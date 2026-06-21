import Server from '#models/server'
import ServerStat from '#models/server_stat'
import type { HttpContext } from '@adonisjs/core/http'
import { DateTime } from 'luxon'

// Un serveur compte comme "en ligne" si son dernier ping réussi date de moins de
// 30 min (même fenêtre que le dashboard et le classement). Au-delà, son
// last_player_count est considéré périmé et exclu du total "joueurs en ligne".
const ONLINE_WINDOW_MINUTES = 30

export default class WebsiteStatsController {
  /**
   * @getWebsiteStats
   * @operationId getWebsiteStats
   * @tag WEBSITE_STATS
   * @summary Global platform statistics
   * @description Returns aggregate statistics about the Minecraft Stats platform: `totalRecords` (rows in `server_stats`), `totalServers` (monitored servers), and `playersOnline` (sum of the last player count across servers pinged within the last 30 minutes). All aggregation is done server-side. Publicly accessible.
   * @responseBody 200 - {"totalRecords": 1234567, "totalServers": 320, "playersOnline": 48210}
   */
  async index({ response }: HttpContext) {
    const onlineSince = DateTime.now().minus({ minutes: ONLINE_WINDOW_MINUTES }).toSQL()

    const [recordsRow, serversRow, playersRow] = await Promise.all([
      ServerStat.query().count('* as total'),
      Server.query().count('* as total'),
      Server.query().where('last_stats_at', '>=', onlineSince!).sum('last_player_count as total'),
    ])

    return response.json({
      totalRecords: Number(recordsRow[0].$extras.total),
      totalServers: Number(serversRow[0].$extras.total),
      playersOnline: Number(playersRow[0].$extras.total ?? 0),
    })
  }
}
