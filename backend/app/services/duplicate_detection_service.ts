import { createHash } from 'node:crypto'
import dns from 'node:dns'
import net from 'node:net'
import Server from '#models/server'

/**
 * Poids de chaque signal dans le score de similarité.
 * À calibrer empiriquement. Logique de conception :
 *  - favicon : signal le plus fort (icône custom quasi unique), mais pas
 *    suffisant seul (deux serveurs peuvent réutiliser une icône téléchargée).
 *  - endpoint : `ip:port` réel ; pour un serveur hébergé en direct, identique =
 *    même serveur. Neutralisé si l'endpoint est partagé (proxy anti-DDoS).
 *  - motd : MOTD normalisé (codes couleur + chiffres retirés). Sujet aux
 *    collisions ("welcome to..."), donc volontairement insuffisant seul.
 *  - version : très commune (tout le monde sur la dernière). Simple bonus —
 *    son poids est choisi pour ne JAMAIS faire basculer une paire à lui seul.
 */
const SIGNAL_WEIGHTS = {
  favicon: 50,
  endpoint: 40,
  motd: 30,
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

export interface ServerFingerprint {
  faviconHash: string | null
  resolvedEndpoint: string | null
  motdHash: string | null
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
    if (node == null) return ''
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

  /** Calcule les empreintes d'un serveur à partir de son adresse + sa réponse de ping. */
  static async fingerprint(
    address: string,
    port: number,
    ping: PingFingerprintInput
  ): Promise<ServerFingerprint> {
    return {
      faviconHash: this.hashFavicon(ping.favicon),
      resolvedEndpoint: await this.resolveEndpoint(address, port),
      motdHash: this.hashMotd(ping.description),
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
    const { faviconHash, resolvedEndpoint, motdHash, version, excludeId } = fingerprint

    // Sans aucun signal exploitable, rien à comparer.
    if (!faviconHash && !resolvedEndpoint && !motdHash) return null

    // Endpoint partagé par plusieurs serveurs => proxy / mutualisé => non fiable.
    let endpointTrusted = false
    if (resolvedEndpoint) {
      const countQuery = Server.query().where('resolved_endpoint', resolvedEndpoint)
      if (excludeId) countQuery.whereNot('id', excludeId)
      const rows = await countQuery.count('* as total')
      endpointTrusted = Number(rows[0].$extras.total) < SHARED_ENDPOINT_LIMIT
    }

    // Aucun signal *discriminant* utilisable (la version seule est trop commune
    // pour servir de critère de sélection) → inutile de scanner.
    const hasDiscriminating = !!faviconHash || (!!resolvedEndpoint && endpointTrusted) || !!motdHash
    if (!hasDiscriminating) return null

    // Candidats : tout serveur partageant au moins un signal discriminant.
    const candidates = await Server.query()
      .where((builder) => {
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
      // La version n'est qu'un bonus : seule, elle ne place jamais un candidat
      // dans la liste ci-dessus, donc elle ne peut pas déclencher un faux positif.
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
