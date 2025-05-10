import { BaseSchema } from '@adonisjs/lucid/schema'

export default class extends BaseSchema {
  protected tableName = 'server_growth_stats'

  async up() {
    this.schema.alterTable(this.tableName, (table) => {
      table.renameColumn('monthly_context_growth', 'monthly_growth')
      table.integer('last_week_average')
      table.integer('previous_week_average')
      table.integer('last_month_average')
    })
  }

  async down() {
    this.schema.alterTable(this.tableName, (table) => {
      table.dropColumn('id')
    })
  }
}
