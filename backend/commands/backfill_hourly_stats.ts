import { BaseCommand } from '@adonisjs/core/ace'
import { type CommandOptions } from '@adonisjs/core/types/ace'
import Database from '@adonisjs/lucid/services/db'

/**
 * P.4.1 — Backfill de la table `server_stats_hourly` depuis les données brutes.
 *
 * À lancer une fois après la migration. Itère jour par jour de la première stat
 * jusqu'à l'heure actuelle, et upsert via INSERT … ON CONFLICT.
 *
 * Usage : `node ace backfill:hourly-stats`
 */
export default class BackfillHourlyStats extends BaseCommand {
  static commandName = 'backfill:hourly-stats'
  static description = 'Backfill server_stats_hourly from server_stats history'

  static options: CommandOptions = {
    startApp: true,
    allowUnknownFlags: false,
    staysAlive: false,
  }

  async run() {
    const minRow = await Database.rawQuery(
      `SELECT MIN(created_at) AS min_created_at FROM server_stats`
    )
    const minCreatedAt: Date | null = minRow.rows[0]?.min_created_at

    if (!minCreatedAt) {
      this.logger.info('No stats in server_stats — nothing to backfill.')
      return
    }

    const startDay = new Date(minCreatedAt)
    startDay.setUTCHours(0, 0, 0, 0)
    const endDay = new Date()
    endDay.setUTCHours(0, 0, 0, 0)

    let cursor = new Date(startDay)
    let totalRows = 0

    while (cursor <= endDay) {
      const nextDay = new Date(cursor)
      nextDay.setUTCDate(nextDay.getUTCDate() + 1)

      const result = await Database.rawQuery(
        `
        INSERT INTO server_stats_hourly (server_id, hour, avg_player_count, max_player_count, samples_count)
        SELECT
          server_id,
          date_trunc('hour', created_at) AS hour,
          ROUND(AVG(player_count))::int AS avg_player_count,
          MAX(max_count) AS max_player_count,
          COUNT(*)::int AS samples_count
        FROM server_stats
        WHERE created_at >= :dayStart AND created_at < :dayEnd
        GROUP BY server_id, hour
        ON CONFLICT (server_id, hour) DO UPDATE SET
          avg_player_count = EXCLUDED.avg_player_count,
          max_player_count = EXCLUDED.max_player_count,
          samples_count    = EXCLUDED.samples_count
        `,
        { dayStart: cursor.toISOString(), dayEnd: nextDay.toISOString() }
      )

      const dayRows = result.rowCount ?? 0
      totalRows += dayRows
      this.logger.info(`backfill ${cursor.toISOString().slice(0, 10)} → ${dayRows} rows upserted`)

      cursor = nextDay
    }

    this.logger.success(`Backfill done — ${totalRows} hourly rows upserted in total.`)
  }
}
