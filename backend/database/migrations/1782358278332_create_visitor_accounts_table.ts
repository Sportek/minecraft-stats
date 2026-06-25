import { BaseSchema } from '@adonisjs/lucid/schema'

export default class extends BaseSchema {
  protected tableName = 'visitor_accounts'

  async up() {
    this.schema.createTable(this.tableName, (table) => {
      table.increments('id')
      // Liaison N:N visiteur ↔ compte : un appareil/IP peut héberger plusieurs
      // comptes, et un compte se connecter depuis plusieurs visiteurs.
      table
        .integer('visitor_id')
        .unsigned()
        .notNullable()
        .references('id')
        .inTable('visitors')
        .onDelete('CASCADE')
      table
        .integer('user_id')
        .unsigned()
        .notNullable()
        .references('id')
        .inTable('users')
        .onDelete('CASCADE')

      table.timestamp('linked_at')
      table.timestamp('last_active_at')

      table.unique(['visitor_id', 'user_id'])
    })
  }

  async down() {
    this.schema.dropTable(this.tableName)
  }
}
