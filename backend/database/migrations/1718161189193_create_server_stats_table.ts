import { BaseSchema } from '@adonisjs/lucid/schema'

export default class extends BaseSchema {
  protected tableName = 'server_stats'

  async up() {
    this.schema.alterTable(this.tableName, (table) => {
      table.dropForeign('server_id')
      table
        .integer('server_id')
        .unsigned()
        .references('id')
        .inTable('servers')
        .onDelete('CASCADE')
        .alter()
    })
  }

  async down() {
    this.schema.dropTable(this.tableName)
  }
}
