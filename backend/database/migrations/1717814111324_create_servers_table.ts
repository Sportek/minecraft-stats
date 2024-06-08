import { BaseSchema } from '@adonisjs/lucid/schema'

export default class extends BaseSchema {
  protected tableName = 'servers'

  async up() {
    this.schema.alterTable(this.tableName, (table) => {
      table.foreign('category_id').references('categories.id')
      table.dropColumn('category')
    })
  }

  async down() {
    this.schema.dropTable(this.tableName)
  }
}
