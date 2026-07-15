import dns from 'node:dns'
import net from 'node:net'
import { randomBytes } from 'node:crypto'
import { DateTime } from 'luxon'
import Server from '#models/server'
import ServerOwnershipClaim from '#models/server_ownership_claim'
import type User from '#models/user'
import {
  DNS_TOKEN_TTL_DAYS,
  DNS_TXT_PREFIX,
  type OwnershipMethod,
} from '../constants/server_ownership.js'

export type ClaimOutcome =
  | { status: 'ok'; claim: ServerOwnershipClaim }
  | { status: 'already_owner' }
  | { status: 'already_verified' }
  | { status: 'dns_unavailable' }

export type VerifyOutcome =
  | { status: 'verified'; server: Server }
  | { status: 'not_found_record' }
  | { status: 'no_claim' }
  | { status: 'expired' }
  | { status: 'already_verified' }

export type ReviewOutcome = { status: 'ok'; server: Server } | { status: 'already_verified' }

/** Valeur exacte à publier dans l'enregistrement TXT pour un jeton donné. */
export function dnsTxtValue(token: string): string {
  return `${DNS_TXT_PREFIX}=${token}`
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

/**
 * Réclamation de propriété d'un serveur. Deux chemins :
 *  - DNS (self-service) : jeton publié en TXT, vérifié automatiquement.
 *  - Manuel (filet)     : preuve libre revue par un admin.
 *
 * Règle de conflit commune : une preuve technique transfère la propriété SAUF si le
 * serveur est déjà vérifié par quelqu'un d'autre — auquel cas la demande est bloquée
 * (redirection support/admin). Extrait du controller pour être testable sans HttpContext.
 */
export default class ServerOwnershipService {
  /**
   * Résolveur des enregistrements TXT d'un hôte. Isolé comme point d'injection : les
   * tests le remplacent par un stub pour rester hermétiques (pas de DNS réseau).
   */
  static resolveTxt: (host: string) => Promise<string[][]> = (host) => dns.promises.resolveTxt(host)

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

  /** Ouvre (ou rejoue) une demande DNS et renvoie le dossier avec un jeton actif. */
  static async startDnsClaim(server: Server, user: User): Promise<ClaimOutcome> {
    const blocked = this.conflict(server, user)
    if (blocked) return blocked
    if (!this.dnsAvailable(server)) return { status: 'dns_unavailable' }

    const existing = await this.findClaim(server.id, user.id)

    // Jeton DNS encore valable : on le réutilise pour ne pas invalider un TXT déjà publié.
    if (
      existing &&
      existing.method === 'dns' &&
      existing.status === 'pending' &&
      existing.isTokenActive
    ) {
      return { status: 'ok', claim: existing }
    }

    const token = randomBytes(16).toString('hex')
    const expiresAt = DateTime.now().plus({ days: DNS_TOKEN_TTL_DAYS })

    if (existing) {
      existing.merge({
        method: 'dns',
        status: 'pending',
        token,
        expiresAt,
        evidence: null,
        evidenceUrl: null,
        verifiedAt: null,
        reviewedBy: null,
        reviewNote: null,
      })
      await existing.save()
      return { status: 'ok', claim: existing }
    }

    const claim = await ServerOwnershipClaim.create({
      serverId: server.id,
      userId: user.id,
      method: 'dns',
      status: 'pending',
      token,
      expiresAt,
    })
    return { status: 'ok', claim }
  }

  /** Résout les TXT du serveur et transfère la propriété si le jeton y figure. */
  static async verifyDnsClaim(server: Server, user: User): Promise<VerifyOutcome> {
    // Re-vérifie le conflit (course : un autre a pu se faire vérifier entre-temps).
    if (server.ownerVerifiedAt && server.userId !== user.id) return { status: 'already_verified' }

    const claim = await this.findClaim(server.id, user.id)
    if (!claim || claim.method !== 'dns' || claim.status !== 'pending' || !claim.token) {
      return { status: 'no_claim' }
    }
    if (!claim.isTokenActive) {
      claim.status = 'expired'
      await claim.save()
      return { status: 'expired' }
    }

    const present = await this.dnsTokenPresent(server, claim.token)
    if (!present) return { status: 'not_found_record' }

    await this.transferOwnership(server, user.id, 'dns')
    claim.status = 'verified'
    claim.verifiedAt = DateTime.now()
    await claim.save()
    return { status: 'verified', server }
  }

  /** Soumet (ou remplace) une demande manuelle en attente de revue admin. */
  static async submitManualClaim(
    server: Server,
    user: User,
    data: { evidence: string; evidenceUrl?: string }
  ): Promise<ClaimOutcome> {
    const blocked = this.conflict(server, user)
    if (blocked) return blocked

    const existing = await this.findClaim(server.id, user.id)
    if (existing) {
      existing.merge({
        method: 'manual',
        status: 'pending',
        token: null,
        expiresAt: null,
        evidence: data.evidence,
        evidenceUrl: data.evidenceUrl ?? null,
        verifiedAt: null,
        reviewedBy: null,
        reviewNote: null,
      })
      await existing.save()
      return { status: 'ok', claim: existing }
    }

    const claim = await ServerOwnershipClaim.create({
      serverId: server.id,
      userId: user.id,
      method: 'manual',
      status: 'pending',
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
    const expected = dnsTxtValue(token)
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
}
