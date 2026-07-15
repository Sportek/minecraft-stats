import dns from 'node:dns'
import net from 'node:net'
import { randomBytes } from 'node:crypto'
import { DateTime } from 'luxon'
import Server from '#models/server'
import ServerOwnershipClaim from '#models/server_ownership_claim'
import type User from '#models/user'
import { flattenMotd } from '#utils/motd'
import {
  TOKEN_TTL_DAYS,
  VERIFY_PREFIX,
  type OwnershipMethod,
} from '../constants/server_ownership.js'
import {
  INTERACTIVE_PING_TIMEOUT,
  pingMinecraftServer,
  type NormalizedPing,
} from '../../minecraft-ping/minecraft_ping.js'
import type { ServerType } from '../constants/server_type.js'

export type ClaimOutcome =
  | { status: 'ok'; claim: ServerOwnershipClaim }
  | { status: 'already_owner' }
  | { status: 'already_verified' }
  | { status: 'dns_unavailable' }

export type VerifyOutcome =
  | { status: 'verified'; server: Server }
  | { status: 'not_found_record' }
  | { status: 'unreachable' }
  | { status: 'no_claim' }
  | { status: 'expired' }
  | { status: 'already_verified' }

export type ReviewOutcome = { status: 'ok'; server: Server } | { status: 'already_verified' }

/** Chaîne à publier (TXT DNS ou MOTD) pour prouver la propriété : `minecraft-stats-verify=<token>`. */
export function verificationValue(token: string): string {
  return `${VERIFY_PREFIX}=${token}`
}

/**
 * Un des enregistrements TXT contient-il la valeur attendue ? `resolveTxt` renvoie
 * chaque enregistrement en morceaux (chunks de 255 octets) qu'on recolle avant de
 * comparer. Comparaison insensible à la casse (le jeton est hexadécimal de toute façon).
 */
export function txtRecordsContainToken(records: string[][], expectedValue: string): boolean {
  const needle = expectedValue.toLowerCase()
  return records.some((chunks) => chunks.join('').toLowerCase().includes(needle))
}

/** Le texte (MOTD aplati) contient-il la valeur de vérification ? Insensible à la casse. */
export function textContainsToken(text: string, expectedValue: string): boolean {
  return text.toLowerCase().includes(expectedValue.toLowerCase())
}

/**
 * Réclamation de propriété d'un serveur. Trois chemins :
 *  - MOTD (self-service) : jeton inséré dans la MOTD, lu via ping. Couverture max.
 *  - DNS (self-service)  : jeton publié en TXT, sans coupure pour les joueurs.
 *  - Manuel (filet)      : preuve libre revue par un admin.
 *
 * Règle de conflit commune : une preuve technique transfère la propriété SAUF si le
 * serveur est déjà vérifié par quelqu'un d'autre — auquel cas la demande est bloquée
 * (redirection support/admin). Extrait du controller pour être testable sans HttpContext.
 */
export default class ServerOwnershipService {
  /**
   * Collaborateurs réseau isolés comme points d'injection : les tests les remplacent
   * par des stubs pour rester hermétiques (aucune requête DNS / aucun ping réel).
   */
  static resolveTxt: (host: string) => Promise<string[][]> = (host) => dns.promises.resolveTxt(host)
  static pingServer: (type: ServerType, address: string, port: number) => Promise<NormalizedPing> =
    (type, address, port) => pingMinecraftServer(type, address, port, INTERACTIVE_PING_TIMEOUT)

  /** Hôtes sur lesquels on accepte l'enregistrement TXT : domaine racine + adresse exacte. */
  static dnsHostCandidates(server: Server): string[] {
    const hosts = new Set<string>()
    if (server.hostDomain) hosts.add(server.hostDomain)
    if (server.address && !net.isIP(server.address)) hosts.add(server.address)
    return [...hosts]
  }

  /** La vérification DNS est-elle possible pour ce serveur (a-t-il un hôte résoluble) ? */
  static dnsAvailable(server: Server): boolean {
    return this.dnsHostCandidates(server).length > 0
  }

  private static async findClaim(
    serverId: number,
    userId: number
  ): Promise<ServerOwnershipClaim | null> {
    return ServerOwnershipClaim.query()
      .where('server_id', serverId)
      .where('user_id', userId)
      .first()
  }

  /**
   * Vérifie la règle de conflit avant d'ouvrir/rejouer une demande.
   * Retourne un `ClaimOutcome` bloquant, ou null si la voie est libre.
   */
  private static conflict(server: Server, user: User): ClaimOutcome | null {
    if (server.ownerVerifiedAt) {
      return server.userId === user.id
        ? { status: 'already_owner' }
        : { status: 'already_verified' }
    }
    return null
  }

  /**
   * Crée ou rejoue LE dossier (unique par serveur+utilisateur) avec les champs fournis,
   * en repartant toujours d'un état propre (les champs non fournis sont remis à zéro).
   */
  private static async upsertClaim(
    server: Server,
    user: User,
    fields: Partial<ServerOwnershipClaim>
  ): Promise<ServerOwnershipClaim> {
    const base = {
      status: 'pending' as const,
      token: null,
      expiresAt: null,
      evidence: null,
      evidenceUrl: null,
      verifiedAt: null,
      reviewedBy: null,
      reviewNote: null,
      ...fields,
    }
    const existing = await this.findClaim(server.id, user.id)
    if (existing) {
      existing.merge(base)
      await existing.save()
      return existing
    }
    return ServerOwnershipClaim.create({ serverId: server.id, userId: user.id, ...base })
  }

  /** Un jeton aléatoire assez court pour tenir dans une ligne de MOTD (24 hex). */
  private static generateToken(): string {
    return randomBytes(12).toString('hex')
  }

  private static tokenExpiry(): DateTime {
    return DateTime.now().plus({ days: TOKEN_TTL_DAYS })
  }

  /**
   * Ouvre (ou rejoue) une demande auto-vérifiable (MOTD ou DNS) et renvoie le dossier
   * avec un jeton actif. Réutilise un jeton encore valable pour ne pas invalider une
   * preuve déjà publiée par l'utilisateur.
   */
  private static async startTokenClaim(
    server: Server,
    user: User,
    method: 'motd' | 'dns'
  ): Promise<ClaimOutcome> {
    const blocked = this.conflict(server, user)
    if (blocked) return blocked
    if (method === 'dns' && !this.dnsAvailable(server)) return { status: 'dns_unavailable' }

    const existing = await this.findClaim(server.id, user.id)
    if (
      existing &&
      existing.method === method &&
      existing.status === 'pending' &&
      existing.isTokenActive
    ) {
      return { status: 'ok', claim: existing }
    }

    const claim = await this.upsertClaim(server, user, {
      method,
      token: this.generateToken(),
      expiresAt: this.tokenExpiry(),
    })
    return { status: 'ok', claim }
  }

  static startMotdClaim(server: Server, user: User): Promise<ClaimOutcome> {
    return this.startTokenClaim(server, user, 'motd')
  }

  static startDnsClaim(server: Server, user: User): Promise<ClaimOutcome> {
    return this.startTokenClaim(server, user, 'dns')
  }

  /**
   * Vérifie une demande auto : rejoue les checks, cherche la preuve (TXT ou MOTD selon
   * la méthode), et transfère la propriété si le jeton est trouvé.
   */
  private static async verifyTokenClaim(
    server: Server,
    user: User,
    method: 'motd' | 'dns'
  ): Promise<VerifyOutcome> {
    // Re-vérifie le conflit (course : un autre a pu se faire vérifier entre-temps).
    if (server.ownerVerifiedAt && server.userId !== user.id) return { status: 'already_verified' }

    const claim = await this.findClaim(server.id, user.id)
    if (!claim || claim.method !== method || claim.status !== 'pending' || !claim.token) {
      return { status: 'no_claim' }
    }
    if (!claim.isTokenActive) {
      claim.status = 'expired'
      await claim.save()
      return { status: 'expired' }
    }

    const found =
      method === 'dns'
        ? await this.dnsTokenPresent(server, claim.token)
        : await this.motdTokenPresent(server, claim.token)

    if (found === 'unreachable') return { status: 'unreachable' }
    if (!found) return { status: 'not_found_record' }

    await this.transferOwnership(server, user.id, method)
    claim.status = 'verified'
    claim.verifiedAt = DateTime.now()
    await claim.save()
    return { status: 'verified', server }
  }

  static verifyMotdClaim(server: Server, user: User): Promise<VerifyOutcome> {
    return this.verifyTokenClaim(server, user, 'motd')
  }

  static verifyDnsClaim(server: Server, user: User): Promise<VerifyOutcome> {
    return this.verifyTokenClaim(server, user, 'dns')
  }

  /** Soumet (ou remplace) une demande manuelle en attente de revue admin. */
  static async submitManualClaim(
    server: Server,
    user: User,
    data: { evidence: string; evidenceUrl?: string }
  ): Promise<ClaimOutcome> {
    const blocked = this.conflict(server, user)
    if (blocked) return blocked

    const claim = await this.upsertClaim(server, user, {
      method: 'manual',
      evidence: data.evidence,
      evidenceUrl: data.evidenceUrl ?? null,
    })
    return { status: 'ok', claim }
  }

  /** Demande courante de l'utilisateur pour ce serveur (null si aucune). */
  static getUserClaim(serverId: number, userId: number): Promise<ServerOwnershipClaim | null> {
    return this.findClaim(serverId, userId)
  }

  /** Demandes manuelles en attente, pour le tableau de bord admin (plus ancienne d'abord). */
  static listPendingManualClaims(): Promise<ServerOwnershipClaim[]> {
    return ServerOwnershipClaim.query()
      .where('method', 'manual')
      .where('status', 'pending')
      .preload('server')
      .preload('user', (query) => query.select('id', 'username', 'email', 'avatarUrl'))
      .orderBy('created_at', 'asc')
  }

  /** Approuve une demande manuelle : transfère la propriété au demandeur. */
  static async approveManualClaim(
    claim: ServerOwnershipClaim,
    admin: User,
    note?: string
  ): Promise<ReviewOutcome> {
    const server = await Server.findOrFail(claim.serverId)
    if (server.ownerVerifiedAt && server.userId !== claim.userId) {
      return { status: 'already_verified' }
    }

    await this.transferOwnership(server, claim.userId, 'manual')
    claim.status = 'verified'
    claim.verifiedAt = DateTime.now()
    claim.reviewedBy = admin.id
    claim.reviewNote = note ?? null
    await claim.save()
    return { status: 'ok', server }
  }

  /** Rejette une demande manuelle avec un motif facultatif. */
  static async rejectManualClaim(
    claim: ServerOwnershipClaim,
    admin: User,
    note?: string
  ): Promise<void> {
    claim.status = 'rejected'
    claim.reviewedBy = admin.id
    claim.reviewNote = note ?? null
    await claim.save()
  }

  /** Passe la propriété du serveur à `userId` et grave la preuve. */
  private static async transferOwnership(
    server: Server,
    userId: number,
    method: OwnershipMethod
  ): Promise<void> {
    server.userId = userId
    server.ownerVerifiedAt = DateTime.now()
    server.ownerVerifiedMethod = method
    await server.save()
  }

  /** Le jeton est-il publié dans un TXT d'un des hôtes acceptés ? */
  private static async dnsTokenPresent(server: Server, token: string): Promise<boolean> {
    const expected = verificationValue(token)
    for (const host of this.dnsHostCandidates(server)) {
      try {
        const records = await ServerOwnershipService.resolveTxt(host)
        if (txtRecordsContainToken(records, expected)) return true
      } catch {
        // NXDOMAIN / aucun TXT sur cet hôte → on tente le suivant.
      }
    }
    return false
  }

  /**
   * Le jeton est-il présent dans la MOTD du serveur ? Renvoie 'unreachable' si le ping
   * échoue (on ne peut alors ni confirmer ni infirmer), true/false sinon.
   */
  private static async motdTokenPresent(
    server: Server,
    token: string
  ): Promise<boolean | 'unreachable'> {
    try {
      const ping = await ServerOwnershipService.pingServer(server.type, server.address, server.port)
      return textContainsToken(flattenMotd(ping.description), verificationValue(token))
    } catch {
      return 'unreachable'
    }
  }
}
