import CacheService from '#services/cache_service'
import StatsService from '#services/stat_service'
import { StatValidator } from '#validators/stat'
import { GlobalStatValidator } from '#validators/global_stat'
import type { HttpContext } from '@adonisjs/core/http'

function bypassFlag(ctx: HttpContext): boolean {
  if (ctx.request.input('nocache') !== '1') return false
  if (process.env.NODE_ENV !== 'production') return true
  return ctx.auth?.user?.role === 'admin'
}

export default class StatsController {
  /**
   * @index
   * @operationId getServerStats
   * @tag STATS
   * @summary Get stats for a single server
   * @description Returns time-series player count stats for a server. You MUST provide either fromDate (raw stats over a range), interval (bucketed aggregation), or exactTime (point-in-time lookup). Calling this endpoint without any of these will return 400 to avoid scanning the full stats table.
   * @paramPath server_id - Server id - @type(number) @example(125) @required
   * @paramQuery exactTime - Point-in-time lookup as epoch milliseconds (or the literal string `now`). Returns the row at that timestamp, or an averaged interpolation between the nearest before/after rows. - @type(number) @example(1717200000000)
   * @paramQuery fromDate - Start of range as epoch milliseconds (or the literal string `now`). Required if neither interval nor exactTime is provided. - @type(number) @example(1716854400000)
   * @paramQuery toDate - End of range as epoch milliseconds (or the literal string `now`). - @type(number) @example(1717459200000)
   * @paramQuery interval - Bucket size for aggregation. When provided, stats are grouped per bucket. Allowed values: `30 minutes`, `1 hour`, `2 hours`, `6 hours`, `1 day`, `1 week` (URL-encode the space, e.g. `interval=1%20hour`). - @type(string) @example(1 hour)
   * @responseBody 200 - [{"serverId": 134, "createdAt": "2026-05-28T12:00:00.000Z", "playerCount": 1250, "maxCount": 2000}]
   * @responseBody 400 - {"error": "fromDate (or interval) is required when fetching raw stats — refusing to scan the full table"}
   * @responseBody 500 - {"error": "Internal server error"}
   */
  async index(ctx: HttpContext) {
    const { request, response } = ctx
    try {
      const validatedData = await StatValidator.validate({
        ...request.params(),
        ...request.qs(),
      })

      // Cas exactTime non cacheable (point-in-time, rarement réutilisé).
      if (validatedData.exactTime) {
        const results = await StatsService.getStats(validatedData)
        return response.status(200).json(results)
      }

      const key = `stats:${validatedData.server_id}:${validatedData.fromDate ?? 0}:${validatedData.toDate ?? 0}:${validatedData.interval ?? 'raw'}`
      const results = await CacheService.cacheOrFetch(
        key,
        300,
        () => StatsService.getStats(validatedData),
        { bypass: bypassFlag(ctx) }
      )
      return response.status(200).json(results)
    } catch (error) {
      console.error(error)
      return response.status(error.status ?? 500).json({
        error: error.message ?? 'Internal server error',
      })
    }
  }

  /**
   * @globalStats
   * @operationId getGlobalStats
   * @tag STATS
   * @summary Get aggregated global stats across all servers
   * @description Returns time-series player count and slot capacity aggregated across all servers on the platform. Optional filters by category or language. When `interval` is provided, results are bucketed; otherwise each row is its own bucket. For each (server, bucket) pair, only the most recent sample is kept before summing.
   * @paramQuery fromDate - Start of range as epoch milliseconds (or the literal string `now`). - @type(number) @example(1716854400000)
   * @paramQuery toDate - End of range as epoch milliseconds (or the literal string `now`). - @type(number) @example(1717459200000)
   * @paramQuery interval - Bucket size for aggregation. Allowed values: `30 minutes`, `1 hour`, `2 hours`, `6 hours`, `1 day`, `1 week` (URL-encode the space, e.g. `interval=1%20hour`). - @type(string) @example(1 hour)
   * @paramQuery categoryId - Restrict aggregation to servers in this category. - @type(number) @example(3)
   * @paramQuery languageId - Restrict aggregation to servers in this language. - @type(number) @example(1)
   * @responseBody 200 - [{"createdAt": "2026-05-28T12:00:00.000Z", "playerCount": 48230, "maxCount": 120000}]
   * @responseBody 400 - {"error": "Invalid fromDate format"}
   * @responseBody 500 - {"error": "Internal server error"}
   */
  async globalStats(ctx: HttpContext) {
    const { request, response } = ctx
    try {
      const validatedData = await GlobalStatValidator.validate(request.qs())
      const key = CacheService.hashParams('global-stats', validatedData)
      const results = await CacheService.cacheOrFetch(
        key,
        300,
        () => StatsService.getGlobalStats(validatedData),
        { bypass: bypassFlag(ctx) }
      )
      return response.status(200).json(results)
    } catch (error) {
      console.error(error)
      return response.status(error.status ?? 500).json({
        error: error.message ?? 'Internal server error',
      })
    }
  }
}
