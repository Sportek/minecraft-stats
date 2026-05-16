import { BaseSchema } from '@adonisjs/lucid/schema'

export default class extends BaseSchema {
  protected tableName = 'advertisement_events'

  async up() {
    this.schema.createTable(this.tableName, (table) => {
      table.increments('id')
      table
        .integer('advertisement_id')
        .unsigned()
        .notNullable()
        .references('id')
        .inTable('advertisements')
        .onDelete('CASCADE')
      // 'impression' = la pub a été affichée. 'click' = un lien de la pub a été cliqué.
      table.string('type', 20).notNullable()
      // 'home' | 'server' — d'où provient l'évènement.
      table.string('placement', 20).nullable()
      // Page serveur d'origine, si applicable.
      table
        .integer('server_id')
        .unsigned()
        .nullable()
        .references('id')
        .inTable('servers')
        .onDelete('SET NULL')
      // URL cible du clic.
      table.string('target_url', 2048).nullable()

      table.timestamp('created_at')

      table.index(['advertisement_id', 'type', 'created_at'], 'advertisement_events_lookup_index')
    })
  }

  async down() {
    this.schema.dropTable(this.tableName)
  }
}
