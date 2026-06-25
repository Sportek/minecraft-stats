import { recordRequest } from '#services/analytics_counters'
import type { HttpContext } from '@adonisjs/core/http'
import type { NextFn } from '@adonisjs/core/types/http'

/**
 * Counts every routed HTTP request (humans + bots + API) into the Redis traffic
 * counters. Gives the raw traffic volume, beyond client-side page views. The
 * counter write is fire-and-forget so it never adds latency to the response.
 */
export default class TrafficMiddleware {
  async handle(ctx: HttpContext, next: NextFn) {
    try {
      const output = await next()
      recordRequest(ctx.response.getStatus() >= 400)
      return output
    } catch (error) {
      recordRequest(true)
      throw error
    }
  }
}
