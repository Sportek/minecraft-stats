import { BaseSchema } from '@adonisjs/lucid/schema'

export default class extends BaseSchema {
  // Agrégat quotidien par page, alimenté par le job de nuit. C'est ce que lit le
  // dashboard (rapide) et ce qui survit à la purge des `page_views` brutes.
  protected tableName = 'page_view_daily'

  async up() {
    this.schema.createTable(this.tableName, (table) => {
      table.increments('id')
      table.date('date').notNullable()
      table.string('path', 512).notNullable()
      table.integer('views').notNullable().defaultTo(0)
      table.integer('unique_visitors').notNullable().defaultTo(0)

      table.unique(['date', 'path'])
      table.index(['date'], 'page_view_daily_date_index')
    })
  }

  async down() {
    this.schema.dropTable(this.tableName)
  }
}
