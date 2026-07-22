import { BaseCommand, flags } from '@adonisjs/core/ace'
import { type CommandOptions } from '@adonisjs/core/types/ace'
import Database from '@adonisjs/lucid/services/db'

/**
 * Backfill de `server_stats_daily` depuis `server_stats_hourly`.
 *
 * À lancer une fois après la migration, et **après** `backfill:hourly-stats` —
 * le palier journalier lit l'horaire, pas le brut.
 *
 * Itère mois par mois : un an d'historique tient en 12 requêtes, et une reprise
 * après interruption ne recommence qu'un mois.
 *
 * Idempotent : relancer la commande ré-écrit les mêmes valeurs.
 *
 * Usage :
 *   node ace backfill:daily-stats
 *   node ace backfill:daily-stats --from-date=2024-08-01
 */
export default class BackfillDailyStats extends BaseCommand {
  static commandName = 'backfill:daily-stats'
  static description = 'Backfill server_stats_daily from server_stats_hourly'

  static options: CommandOptions = {
    startApp: true,
    allowUnknownFlags: false,
    staysAlive: false,
  }

  @flags.string({
    description: 'Resume from this date (YYYY-MM-DD UTC). Defaults to MIN(hour).',
  })
  declare fromDate: string

  async run() {
    const startMonth = await this.resolveStartMonth()
    if (!startMonth) return

    const endMonth = new Date()
    endMonth.setUTCDate(1)
    endMonth.setUTCHours(0, 0, 0, 0)

    let cursor = startMonth
    let totalRows = 0

    while (cursor <= endMonth) {
      const nextMonth = new Date(cursor)
      nextMonth.setUTCMonth(nextMonth.getUTCMonth() + 1)

      const result = await Database.rawQuery(
        `
        INSERT INTO server_stats_daily (server_id, day, avg_player_count, peak_player_count, min_player_count, max_slot_count, samples_count)
        SELECT
          server_id,
          date_trunc('day', hour) AS day,
          ROUND(
            SUM(avg_player_count::bigint * samples_count)::numeric /
            NULLIF(SUM(samples_count), 0)
          )::int AS avg_player_count,
          MAX(peak_player_count)::int AS peak_player_count,
          MIN(min_player_count)::int AS min_player_count,
          MAX(max_slot_count)::int AS max_slot_count,
          SUM(samples_count)::int AS samples_count
        FROM server_stats_hourly
        WHERE hour >= :monthStart AND hour < :monthEnd
        GROUP BY server_id, day
        ON CONFLICT (server_id, day) DO UPDATE SET
          avg_player_count  = EXCLUDED.avg_player_count,
          peak_player_count = EXCLUDED.peak_player_count,
          min_player_count  = EXCLUDED.min_player_count,
          max_slot_count    = EXCLUDED.max_slot_count,
          samples_count     = EXCLUDED.samples_count
        `,
        { monthStart: cursor.toISOString(), monthEnd: nextMonth.toISOString() }
      )

      const monthRows = result.rowCount ?? 0
      totalRows += monthRows
      this.logger.info(`backfill ${cursor.toISOString().slice(0, 7)} → ${monthRows} rows upserted`)

      cursor = nextMonth
    }

    this.logger.success(`Backfill done — ${totalRows} daily rows upserted in total.`)
  }

  /** Premier mois à traiter, depuis `--from-date` ou depuis la plus ancienne heure connue. */
  private async resolveStartMonth(): Promise<Date | null> {
    if (this.fromDate) {
      const parsed = new Date(`${this.fromDate}T00:00:00Z`)
      if (Number.isNaN(parsed.getTime())) {
        this.logger.error(`Invalid --from-date: ${this.fromDate} (expected YYYY-MM-DD)`)
        this.exitCode = 1
        return null
      }
      this.logger.info(`Resuming backfill from ${this.fromDate}`)
      parsed.setUTCDate(1)
      return parsed
    }

    const minRow = await Database.rawQuery(`SELECT MIN(hour) AS min_hour FROM server_stats_hourly`)
    const minHour: Date | null = minRow.rows[0]?.min_hour

    if (!minHour) {
      this.logger.info('No rows in server_stats_hourly — run backfill:hourly-stats first.')
      return null
    }

    const start = new Date(minHour)
    start.setUTCDate(1)
    start.setUTCHours(0, 0, 0, 0)
    return start
  }
}
