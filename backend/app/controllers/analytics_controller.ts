import { recordAnonymousHit } from '#services/analytics_counters'
import AnalyticsService from '#services/analytics_service'
import { IdentifyVisitorValidator, TrackPageViewValidator } from '#validators/analytics'
import { parseEpochMs } from '#validators/helpers'
import type { HttpContext } from '@adonisjs/core/http'

/**
 * Normalise le code pays renvoyé par Cloudflare (`CF-IPCountry`). Cloudflare
 * renvoie `XX`/`T1` quand le pays est inconnu ou anonymisé — on les écarte.
 */
function normalizeCountry(value: string | undefined): string | null {
  if (!value || value.length !== 2) return null
  const code = value.toUpperCase()
  return code === 'XX' || code === 'T1' ? null : code
}

function realIp(request: HttpContext['request']): string | null {
  return request.header('CF-Connecting-IP') || request.ip() || null
}

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
        ip: realIp(request),
        userAgent: request.header('user-agent') ?? null,
        country: normalizeCountry(request.header('CF-IPCountry')),
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
        ip: realIp(request),
        userAgent: request.header('user-agent') ?? null,
        country: normalizeCountry(request.header('CF-IPCountry')),
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
      realIp(request),
      request.header('user-agent') ?? null,
      normalizeCountry(request.header('CF-IPCountry'))
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
}
