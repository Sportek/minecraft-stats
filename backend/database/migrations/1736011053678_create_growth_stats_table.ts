import { BaseSchema } from '@adonisjs/lucid/schema'

export default class extends BaseSchema {
  protected tableName = 'server_growth_stats'

  async up() {
    this.schema.createTable(this.tableName, (table) => {
      table.integer('server_id').primary()
      table.float('weekly_growth')
      table.float('monthly_context_growth')
      table.timestamp('last_updated').defaultTo(this.now())
    })
  }

  async down() {
    this.schema.dropTable(this.tableName)
  }
}