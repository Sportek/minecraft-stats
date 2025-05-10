import { BaseSchema } from '@adonisjs/lucid/schema'

export default class extends BaseSchema {
  protected tableName = 'server_languages'

  async up() {
    await this.schema.dropTableIfExists(this.tableName)
    await this.schema.createTable(this.tableName, (table) => {
      table.increments('id')
      table.integer('server_id').unsigned().references('id').inTable('servers').onDelete('CASCADE')
      table
        .integer('language_id')
        .unsigned()
        .references('id')
        .inTable('languages')
        .onDelete('CASCADE')
      table.unique(['server_id', 'language_id'])

      table.timestamp('created_at')
      table.timestamp('updated_at')
    })
  }

  async down() {
    this.schema.dropTable(this.tableName)
  }
}
