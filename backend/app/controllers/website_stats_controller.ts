import ServerStat from '#models/server_stat'
import type { HttpContext } from '@adonisjs/core/http'

export default class WebsiteStatsController {
  /**
   * @getWebsiteStats
   * @operationId getWebsiteStats
   * @tag WEBSITE_STATS
   * @summary Global platform statistics
   * @description Returns aggregate statistics about the Minecraft Stats platform. Currently exposes `totalRecords` — the total number of rows stored in the `server_stats` table (one row per server per 10-minute ping). Publicly accessible.
   * @responseBody 200 - {"totalRecords": 1234567}
   */
  async index({ response }: HttpContext) {
    const dataAmount = await ServerStat.query().count('* as total')
    const stats = {
      totalRecords: dataAmount[0].$extras.total,
    }

    return response.json(stats)
  }
}
