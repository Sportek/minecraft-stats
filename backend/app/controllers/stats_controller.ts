import StatsService from '#services/stat_service'
import { StatValidator } from '#validators/stat'
import { GlobalStatValidator } from '#validators/global_stat'
import type { HttpContext } from '@adonisjs/core/http'

export default class StatsController {
  public async index({ request, response }: HttpContext) {
    try {
      const validatedData = await StatValidator.validate({
        ...request.params(),
        ...request.qs(),
      })

      const results = await StatsService.getStats(validatedData)
      return response.status(200).json(results)
    } catch (error) {
      console.error(error)
      return response.status(error.status ?? 500).json({
        error: error.message ?? 'Internal server error',
      })
    }
  }

  async globalStats({ request, response }: HttpContext) {
    try {
      const validatedData = await GlobalStatValidator.validate(request.qs())
      const results = await StatsService.getGlobalStats(validatedData)
      return response.status(200).json(results)
    } catch (error) {
      console.error(error)
      return response.status(error.status ?? 500).json({
        error: error.message ?? 'Internal server error',
      })
    }
  }
}