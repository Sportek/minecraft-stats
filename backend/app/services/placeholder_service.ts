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

    // Group placeholders by server ID to minimize database queries
    const serverIds = [...new Set(matches.map((match) => Number.parseInt(match[2])))]

    // Preload all server data
    const serversData = await this.preloadServerData(serverIds)

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
   * Preload server data for multiple servers at once.
   *
   * Toutes les données sont récupérées avec des requêtes ensemblistes
   * (`whereIn` / `GROUP BY server_id`) pour éviter le N+1 : un serveur absent du
   * résultat `whereIn` est traité comme introuvable (`exists: false`), et les
   * erreurs DB ne sont plus avalées — elles remontent.
   */
  private static async preloadServerData(serverIds: number[]): Promise<Map<number, ServerData>> {
    const serversData = new Map<number, ServerData>()

    if (serverIds.length === 0) {
      return serversData
    }

    const servers = await Server.query().whereIn('id', serverIds)

    // Latest stat per server (highest createdAt) — équivalent à orderBy createdAt desc + first
    const latestStats = await ServerStat.query()
      .whereIn('serverId', serverIds)
      .select('*')
      .distinctOn('serverId')
      .orderBy('serverId', 'asc')
      .orderBy('createdAt', 'desc')

    // First stat per server (lowest createdAt) — équivalent à orderBy createdAt asc + first
    const firstStats = await ServerStat.query()
      .whereIn('serverId', serverIds)
      .select('*')
      .distinctOn('serverId')
      .orderBy('serverId', 'asc')
      .orderBy('createdAt', 'asc')

    // Peak high per server (highest playerCount) — équivalent à orderBy playerCount desc + first
    const peakHighStats = await ServerStat.query()
      .whereIn('serverId', serverIds)
      .select('*')
      .distinctOn('serverId')
      .orderBy('serverId', 'asc')
      .orderBy('playerCount', 'desc')

    // Peak low per server (lowest playerCount > 0) — équivalent à where > 0 + orderBy playerCount asc + first
    const peakLowStats = await ServerStat.query()
      .whereIn('serverId', serverIds)
      .where('playerCount', '>', 0)
      .select('*')
      .distinctOn('serverId')
      .orderBy('serverId', 'asc')
      .orderBy('playerCount', 'asc')

    // Average and median per server, en une seule requête groupée
    const aggregatesQuery = await Database.rawQuery(
      `
      SELECT
        server_id,
        AVG(player_count)::int as avg_players,
        PERCENTILE_CONT(0.5) WITHIN GROUP (ORDER BY player_count)::int as median_players
      FROM server_stats
      WHERE server_id IN (${serverIds.map(() => '?').join(', ')})
      GROUP BY server_id
    `,
      serverIds
    )

    const byServerId = <T extends { serverId: number }>(rows: T[]): Map<number, T> =>
      new Map(rows.map((row) => [row.serverId, row]))

    const latestByServer = byServerId(latestStats)
    const firstByServer = byServerId(firstStats)
    const peakHighByServer = byServerId(peakHighStats)
    const peakLowByServer = byServerId(peakLowStats)
    const aggregatesByServer = new Map<number, { avg_players: number; median_players: number }>(
      aggregatesQuery.rows.map((row: any) => [Number(row.server_id), row])
    )

    for (const server of servers) {
      const aggregates = aggregatesByServer.get(server.id)

      serversData.set(server.id, {
        exists: true,
        server,
        latestStat: latestByServer.get(server.id),
        firstStat: firstByServer.get(server.id),
        peakHigh: peakHighByServer.get(server.id),
        peakLow: peakLowByServer.get(server.id),
        average: aggregates?.avg_players || 0,
        median: aggregates?.median_players || 0,
      })
    }

    for (const serverId of serverIds) {
      if (!serversData.has(serverId)) {
        serversData.set(serverId, { exists: false })
      }
    }

    return serversData
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
        return String(data.latestStat?.playerCount ?? 0)

      case 'PLAYER_COUNT_PEAK_HIGH':
        return String(data.peakHigh?.playerCount ?? 0)

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
  latestStat?: ServerStat
  firstStat?: ServerStat
  peakHigh?: ServerStat
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
