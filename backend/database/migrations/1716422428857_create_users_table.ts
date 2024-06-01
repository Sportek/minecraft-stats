import { BaseSchema } from '@adonisjs/lucid/schema'

export default class extends BaseSchema {
  protected tableName = 'users'

  async up() {
    this.schema.createTable(this.tableName, (table) => {
      table.increments('id').notNullable()
      table.string('username', 254).notNullable().unique()
      table.string('email', 254).notNullable().unique()
      table.string('password').notNullable()
      table.boolean('verified').defaultTo(false)
      table.string('verification_token', 8).nullable()
      table.timestamp('verification_token_expires', { useTz: true }).nullable()
      table.string('avatar_url').nullable()
      table.enum('provider', ['github', 'discord']).nullable()
      table.enum('role', ['admin', 'user']).defaultTo('user')
      table.timestamp('created_at', { useTz: true })
      table.timestamp('updated_at', { useTz: true })
    })
  }

  async down() {
    this.schema.dropTable(this.tableName)
  }
}
