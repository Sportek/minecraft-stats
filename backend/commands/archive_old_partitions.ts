import { BaseCommand, flags } from '@adonisjs/core/ace'
import { type CommandOptions } from '@adonisjs/core/types/ace'
import Database from '@adonisjs/lucid/services/db'

/**
 * P.4.2 — Drop des partitions `server_stats_*` plus vieilles que `--older-than-months`
 * (défaut : 24 mois). Demande confirmation sauf si `--yes` est passé.
 *
 * Usage :
 *   node ace archive:old-partitions --older-than-months=24 --yes
 *   node ace archive:old-partitions --dry-run
 */
export default class ArchiveOldPartitions extends BaseCommand {
  static commandName = 'archive:old-partitions'
  static description = 'Drop server_stats partitions older than a threshold (default 24 months)'

  static options: CommandOptions = {
    startApp: true,
    allowUnknownFlags: false,
    staysAlive: false,
  }

  @flags.number({
    description: 'Drop partitions whose end date is older than N months',
    default: 24,
  })
  declare olderThanMonths: number

  @flags.boolean({ description: 'Auto-confirm — required for non-interactive runs' })
  declare yes: boolean

  @flags.boolean({ description: 'Only list candidate partitions, no DROP' })
  declare dryRun: boolean

  async run() {
    const partitionedCheck = await Database.rawQuery(`
      SELECT 1 FROM pg_class WHERE relname = 'server_stats' AND relkind = 'p' LIMIT 1
    `)
    if (partitionedCheck.rows.length === 0) {
      this.logger.warning('server_stats is not a partitioned table — nothing to archive.')
      return
    }

    const monthsThreshold = this.olderThanMonths ?? 24

    // Liste les partitions enfants. Le nom est expected `server_stats_yYYYYmMM`.
    const partitions = await Database.rawQuery(
      `
      SELECT c.relname AS partition_name,
             pg_get_expr(c.relpartbound, c.oid) AS bound
        FROM pg_inherits i
        JOIN pg_class c ON c.oid = i.inhrelid
       WHERE i.inhparent = 'server_stats'::regclass
       ORDER BY c.relname
      `
    )

    const cutoff = new Date()
    cutoff.setUTCMonth(cutoff.getUTCMonth() - monthsThreshold)
    cutoff.setUTCDate(1)
    cutoff.setUTCHours(0, 0, 0, 0)

    const toDrop: string[] = []
    for (const row of partitions.rows as Array<{ partition_name: string; bound: string }>) {
      // bound ressemble à : FOR VALUES FROM ('2024-01-01 00:00:00+00') TO ('2024-02-01 00:00:00+00')
      const match = row.bound.match(/TO \('([^']+)'\)/)
      if (!match) continue
      const partitionEnd = new Date(match[1])
      if (partitionEnd <= cutoff) {
        toDrop.push(row.partition_name)
      }
    }

    if (toDrop.length === 0) {
      this.logger.success('No partitions older than threshold — nothing to archive.')
      return
    }

    this.logger.info(`Candidate partitions (older than ${monthsThreshold} months):`)
    for (const name of toDrop) this.logger.info(`  - ${name}`)

    if (this.dryRun) {
      this.logger.info('--dry-run set, not dropping.')
      return
    }

    if (!this.yes) {
      this.logger.error('Refusing to drop without --yes (or --dry-run). Aborting.')
      this.exitCode = 1
      return
    }

    for (const name of toDrop) {
      await Database.rawQuery(`DROP TABLE IF EXISTS ${name}`)
      this.logger.success(`Dropped partition ${name}`)
    }
  }
}
