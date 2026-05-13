import { Exception } from '@adonisjs/core/exceptions'
import logger from '@adonisjs/core/services/logger'
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
   *
   * Une seule requête UNION ALL pour récupérer exact + before + after (P.3.3).
   */
  static async getExactTimeRow(serverId: number, exactTime: DateTime) {
    const exactTimeSql = exactTime.toSQL()

    const combinedQuery = `
      (SELECT 'exact'::text AS kind, server_id, created_at, player_count
         FROM server_stats
        WHERE server_id = :serverId AND created_at = :exactTime
        LIMIT 1)
      UNION ALL
      (SELECT 'before'::text AS kind, server_id, created_at, player_count
         FROM server_stats
        WHERE server_id = :serverId AND created_at < :exactTime
        ORDER BY created_at DESC
        LIMIT 1)
      UNION ALL
      (SELECT 'after'::text AS kind, server_id, created_at, player_count
         FROM server_stats
        WHERE server_id = :serverId AND created_at > :exactTime
        ORDER BY created_at ASC
        LIMIT 1)
    `

    const result = await Database.rawQuery(combinedQuery, {
      serverId,
      exactTime: exactTimeSql,
    })

    const rows: any[] = result.rows
    const stripKind = (r: any): any => ({
      server_id: r.server_id,
      created_at: r.created_at,
      player_count: r.player_count,
    })

    const exact = rows.find((r) => r.kind === 'exact')
    if (exact) return stripKind(exact)

    const before = rows.find((r) => r.kind === 'before')
    const after = rows.find((r) => r.kind === 'after')

    if (!before && !after) return null
    if (before && !after) return stripKind(before)
    if (!before && after) return stripKind(after)

    // Sinon on fait la moyenne
    const avg = Math.round((Number(before.player_count) + Number(after.player_count)) / 2)
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
   * Heuristique de routage (P.4.1) : utilise `server_stats_hourly` pour les requêtes
   * à interval ≥ 1h sur des plages > 24h. Sinon (intervals fins, fenêtres courtes,
   * absence de plage), reste sur `server_stats` brute.
   */
  private static shouldUseHourlyTable(
    intervalSeconds: number,
    fromDateSql?: string,
    toDateSql?: string
  ): boolean {
    if (intervalSeconds < 3600) return false
    if (!fromDateSql || !toDateSql) return false
    const rangeMs =
      DateTime.fromSQL(toDateSql).toMillis() - DateTime.fromSQL(fromDateSql).toMillis()
    return rangeMs > 24 * 60 * 60 * 1000
  }

  /**
   * Regroupe les stats en fonction d'un interval (ex: 1 hour, 30 minutes).
   * Route automatiquement vers la table horaire pré-agrégée si la plage est longue
   * (P.4.1). La moyenne re-bucketée est **pondérée** par `samples_count` pour
   * préserver la précision quand des heures ont moins de samples (serveur down).
   */
  static async getStatsWithInterval(
    serverId: number,
    interval: string,
    fromDateSql?: string,
    toDateSql?: string
  ) {
    const intervalSeconds = this.intervalToSeconds(interval)

    if (this.shouldUseHourlyTable(intervalSeconds, fromDateSql, toDateSql)) {
      let whereClauseHourly = `WHERE server_id = :serverId`
      if (fromDateSql && toDateSql) {
        whereClauseHourly += ` AND hour BETWEEN :fromDate AND :toDate`
      } else if (fromDateSql) {
        whereClauseHourly += ` AND hour >= :fromDate`
      } else if (toDateSql) {
        whereClauseHourly += ` AND hour <= :toDate`
      }

      const hourlyQuery = `
        SELECT
          to_timestamp(
            floor(extract(epoch from hour) / ${intervalSeconds})
            * ${intervalSeconds}
          ) AS created_at,
          ROUND(
            SUM(avg_player_count::bigint * samples_count)::numeric /
            NULLIF(SUM(samples_count), 0)
          )::int AS player_count
        FROM server_stats_hourly
        ${whereClauseHourly}
        GROUP BY 1
        ORDER BY 1
      `

      const bindings: any = { serverId }
      if (fromDateSql) bindings.fromDate = fromDateSql
      if (toDateSql) bindings.toDate = toDateSql

      const result = await Database.rawQuery(hourlyQuery, bindings)
      // Fallback transparent : si la table horaire n'est pas (encore) backfillée pour
      // cette range, on retombe sur l'agrégation brute. Évite les réponses vides
      // tant que `node ace backfill:hourly-stats` n'a pas tourné (P.4.1).
      if (result.rows.length > 0) {
        return result.rows
      }
      logger.warn(
        { serverId, fromDateSql, toDateSql, interval },
        'hourly stats empty for range — falling back to server_stats'
      )
    }

    // Chemin par défaut : agrégation à la volée sur server_stats brute.
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
   * Regroupe les stats par intervalle pour plusieurs serveurs en une seule requête.
   * Retourne un Map<serverId, stats[]> pour répartition côté Node.
   */
  static async getStatsBatch(params: {
    serverIds: number[]
    fromDate: number
    toDate: number
    interval: string
  }): Promise<
    Map<number, Array<{ created_at: DateTime; player_count: number; max_count: number }>>
  > {
    const intervalSeconds = this.intervalToSeconds(params.interval)
    const fromDateSql = DateTime.fromMillis(params.fromDate).toSQL()
    const toDateSql = DateTime.fromMillis(params.toDate).toSQL()

    const result = new Map<
      number,
      Array<{ created_at: DateTime; player_count: number; max_count: number }>
    >()

    if (params.serverIds.length === 0 || !fromDateSql || !toDateSql) {
      return result
    }

    const rawQuery = `
      SELECT
        server_id,
        to_timestamp(
          floor(extract(epoch from created_at) / ${intervalSeconds})
          * ${intervalSeconds}
        ) AS created_at,
        round(AVG(player_count))::int AS player_count,
        round(AVG(max_count))::int AS max_count
      FROM server_stats
      WHERE server_id = ANY(:serverIds)
        AND created_at BETWEEN :fromDate AND :toDate
      GROUP BY server_id, 2
      ORDER BY server_id, 2
    `

    const batchResult = await Database.rawQuery(rawQuery, {
      serverIds: params.serverIds,
      fromDate: fromDateSql,
      toDate: toDateSql,
    })
    const rows = batchResult.rows as Array<{
      server_id: number
      created_at: string | Date
      player_count: number
      max_count: number
    }>

    for (const id of params.serverIds) result.set(id, [])
    for (const row of rows) {
      const arr = result.get(row.server_id) ?? []
      arr.push({
        created_at:
          row.created_at instanceof Date
            ? DateTime.fromJSDate(row.created_at)
            : DateTime.fromSQL(row.created_at),
        player_count: row.player_count,
        max_count: row.max_count,
      })
      result.set(row.server_id, arr)
    }

    return result
  }

  /**
   * Récupère les stats brutes (avec éventuellement un filtrage fromDate/toDate).
   * Refuse les appels sans plage temporelle pour éviter de scanner toute la table.
   */
  static async getRawStats(serverId: number, fromDateSql?: string, toDateSql?: string) {
    if (!fromDateSql && !toDateSql) {
      throw new Exception(
        'fromDate (or interval) is required when fetching raw stats — refusing to scan the full table',
        { status: 400, code: 'E_STATS_MISSING_RANGE' }
      )
    }

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

  /**
   * Calcule et stocke les growth stats pour tous les serveurs en une seule requête SQL.
   * Remplace l'ancien O(3·N) séquentiel par O(1) côté DB + 1 upsert (cf. P.3.2).
   *
   * Pré-filtre sur 30 jours pour ne pas scanner toute la table — l'index
   * (server_id, created_at) le rend efficace.
   */
  static async calculateAndStoreGrowthStats() {
    const aggregateQuery = `
      SELECT
        server_id,
        ROUND(AVG(player_count) FILTER (WHERE created_at > now() - interval '7 days'))::int AS last_week_avg,
        ROUND(AVG(player_count) FILTER (WHERE created_at BETWEEN now() - interval '14 days' AND now() - interval '7 days'))::int AS prev_week_avg,
        ROUND(AVG(player_count) FILTER (WHERE created_at > now() - interval '30 days'))::int AS last_month_avg
      FROM server_stats
      WHERE created_at > now() - interval '30 days'
      GROUP BY server_id
    `

    const aggregateResult = await Database.rawQuery(aggregateQuery)
    const rows = aggregateResult.rows as Array<{
      server_id: number
      last_week_avg: number | null
      prev_week_avg: number | null
      last_month_avg: number | null
    }>

    const now = DateTime.now().toSQL()
    const growthRows = rows.map((row) => {
      const lastWeek = row.last_week_avg ?? 0
      const prevWeek = row.prev_week_avg ?? 0
      const lastMonth = row.last_month_avg ?? 0

      const weeklyGrowth =
        prevWeek === 0 ? 0 : Math.round(((lastWeek - prevWeek) / prevWeek) * 100) / 100
      const monthlyGrowth =
        lastMonth === 0 ? 0 : Math.round(((lastWeek - lastMonth) / lastMonth) * 100) / 100

      return {
        server_id: row.server_id,
        weekly_growth: weeklyGrowth,
        monthly_growth: monthlyGrowth,
        last_week_average: lastWeek,
        previous_week_average: prevWeek,
        last_month_average: lastMonth,
        last_updated: now,
      }
    })

    if (growthRows.length === 0) {
      logger.info(
        'SCHEDULER: growth_stats — no servers with stats in the last 30d, skipping upsert'
      )
      return
    }

    await Database.transaction(async (trx) => {
      await trx
        .table('server_growth_stats')
        .insert(growthRows)
        .onConflict('server_id')
        .merge([
          'weekly_growth',
          'monthly_growth',
          'last_week_average',
          'previous_week_average',
          'last_month_average',
          'last_updated',
        ])
    })

    logger.info(`SCHEDULER: growth_stats — upserted ${growthRows.length} rows`)
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

    logger.info('Fetching global stats with params:', params)

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

    // Expression "bucket" calculée une seule fois ; partition idem.
    // En l'absence d'interval, bucket = created_at (chaque ligne est son propre bucket).
    const intervalSeconds = params.interval ? this.intervalToSeconds(params.interval) : null
    const bucketExpr = intervalSeconds
      ? `to_timestamp(floor(extract(epoch from ss.created_at) / ${intervalSeconds}) * ${intervalSeconds})`
      : 'ss.created_at'
    const partitionExpr = intervalSeconds
      ? `floor(extract(epoch from ss.created_at) / ${intervalSeconds})`
      : 'ss.created_at'

    // Pour chaque (server_id, bucket), on garde la ligne la plus récente, puis
    // on somme player_count / max_count par bucket et on ordonne.
    const rawQuery = `
      WITH bucketed AS (
        SELECT
          ss.server_id,
          ss.player_count,
          ss.max_count,
          ${bucketExpr} AS bucket,
          ROW_NUMBER() OVER (
            PARTITION BY ss.server_id, ${partitionExpr}
            ORDER BY ss.created_at DESC
          ) AS rn
        FROM server_stats ss
        ${joins}
        ${whereClause}
      )
      SELECT
        bucket AS created_at,
        SUM(player_count)::bigint AS player_count,
        SUM(max_count)::bigint AS max_count
      FROM bucketed
      WHERE rn = 1
      GROUP BY bucket
      ORDER BY bucket
    `

    const bindings: any = {}
    if (fromDateSql) bindings.fromDate = fromDateSql
    if (toDateSql) bindings.toDate = toDateSql
    if (params.categoryId) bindings.categoryId = params.categoryId
    if (params.languageId) bindings.languageId = params.languageId

    const result = await Database.rawQuery(rawQuery, bindings)
    return result.rows.map((row: any) => ({
      createdAt: row.created_at,
      playerCount: Number(row.player_count),
      maxCount: Number(row.max_count),
    }))
  }
}
