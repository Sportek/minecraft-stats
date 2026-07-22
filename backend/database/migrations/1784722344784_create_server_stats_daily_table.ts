import { BaseSchema } from '@adonisjs/lucid/schema'

/**
 * Palier journalier, au-dessus de `server_stats_hourly`.
 *
 * Le rollup horaire suffit jusqu'à ~3 mois ; au-delà (« 2 ans », « Tout ») il
 * fait scanner 24 lignes par serveur et par jour. Le palier journalier ramène ça
 * à 1 ligne — 3 ans d'historique tiennent en ~1 100 lignes par serveur.
 *
 * Mêmes noms de colonnes que le rollup horaire, volontairement : `StatsService`
 * interroge les deux tables avec la même requête paramétrée, seule la colonne
 * temporelle change (`hour` / `day`).
 */
export default class extends BaseSchema {
  protected tableName = 'server_stats_daily'

  async up() {
    this.schema.createTable(this.tableName, (table) => {
      table
        .integer('server_id')
        .notNullable()
        .references('id')
        .inTable('servers')
        .onDelete('CASCADE')
      table.timestamp('day', { useTz: true }).notNullable()
      table.integer('avg_player_count').nullable()
      table.integer('peak_player_count').nullable()
      table.integer('min_player_count').nullable()
      table.integer('max_slot_count').nullable()
      table.integer('samples_count').notNullable().defaultTo(0)

      table.primary(['server_id', 'day'])
      table.index(['day'], 'server_stats_daily_day_idx')
    })
  }

  async down() {
    this.schema.dropTable(this.tableName)
  }
}
