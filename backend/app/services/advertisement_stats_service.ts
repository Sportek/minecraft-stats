import db from '@adonisjs/lucid/services/db'

type Interval = 'hour' | 'day'

interface AdvertisementStatsParams {
  advertisementId: number
  interval: Interval
  fromDate: number | null
  toDate: number | null
}

interface AdvertisementStatsPoint {
  time: unknown
  impressions: number
  clicks: number
}

interface AdvertisementStatsTotals {
  impressions: number
  clicks: number
}

export default class AdvertisementStatsService {
  /**
   * Agrège les événements (impressions/clics) d'une publicité en buckets
   * (`hour` ou `day`) sur la fenêtre demandée, et renvoie la série par bucket
   * ainsi que les totaux cumulés.
   */
  static async getStats(params: AdvertisementStatsParams): Promise<{
    totals: AdvertisementStatsTotals
    series: AdvertisementStatsPoint[]
  }> {
    const { advertisementId, interval, fromDate, toDate } = params

    let query = db.from('advertisement_events').where('advertisement_id', advertisementId)
    if (fromDate !== null) query = query.where('created_at', '>=', new Date(fromDate))
    if (toDate !== null) query = query.where('created_at', '<=', new Date(toDate))

    const rows = await query
      .select(db.raw('date_trunc(?, created_at) as bucket', [interval]))
      .select(db.raw(`count(*) filter (where type = 'impression') as impressions`))
      .select(db.raw(`count(*) filter (where type = 'click') as clicks`))
      .groupByRaw('bucket')
      .orderByRaw('bucket asc')

    const series = rows.map((row) => ({
      time: row.bucket,
      impressions: Number(row.impressions),
      clicks: Number(row.clicks),
    }))

    const totals = series.reduce(
      (acc, row) => ({
        impressions: acc.impressions + row.impressions,
        clicks: acc.clicks + row.clicks,
      }),
      { impressions: 0, clicks: 0 }
    )

    return { totals, series }
  }
}
