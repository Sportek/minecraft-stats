import { BaseSchema } from '@adonisjs/lucid/schema'

export default class extends BaseSchema {
  protected tableName = 'blacklisted_identifiers'

  async up() {
    this.schema.createTable(this.tableName, (table) => {
      table.increments('id')
      table.string('type').notNullable()
      table.string('value').notNullable()
      table.string('reason').nullable()
      table
        .integer('blacklisted_by')
        .unsigned()
        .nullable()
        .references('id')
        .inTable('users')
        .onDelete('SET NULL')
      table.timestamp('created_at', { useTz: true })

      table.unique(['type', 'value'])
    })
  }

  async down() {
    this.schema.dropTable(this.tableName)
  }
}
