import env from '#start/env'
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

/**
 * Reads all Redis-backed counters for the dashboard over [from, to]. Unique
 * counts are deduplicated via HLL union (`PFCOUNT` over the day keys).
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

  const pipe = redis.pipeline()
  for (const day of days) {
    const ds = dayKey(day)
    pipe.get(`${PREFIX}:req:${ds}`)
    pipe.get(`${PREFIX}:err:${ds}`)
    pipe.pfcount(`${PREFIX}:uniq:d:${ds}`)
    pipe.hgetall(`${PREFIX}:geo:d:${ds}`)
  }
  const results = (await pipe.exec()) ?? []

  let httpRequests = 0
  let httpErrors = 0
  const series: TrafficCounters['series'] = []
  const countryTotals = new Map<string, number>()

  days.forEach((day, index) => {
    const base = index * 4
    const requests = Number(results[base]?.[1] ?? 0)
    const errors = Number(results[base + 1]?.[1] ?? 0)
    const uniqueVisitors = Number(results[base + 2]?.[1] ?? 0)
    const geo = (results[base + 3]?.[1] ?? {}) as Record<string, string>

    httpRequests += requests
    httpErrors += errors
    series.push({ time: day.toISODate()!, requests, uniqueVisitors })

    for (const [country, count] of Object.entries(geo)) {
      countryTotals.set(country, (countryTotals.get(country) ?? 0) + Number(count))
    }
  })

  const now = DateTime.now()
  const monthDays = enumerateDays(now.startOf('month'), now).map(
    (d) => `${PREFIX}:uniq:d:${dayKey(d)}`
  )
  const windowKeys = days.map((d) => `${PREFIX}:uniq:d:${dayKey(d)}`)

  const [uniqueVisitors, uniqueVisitorsThisMonth] = await Promise.all([
    redis.pfcount(...windowKeys),
    monthDays.length ? redis.pfcount(...monthDays) : Promise.resolve(0),
  ])

  const countries = [...countryTotals.entries()]
    .map(([country, views]) => ({ country, views }))
    .sort((a, b) => b.views - a.views)

  return { httpRequests, httpErrors, uniqueVisitors, uniqueVisitorsThisMonth, series, countries }
}
