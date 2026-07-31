import EntitlementsService from '#services/entitlements_service'
import { Exception } from '@adonisjs/core/exceptions'
import logger from '@adonisjs/core/services/logger'
import Database from '@adonisjs/lucid/services/db'
import { DateTime } from 'luxon'
import type { Entitlements } from '../constants/tiers.js'

const HOUR_SECONDS = 60 * 60
const DAY_SECONDS = 24 * HOUR_SECONDS
const WEEK_SECONDS = 7 * DAY_SECONDS

/**
 * Au-delà de 90 jours, le rollup horaire fait scanner 24 lignes par serveur et
 * par jour là où le journalier en scanne une seule.
 */
const DAILY_ROLLUP_THRESHOLD_MS = 90 * DAY_SECONDS * 1000

/**
 * Le plafond de points et la profondeur d'historique dépendent désormais du palier
 * de l'appelant (cf. `app/constants/tiers.ts`) : ils arrivent par `entitlements`.
 * L'interface ne propose jamais de combinaison hors palier ; ces garde-fous
 * protègent la base des appels directs à l'API — sans eux, « 5 ans » × « 30 minutes »
 * demande 87 600 buckets.
 */

/**
 * Les deux rollups partagent leurs noms de colonnes ; seule la colonne temporelle
 * diffère. Une seule requête paramétrée sert donc les deux paliers.
 */
const ROLLUPS = {
  hourly: { table: 'server_stats_hourly', timeColumn: 'hour' },
  daily: { table: 'server_stats_daily', timeColumn: 'day' },
} as const

type RollupTier = keyof typeof ROLLUPS
type StatsSource = RollupTier | 'raw'

/**
 * Journée type : au-delà de cette fenêtre, le brut ferait scanner ~150 lignes par
 * jour et par serveur pour une seule page. On bascule sur le rollup horaire, dont
 * la granularité plafonne les créneaux à 1 h au lieu de 30 min.
 */
const RHYTHM_RAW_MAX_DAYS = 31

/**
 * Journée type déclinée par jour de semaine. On expose les sept jours pris un à un
 * (pour lire un évènement récurrent — le raid du samedi soir, la maintenance du
 * mardi) et les trois regroupements usuels, tous dérivés d'une même requête groupée
 * par `isodow`. Les clés `mon`…`sun` suivent l'ISO (lundi = 1).
 */
const ISO_WEEKDAYS = ['mon', 'tue', 'wed', 'thu', 'fri', 'sat', 'sun'] as const
type IsoWeekday = (typeof ISO_WEEKDAYS)[number]
type RhythmView = 'all' | 'weekday' | 'weekend' | IsoWeekday

interface RhythmSlot {
  slot: number
  minuteOfDay: number
  playerCount: number
  peakPlayerCount: number
  minPlayerCount: number
  samplesCount: number
  daysCount: number
}

export default class StatsService {
  static convertToCamelCase(input: {
    server_id: number
    created_at: DateTime
    max_count: number
    player_count: number
    peak_player_count?: number | null
    min_player_count?: number | null
  }): {
    serverId: number
    createdAt: DateTime
    playerCount: number
    peakPlayerCount: number
    minPlayerCount: number
    maxCount: number
  } {
    return {
      serverId: input.server_id,
      createdAt: input.created_at,
      playerCount: input.player_count,
      // Une ligne brute ou un rollup pas encore backfillé n'a pas d'amplitude
      // propre : l'échantillon unique est à la fois son pic et son creux.
      peakPlayerCount: input.peak_player_count ?? input.player_count,
      minPlayerCount: input.min_player_count ?? input.player_count,
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
   * Expression SQL du bucket pour une colonne temporelle donnée.
   *
   * `floor(epoch / N)` aligne les buckets sur l'epoch — ce qui, pour une semaine,
   * les fait commencer un **jeudi** (epoch 0 = jeudi 1ᵉʳ janvier 1970). On passe
   * par `date_trunc` dans ce cas pour que les semaines démarrent le lundi.
   */
  private static bucketExpr(column: string, intervalSeconds: number) {
    if (intervalSeconds === WEEK_SECONDS) return `date_trunc('week', ${column})`
    return `to_timestamp(floor(extract(epoch from ${column}) / ${intervalSeconds}) * ${intervalSeconds})`
  }

  /**
   * Table lue, de la plus précise à la moins coûteuse :
   * - `raw` : intervalles < 1 h (le rollup horaire ne sait pas les produire), ou
   *   fenêtres ≤ 24 h où le brut est déjà petit ;
   * - `hourly` : le gros des cas, de quelques jours à quelques mois ;
   * - `daily` : au-delà de 90 jours, où l'horaire ferait scanner 24× plus de lignes.
   */
  private static pickSource(intervalSeconds: number, fromMs: number, toMs: number): StatsSource {
    const rangeMs = toMs - fromMs
    if (intervalSeconds < HOUR_SECONDS || rangeMs <= DAY_SECONDS * 1000) return 'raw'
    if (intervalSeconds >= DAY_SECONDS && rangeMs > DAILY_ROLLUP_THRESHOLD_MS) return 'daily'
    return 'hourly'
  }

  /**
   * Refuse ce que le palier de l'appelant n'ouvre pas : une combinaison
   * plage × intervalle qui produirait plus de points que le graphique ne peut en
   * dire quoi que ce soit — et que la base paierait cher —, ou un historique plus
   * profond que ce à quoi le palier donne droit.
   */
  private static assertRangeAllowed(params: {
    fromMs: number
    toMs: number
    intervalSeconds: number | null
    entitlements: Entitlements
  }) {
    const { entitlements, fromMs, toMs, intervalSeconds } = params

    if (intervalSeconds) {
      const buckets = Math.ceil((toMs - fromMs) / (intervalSeconds * 1000))
      EntitlementsService.assertWithinLimit({
        limit: 'statBuckets',
        requested: buckets,
        allowed: entitlements.maxStatBuckets,
        entitlements,
        message: `This range would produce ${buckets} points (limit is ${entitlements.maxStatBuckets}) — request a wider interval`,
      })
    }

    if (entitlements.maxHistoryDays !== null) {
      // Arrondi au jour inférieur : les bornes sont snappées sur la grille de cache
      // (5 min), un preset « 1 an » ne doit pas sortir du palier pour trois minutes.
      const depthDays = Math.floor((Date.now() - fromMs) / (DAY_SECONDS * 1000))
      EntitlementsService.assertWithinLimit({
        limit: 'historyDays',
        requested: depthDays,
        allowed: entitlements.maxHistoryDays,
        entitlements,
        message: `This range reaches ${depthDays} days back (limit is ${entitlements.maxHistoryDays}) — request a shorter range`,
      })
    }
  }

  /**
   * Borne basse réelle quand le client ne fournit pas `fromDate` — la vue « Tout ».
   * On lit la date de création du serveur (ou du plus ancien serveur, pour la vue
   * globale) plutôt qu'un `MIN(created_at)` sur la table time-series : c'est la même
   * date à l'échelle du graphique, sans scan.
   */
  private static async resolveRangeStart(serverId?: number): Promise<number> {
    const query = Database.from('servers').min('created_at as start')
    if (serverId) query.where('id', serverId)

    const rows = await query
    const start = rows[0]?.start as Date | string | null
    if (!start) return Date.now()
    return start instanceof Date ? start.getTime() : DateTime.fromSQL(start).toMillis()
  }

  /**
   * Agrège un rollup (horaire ou journalier) pour un serveur. La moyenne
   * re-bucketée est **pondérée** par `samples_count` pour préserver la précision
   * quand certaines heures ont moins de samples (serveur down).
   */
  private static async getStatsFromRollup(params: {
    tier: RollupTier
    serverId: number
    intervalSeconds: number
    fromDateSql: string
    toDateSql: string
  }) {
    const { table, timeColumn } = ROLLUPS[params.tier]

    const query = `
      SELECT
        ${this.bucketExpr(timeColumn, params.intervalSeconds)} AS created_at,
        ROUND(
          SUM(avg_player_count::bigint * samples_count)::numeric /
          NULLIF(SUM(samples_count), 0)
        )::int AS player_count,
        MAX(peak_player_count)::int AS peak_player_count,
        MIN(min_player_count)::int AS min_player_count,
        MAX(max_slot_count)::int AS max_count
      FROM ${table}
      WHERE server_id = :serverId AND ${timeColumn} BETWEEN :fromDate AND :toDate
      GROUP BY 1
      ORDER BY 1
    `

    const result = await Database.rawQuery(query, {
      serverId: params.serverId,
      fromDate: params.fromDateSql,
      toDate: params.toDateSql,
    })
    return result.rows
  }

  /**
   * Regroupe les stats d'un serveur par intervalle, en lisant la source la moins
   * coûteuse capable de répondre (cf. {@link pickSource}).
   */
  static async getStatsWithInterval(
    serverId: number,
    intervalSeconds: number,
    fromMs: number,
    toMs: number
  ) {
    const fromDateSql = DateTime.fromMillis(fromMs).toSQL()!
    const toDateSql = DateTime.fromMillis(toMs).toSQL()!
    const source = this.pickSource(intervalSeconds, fromMs, toMs)

    if (source !== 'raw') {
      const rows = await this.getStatsFromRollup({
        tier: source,
        serverId,
        intervalSeconds,
        fromDateSql,
        toDateSql,
      })
      // Fallback transparent : tant que `node ace backfill:hourly-stats` ou
      // `backfill:daily-stats` n'a pas tourné sur cette plage, on retombe sur le
      // brut plutôt que de renvoyer une réponse vide.
      if (rows.length > 0) return rows
      logger.warn(
        { serverId, source, fromDateSql, toDateSql, intervalSeconds },
        'rollup empty for range — falling back to server_stats'
      )
    }

    const rawQuery = `
      SELECT
        ${this.bucketExpr('created_at', intervalSeconds)} AS created_at,
        round(AVG(player_count))::int AS player_count,
        MAX(player_count)::int AS peak_player_count,
        MIN(player_count)::int AS min_player_count,
        round(AVG(max_count))::int AS max_count
      FROM server_stats
      WHERE server_id = :serverId AND created_at BETWEEN :fromDate AND :toDate
      GROUP BY 1
      ORDER BY 1
    `

    const result = await Database.rawQuery(rawQuery, {
      serverId,
      fromDate: fromDateSql,
      toDate: toDateSql,
    })
    return result.rows
  }

  /**
   * Agrège les relevés par créneau horaire **local** et par jour de semaine (`isodow`,
   * lundi = 1). Les regroupements semaine/week-end/tous se font ensuite côté Node, à
   * partir de ces sept séries, sans repayer la requête.
   *
   * Le brut est normalisé sur les colonnes du rollup (un relevé = un sample) pour
   * qu'une seule expression d'agrégat serve les deux sources. La sous-requête
   * convertit une fois pour toutes en heure locale : `EXTRACT` et `::date` en aval
   * raisonnent alors sur l'horloge du visiteur, pas sur UTC.
   */
  private static async getRhythmRows(params: {
    source: 'raw' | 'hourly'
    serverId: number
    fromDateSql: string
    toDateSql: string
    timezone: string
  }) {
    const isRaw = params.source === 'raw'

    // `CAST(... AS text)` plutôt que `::text` : un paramètre de type inconnu rendrait
    // `timezone(unknown, timestamptz)` ambigu pour Postgres, et la syntaxe `::` entre
    // en conflit avec les bindings d'identifiant de Knex (`:nom:`).
    const localTime = (column: string) => `${column} AT TIME ZONE CAST(:timezone AS text)`

    const localised = isRaw
      ? `SELECT ${localTime('created_at')} AS local,
                player_count AS avg_player_count,
                player_count AS peak_player_count,
                player_count AS min_player_count,
                1 AS samples_count
           FROM server_stats
          WHERE server_id = :serverId
            AND created_at >= :fromDate AND created_at < :toDate
            AND player_count IS NOT NULL`
      : `SELECT ${localTime('hour')} AS local,
                avg_player_count, peak_player_count, min_player_count, samples_count
           FROM server_stats_hourly
          WHERE server_id = :serverId
            AND hour >= :fromDate AND hour < :toDate
            AND avg_player_count IS NOT NULL`

    const slotExpr = isRaw
      ? `EXTRACT(hour FROM local)::int * 2 + FLOOR(EXTRACT(minute FROM local) / 30)::int`
      : `EXTRACT(hour FROM local)::int`

    const query = `
      SELECT
        EXTRACT(isodow FROM local)::int AS iso_dow,
        ${slotExpr} AS slot,
        ROUND(
          SUM(avg_player_count::bigint * samples_count)::numeric /
          NULLIF(SUM(samples_count), 0)
        )::int AS player_count,
        MAX(COALESCE(peak_player_count, avg_player_count))::int AS peak_player_count,
        MIN(COALESCE(min_player_count, avg_player_count))::int AS min_player_count,
        SUM(samples_count)::int AS samples_count,
        COUNT(DISTINCT local::date)::int AS days_count
      FROM (${localised}) s
      GROUP BY 1, 2
      ORDER BY 1, 2
    `

    const result = await Database.rawQuery(query, {
      serverId: params.serverId,
      fromDate: params.fromDateSql,
      toDate: params.toDateSql,
      timezone: params.timezone,
    })
    return result.rows as Array<{
      iso_dow: number
      slot: number
      player_count: number
      peak_player_count: number
      min_player_count: number
      samples_count: number
      days_count: number
    }>
  }

  /**
   * Fusionne plusieurs séries par jour en une seule. Les jours portent des dates
   * disjointes, donc sommer `daysCount` est exact ; la moyenne, elle, doit être
   * repondérée par `samplesCount` — un samedi peu suivi ne doit pas peser autant
   * qu'un vendredi plein dans la moyenne « semaine ».
   */
  private static mergeRhythmSeries(series: RhythmSlot[][]): RhythmSlot[] {
    const bySlot = new Map<number, RhythmSlot>()

    for (const slot of series.flat()) {
      const known = bySlot.get(slot.slot)
      if (!known) {
        bySlot.set(slot.slot, { ...slot })
        continue
      }

      const samplesCount = known.samplesCount + slot.samplesCount
      bySlot.set(slot.slot, {
        slot: slot.slot,
        minuteOfDay: slot.minuteOfDay,
        playerCount: Math.round(
          (known.playerCount * known.samplesCount + slot.playerCount * slot.samplesCount) /
            samplesCount
        ),
        peakPlayerCount: Math.max(known.peakPlayerCount, slot.peakPlayerCount),
        minPlayerCount: Math.min(known.minPlayerCount, slot.minPlayerCount),
        samplesCount,
        daysCount: known.daysCount + slot.daysCount,
      })
    }

    return [...bySlot.values()].sort((a, b) => a.slot - b.slot)
  }

  /**
   * « Journée type » : l'historique replié sur 24 h. Chaque créneau porte la moyenne
   * des relevés tombés à cette heure-là sur la fenêtre demandée, ce qui répond à une
   * question que la chronologie ne sait pas poser — *quand* ce serveur est-il vivant.
   *
   * Le découpage se fait dans le fuseau de celui qui lit (`timezone`) et non en UTC :
   * un pic « à 21 h » ne veut rien dire sans une horloge de référence.
   */
  static async getDailyRhythm(params: { server_id: number; days: number; timezone: string }) {
    const toMs = Date.now()
    const fromMs = toMs - params.days * DAY_SECONDS * 1000
    const shared = {
      serverId: params.server_id,
      fromDateSql: DateTime.fromMillis(fromMs).toSQL()!,
      toDateSql: DateTime.fromMillis(toMs).toSQL()!,
      timezone: params.timezone,
    }

    let source: 'raw' | 'hourly' = params.days <= RHYTHM_RAW_MAX_DAYS ? 'raw' : 'hourly'
    let rows = await this.getRhythmRows({ ...shared, source })

    // Même repli transparent que `getStatsWithInterval` : tant que le backfill horaire
    // n'a pas couvert la plage, mieux vaut un brut coûteux qu'une réponse vide.
    if (source === 'hourly' && rows.length === 0) {
      logger.warn(shared, 'hourly rollup empty for rhythm range — falling back to server_stats')
      source = 'raw'
      rows = await this.getRhythmRows({ ...shared, source })
    }

    const slotMinutes = source === 'raw' ? 30 : 60
    const toSlot = (row: (typeof rows)[number]): RhythmSlot => ({
      slot: row.slot,
      minuteOfDay: row.slot * slotMinutes,
      playerCount: row.player_count,
      peakPlayerCount: row.peak_player_count,
      minPlayerCount: row.min_player_count,
      samplesCount: row.samples_count,
      daysCount: row.days_count,
    })

    // Une série par jour ISO (lundi = 1). Les regroupements ne sont que des fusions.
    const byWeekday = ISO_WEEKDAYS.map((_, index) =>
      rows.filter((row) => row.iso_dow === index + 1).map(toSlot)
    )
    const perDay = Object.fromEntries(
      ISO_WEEKDAYS.map((day, index) => [day, byWeekday[index]])
    ) as Record<IsoWeekday, RhythmSlot[]>

    const series: Record<RhythmView, RhythmSlot[]> = {
      ...perDay,
      weekday: this.mergeRhythmSeries(byWeekday.slice(0, 5)),
      weekend: this.mergeRhythmSeries(byWeekday.slice(5)),
      all: this.mergeRhythmSeries(byWeekday),
    }

    // Un serveur qui ne répond que le soir n'a de relevés que sur ses créneaux du
    // soir : le maximum, et non la moyenne, donne le nombre de jours réellement vus.
    const daysObserved = Object.fromEntries(
      Object.entries(series).map(([view, slots]) => [
        view,
        slots.reduce((max, slot) => Math.max(max, slot.daysCount), 0),
      ])
    ) as Record<RhythmView, number>

    return {
      timezone: params.timezone,
      slotMinutes,
      from: DateTime.fromMillis(fromMs).toISO(),
      to: DateTime.fromMillis(toMs).toISO(),
      daysObserved,
      series,
    }
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

      // Croissance relative de `lastWeek` par rapport à une base, arrondie à 2 décimales.
      // 0 quand la base est nulle (pas de point de comparaison).
      const growthVs = (base: number) =>
        base === 0 ? 0 : Math.round(((lastWeek - base) / base) * 100) / 100
      const weeklyGrowth = growthVs(prevWeek)
      const monthlyGrowth = growthVs(lastMonth)

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

  static async getStats(
    params: {
      server_id: number
      exactTime?: number
      fromDate?: number
      toDate?: number
      interval?: string
    },
    entitlements: Entitlements
  ) {
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
    const fromDateSql = params.fromDate ? this.toSqlOrFail(params.fromDate, 'fromDate') : undefined
    const toDateSql = params.toDate ? this.toSqlOrFail(params.toDate, 'toDate') : undefined

    // ---------------------------------------
    //  interval => regroupement
    // ---------------------------------------
    if (params.interval) {
      const intervalSeconds = this.intervalToSeconds(params.interval)
      const toMs = params.toDate ?? Date.now()
      // `fromDate` absent = « depuis le début » : on résout la borne réelle pour que
      // le choix de la source et le garde-fou raisonnent sur la vraie plage.
      const fromMs = params.fromDate ?? (await this.resolveRangeStart(serverId))
      this.assertRangeAllowed({ fromMs, toMs, intervalSeconds, entitlements })

      const rows = await this.getStatsWithInterval(serverId, intervalSeconds, fromMs, toMs)
      return rows.map(this.convertToCamelCase)
    }

    // ---------------------------------------
    // Sinon => stats brutes
    // ---------------------------------------
    if (params.fromDate) {
      this.assertRangeAllowed({
        fromMs: params.fromDate,
        toMs: params.toDate ?? Date.now(),
        intervalSeconds: null,
        entitlements,
      })
    }

    const results = await this.getRawStats(serverId, fromDateSql, toDateSql)
    return results.map(this.convertToCamelCase)
  }

  /** Epoch ms → timestamp SQL, en refusant proprement une date invalide. */
  private static toSqlOrFail(epochMs: number, field: 'fromDate' | 'toDate') {
    const parsed = DateTime.fromMillis(epochMs)
    if (!parsed.isValid) {
      throw new Exception(`Invalid ${field} format`, { status: 400 })
    }
    return parsed.toSQL()
  }

  /**
   * Variante rollup de `getGlobalStats`. Par (serveur, bucket) on pondère l'avg par
   * `samples_count` — comme le chemin par-serveur — puis on somme sur l'ensemble
   * des serveurs. Bien moins de lignes scannées que sur le brut.
   *
   * Note de sémantique : le « pic global » est la **somme des pics par serveur**,
   * pas le pic simultané de la plateforme (les pics de deux serveurs ne tombent
   * pas à la même minute). L'interface l'annonce comme tel.
   */
  private static async getGlobalStatsFromRollup(params: {
    tier: RollupTier
    intervalSeconds: number
    fromDateSql: string
    toDateSql: string
    categoryId?: number
    languageId?: number
  }) {
    const { table, timeColumn } = ROLLUPS[params.tier]
    let joins = ''
    const whereClauses: string[] = [`sh.${timeColumn} BETWEEN :fromDate AND :toDate`]

    if (params.categoryId) {
      joins += ` INNER JOIN server_categories sc ON sh.server_id = sc.server_id `
      whereClauses.push('sc.category_id = :categoryId')
    }
    if (params.languageId) {
      joins += ` INNER JOIN server_languages sl ON sh.server_id = sl.server_id `
      whereClauses.push('sl.language_id = :languageId')
    }

    const rawQuery = `
      WITH per_server_bucket AS (
        SELECT
          sh.server_id,
          ${this.bucketExpr(`sh.${timeColumn}`, params.intervalSeconds)} AS bucket,
          ROUND(
            SUM(sh.avg_player_count::bigint * sh.samples_count)::numeric /
            NULLIF(SUM(sh.samples_count), 0)
          ) AS player_count,
          MAX(COALESCE(sh.peak_player_count, sh.avg_player_count)) AS peak_player_count,
          MIN(COALESCE(sh.min_player_count, sh.avg_player_count)) AS min_player_count,
          MAX(sh.max_slot_count) AS max_count
        FROM ${table} sh
        ${joins}
        WHERE ${whereClauses.join(' AND ')}
        GROUP BY sh.server_id, bucket
      )
      SELECT
        bucket AS created_at,
        SUM(player_count)::bigint AS player_count,
        SUM(peak_player_count)::bigint AS peak_player_count,
        SUM(min_player_count)::bigint AS min_player_count,
        SUM(max_count)::bigint AS max_count
      FROM per_server_bucket
      GROUP BY bucket
      ORDER BY bucket
    `

    const bindings: Record<string, string | number> = {
      fromDate: params.fromDateSql,
      toDate: params.toDateSql,
    }
    if (params.categoryId) bindings.categoryId = params.categoryId
    if (params.languageId) bindings.languageId = params.languageId

    const result = await Database.rawQuery(rawQuery, bindings)
    return result.rows.map(this.toGlobalRow)
  }

  /**
   * Ligne globale SQL → forme camelCase de l'API. `peak`/`min` peuvent être NULL
   * tant qu'un rollup n'est pas backfillé : on retombe alors sur la moyenne.
   */
  private static toGlobalRow(row: {
    created_at: string | Date
    player_count: string | number
    peak_player_count: string | number | null
    min_player_count: string | number | null
    max_count: string | number
  }) {
    const playerCount = Number(row.player_count)
    return {
      createdAt: row.created_at,
      playerCount,
      peakPlayerCount: row.peak_player_count === null ? playerCount : Number(row.peak_player_count),
      minPlayerCount: row.min_player_count === null ? playerCount : Number(row.min_player_count),
      maxCount: Number(row.max_count),
    }
  }

  static async getGlobalStats(
    params: {
      fromDate?: number
      toDate?: number
      interval?: string
      categoryId?: number
      languageId?: number
    },
    entitlements: Entitlements
  ) {
    logger.info('Fetching global stats with params:', params)

    const intervalSeconds = params.interval ? this.intervalToSeconds(params.interval) : null
    const toMs = params.toDate ?? Date.now()
    // `fromDate` absent = « depuis le début » : on résout la borne réelle pour que
    // le choix de la source et le garde-fou raisonnent sur la vraie plage.
    const fromMs = params.fromDate ?? (await this.resolveRangeStart())

    if (params.fromDate) this.toSqlOrFail(params.fromDate, 'fromDate')
    if (params.toDate) this.toSqlOrFail(params.toDate, 'toDate')
    this.assertRangeAllowed({ fromMs, toMs, intervalSeconds, entitlements })

    const fromDateSql = DateTime.fromMillis(fromMs).toSQL()!
    const toDateSql = DateTime.fromMillis(toMs).toSQL()!

    // Routage vers un rollup pré-agrégé plutôt que de scanner tout le brut.
    // Fallback transparent sur le brut si la plage n'est pas encore backfillée.
    if (intervalSeconds) {
      const source = this.pickSource(intervalSeconds, fromMs, toMs)
      if (source !== 'raw') {
        const rollupRows = await this.getGlobalStatsFromRollup({
          tier: source,
          intervalSeconds,
          fromDateSql,
          toDateSql,
          categoryId: params.categoryId,
          languageId: params.languageId,
        })
        if (rollupRows.length > 0) return rollupRows
        logger.warn(params, 'global rollup empty for range — falling back to server_stats')
      }
    }

    // Construction des JOINs pour les filtres catégorie/langue
    let joins = ''
    const whereClauses: string[] = ['ss.created_at BETWEEN :fromDate AND :toDate']

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

    // En l'absence d'interval, chaque ligne est son propre bucket.
    const bucketExpr = intervalSeconds
      ? this.bucketExpr('ss.created_at', intervalSeconds)
      : 'ss.created_at'

    // Par (serveur, bucket) on agrège les samples, puis on somme sur les serveurs.
    // La moyenne — et non le dernier sample du bucket, comme auparavant — aligne ce
    // chemin sur celui des rollups : les deux sources donnent désormais le même
    // chiffre pour un même bucket.
    const rawQuery = `
      WITH per_server_bucket AS (
        SELECT
          ss.server_id,
          ${bucketExpr} AS bucket,
          AVG(ss.player_count) AS player_count,
          MAX(ss.player_count) AS peak_player_count,
          MIN(ss.player_count) AS min_player_count,
          MAX(ss.max_count) AS max_count
        FROM server_stats ss
        ${joins}
        WHERE ${whereClauses.join(' AND ')}
        GROUP BY ss.server_id, bucket
      )
      SELECT
        bucket AS created_at,
        ROUND(SUM(player_count))::bigint AS player_count,
        SUM(peak_player_count)::bigint AS peak_player_count,
        SUM(min_player_count)::bigint AS min_player_count,
        SUM(max_count)::bigint AS max_count
      FROM per_server_bucket
      GROUP BY bucket
      ORDER BY bucket
    `

    const bindings: Record<string, string | number | number[]> = {
      fromDate: fromDateSql,
      toDate: toDateSql,
    }
    if (params.categoryId) bindings.categoryId = params.categoryId
    if (params.languageId) bindings.languageId = params.languageId

    const result = await Database.rawQuery(rawQuery, bindings)
    return result.rows.map(this.toGlobalRow)
  }
}
