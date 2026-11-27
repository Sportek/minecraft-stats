import { BaseSchema } from '@adonisjs/lucid/schema'

export default class extends BaseSchema {
  protected tableName = 'webhooks'

  async up() {
    this.schema.createTable(this.tableName, (table) => {
      table.increments('id')
      table.string('name', 100).notNullable()
      table.text('url').notNullable()
      table.jsonb('events').notNullable().defaultTo('[]')
      table.boolean('enabled').notNullable().defaultTo(true)
      table.integer('last_status').nullable()
      table.text('last_error').nullable()
      table.timestamp('last_sent_at', { useTz: true }).nullable()
      table.integer('created_by').unsigned().nullable().references('users.id').onDelete('SET NULL')
      table.timestamp('created_at', { useTz: true })
      table.timestamp('updated_at', { useTz: true })
    })
  }

  async down() {
    this.schema.dropTable(this.tableName)
  }
}
