import Server from '#models/server'
import ServerStat from '#models/server_stat'
import Database from '@adonisjs/lucid/services/db'

/**
 * Service to handle placeholder replacement in blog posts
 * Format: %PLACEHOLDER_NAME_SERVER_ID%
 *
 * Available placeholders:
 * - PLAYER_COUNT_REALTIME: Current player count
 * - PLAYER_COUNT_PEAK_HIGH: Highest player count recorded
 * - PLAYER_COUNT_PEAK_LOW: Lowest player count recorded
 * - PLAYER_COUNT_AVERAGE: Average player count
 * - PLAYER_COUNT_MEDIAN: Median player count
 * - SERVER_VERSION: Server version
 * - DATA_SINCE_DATE: Date since data collection started
 * - ADDRESS: Server address
 */
export default class PlaceholderService {
  /**
   * Regular expression to match placeholders
   * Example: %PLAYER_COUNT_REALTIME_125%
   */
  private static readonly PLACEHOLDER_REGEX = /%([A-Z_]+)_(\d+)%/g

  /**
   * Échappe les caractères HTML sensibles. Les valeurs SERVER_VERSION / ADDRESS
   * proviennent de sources non fiables (réponse de ping du serveur distant,
   * saisie du propriétaire) et sont substituées dans le contenu d'un article qui
   * est ensuite rendu en HTML brut côté frontend (markdown-it `html: true`).
   * Sans échappement, une version/adresse malveillante = XSS stocké.
   */
  private static escapeHtml(value: string): string {
    return value
      .replaceAll('&', '&amp;')
      .replaceAll('<', '&lt;')
      .replaceAll('>', '&gt;')
      .replaceAll('"', '&quot;')
      .replaceAll("'", '&#39;')
  }

  /**
   * Replace all placeholders in content with actual values
   */
  static async replacePlaceholders(content: string): Promise<string> {
    const matches = Array.from(content.matchAll(this.PLACEHOLDER_REGEX))

    if (matches.length === 0) {
      return content
    }

    // Preload only the data actually referenced by these placeholders
    const pairs = matches.map((match) => ({
      name: match[1],
      serverId: Number.parseInt(match[2]),
    }))
    const serversData = await this.preloadServerData(pairs)

    // Replace each placeholder
    let result = content
    for (const match of matches) {
      const [fullMatch, placeholderName, serverId] = match
      const serverIdNum = Number.parseInt(serverId)

      const value = await this.getPlaceholderValue(
        placeholderName,
        serverIdNum,
        serversData.get(serverIdNum)
      )

      result = result.replace(fullMatch, value)
    }

    return result
  }

  /**
   * Resolve a batch of placeholder tokens (e.g. `%PLAYER_COUNT_REALTIME_125%`) to
   * their current values, returning a `token -> value` map. Server data is
   * preloaded once for every referenced server, so the cost is independent of the
   * number of tokens. Powers the public async resolution endpoint.
   */
  static async resolveTokens(tokens: string[]): Promise<Record<string, string>> {
    const parsed = tokens
      .map((token) => ({ token, match: token.match(/^%([A-Z_]+)_(\d+)%$/) }))
      .filter((entry): entry is { token: string; match: RegExpMatchArray } => entry.match !== null)

    const pairs = parsed.map((entry) => ({
      name: entry.match[1],
      serverId: Number.parseInt(entry.match[2]),
    }))
    const serversData = await this.preloadServerData(pairs)

    const result: Record<string, string> = {}
    for (const { token, match } of parsed) {
      const serverId = Number.parseInt(match[2])
      result[token] = await this.getPlaceholderValue(match[1], serverId, serversData.get(serverId))
    }

    return result
  }

  /**
   * Charge, pour un ensemble de placeholders, uniquement les données dont ils ont
   * besoin — et seulement pour les serveurs concernés par chaque métrique.
   *
   * REALTIME / PEAK_HIGH / VERSION / ADDRESS se lisent sur `servers` et ne
   * déclenchent aucune requête `server_stats`. Les métriques coûteuses
   * (first-stat, peak-low, AVG, médiane) ne sont calculées que si un placeholder
   * les demande, et le `PERCENTILE_CONT` (médiane, qui trie tout l'historique)
   * n'est ajouté que si une médiane est réellement demandée. Les requêtes
   * restantes tournent en parallèle.
   */
  private static async preloadServerData(
    pairs: { name: string; serverId: number }[]
  ): Promise<Map<number, ServerData>> {
    const serversData = new Map<number, ServerData>()

    const allIds = [...new Set(pairs.map((pair) => pair.serverId))]
    if (allIds.length === 0) {
      return serversData
    }

    const servers = await Server.query().whereIn('id', allIds)
    for (const server of servers) {
      serversData.set(server.id, { exists: true, server })
    }
    for (const id of allIds) {
      if (!serversData.has(id)) {
        serversData.set(id, { exists: false })
      }
    }

    // Serveurs (existants) qui réclament chaque métrique dérivée de server_stats.
    const idsNeeding = (...names: string[]) => [
      ...new Set(
        pairs
          .filter((pair) => names.includes(pair.name) && serversData.get(pair.serverId)?.exists)
          .map((pair) => pair.serverId)
      ),
    ]

    const firstIds = idsNeeding('DATA_SINCE_DATE')
    const peakLowIds = idsNeeding('PLAYER_COUNT_PEAK_LOW')
    const aggIds = idsNeeding('PLAYER_COUNT_AVERAGE', 'PLAYER_COUNT_MEDIAN')
    const needAvg = pairs.some((pair) => pair.name === 'PLAYER_COUNT_AVERAGE')
    const needMedian = pairs.some((pair) => pair.name === 'PLAYER_COUNT_MEDIAN')

    const [firstStats, peakLowStats, aggregatesByServer] = await Promise.all([
      firstIds.length
        ? ServerStat.query()
            .whereIn('serverId', firstIds)
            .select('*')
            .distinctOn('serverId')
            .orderBy('serverId', 'asc')
            .orderBy('createdAt', 'asc')
        : Promise.resolve([] as ServerStat[]),
      peakLowIds.length
        ? ServerStat.query()
            .whereIn('serverId', peakLowIds)
            .where('playerCount', '>', 0)
            .select('*')
            .distinctOn('serverId')
            .orderBy('serverId', 'asc')
            .orderBy('playerCount', 'asc')
        : Promise.resolve([] as ServerStat[]),
      aggIds.length
        ? this.loadAggregates(aggIds, needAvg, needMedian)
        : Promise.resolve(new Map<number, { avg: number; median: number }>()),
    ])

    const byServerId = <T extends { serverId: number }>(rows: T[]): Map<number, T> =>
      new Map(rows.map((row) => [row.serverId, row]))

    const firstByServer = byServerId(firstStats)
    const peakLowByServer = byServerId(peakLowStats)

    for (const id of allIds) {
      const data = serversData.get(id)
      if (!data?.exists) continue

      const aggregates = aggregatesByServer.get(id)
      data.firstStat = firstByServer.get(id)
      data.peakLow = peakLowByServer.get(id)
      data.average = aggregates?.avg ?? 0
      data.median = aggregates?.median ?? 0
    }

    return serversData
  }

  /**
   * AVG / médiane par serveur en une requête groupée. `PERCENTILE_CONT` est le
   * calcul le plus lourd (tri de tout l'historique) : on ne l'inclut que si une
   * médiane est demandée, sinon on ne calcule que la moyenne.
   */
  private static async loadAggregates(
    serverIds: number[],
    needAvg: boolean,
    needMedian: boolean
  ): Promise<Map<number, { avg: number; median: number }>> {
    const columns = [
      needAvg ? 'AVG(player_count)::int AS avg_players' : 'NULL::int AS avg_players',
      needMedian
        ? 'PERCENTILE_CONT(0.5) WITHIN GROUP (ORDER BY player_count)::int AS median_players'
        : 'NULL::int AS median_players',
    ]

    const query = await Database.rawQuery(
      `
      SELECT server_id, ${columns.join(', ')}
      FROM server_stats
      WHERE server_id IN (${serverIds.map(() => '?').join(', ')})
      GROUP BY server_id
    `,
      serverIds
    )

    return new Map(
      query.rows.map((row: any) => [
        Number(row.server_id),
        { avg: row.avg_players ?? 0, median: row.median_players ?? 0 },
      ])
    )
  }

  /**
   * Get the value for a specific placeholder
   */
  private static async getPlaceholderValue(
    placeholderName: string,
    serverId: number,
    data?: ServerData
  ): Promise<string> {
    if (!data?.exists) {
      return `[Server ${serverId} not found]`
    }

    switch (placeholderName) {
      case 'PLAYER_COUNT_REALTIME':
        return String(data.server?.lastPlayerCount ?? 0)

      case 'PLAYER_COUNT_PEAK_HIGH':
        return String(data.server?.peakPlayerCount ?? 0)

      case 'PLAYER_COUNT_PEAK_LOW':
        return String(data.peakLow?.playerCount ?? 0)

      case 'PLAYER_COUNT_AVERAGE':
        return String(data.average)

      case 'PLAYER_COUNT_MEDIAN':
        return String(data.median)

      case 'SERVER_VERSION':
        return this.escapeHtml(data.server?.version || 'Unknown')

      case 'DATA_SINCE_DATE':
        if (data.firstStat) {
          return data.firstStat.createdAt.toFormat('dd/MM/yyyy')
        }
        return 'N/A'

      case 'ADDRESS':
        if (!data.server?.address) {
          return 'N/A'
        }
        return this.escapeHtml(data.server.address)

      default:
        return `[Unknown placeholder: ${placeholderName}]`
    }
  }

  /**
   * Get available placeholder types with descriptions
   */
  static getAvailablePlaceholders(): PlaceholderInfo[] {
    return [
      {
        name: 'PLAYER_COUNT_REALTIME',
        description: 'Current number of online players',
        example: '%PLAYER_COUNT_REALTIME_125%',
      },
      {
        name: 'PLAYER_COUNT_PEAK_HIGH',
        description: 'Highest number of players ever recorded',
        example: '%PLAYER_COUNT_PEAK_HIGH_125%',
      },
      {
        name: 'PLAYER_COUNT_PEAK_LOW',
        description: 'Lowest number of players recorded (excluding 0)',
        example: '%PLAYER_COUNT_PEAK_LOW_125%',
      },
      {
        name: 'PLAYER_COUNT_AVERAGE',
        description: 'Average number of players',
        example: '%PLAYER_COUNT_AVERAGE_125%',
      },
      {
        name: 'PLAYER_COUNT_MEDIAN',
        description: 'Median number of players',
        example: '%PLAYER_COUNT_MEDIAN_125%',
      },
      {
        name: 'SERVER_VERSION',
        description: 'Minecraft server version',
        example: '%SERVER_VERSION_125%',
      },
      {
        name: 'DATA_SINCE_DATE',
        description: 'Date when data collection started',
        example: '%DATA_SINCE_DATE_125%',
      },
      {
        name: 'ADDRESS',
        description: 'Server address',
        example: '%ADDRESS_125%',
      },
    ]
  }
}

/**
 * Server data structure for placeholder replacement
 */
interface ServerData {
  exists: boolean
  server?: Server
  firstStat?: ServerStat
  peakLow?: ServerStat
  average?: number
  median?: number
}

/**
 * Placeholder information structure
 */
interface PlaceholderInfo {
  name: string
  description: string
  example: string
}
