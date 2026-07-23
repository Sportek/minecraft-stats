import CacheService from '#services/cache_service'
import StatsService from '#services/stat_service'
import { DailyRhythmValidator, StatValidator } from '#validators/stat'
import { GlobalStatValidator } from '#validators/global_stat'
import type { HttpContext } from '@adonisjs/core/http'

export default class StatsController {
  /**
   * @index
   * @operationId getServerStats
   * @tag STATS
   * @summary Get stats for a single server
   * @description Returns time-series player count stats for a server. You MUST provide either fromDate (raw stats over a range), interval (bucketed aggregation), or exactTime (point-in-time lookup). Calling this endpoint without any of these will return 400 to avoid scanning the full stats table. Each bucket carries `playerCount` (average over the bucket), `peakPlayerCount` (highest sample) and `minPlayerCount` (lowest sample); for a single sample the three are equal.
   * @paramPath server_id - Server id - @type(number) @example(125) @required
   * @paramQuery exactTime - Point-in-time lookup as epoch milliseconds (or the literal string `now`). Returns the row at that timestamp, or an averaged interpolation between the nearest before/after rows. - @type(number) @example(1717200000000)
   * @paramQuery fromDate - Start of range as epoch milliseconds (or the literal string `now`). Omit it alongside `interval` to go back to the server's first recorded day. Required if neither interval nor exactTime is provided. - @type(number) @example(1716854400000)
   * @paramQuery toDate - End of range as epoch milliseconds (or the literal string `now`). Defaults to now. - @type(number) @example(1717459200000)
   * @paramQuery interval - Bucket size for aggregation. When provided, stats are grouped per bucket. Allowed values: `30 minutes`, `1 hour`, `2 hours`, `6 hours`, `1 day`, `1 week` (URL-encode the space, e.g. `interval=1%20hour`). A range/interval pair producing more than 1500 buckets is rejected. - @type(string) @example(1 hour)
   * @responseBody 200 - [{"serverId": 134, "createdAt": "2026-05-28T12:00:00.000Z", "playerCount": 1250, "peakPlayerCount": 1840, "minPlayerCount": 910, "maxCount": 2000}]
   * @responseBody 400 - {"error": "This range would produce 26280 points (limit is 1500) — request a wider interval"}
   * @responseBody 500 - {"error": "Internal server error"}
   */
  async index(ctx: HttpContext) {
    const { request, response } = ctx
    const validatedData = await StatValidator.validate({
      ...request.params(),
      ...request.qs(),
    })

    // Cas exactTime non cacheable (point-in-time, rarement réutilisé).
    if (validatedData.exactTime) {
      const results = await StatsService.getStats(validatedData)
      return response.status(200).json(results)
    }

    // Snappe les bornes sur la grille de cache : sans ça, `Date.now()` côté client
    // rend chaque requête unique et le cache ne sert jamais (cf. quantizeEpochMs).
    if (validatedData.fromDate) {
      validatedData.fromDate = CacheService.quantizeEpochMs(validatedData.fromDate)
    }
    if (validatedData.toDate) {
      validatedData.toDate = CacheService.quantizeEpochMs(validatedData.toDate)
    }

    const key = `stats:${validatedData.server_id}:${validatedData.fromDate ?? 0}:${validatedData.toDate ?? 0}:${validatedData.interval ?? 'raw'}`
    const results = await CacheService.cacheOrFetch(
      key,
      300,
      () => StatsService.getStats(validatedData),
      { bypass: CacheService.bypassAllowed(ctx) }
    )
    return response.status(200).json(results)
  }

  /**
   * @dailyRhythm
   * @operationId getServerDailyRhythm
   * @tag STATS
   * @summary Get the typical day of a server
   * @description Folds the last `days` of history onto a single 24-hour day, in the caller's time zone. Answers "when is this server busiest" rather than "how did it grow". Windows of 31 days or less are built from raw samples and yield 48 half-hour slots; longer windows use the hourly rollup and yield 24 one-hour slots — read `slotMinutes` rather than assuming. Ten series are returned in one payload so a client can switch between them without a round trip: `all`, `weekday` (Mon–Fri), `weekend` (Sat–Sun), and each individual day `mon`…`sun` — useful for spotting a recurring event such as a Saturday-night raid. Day-of-week is resolved in the same time zone. Slots with no successful ping are absent from the array, which is not the same as a slot averaging zero players.
   * @paramPath server_id - Server id - @type(number) @example(125) @required
   * @paramQuery days - Size of the observation window, in days back from now. Defaults to 30, capped at 730. - @type(number) @example(30)
   * @paramQuery timezone - IANA time zone used to bucket slots and resolve the day of week. Defaults to UTC. - @type(string) @example(Europe/Paris)
   * @responseBody 200 - {"timezone": "Europe/Paris", "slotMinutes": 30, "from": "2026-06-23T00:00:00.000+02:00", "to": "2026-07-23T00:00:00.000+02:00", "daysObserved": {"all": 30, "weekday": 22, "weekend": 8, "mon": 4, "tue": 5, "wed": 4, "thu": 5, "fri": 4, "sat": 4, "sun": 4}, "series": {"all": [{"slot": 43, "minuteOfDay": 1290, "playerCount": 502, "peakPlayerCount": 806, "minPlayerCount": 341, "samplesCount": 90, "daysCount": 30}], "weekday": [], "weekend": [], "mon": [], "tue": [], "wed": [], "thu": [], "fri": [], "sat": [], "sun": []}}
   * @responseBody 422 - {"errors": [{"message": "The timezone field must be a valid IANA time zone", "rule": "ianaTimezone", "field": "timezone"}]}
   * @responseBody 500 - {"error": "Internal server error"}
   */
  async dailyRhythm(ctx: HttpContext) {
    const { request, response } = ctx
    const validatedData = await DailyRhythmValidator.validate({
      ...request.params(),
      ...request.qs(),
    })

    // Pas de `quantizeEpochMs` ici : la fenêtre est dérivée de `days` et de
    // maintenant, donc la clé est déjà stable — c'est le TTL qui la fait glisser.
    const key = `rhythm:${validatedData.server_id}:${validatedData.days}:${validatedData.timezone}`
    const results = await CacheService.cacheOrFetch(
      key,
      300,
      () => StatsService.getDailyRhythm(validatedData),
      { bypass: CacheService.bypassAllowed(ctx) }
    )
    return response.status(200).json(results)
  }

  /**
   * @globalStats
   * @operationId getGlobalStats
   * @tag STATS
   * @summary Get aggregated global stats across all servers
   * @description Returns time-series player count and slot capacity aggregated across all servers on the platform. Optional filters by category or language. When `interval` is provided, results are bucketed; otherwise each row is its own bucket. Each (server, bucket) pair is averaged, then summed across servers. `peakPlayerCount` is the **sum of per-server peaks**, not the platform's simultaneous peak — two servers rarely peak in the same minute.
   * @paramQuery fromDate - Start of range as epoch milliseconds (or the literal string `now`). Omit it to go back to the platform's first recorded day. - @type(number) @example(1716854400000)
   * @paramQuery toDate - End of range as epoch milliseconds (or the literal string `now`). Defaults to now. - @type(number) @example(1717459200000)
   * @paramQuery interval - Bucket size for aggregation. Allowed values: `30 minutes`, `1 hour`, `2 hours`, `6 hours`, `1 day`, `1 week` (URL-encode the space, e.g. `interval=1%20hour`). A range/interval pair producing more than 1500 buckets is rejected. - @type(string) @example(1 hour)
   * @paramQuery categoryId - Restrict aggregation to servers in this category. - @type(number) @example(3)
   * @paramQuery languageId - Restrict aggregation to servers in this language. - @type(number) @example(1)
   * @responseBody 200 - [{"createdAt": "2026-05-28T12:00:00.000Z", "playerCount": 48230, "peakPlayerCount": 71400, "minPlayerCount": 29800, "maxCount": 120000}]
   * @responseBody 400 - {"error": "This range would produce 26280 points (limit is 1500) — request a wider interval"}
   * @responseBody 500 - {"error": "Internal server error"}
   */
  async globalStats(ctx: HttpContext) {
    const { request, response } = ctx
    const validatedData = await GlobalStatValidator.validate(request.qs())

    // Snappe les bornes sur la grille de cache : sans ça, `Date.now()` côté client
    // rend chaque requête unique et le cache ne sert jamais (cf. quantizeEpochMs).
    if (validatedData.fromDate) {
      validatedData.fromDate = CacheService.quantizeEpochMs(validatedData.fromDate)
    }
    if (validatedData.toDate) {
      validatedData.toDate = CacheService.quantizeEpochMs(validatedData.toDate)
    }

    const key = CacheService.hashParams('global-stats', validatedData)
    const results = await CacheService.cacheOrFetch(
      key,
      300,
      () => StatsService.getGlobalStats(validatedData),
      { bypass: CacheService.bypassAllowed(ctx) }
    )
    return response.status(200).json(results)
  }
}
