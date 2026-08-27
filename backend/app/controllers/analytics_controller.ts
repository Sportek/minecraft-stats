import { recordAnonymousHit } from '#services/analytics_counters'
import AnalyticsService from '#services/analytics_service'
import UserActivityService, { isUserActivitySort } from '#services/user_activity_service'
import { IdentifyVisitorValidator, TrackPageViewValidator } from '#validators/analytics'
import { parseEpochMs } from '#validators/helpers'
import type { HttpContext } from '@adonisjs/core/http'

export default class AnalyticsController {
  /**
   * @trackPageView
   * @operationId trackPageView
   * @tag ANALYTICS
   * @summary Record a first-party page view
   * @description Records a page view for the anonymous `visitorId` (a client-generated UUID). The endpoint is best-effort and always responds `204 No Content`, even when persistence fails. When the request carries a valid `Authorization` bearer token the view is additionally attributed to the logged-in user. The visitor's IP is never stored in clear: only a salted HMAC is kept. Publicly accessible.
   * @requestBody {"visitorId": "f47ac10b-58cc-4372-a567-0e02b2c3d479", "path": "/servers/42", "referrer": "https://google.com", "title": "Server 42", "durationMs": 5230}
   * @responseBody 204 - No content
   * @responseBody 422 - {"errors": [{"message": "Validation failed", "field": "visitorId"}]}
   */
  async pageview({ request, response, auth }: HttpContext) {
    const payload = await request.validateUsing(TrackPageViewValidator)

    // L'endpoint est public : on lit l'utilisateur s'il est connecté, sans imposer
    // l'authentification (un visiteur anonyme doit pouvoir être traqué).
    await auth.check()

    try {
      await AnalyticsService.recordPageView({
        visitorId: payload.visitorId,
        userId: auth.user?.id ?? null,
        path: payload.path,
        referrer: payload.referrer ?? null,
        title: payload.title ?? null,
        durationMs: payload.durationMs ?? null,
        ip: AnalyticsService.realIp(request),
        userAgent: request.header('user-agent') ?? null,
        country: AnalyticsService.normalizeCountry(request.header('CF-IPCountry')),
      })
    } catch (error) {
      // Le tracking est best-effort : un échec ne doit pas faire échouer la requête.
      console.error('Failed to record page view', error)
    }

    return response.noContent()
  }

  /**
   * @identifyVisitor
   * @operationId identifyVisitor
   * @tag ANALYTICS
   * @summary Link an anonymous visitor to the authenticated account
   * @description Associates the anonymous `visitorId` with the currently authenticated user (N:N link, emitted at login) and retroactively attributes to the account the page views that were still anonymous before this first login. Requires authentication.
   * @requestBody {"visitorId": "f47ac10b-58cc-4372-a567-0e02b2c3d479"}
   * @responseBody 204 - No content
   * @responseBody 401 - {"message": "Unauthorized"}
   * @responseBody 422 - {"errors": [{"message": "Validation failed", "field": "visitorId"}]}
   */
  async identify({ request, response, auth }: HttpContext) {
    const user = auth.getUserOrFail()
    const { visitorId } = await request.validateUsing(IdentifyVisitorValidator)

    try {
      await AnalyticsService.identify(visitorId, user.id, {
        ip: AnalyticsService.realIp(request),
        userAgent: request.header('user-agent') ?? null,
        country: AnalyticsService.normalizeCountry(request.header('CF-IPCountry')),
      })
    } catch (error) {
      console.error('Failed to identify visitor', error)
    }

    return response.noContent()
  }

  /**
   * @trackAnonymousHit
   * @operationId trackAnonymousHit
   * @tag ANALYTICS
   * @summary Record an anonymous, consent-free visitor hit
   * @description Records a fully anonymous visitor hit used only for aggregate audience measurement (unique visitor counts and per-country traffic). No identifier is stored: the visitor's IP and user agent are folded into a HyperLogLog estimator that cannot enumerate or reveal individuals. Because it stores no personal data, it runs without consent (opt-outs included). Always responds `204 No Content`. Publicly accessible.
   * @responseBody 204 - No content
   */
  async hit({ request, response }: HttpContext) {
    recordAnonymousHit(
      AnalyticsService.realIp(request),
      request.header('user-agent') ?? null,
      AnalyticsService.normalizeCountry(request.header('CF-IPCountry'))
    )
    return response.noContent()
  }

  /**
   * @getAnalyticsDashboard
   * @operationId getAnalyticsDashboard
   * @tag ANALYTICS_ADMIN
   * @summary Website usage analytics dashboard (admin)
   * @description Returns aggregated first-party analytics over the requested window: totals (anonymous unique visitors over the window and for the current month, raw HTTP requests/errors, consented page views and logged-in views), a per-day time series of requests and unique visitors, the top pages and referrers, and the per-country breakdown. The window is narrowed with the optional `fromDate`/`toDate` query parameters (epoch milliseconds; default: last 30 days). Requires authentication and administrator privileges.
   * @paramQuery fromDate - Lower bound of the window, in epoch milliseconds (or the literal string `now`). - @type(number) @example(1716854400000)
   * @paramQuery toDate - Upper bound of the window, in epoch milliseconds (or the literal string `now`). - @type(number) @example(1717459200000)
   * @responseBody 200 - {"totals": {"httpRequests": 98000, "httpErrors": 120, "uniqueVisitors": 3400, "uniqueVisitorsThisMonth": 5200, "pageViews": 12000, "loggedInViews": 1200}, "series": [{"time": "2026-05-01", "requests": 3200, "uniqueVisitors": 120}], "topPages": [{"path": "/servers/:id", "views": 5000, "uniqueVisitors": 2100}], "topReferrers": [{"referrer": "https://google.com", "views": 800}], "countries": [{"country": "FR", "views": 6000}]}
   * @responseBody 401 - {"message": "Unauthorized"}
   * @responseBody 403 - {"error": "Access denied. Admin privileges required."}
   */
  async dashboard({ request, response }: HttpContext) {
    const fromDate = parseEpochMs(request.input('fromDate'))
    const toDate = parseEpochMs(request.input('toDate'))

    const data = await AnalyticsService.getDashboard({ fromDate, toDate })

    return response.ok(data)
  }

  /**
   * @getUserActivity
   * @operationId getUserActivity
   * @tag ANALYTICS_ADMIN
   * @summary Logged-in user activity leaderboard (admin)
   * @description Ranks the accounts that used the site over the requested window. A "connection" is a visit, not a login: page views attributed to an account are cut into sessions on 30 minutes of inactivity, so a member who logs in once and comes back daily still counts one connection per visit. Each row carries the connection count, page views, distinct devices, active days, time spent and last activity; `totals` sums the same window. Supports pagination (`page`, `limit`), a username/email `search` and a `sort` column. Requires authentication and administrator privileges.
   * @paramQuery fromDate - Lower bound of the window, in epoch milliseconds. - @type(number) @example(1716854400000)
   * @paramQuery toDate - Upper bound of the window, in epoch milliseconds. - @type(number) @example(1717459200000)
   * @paramQuery page - Page number (1-based). - @type(number) @example(1)
   * @paramQuery limit - Rows per page (1-100, default 20). - @type(number) @example(20)
   * @paramQuery search - Filters on username or email. - @type(string) @example(gabriel)
   * @paramQuery sort - Sort column: `connections` (default), `pageViews`, `timeSpent` or `lastSeen`. - @type(string) @example(connections)
   * @responseBody 200 - {"data": [{"id": 7, "username": "gabriel", "email": "gabriel@example.com", "role": "user", "avatarUrl": "", "createdAt": "2025-01-01T00:00:00.000Z", "connections": 42, "pageViews": 310, "devices": 2, "activeDays": 18, "timeSpentMs": 4200000, "viewsPerConnection": 7.4, "firstSeenAt": "2026-05-01T10:00:00.000Z", "lastSeenAt": "2026-05-28T09:12:00.000Z"}], "meta": {"total": 120, "perPage": 20, "currentPage": 1, "lastPage": 6}, "totals": {"activeUsers": 120, "connections": 2400, "pageViews": 18000, "connectionsPerUser": 20}}
   * @responseBody 401 - {"message": "Unauthorized"}
   * @responseBody 403 - {"error": "Access denied. Admin privileges required."}
   */
  async users({ request, response }: HttpContext) {
    const sort = request.input('sort', 'connections')

    const data = await UserActivityService.leaderboard({
      fromDate: parseEpochMs(request.input('fromDate')),
      toDate: parseEpochMs(request.input('toDate')),
      page: Math.max(1, Number.parseInt(request.input('page', 1), 10) || 1),
      limit: Math.min(100, Math.max(1, Number.parseInt(request.input('limit', 20), 10) || 20)),
      search: String(request.input('search', '')),
      sort: isUserActivitySort(sort) ? sort : 'connections',
    })

    return response.ok(data)
  }
}
