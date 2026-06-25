import PageView from '#models/page_view'
import env from '#start/env'
import db from '@adonisjs/lucid/services/db'
import { createHmac } from 'node:crypto'
import { DateTime } from 'luxon'

type Interval = 'hour' | 'day'

interface VisitorContext {
  ip: string | null
  userAgent: string | null
  country: string | null
}

interface PageViewInput extends VisitorContext {
  visitorId: string
  userId: number | null
  path: string
  referrer: string | null
  title: string | null
  durationMs: number | null
}

interface DashboardParams {
  interval: Interval
  fromDate: number | null
  toDate: number | null
}

export default class AnalyticsService {
  /**
   * Hash non réversible d'une IP (HMAC-SHA256 salé avec APP_KEY). On ne stocke
   * jamais l'adresse en clair — ce hash permet de regrouper les visites d'une
   * même IP sans conserver de donnée personnelle directement identifiante.
   */
  static hashIp(ip: string | null): string | null {
    if (!ip) return null
    return createHmac('sha256', env.get('APP_KEY')).update(ip).digest('hex')
  }

  /**
   * Crée (ou rafraîchit) le visiteur identifié par son UUID anonyme et renvoie
   * sa clé primaire. Upsert atomique pour résister aux vues concurrentes du
   * même visiteur (première visite multi-onglets).
   */
  private static async upsertVisitor(uuid: string, ctx: VisitorContext): Promise<number> {
    const now = DateTime.now().toSQL()
    const fields = {
      ip_hash: this.hashIp(ctx.ip),
      user_agent: ctx.userAgent?.slice(0, 512) ?? null,
      country: ctx.country,
    }

    const [row] = await db
      .table('visitors')
      .insert({ uuid, ...fields, first_seen_at: now, last_seen_at: now })
      .onConflict('uuid')
      .merge({ ...fields, last_seen_at: now })
      .returning('id')

    return Number(row.id)
  }

  /**
   * Enregistre une page vue. Best-effort : appelé en fire-and-forget par le client.
   */
  static async recordPageView(input: PageViewInput): Promise<void> {
    const visitorId = await this.upsertVisitor(input.visitorId, input)

    await PageView.create({
      visitorId,
      userId: input.userId,
      path: input.path,
      referrer: input.referrer,
      title: input.title,
      durationMs: input.durationMs,
    })
  }

  /**
   * Relie le visiteur anonyme courant à un compte authentifié (event "identify"
   * émis au login). Enregistre l'association N:N et rattache rétroactivement au
   * compte les vues restées anonymes avant ce premier login.
   */
  static async identify(visitorUuid: string, userId: number, ctx: VisitorContext): Promise<void> {
    const visitorId = await this.upsertVisitor(visitorUuid, ctx)
    const now = DateTime.now().toSQL()

    await db
      .table('visitor_accounts')
      .insert({ visitor_id: visitorId, user_id: userId, linked_at: now, last_active_at: now })
      .onConflict(['visitor_id', 'user_id'])
      .merge({ last_active_at: now })

    // Seules les vues encore anonymes sont rattachées : on n'écrase jamais une
    // vue déjà attribuée à un autre compte sur le même appareil partagé.
    await db.from('page_views').where('visitor_id', visitorId).whereNull('user_id').update({
      user_id: userId,
    })
  }

  /**
   * Agrège les statistiques d'usage du site sur la fenêtre demandée pour le
   * dashboard admin : séries temporelles, top pages/référents/pays et totaux.
   */
  static async getDashboard(params: DashboardParams) {
    const { interval, fromDate, toDate } = params
    const from = fromDate !== null ? new Date(fromDate) : null
    const to = toDate !== null ? new Date(toDate) : null

    const withWindow = (column: string) => (query: ReturnType<typeof db.from>) => {
      if (from) query.where(column, '>=', from)
      if (to) query.where(column, '<=', to)
      return query
    }
    const onPageViews = withWindow('created_at')

    const [totalsRow, series, topPages, topReferrers, countries, trafficRow] = await Promise.all([
      onPageViews(db.from('page_views'))
        .select(db.raw('count(*) as page_views'))
        .select(db.raw('count(distinct visitor_id) as unique_visitors'))
        .select(db.raw('count(*) filter (where user_id is not null) as logged_in_views'))
        .first(),

      onPageViews(db.from('page_views'))
        .select(db.raw('date_trunc(?, created_at) as bucket', [interval]))
        .select(db.raw('count(*) as page_views'))
        .select(db.raw('count(distinct visitor_id) as unique_visitors'))
        .groupByRaw('bucket')
        .orderByRaw('bucket asc'),

      onPageViews(db.from('page_views'))
        .select('path')
        .select(db.raw('count(*) as views'))
        .select(db.raw('count(distinct visitor_id) as unique_visitors'))
        .groupBy('path')
        .orderByRaw('views desc')
        .limit(15),

      onPageViews(db.from('page_views'))
        .select('referrer')
        .select(db.raw('count(*) as views'))
        .whereNotNull('referrer')
        .whereNot('referrer', '')
        .groupBy('referrer')
        .orderByRaw('views desc')
        .limit(15),

      onPageViews(db.from('page_views as pv'))
        .join('visitors as v', 'v.id', 'pv.visitor_id')
        .select('v.country')
        .select(db.raw('count(*) as views'))
        .whereNotNull('v.country')
        .groupBy('v.country')
        .orderByRaw('views desc')
        .limit(30),

      withWindow('bucket')(db.from('traffic_stats'))
        .select(db.raw('coalesce(sum(requests), 0) as requests'))
        .select(db.raw('coalesce(sum(errors), 0) as errors'))
        .first(),
    ])

    return {
      totals: {
        pageViews: Number(totalsRow?.page_views ?? 0),
        uniqueVisitors: Number(totalsRow?.unique_visitors ?? 0),
        loggedInViews: Number(totalsRow?.logged_in_views ?? 0),
        requests: Number(trafficRow?.requests ?? 0),
        errors: Number(trafficRow?.errors ?? 0),
      },
      series: series.map((row) => ({
        time: row.bucket,
        pageViews: Number(row.page_views),
        uniqueVisitors: Number(row.unique_visitors),
      })),
      topPages: topPages.map((row) => ({
        path: row.path,
        views: Number(row.views),
        uniqueVisitors: Number(row.unique_visitors),
      })),
      topReferrers: topReferrers.map((row) => ({
        referrer: row.referrer,
        views: Number(row.views),
      })),
      countries: countries.map((row) => ({
        country: row.country,
        views: Number(row.views),
      })),
    }
  }
}
