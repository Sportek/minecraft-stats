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
