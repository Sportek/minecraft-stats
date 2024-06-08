import { BaseSchema } from '@adonisjs/lucid/schema'

export default class extends BaseSchema {
  protected tableName = 'servers'

  async up() {
    this.schema.alterTable(this.tableName, (table) => {
      table.string('category').notNullable().defaultTo('other')
    })
  }

  async down() {
    this.schema.dropTable(this.tableName)
  }
}
