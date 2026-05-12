import { BaseCommand, flags } from '@adonisjs/core/ace'
import { type CommandOptions } from '@adonisjs/core/types/ace'
import Database from '@adonisjs/lucid/services/db'

/**
 * P.4.1 — Backfill de la table `server_stats_hourly` depuis les données brutes.
 *
 * À lancer une fois après la migration. Itère jour par jour de la première stat
 * (ou de `--from-date`) jusqu'à l'heure actuelle, et upsert via INSERT … ON CONFLICT.
 *
 * Idempotent : on peut relancer la commande, les jours déjà calculés sont juste
 * ré-écrits avec la même valeur.
 *
 * Usage :
 *   node ace backfill:hourly-stats
 *   node ace backfill:hourly-stats --from-date=2024-08-21
 */
export default class BackfillHourlyStats extends BaseCommand {
  static commandName = 'backfill:hourly-stats'
  static description = 'Backfill server_stats_hourly from server_stats history'

  static options: CommandOptions = {
    startApp: true,
    allowUnknownFlags: false,
    staysAlive: false,
  }

  @flags.string({
    description: 'Resume from this date (YYYY-MM-DD UTC). Defaults to MIN(created_at).',
  })
  declare fromDate: string

  async run() {
    let startDay: Date

    if (this.fromDate) {
      const parsed = new Date(`${this.fromDate}T00:00:00Z`)
      if (Number.isNaN(parsed.getTime())) {
        this.logger.error(`Invalid --from-date: ${this.fromDate} (expected YYYY-MM-DD)`)
        this.exitCode = 1
        return
      }
      startDay = parsed
      this.logger.info(`Resuming backfill from ${this.fromDate}`)
    } else {
      const minRow = await Database.rawQuery(
        `SELECT MIN(created_at) AS min_created_at FROM server_stats WHERE server_id IS NOT NULL`
      )
      const minCreatedAt: Date | null = minRow.rows[0]?.min_created_at

      if (!minCreatedAt) {
        this.logger.info('No stats in server_stats — nothing to backfill.')
        return
      }

      startDay = new Date(minCreatedAt)
      startDay.setUTCHours(0, 0, 0, 0)
    }

    const endDay = new Date()
    endDay.setUTCHours(0, 0, 0, 0)

    let cursor = new Date(startDay)
    let totalRows = 0

    while (cursor <= endDay) {
      const nextDay = new Date(cursor)
      nextDay.setUTCDate(nextDay.getUTCDate() + 1)

      // `WHERE server_id IS NOT NULL` : protège contre les stats orphelines
      // (anciens stats créés sans association valide avant le bulk insert P.1.4).
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
          AND server_id IS NOT NULL
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
