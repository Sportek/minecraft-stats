import { BaseSchema } from '@adonisjs/lucid/schema'

/**
 * P.4.1 — Table de stats horaires pré-agrégées.
 *
 * 1 ligne par (server_id, hour). `samples_count` permet de calculer un re-aggrégat
 * pondéré quand on re-buckette en mensuel/annuel (`SUM(avg*samples) / SUM(samples)`).
 */
export default class extends BaseSchema {
  protected tableName = 'server_stats_hourly'

  async up() {
    this.schema.createTable(this.tableName, (table) => {
      table
        .integer('server_id')
        .notNullable()
        .references('id')
        .inTable('servers')
        .onDelete('CASCADE')
      table.timestamp('hour', { useTz: true }).notNullable()
      table.integer('avg_player_count').nullable()
      table.integer('max_player_count').nullable()
      table.integer('samples_count').notNullable().defaultTo(0)

      table.primary(['server_id', 'hour'])
      table.index(['hour'], 'server_stats_hourly_hour_idx')
    })
  }

  async down() {
    this.schema.dropTable(this.tableName)
  }
}
