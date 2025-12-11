import { BaseSchema } from '@adonisjs/lucid/schema'

export default class extends BaseSchema {
  protected tableName = 'posts'

  async up() {
    this.schema.createTable(this.tableName, (table) => {
      table.increments('id')
      table.string('title', 255).notNullable()
      table.string('slug', 255).notNullable().unique()
      table.text('content', 'longtext').notNullable()
      table.text('excerpt').nullable()
      table.string('cover_image', 500).nullable()
      table.boolean('published').defaultTo(false)
      table.timestamp('published_at').nullable()
      table.integer('user_id').unsigned().notNullable()

      table.foreign('user_id').references('id').inTable('users').onDelete('CASCADE')

      table.timestamp('created_at')
      table.timestamp('updated_at')
    })
  }

  async down() {
    this.schema.dropTable(this.tableName)
  }
}