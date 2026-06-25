import { BaseSchema } from '@adonisjs/lucid/schema'

export default class extends BaseSchema {
  protected tableName = 'page_views'

  async up() {
    this.schema.createTable(this.tableName, (table) => {
      table.increments('id')
      table
        .integer('visitor_id')
        .unsigned()
        .notNullable()
        .references('id')
        .inTable('visitors')
        .onDelete('CASCADE')
      // Snapshot du compte actif au moment de la vue (null si anonyme). On ne
      // réécrit jamais ce champ ensuite, sauf le backfill des vues restées
      // anonymes avant le tout premier login du visiteur.
      table
        .integer('user_id')
        .unsigned()
        .nullable()
        .references('id')
        .inTable('users')
        .onDelete('SET NULL')

      table.string('path', 512).notNullable()
      table.string('referrer', 2048).nullable()
      table.string('title', 512).nullable()
      // Temps passé sur la page, mesuré côté client et envoyé au unload.
      table.integer('duration_ms').nullable()

      table.timestamp('created_at')

      table.index(['created_at'], 'page_views_created_at_index')
      table.index(['path'], 'page_views_path_index')
      table.index(['visitor_id'], 'page_views_visitor_id_index')
    })
  }

  async down() {
    this.schema.dropTable(this.tableName)
  }
}
