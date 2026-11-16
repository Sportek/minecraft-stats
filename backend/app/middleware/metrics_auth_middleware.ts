import env from '#start/env'
import { safeEqual } from '@adonisjs/core/helpers'
import type { HttpContext } from '@adonisjs/core/http'
import type { NextFn } from '@adonisjs/core/types/http'

/**
 * Protects the /metrics route registered by @julr/adonisjs-prometheus.
 * The package only offers an IP whitelist, which is useless here: behind
 * Cloudflare + Traefik the client IP comes from a spoofable X-Forwarded-For.
 */
export default class MetricsAuthMiddleware {
  async handle(ctx: HttpContext, next: NextFn) {
    if (ctx.route?.name !== 'prometheus.metrics') {
      return next()
    }

    const token = env.get('METRICS_TOKEN')
    const authorization = ctx.request.header('authorization') ?? ''

    if (!token || !safeEqual(authorization, `Bearer ${token}`)) {
      return ctx.response.unauthorized({ error: 'Unauthorized' })
    }

    return next()
  }
}
