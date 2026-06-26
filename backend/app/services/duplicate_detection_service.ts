import { createHash } from 'node:crypto'
import dns from 'node:dns'
import net from 'node:net'
import Server from '#models/server'
import { deriveServerWebsite } from '#utils/server_website'

/**
 * Poids de chaque signal dans le score de similarité.
 * À calibrer empiriquement. Logique de conception :
 *  - domain : domaine racine (eTLD+1) de l'adresse. `mc.hypixel.net` et
 *    `hypixel.net` le partagent → signal fort. Neutralisé si beaucoup de
 *    serveurs partagent le domaine (hébergeurs à sous-domaines type minehut.gg).
 *  - favicon : icône custom quasi unique, mais pas suffisante seule (deux
 *    serveurs peuvent réutiliser une icône téléchargée / l'icône par défaut d'un
 *    hébergeur).
 *  - endpoint : `ip:port` réel ; pour un serveur hébergé en direct, identique =
 *    même serveur. Neutralisé si l'endpoint est partagé (proxy anti-DDoS).
 *  - motd : MOTD normalisé (codes couleur + chiffres retirés). Sujet aux
 *    collisions ("welcome to..."), donc volontairement insuffisant seul.
 *  - players : nombre de joueurs connectés. Deux serveurs au même instant avec
 *    un compte à ±10 % sont très probablement le même backend. Bruité à bas
 *    volume (tout le monde a ~10 joueurs), donc plancher + jamais décisif seul.
 *  - version : très commune (tout le monde sur la dernière). Simple bonus —
 *    son poids est choisi pour ne JAMAIS faire basculer une paire à lui seul.
 *
 * Calibrage : aucun signal ne franchit le seuil seul. Les combinaisons qui le
 * franchissent (≥ 75) sont celles où deux signaux indépendants concordent :
 * domain+favicon=90, domain+endpoint=85, domain+motd=75, favicon+endpoint=85,
 * favicon+motd=75, domain+players+version=75… Le cas hypixel.net/mc.hypixel.net
 * (endpoint proxyfié, MOTD rotatif) marque domain+favicon+players ≈ 112.
 */
const SIGNAL_WEIGHTS = {
  domain: 45,
  favicon: 45,
  endpoint: 40,
  motd: 30,
  players: 22,
  version: 8,
} as const

/** Score à partir duquel deux serveurs sont considérés comme un doublon. */
const DUPLICATE_THRESHOLD = 75

/**
 * À partir de ce nombre de serveurs déjà listés partageant le même endpoint, on
 * considère que l'`ip:port` est un proxy / hébergement mutualisé : il ne prouve
 * plus rien et son poids tombe à 0.
 */
const SHARED_ENDPOINT_LIMIT = 2

/**
 * À partir de ce nombre de serveurs partageant le même domaine racine, on le
 * considère comme un hébergeur à sous-domaines (minehut.gg, *.aternos.me…) : il
 * ne discrimine plus rien et son poids tombe à 0. Volontairement généreux — un
 * réseau légitime peut lister quelques sous-domaines (mc., play., eu.…).
 */
const SHARED_DOMAIN_LIMIT = 5

/**
 * Plancher en deçà duquel le signal "joueurs" est ignoré : à faible volume, des
 * dizaines de serveurs sans rapport stationnent à quelques joueurs, la
 * proximité ne prouve donc rien.
 */
const PLAYER_SIMILARITY_FLOOR = 50

/** Écart relatif maximal entre deux comptes de joueurs pour les juger proches. */
const PLAYER_SIMILARITY_TOLERANCE = 0.1

export interface ServerFingerprint {
  domain: string | null
  faviconHash: string | null
  resolvedEndpoint: string | null
  motdHash: string | null
  playerCount: number | null
  version: string | null
}

export interface DuplicateMatch {
  server: Server
  score: number
  signals: string[]
}

/** Forme minimale d'une réponse de ping nécessaire au calcul d'empreinte. */
export interface PingFingerprintInput {
  favicon?: string | null
  description?: unknown
  version?: { name?: string } | null
  players?: { online?: number } | null
}

/**
 * Détection de doublons à la création d'un serveur.
 *
 * Problème : un même serveur Minecraft est souvent joignable via plusieurs
 * adresses (`play.example.com`, `mc.example.com`, une IP brute…). On veut
 * éviter qu'il soit listé deux fois.
 *
 * Approche : un score pondéré multi-signaux. Aucun signal ne suffit seul (ils
 * sont tous individuellement bruités), mais leur combinaison au-delà d'un seuil
 * identifie un doublon de façon fiable. Voir SIGNAL_WEIGHTS / DUPLICATE_THRESHOLD.
 */
export default class DuplicateDetectionService {
  /** SHA-256 du favicon (data URI base64). null si le serveur n'a pas d'icône. */
  static hashFavicon(favicon?: string | null): string | null {
    if (!favicon) return null
    const base64 = favicon.replace(/^data:image\/\w+;base64,/, '').trim()
    if (!base64) return null
    return createHash('sha256').update(base64).digest('hex')
  }

  /** Aplatit un MOTD (string ou composant Chat imbriqué) en texte brut. */
  private static flattenMotd(node: unknown): string {
    if (node === null || node === undefined) return ''
    if (typeof node === 'string') return node
    if (Array.isArray(node)) return node.map((n) => this.flattenMotd(n)).join('')
    if (typeof node === 'object') {
      const obj = node as { text?: unknown; extra?: unknown }
      let text = typeof obj.text === 'string' ? obj.text : ''
      if (obj.extra) text += this.flattenMotd(obj.extra)
      return text
    }
    return ''
  }

  /**
   * Hash du MOTD *normalisé* : on retire les codes couleur `§x` et les chiffres
   * (compteurs de joueurs en direct, dates) pour ne garder que le squelette
   * texte stable. null si le MOTD est vide ou trop court pour discriminer.
   */
  static hashMotd(motd?: unknown): string | null {
    const normalized = this.flattenMotd(motd)
      .replace(/§./g, '') // codes couleur/format Minecraft
      .replace(/\d/g, '') // chiffres : joueurs en ligne, dates…
      .toLowerCase()
      .replace(/\s+/g, ' ')
      .trim()
    if (normalized.length < 4) return null
    return createHash('sha256').update(normalized).digest('hex')
  }

  /**
   * Résout une adresse Minecraft vers son endpoint réel `ip:port`.
   * Suit d'abord les SRV records (`_minecraft._tcp.<host>`), comme le client MC.
   * Retourne null si la résolution échoue — le signal endpoint est alors ignoré.
   */
  static async resolveEndpoint(address: string, port: number): Promise<string | null> {
    try {
      // Adresse déjà littérale (IP brute) → pas de DNS à faire.
      if (net.isIP(address)) return `${address}:${port}`

      let targetHost = address
      let targetPort = port

      // 1. SRV — le client Minecraft Java interroge _minecraft._tcp.<host>.
      try {
        const srv = await dns.promises.resolveSrv(`_minecraft._tcp.${address}`)
        if (srv.length > 0) {
          // Priorité la plus basse = enregistrement préféré.
          const best = srv.sort((a, b) => a.priority - b.priority)[0]
          targetHost = best.name
          targetPort = best.port
        }
      } catch {
        // Pas de SRV record — cas le plus courant, on garde l'adresse telle quelle.
      }

      if (net.isIP(targetHost)) return `${targetHost}:${targetPort}`

      // 2. A/AAAA du host cible (resolve4/resolve6 suivent les CNAME).
      const v4 = await dns.promises.resolve4(targetHost).catch(() => [] as string[])
      const ips =
        v4.length > 0 ? v4 : await dns.promises.resolve6(targetHost).catch(() => [] as string[])
      if (ips.length === 0) return null

      // Tri pour que deux alias du même serveur (round-robin DNS) produisent
      // la même chaîne quel que soit l'ordre renvoyé par le résolveur.
      return `${[...ips].sort()[0]}:${targetPort}`
    } catch {
      return null
    }
  }

  /**
   * Domaine racine (eTLD+1) de l'adresse — `mc.hypixel.net` -> `hypixel.net`.
   * Réutilise l'extraction de l'adresse->site web. null pour une IP/localhost.
   */
  static hostDomain(address: string): string | null {
    return deriveServerWebsite(address)
  }

  /**
   * Deux comptes de joueurs sont-ils suffisamment proches pour suggérer le même
   * serveur ? Faux si l'un des deux est inconnu ou sous le plancher de bruit.
   */
  static playerCountsClose(a: number | null, b: number | null): boolean {
    if (a === null || b === null) return false
    if (a < PLAYER_SIMILARITY_FLOOR || b < PLAYER_SIMILARITY_FLOOR) return false
    return Math.abs(a - b) / Math.max(a, b) <= PLAYER_SIMILARITY_TOLERANCE
  }

  /** Calcule les empreintes d'un serveur à partir de son adresse + sa réponse de ping. */
  static async fingerprint(
    address: string,
    port: number,
    ping: PingFingerprintInput
  ): Promise<ServerFingerprint> {
    return {
      domain: this.hostDomain(address),
      faviconHash: this.hashFavicon(ping.favicon),
      resolvedEndpoint: await this.resolveEndpoint(address, port),
      motdHash: this.hashMotd(ping.description),
      playerCount: ping.players?.online ?? null,
      version: ping.version?.name ?? null,
    }
  }

  /**
   * Cherche un serveur déjà listé qui serait le même que celui décrit par
   * `fingerprint`. Retourne le meilleur match dont le score dépasse le seuil,
   * ou null si aucun doublon n'est trouvé.
   *
   * @param fingerprint.excludeId  serveur à exclure de la recherche (édition).
   */
  static async findDuplicate(
    fingerprint: ServerFingerprint & { excludeId?: number }
  ): Promise<DuplicateMatch | null> {
    const { domain, faviconHash, resolvedEndpoint, motdHash, playerCount, version, excludeId } =
      fingerprint

    // Sans aucun signal indexable exploitable, rien à comparer. (`players` et
    // `version` ne servent qu'à corroborer un candidat déjà sélectionné.)
    if (!domain && !faviconHash && !resolvedEndpoint && !motdHash) return null

    const countSharing = async (column: string, value: string): Promise<number> => {
      const query = Server.query().where(column, value)
      if (excludeId) query.whereNot('id', excludeId)
      const rows = await query.count('* as total')
      return Number(rows[0].$extras.total)
    }

    // Endpoint partagé par plusieurs serveurs => proxy / mutualisé => non fiable.
    const endpointTrusted = resolvedEndpoint
      ? (await countSharing('resolved_endpoint', resolvedEndpoint)) < SHARED_ENDPOINT_LIMIT
      : false

    // Domaine partagé par trop de serveurs => hébergeur à sous-domaines => non fiable.
    const domainTrusted = domain
      ? (await countSharing('host_domain', domain)) < SHARED_DOMAIN_LIMIT
      : false

    // Aucun signal *discriminant* utilisable (players/version sont trop communs
    // pour servir de critère de sélection) → inutile de scanner.
    const hasDiscriminating =
      (!!domain && domainTrusted) ||
      !!faviconHash ||
      (!!resolvedEndpoint && endpointTrusted) ||
      !!motdHash
    if (!hasDiscriminating) return null

    // Candidats : tout serveur partageant au moins un signal discriminant.
    const candidates = await Server.query()
      .where((builder) => {
        if (domain && domainTrusted) builder.orWhere('host_domain', domain)
        if (faviconHash) builder.orWhere('favicon_hash', faviconHash)
        if (resolvedEndpoint && endpointTrusted) {
          builder.orWhere('resolved_endpoint', resolvedEndpoint)
        }
        if (motdHash) builder.orWhere('motd_hash', motdHash)
      })
      .if(!!excludeId, (query) => query.whereNot('id', excludeId!))

    let best: DuplicateMatch | null = null
    for (const candidate of candidates) {
      let score = 0
      const signals: string[] = []

      if (domainTrusted && domain && candidate.hostDomain === domain) {
        score += SIGNAL_WEIGHTS.domain
        signals.push('domain')
      }
      if (faviconHash && candidate.faviconHash === faviconHash) {
        score += SIGNAL_WEIGHTS.favicon
        signals.push('favicon')
      }
      if (endpointTrusted && resolvedEndpoint && candidate.resolvedEndpoint === resolvedEndpoint) {
        score += SIGNAL_WEIGHTS.endpoint
        signals.push('endpoint')
      }
      if (motdHash && candidate.motdHash === motdHash) {
        score += SIGNAL_WEIGHTS.motd
        signals.push('motd')
      }
      // players / version ne sont que des bonus : seuls, ils ne placent jamais un
      // candidat dans la liste ci-dessus, donc ne peuvent pas déclencher de faux
      // positif. On compare le compte live au dernier compte connu du candidat.
      if (this.playerCountsClose(playerCount, candidate.lastPlayerCount)) {
        score += SIGNAL_WEIGHTS.players
        signals.push('players')
      }
      if (version && candidate.version === version) {
        score += SIGNAL_WEIGHTS.version
        signals.push('version')
      }

      if (score >= DUPLICATE_THRESHOLD && (!best || score > best.score)) {
        best = { server: candidate, score, signals }
      }
    }

    return best
  }
}
