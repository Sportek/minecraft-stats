import env from '#start/env'
import db from '@adonisjs/lucid/services/db'
import redis from '@adonisjs/redis/services/main'
import { createHmac } from 'node:crypto'
import { DateTime } from 'luxon'

/**
 * Redis-backed analytics counters. We use Redis (shared across the web and
 * scheduler processes) instead of in-memory state, and HyperLogLog for unique
 * visitor counting — HLL estimates cardinality without ever storing the
 * individual visitors, so it counts everyone (opt-outs included) while keeping
 * zero personal data. Anonymous aggregate measurement, consent-exempt.
 */
const PREFIX = 'mcstats:analytics'
const DAY_TTL = 100 * 24 * 3600 // ~100 days
const MAX_WINDOW_DAYS = 400

const dayKey = (d: DateTime) => d.toFormat('yyyy-LL-dd')
const monthKey = (d: DateTime) => d.toFormat('yyyy-LL')

/**
 * Anonymous, non-reversible visitor id. Salted with APP_KEY and the month so the
 * same visitor is stable within a calendar month (lets HLL dedupe), but cannot
 * be linked across months or back to an identity.
 */
function anonId(month: string, ip: string | null, userAgent: string | null): string {
  return createHmac('sha256', env.get('APP_KEY'))
    .update(`${month}|${ip ?? ''}|${userAgent ?? ''}`)
    .digest('hex')
}

function enumerateDays(from: DateTime, to: DateTime): DateTime[] {
  const start = from.startOf('day')
  const end = to.startOf('day')
  const days: DateTime[] = []
  let cursor = start
  while (cursor <= end && days.length < MAX_WINDOW_DAYS) {
    days.push(cursor)
    cursor = cursor.plus({ days: 1 })
  }
  return days
}

/**
 * Total HTTP traffic counter, incremented by the traffic middleware.
 * Fire-and-forget: returns void and swallows Redis errors internally so it never
 * adds latency to, or breaks, a request.
 */
export function recordRequest(isError: boolean): void {
  const day = dayKey(DateTime.now())
  const pipe = redis.pipeline()
  pipe.incr(`${PREFIX}:req:${day}`)
  pipe.expire(`${PREFIX}:req:${day}`, DAY_TTL)
  if (isError) {
    pipe.incr(`${PREFIX}:err:${day}`)
    pipe.expire(`${PREFIX}:err:${day}`, DAY_TTL)
  }
  pipe.exec().catch(() => {})
}

/**
 * Anonymous visitor hit, emitted by the front-end on every page view.
 * Fire-and-forget (see `recordRequest`).
 */
export function recordAnonymousHit(
  ip: string | null,
  userAgent: string | null,
  country: string | null
): void {
  const now = DateTime.now()
  const day = dayKey(now)
  const id = anonId(monthKey(now), ip, userAgent)
  const pipe = redis.pipeline()
  pipe.pfadd(`${PREFIX}:uniq:d:${day}`, id)
  pipe.expire(`${PREFIX}:uniq:d:${day}`, DAY_TTL)
  if (country) {
    pipe.hincrby(`${PREFIX}:geo:d:${day}`, country, 1)
    pipe.expire(`${PREFIX}:geo:d:${day}`, DAY_TTL)
  }
  pipe.exec().catch(() => {})
}

export interface TrafficCounters {
  httpRequests: number
  httpErrors: number
  uniqueVisitors: number
  uniqueVisitorsThisMonth: number
  series: Array<{ time: string; requests: number; uniqueVisitors: number }>
  countries: Array<{ country: string; views: number }>
}

interface DailySnapshot {
  httpRequests: number
  httpErrors: number
  uniqueVisitors: number
  countries: Record<string, number>
}

/**
 * Persists the given day's Redis counters into `traffic_daily` so they survive a
 * Redis volume wipe and the ~100-day key TTL. Counters are monotonic within a
 * day, so we keep the GREATEST of the stored and current values — a transient
 * Redis outage (which reports 0) can never erase a previously snapshotted day.
 */
export async function snapshotTrafficDay(day: DateTime): Promise<void> {
  const ds = dayKey(day)
  const pipe = redis.pipeline()
  pipe.get(`${PREFIX}:req:${ds}`)
  pipe.get(`${PREFIX}:err:${ds}`)
  pipe.pfcount(`${PREFIX}:uniq:d:${ds}`)
  pipe.hgetall(`${PREFIX}:geo:d:${ds}`)
  const results = (await pipe.exec()) ?? []

  const geo = (results[3]?.[1] ?? {}) as Record<string, string>
  const countries: Record<string, number> = {}
  for (const [country, count] of Object.entries(geo)) countries[country] = Number(count)
  const countriesJson = JSON.stringify(countries)

  const now = DateTime.now().toSQL()!
  await db
    .table('traffic_daily')
    .insert({
      date: ds,
      http_requests: Number(results[0]?.[1] ?? 0),
      http_errors: Number(results[1]?.[1] ?? 0),
      unique_visitors: Number(results[2]?.[1] ?? 0),
      countries: countriesJson,
      created_at: now,
      updated_at: now,
    })
    .onConflict('date')
    .merge({
      http_requests: db.raw('GREATEST(traffic_daily.http_requests, EXCLUDED.http_requests)'),
      http_errors: db.raw('GREATEST(traffic_daily.http_errors, EXCLUDED.http_errors)'),
      unique_visitors: db.raw('GREATEST(traffic_daily.unique_visitors, EXCLUDED.unique_visitors)'),
      countries: db.raw(
        "CASE WHEN EXCLUDED.countries = '{}'::jsonb THEN traffic_daily.countries ELSE EXCLUDED.countries END"
      ),
      updated_at: now,
    })
}

async function loadSnapshots(days: DateTime[]): Promise<Map<string, DailySnapshot>> {
  const map = new Map<string, DailySnapshot>()
  if (days.length === 0) return map

  // Read `date` as text — the pg driver would otherwise parse it into a UTC Date,
  // which shifts the day key in negative-offset timezones.
  const rows = await db
    .from('traffic_daily')
    .whereIn(
      'date',
      days.map((d) => dayKey(d))
    )
    .select('http_requests', 'http_errors', 'unique_visitors', 'countries')
    .select(db.raw("to_char(date, 'YYYY-MM-DD') as date_key"))

  for (const row of rows) {
    map.set(row.date_key, {
      httpRequests: Number(row.http_requests),
      httpErrors: Number(row.http_errors),
      uniqueVisitors: Number(row.unique_visitors),
      countries: (row.countries ?? {}) as Record<string, number>,
    })
  }
  return map
}

/**
 * Reads all counters for the dashboard over [from, to]. Redis is the live source
 * (unique counts deduplicated via HLL union over the day keys); for any day Redis
 * no longer has — volume wiped or key expired past its TTL — we fall back to the
 * durable `traffic_daily` snapshot so history is never lost.
 */
export async function getTrafficCounters(from: DateTime, to: DateTime): Promise<TrafficCounters> {
  const days = enumerateDays(from, to)
  if (days.length === 0) {
    return {
      httpRequests: 0,
      httpErrors: 0,
      uniqueVisitors: 0,
      uniqueVisitorsThisMonth: 0,
      series: [],
      countries: [],
    }
  }

  const now = DateTime.now()
  const monthDays = enumerateDays(now.startOf('month'), now)

  const pipe = redis.pipeline()
  for (const day of days) {
    const ds = dayKey(day)
    pipe.get(`${PREFIX}:req:${ds}`)
    pipe.get(`${PREFIX}:err:${ds}`)
    pipe.pfcount(`${PREFIX}:uniq:d:${ds}`)
    pipe.hgetall(`${PREFIX}:geo:d:${ds}`)
  }
  const [results, snapshots] = await Promise.all([
    pipe.exec().then((r) => r ?? []),
    loadSnapshots([...days, ...monthDays]),
  ])

  let httpRequests = 0
  let httpErrors = 0
  const series: TrafficCounters['series'] = []
  const countryTotals = new Map<string, number>()

  days.forEach((day, index) => {
    const base = index * 4
    let requests = Number(results[base]?.[1] ?? 0)
    let errors = Number(results[base + 1]?.[1] ?? 0)
    let uniqueVisitors = Number(results[base + 2]?.[1] ?? 0)
    let geo = (results[base + 3]?.[1] ?? {}) as Record<string, string | number>

    // Redis has nothing for this day → use the persisted snapshot instead.
    const snap = snapshots.get(day.toFormat('yyyy-LL-dd'))
    if (
      snap &&
      requests === 0 &&
      errors === 0 &&
      uniqueVisitors === 0 &&
      !Object.keys(geo).length
    ) {
      requests = snap.httpRequests
      errors = snap.httpErrors
      uniqueVisitors = snap.uniqueVisitors
      geo = snap.countries
    }

    httpRequests += requests
    httpErrors += errors
    series.push({ time: day.toISODate()!, requests, uniqueVisitors })

    for (const [country, count] of Object.entries(geo)) {
      countryTotals.set(country, (countryTotals.get(country) ?? 0) + Number(count))
    }
  })

  const windowKeys = days.map((d) => `${PREFIX}:uniq:d:${dayKey(d)}`)
  const monthKeys = monthDays.map((d) => `${PREFIX}:uniq:d:${dayKey(d)}`)

  const [redisUnique, redisUniqueThisMonth] = await Promise.all([
    redis.pfcount(...windowKeys),
    monthKeys.length ? redis.pfcount(...monthKeys) : Promise.resolve(0),
  ])

  // HLL union can't be rebuilt from snapshots; when Redis has lost the whole
  // window we approximate the unique count by summing the snapshotted days.
  const sumSnapshotUnique = (ds: DateTime[]) =>
    ds.reduce((sum, d) => sum + (snapshots.get(d.toFormat('yyyy-LL-dd'))?.uniqueVisitors ?? 0), 0)

  const uniqueVisitors = redisUnique > 0 ? redisUnique : sumSnapshotUnique(days)
  const uniqueVisitorsThisMonth =
    redisUniqueThisMonth > 0 ? redisUniqueThisMonth : sumSnapshotUnique(monthDays)

  const countries = [...countryTotals.entries()]
    .map(([country, views]) => ({ country, views }))
    .sort((a, b) => b.views - a.views)

  return { httpRequests, httpErrors, uniqueVisitors, uniqueVisitorsThisMonth, series, countries }
}
