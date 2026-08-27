import db from '@adonisjs/lucid/services/db'
import { DateTime } from 'luxon'

/**
 * Inactivité au-delà de laquelle une nouvelle page vue ouvre une nouvelle
 * connexion. Une « connexion » n'est pas un login : les sessions durent des
 * semaines, un habitué se logue une fois puis revient des mois sans repasser par
 * le formulaire. C'est une visite — une série de pages vues séparée de la
 * précédente par au moins ce délai.
 */
const SESSION_GAP_MINUTES = 30

/** Colonnes de tri exposées à l'admin → expression SQL correspondante. */
const SORTS = {
  connections: 'connections',
  pageViews: 'page_views',
  timeSpent: 'duration_ms',
  lastSeen: 'last_seen_at',
} as const

export type UserActivitySort = keyof typeof SORTS

/** Garde de saisie : le tri vient d'un paramètre de requête, jamais de confiance. */
export const isUserActivitySort = (value: unknown): value is UserActivitySort =>
  typeof value === 'string' && value in SORTS

// Collapse numeric path segments (/servers/42 → /servers/:id) so the ~500 real
// URLs aggregate into a readable handful of route patterns.
const NORMALIZED_PATH = "regexp_replace(path, '/[0-9]+', '/:id', 'g')"

/**
 * CTE `per_user` : découpe les pages vues attribuées à un compte en connexions.
 * `lag()` donne l'écart avec la vue précédente du même utilisateur, et tout écart
 * supérieur au seuil d'inactivité ouvre une connexion. `bucketByDay` ajoute le
 * jour à la clé de regroupement pour obtenir la courbe jour par jour ; le seuil
 * est une constante du code, jamais une entrée utilisateur, d'où l'interpolation.
 */
const perUserCte = (options: { bucketByDay?: boolean; singleUser?: boolean } = {}) => {
  const dayColumn = options.bucketByDay ? "date_trunc('day', created_at) as day," : ''
  const dayGroup = options.bucketByDay ? ", date_trunc('day', created_at)" : ''
  const userFilter = options.singleUser ? 'and user_id = :userId' : ''

  return `
    with attributed as (
      select
        user_id,
        visitor_id,
        created_at,
        duration_ms,
        lag(created_at) over (partition by user_id order by created_at) as previous_at
      from page_views
      where user_id is not null
        and created_at >= :from
        and created_at <= :to
        ${userFilter}
    ),
    sessionized as (
      select
        *,
        case
          when previous_at is null
            or created_at - previous_at > interval '${SESSION_GAP_MINUTES} minutes'
          then 1
          else 0
        end as starts_connection
      from attributed
    ),
    per_user as (
      select
        user_id,
        ${dayColumn}
        sum(starts_connection)::int as connections,
        count(*)::int as page_views,
        count(distinct visitor_id)::int as devices,
        count(distinct date_trunc('day', created_at))::int as active_days,
        coalesce(sum(duration_ms), 0)::bigint as duration_ms,
        min(created_at) as first_seen_at,
        max(created_at) as last_seen_at
      from sessionized
      group by user_id${dayGroup}
    )
  `
}

export interface UserActivityMetrics {
  connections: number
  pageViews: number
  devices: number
  activeDays: number
  timeSpentMs: number
  viewsPerConnection: number
  firstSeenAt: Date | null
  lastSeenAt: Date | null
}

export interface ActiveUser extends UserActivityMetrics {
  id: number
  username: string
  email: string
  role: string
  avatarUrl: string | null
  createdAt: Date
}

interface ActivityWindow {
  fromDate: number | null
  toDate: number | null
}

interface LeaderboardParams extends ActivityWindow {
  page: number
  limit: number
  search: string
  sort: UserActivitySort
}

/** Ligne brute du CTE `per_user` : colonnes SQL, donc en snake_case. */
interface ActivityRow {
  connections: number | string | null
  page_views: number | string | null
  devices: number | string | null
  active_days: number | string | null
  duration_ms: number | string | null
  first_seen_at: Date | null
  last_seen_at: Date | null
}

interface ActiveUserRow extends ActivityRow {
  id: number
  username: string
  email: string
  role: string
  avatar_url: string | null
  created_at: Date
}

const EMPTY_METRICS: UserActivityMetrics = {
  connections: 0,
  pageViews: 0,
  devices: 0,
  activeDays: 0,
  timeSpentMs: 0,
  viewsPerConnection: 0,
  firstSeenAt: null,
  lastSeenAt: null,
}

/**
 * Activité des comptes connectés, pour le dashboard admin. Tout est dérivé de
 * `page_views`, seul journal d'usage attribué à un compte : les connexions y sont
 * reconstruites par découpage sur l'inactivité plutôt que comptées au login.
 */
export default class UserActivityService {
  /** Fenêtre par défaut : 30 derniers jours, comme le dashboard analytics. */
  private static resolveWindow({ fromDate, toDate }: ActivityWindow) {
    const from =
      fromDate !== null ? DateTime.fromMillis(fromDate) : DateTime.now().minus({ days: 30 })
    const to = toDate !== null ? DateTime.fromMillis(toDate) : DateTime.now()

    return { from: from.toJSDate(), to: to.toJSDate() }
  }

  private static toMetrics(row: ActivityRow | undefined): UserActivityMetrics {
    if (!row) return EMPTY_METRICS

    const connections = Number(row.connections ?? 0)
    const pageViews = Number(row.page_views ?? 0)

    return {
      connections,
      pageViews,
      devices: Number(row.devices ?? 0),
      activeDays: Number(row.active_days ?? 0),
      timeSpentMs: Number(row.duration_ms ?? 0),
      viewsPerConnection: connections > 0 ? Number((pageViews / connections).toFixed(1)) : 0,
      firstSeenAt: row.first_seen_at,
      lastSeenAt: row.last_seen_at,
    }
  }

  /**
   * Classement des comptes les plus actifs sur la fenêtre, paginé et triable.
   * Seuls les utilisateurs avec au moins une page vue attribuée y figurent.
   */
  static async leaderboard(params: LeaderboardParams) {
    const { page, limit, search, sort } = params
    const window = this.resolveWindow(params)

    // Le même filtre sert au classement et aux totaux : la pagination et le
    // compteur doivent porter sur exactement les mêmes lignes.
    const searchFilter = search ? 'where u.username ilike :search or u.email ilike :search' : ''
    const bindings = {
      ...window,
      ...(search ? { search: `%${search}%` } : {}),
      limit,
      offset: (page - 1) * limit,
    }
    const cte = perUserCte()

    const [rows, totalsRow] = await Promise.all([
      db
        .rawQuery(
          `${cte}
           select
             u.id, u.username, u.email, u.role, u.avatar_url, u.created_at,
             p.connections, p.page_views, p.devices, p.active_days, p.duration_ms,
             p.first_seen_at, p.last_seen_at
           from per_user p
           join users u on u.id = p.user_id
           ${searchFilter}
           order by ${SORTS[sort]} desc nulls last, u.id asc
           limit :limit offset :offset`,
          bindings
        )
        .then((result) => result.rows as ActiveUserRow[]),

      db
        .rawQuery(
          `${cte}
           select
             count(*)::int as active_users,
             coalesce(sum(p.connections), 0)::int as connections,
             coalesce(sum(p.page_views), 0)::int as page_views
           from per_user p
           join users u on u.id = p.user_id
           ${searchFilter}`,
          bindings
        )
        .then((result) => result.rows[0]),
    ])

    const activeUsers = Number(totalsRow?.active_users ?? 0)
    const connections = Number(totalsRow?.connections ?? 0)

    return {
      data: rows.map(
        (row): ActiveUser => ({
          id: Number(row.id),
          username: row.username,
          email: row.email,
          role: row.role,
          avatarUrl: row.avatar_url,
          createdAt: row.created_at,
          ...this.toMetrics(row),
        })
      ),
      meta: {
        total: activeUsers,
        perPage: limit,
        currentPage: page,
        lastPage: Math.max(1, Math.ceil(activeUsers / limit)),
      },
      totals: {
        activeUsers,
        connections,
        pageViews: Number(totalsRow?.page_views ?? 0),
        connectionsPerUser: activeUsers > 0 ? Number((connections / activeUsers).toFixed(1)) : 0,
      },
    }
  }

  /**
   * Détail d'activité d'un compte : mêmes métriques que le classement, plus la
   * courbe jour par jour et les pages les plus consultées par cet utilisateur.
   */
  static async forUser(userId: number, params: ActivityWindow) {
    const window = this.resolveWindow(params)
    const bindings = { ...window, userId }

    const [metricsRow, series, topPages] = await Promise.all([
      db
        .rawQuery(`${perUserCte({ singleUser: true })} select * from per_user`, bindings)
        .then((result) => result.rows[0] as ActivityRow | undefined),

      db
        .rawQuery(
          `${perUserCte({ singleUser: true, bucketByDay: true })}
           select day, connections, page_views from per_user order by day asc`,
          bindings
        )
        .then((result) => result.rows as { day: Date; connections: number; page_views: number }[]),

      db
        .from('page_views')
        .where('user_id', userId)
        .where('created_at', '>=', window.from)
        .where('created_at', '<=', window.to)
        .select(db.raw(`${NORMALIZED_PATH} as path`))
        .select(db.raw('count(*) as views'))
        .groupByRaw(NORMALIZED_PATH)
        .orderByRaw('views desc')
        .limit(10),
    ])

    return {
      ...this.toMetrics(metricsRow),
      series: series.map((row) => ({
        day: row.day,
        connections: Number(row.connections),
        pageViews: Number(row.page_views),
      })),
      topPages: topPages.map((row) => ({ path: row.path, views: Number(row.views) })),
    }
  }
}
