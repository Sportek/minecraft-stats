import ServerStat from '#models/server_stat'
import type { HttpContext } from '@adonisjs/core/http'

export default class WebsiteStatsController {
  async index({ response }: HttpContext) {
    const dataAmount = await ServerStat.query().count('* as total')
    const stats = {
      totalRecords: dataAmount[0].$extras.total,
    }

    return response.json(stats)
  }
}
