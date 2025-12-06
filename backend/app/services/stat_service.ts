import Server from '#models/server'
import ServerGrowthStat from '#models/server_growth_stat'
import { Exception } from '@adonisjs/core/exceptions'
import Database from '@adonisjs/lucid/services/db'
import { DateTime } from 'luxon'

export default class StatsService {
  static convertToCamelCase(input: {
    server_id: number
    created_at: DateTime
    max_count: number
    player_count: number
  }): any {
    return {
      serverId: input.server_id,
      createdAt: input.created_at,
      playerCount: input.player_count,
      maxCount: input.max_count,
    }
  }

  /**
   * Cherche la donnée exacte, ou fait la moyenne entre la donnée
   * juste avant et juste après si elle n'existe pas.
   */
  static async getExactTimeRow(serverId: number, exactTime: DateTime) {
    const exactTimeSql = exactTime.toSQL()

    // 1) Vérifier si la donnée exacte existe
    const exactRowQuery = `
      SELECT 
        server_id,
        created_at,
        player_count
      FROM server_stats
      WHERE server_id = ?
        AND created_at = ?
      LIMIT 1
    `
    const exactRow = await Database.rawQuery(exactRowQuery, [serverId, exactTimeSql])

    if (exactRow.rows.length > 0) {
      // On a trouvé l'enregistrement exact
      return exactRow.rows[0]
    }

    // 2) Sinon, récupérer l'enregistrement juste avant et juste après
    const rowBeforeQuery = `
      SELECT 
        server_id,
        created_at,
        player_count
      FROM server_stats
      WHERE server_id = ?
        AND created_at < ?
      ORDER BY created_at DESC
      LIMIT 1
    `
    const rowAfterQuery = `
      SELECT 
        server_id,
        created_at,
        player_count
      FROM server_stats
      WHERE server_id = ?
        AND created_at > ?
      ORDER BY created_at ASC
      LIMIT 1
    `
    const [beforeRows, afterRows] = await Promise.all([
      Database.rawQuery(rowBeforeQuery, [serverId, exactTimeSql]),
      Database.rawQuery(rowAfterQuery, [serverId, exactTimeSql]),
    ])
    const rowBefore = beforeRows.rows[0]
    const rowAfter = afterRows.rows[0]

    // Aucun avant/après => rien à renvoyer
    if (!rowBefore && !rowAfter) return null
    // Seulement avant
    if (rowBefore && !rowAfter) return rowBefore
    // Seulement après
    if (!rowBefore && rowAfter) return rowAfter

    // Sinon on fait la moyenne
    const avg = Math.round((Number(rowBefore.player_count) + Number(rowAfter.player_count)) / 2)
    return {
      server_id: serverId,
      created_at: exactTimeSql,
      player_count: avg,
    }
  }

  /**
   * Convertit un interval (string) en nombre de secondes.
   */
  private static intervalToSeconds(interval: string) {
    switch (interval) {
      case '30 minutes':
        return 30 * 60
      case '1 hour':
        return 60 * 60
      case '2 hours':
        return 2 * 60 * 60
      case '6 hours':
        return 6 * 60 * 60
      case '1 day':
        return 24 * 60 * 60
      case '1 week':
        return 7 * 24 * 60 * 60
      default:
        return 3600 // Défaut = 1h
    }
  }

  /**
   * Regroupe les stats en fonction d'un interval (ex: 1 hour, 30 minutes).
   */
  static async getStatsWithInterval(
    serverId: number,
    interval: string,
    fromDateSql?: string,
    toDateSql?: string
  ) {
    const intervalSeconds = this.intervalToSeconds(interval)

    // Construction de la clause WHERE
    // On utilise des conditions "dynamiques" sur fromDateSql et toDateSql
    let whereClause = `WHERE server_id = :serverId`
    if (fromDateSql && toDateSql) {
      whereClause += `
        AND created_at BETWEEN :fromDate AND :toDate
      `
    } else if (fromDateSql) {
      whereClause += ` AND created_at >= :fromDate `
    } else if (toDateSql) {
      whereClause += ` AND created_at <= :toDate `
    }

    const rawQuery = `
      SELECT 
        to_timestamp(
          floor(extract(epoch from created_at) / ${intervalSeconds}) 
          * ${intervalSeconds}
        ) AS created_at,
        round(AVG(player_count))::int AS player_count
      FROM server_stats
      ${whereClause}
      GROUP BY 1
      ORDER BY 1
    `

    const bindings: any = { serverId }
    if (fromDateSql) bindings.fromDate = fromDateSql
    if (toDateSql) bindings.toDate = toDateSql

    const result = await Database.rawQuery(rawQuery, bindings)
    return result.rows
  }

  /**
   * Récupère les stats brutes (avec éventuellement un filtrage fromDate/toDate).
   */
  static async getRawStats(serverId: number, fromDateSql?: string, toDateSql?: string) {
    const query = Database.from('server_stats').select('*').where('server_id', serverId)

    if (fromDateSql && toDateSql) {
      query.whereBetween('created_at', [fromDateSql, toDateSql])
    } else if (fromDateSql) {
      query.where('created_at', '>=', fromDateSql)
    } else if (toDateSql) {
      query.where('created_at', '<=', toDateSql)
    }

    return query.orderBy('created_at', 'asc')
  }

  static async calculateAndStoreGrowthStats() {
    const servers = await Server.query()

    for (const server of servers) {
      const lastWeekStats = await this.getStatsWithInterval(
        server.id,
        '1 week',
        DateTime.now().minus({ week: 1 }).toSQL()
      )
      const previousWeekStats = await this.getStatsWithInterval(
        server.id,
        '1 week',
        DateTime.now().minus({ week: 2 }).toSQL()
      )
      const lastMonthStats = await this.getStatsWithInterval(
        server.id,
        '1 month',
        DateTime.now().minus({ month: 1 }).toSQL()
      )

      const lastWeekAverage = Math.round(
        lastWeekStats.reduce((sum: number, stat: any) => sum + stat.player_count, 0) /
          lastWeekStats.length
      )
      const previousWeekAverage = Math.round(
        previousWeekStats.reduce((sum: number, stat: any) => sum + stat.player_count, 0) /
          previousWeekStats.length
      )
      const lastMonthAverage = Math.round(
        lastMonthStats.reduce((sum: number, stat: any) => sum + stat.player_count, 0) /
          lastMonthStats.length
      )

      // On calcule le taux de croissance de la semaine dernière par rapport à la semaine d'avant
      const weeklyGrowth =
        Math.round(((lastWeekAverage - previousWeekAverage) / previousWeekAverage) * 100) / 100

      // On calcule le taux de croissance de la semaine dernière par rapport au mois dernier
      const monthlyGrowth =
        Math.round(((lastWeekAverage - lastMonthAverage) / lastMonthAverage) * 100) / 100

      await ServerGrowthStat.updateOrCreate(
        { serverId: server.id },
        {
          serverId: server.id,
          weeklyGrowth: weeklyGrowth,
          monthlyGrowth: monthlyGrowth,
          lastWeekAverage: lastWeekAverage,
          previousWeekAverage: previousWeekAverage,
          lastMonthAverage: lastMonthAverage,
          lastUpdated: DateTime.now(),
        }
      )
    }
  }

  static async getStats(params: {
    server_id: number
    exactTime?: number
    fromDate?: number
    toDate?: number
    interval?: string
  }) {
    const serverId = params.server_id
    if (!serverId) {
      throw new Exception('Server id is required', { status: 400 })
    }

    // ---------------------------------------
    // exactTime => on fait la logique dédiée
    // ---------------------------------------
    if (params.exactTime) {
      const exactDateTime = DateTime.fromMillis(params.exactTime)
      if (!exactDateTime.isValid) {
        throw new Exception('Invalid exactTime format', { status: 400 })
      }
      const row = await this.getExactTimeRow(serverId, exactDateTime)
      return row ? [this.convertToCamelCase(row)] : []
    }

    // ---------------------------------------
    // fromDate / toDate => filtrage éventuel
    // ---------------------------------------
    let fromDateSql: string | undefined
    let toDateSql: string | undefined

    if (params.fromDate) {
      const fromDateTime = DateTime.fromMillis(params.fromDate)
      if (!fromDateTime.isValid) {
        throw new Exception('Invalid fromDate format', { status: 400 })
      }
      fromDateSql = fromDateTime.toSQL()
    }
    if (params.toDate) {
      const toDateTime = DateTime.fromMillis(params.toDate)
      if (!toDateTime.isValid) {
        throw new Exception('Invalid toDate format', { status: 400 })
      }
      toDateSql = toDateTime.toSQL()
    }

    // ---------------------------------------
    //  interval => regroupement
    // ---------------------------------------
    if (params.interval) {
      const rows = await this.getStatsWithInterval(
        serverId,
        params.interval,
        fromDateSql,
        toDateSql
      )

      // // Optionnel : filtrer les rows où player_count = 0
      // const filtered = rows.filter((row: any) => row.player_count > 0)

      return rows.map(this.convertToCamelCase)
    }

    // ---------------------------------------
    // Sinon => stats brutes
    // ---------------------------------------
    const results = await this.getRawStats(serverId, fromDateSql, toDateSql)
    return results.map(this.convertToCamelCase)
  }

  static async getGlobalStats(params: {
    fromDate?: number
    toDate?: number
    interval?: string
    categoryId?: number
    languageId?: number
  }) {
    let fromDateSql: string | undefined
    let toDateSql: string | undefined

    console.log('Coucou')

    if (params.fromDate) {
      const fromDateTime = DateTime.fromMillis(params.fromDate)
      if (!fromDateTime.isValid) {
        throw new Exception('Invalid fromDate format', { status: 400 })
      }
      fromDateSql = fromDateTime.toSQL()
    }
    if (params.toDate) {
      const toDateTime = DateTime.fromMillis(params.toDate)
      if (!toDateTime.isValid) {
        throw new Exception('Invalid toDate format', { status: 400 })
      }
      toDateSql = toDateTime.toSQL()
    }

    // Construction des JOINs pour les filtres catégorie/langue
    let joins = ''
    const whereClauses: string[] = []

    if (params.categoryId) {
      joins += `
        INNER JOIN server_categories sc ON ss.server_id = sc.server_id
      `
      whereClauses.push(`sc.category_id = :categoryId`)
    }

    if (params.languageId) {
      joins += `
        INNER JOIN server_languages sl ON ss.server_id = sl.server_id
      `
      whereClauses.push(`sl.language_id = :languageId`)
    }

    // Construction de la clause WHERE pour le filtrage des dates
    if (fromDateSql && toDateSql) {
      whereClauses.push(`ss.created_at BETWEEN :fromDate AND :toDate`)
    } else if (fromDateSql) {
      whereClauses.push(`ss.created_at >= :fromDate`)
    } else if (toDateSql) {
      whereClauses.push(`ss.created_at <= :toDate`)
    }

    const whereClause = whereClauses.length > 0 ? `WHERE ${whereClauses.join(' AND ')}` : ''

    // Optimisation : Utilisation d'une seule requête avec des sous-requêtes pour éviter les calculs redondants
    const rawQuery = `
      WITH latest_stats AS (
        SELECT DISTINCT ON (ss.server_id,
          ${
            params.interval
              ? `
            to_timestamp(
              floor(extract(epoch from ss.created_at) / ${this.intervalToSeconds(params.interval)})
              * ${this.intervalToSeconds(params.interval)}
            )
          `
              : 'ss.created_at'
          })
          ss.server_id,
          ${
            params.interval
              ? `
            to_timestamp(
              floor(extract(epoch from ss.created_at) / ${this.intervalToSeconds(params.interval)})
              * ${this.intervalToSeconds(params.interval)}
            ) AS created_at,
          `
              : 'ss.created_at,'
          }
          ss.player_count,
          ss.max_count
        FROM server_stats ss
        ${joins}
        ${whereClause}
        ORDER BY ss.server_id,
          ${
            params.interval
              ? `
            to_timestamp(
              floor(extract(epoch from ss.created_at) / ${this.intervalToSeconds(params.interval)})
              * ${this.intervalToSeconds(params.interval)}
            )
          `
              : 'ss.created_at'
          },
          ss.created_at DESC
      )
      SELECT
        created_at,
        SUM(player_count)::int AS player_count,
        SUM(max_count)::int AS max_count
      FROM latest_stats
      GROUP BY created_at
      ORDER BY created_at
    `

    const bindings: any = {}
    if (fromDateSql) bindings.fromDate = fromDateSql
    if (toDateSql) bindings.toDate = toDateSql
    if (params.categoryId) bindings.categoryId = params.categoryId
    if (params.languageId) bindings.languageId = params.languageId

    const result = await Database.rawQuery(rawQuery, bindings)
    return result.rows.map(this.convertToCamelCase)
  }
}
