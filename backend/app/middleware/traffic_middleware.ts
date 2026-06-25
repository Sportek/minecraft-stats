import { recordRequest } from '#services/traffic_buffer'
import type { HttpContext } from '@adonisjs/core/http'
import type { NextFn } from '@adonisjs/core/types/http'

/**
 * Comptabilise chaque requête HTTP routée (humains + bots + API) dans le buffer
 * de trafic en mémoire. Donne le volume brut de trafic, au-delà des seules pages
 * vues côté client. Le buffer est flushé périodiquement par le scheduler.
 */
export default class TrafficMiddleware {
  async handle(ctx: HttpContext, next: NextFn) {
    try {
      const output = await next()
      recordRequest(ctx.response.getStatus())
      return output
    } catch (error) {
      recordRequest(500)
      throw error
    }
  }
}
