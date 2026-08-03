import { BaseSchema } from '@adonisjs/lucid/schema'

export default class extends BaseSchema {
  protected tableName = 'users'

  async up() {
    this.schema.alterTable(this.tableName, (table) => {
      table.timestamp('blacklisted_at', { useTz: true }).nullable().index()
      table
        .integer('blacklisted_by')
        .unsigned()
        .nullable()
        .references('id')
        .inTable('users')
        .onDelete('SET NULL')
      table.string('blacklist_reason').nullable()
    })
  }

  async down() {
    this.schema.alterTable(this.tableName, (table) => {
      table.dropColumn('blacklisted_at')
      table.dropColumn('blacklisted_by')
      table.dropColumn('blacklist_reason')
    })
  }
}
