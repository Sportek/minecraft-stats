import { BaseSchema } from '@adonisjs/lucid/schema'

export default class extends BaseSchema {
  protected tableName = 'servers'

  async up() {
    this.schema.alterTable(this.tableName, (table) => {
      table.integer('peak_player_count').nullable()
      table.timestamp('peak_player_at').nullable()
    })

    // Backfill du pic all-time depuis l'historique server_stats. DISTINCT ON
    // (Postgres) garde, par serveur, la ligne au plus grand player_count — et,
    // à égalité, la plus ancienne (première fois que le pic a été atteint).
    this.defer(async (db) => {
      await db.rawQuery(`
        UPDATE servers s
        SET peak_player_count = sub.peak_count,
            peak_player_at = sub.peak_at
        FROM (
          SELECT DISTINCT ON (server_id)
            server_id,
            player_count AS peak_count,
            created_at AS peak_at
          FROM server_stats
          ORDER BY server_id, player_count DESC, created_at ASC
        ) sub
        WHERE s.id = sub.server_id
      `)
    })
  }

  async down() {
    this.schema.alterTable(this.tableName, (table) => {
      table.dropColumn('peak_player_count')
      table.dropColumn('peak_player_at')
    })
  }
}
