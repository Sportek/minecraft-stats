import { BaseSchema } from '@adonisjs/lucid/schema'

export default class extends BaseSchema {
  protected tableName = 'servers'

  async up() {
    this.schema.alterTable(this.tableName, (table) => {
      table.integer('last_player_count').nullable()
      table.integer('last_max_count').nullable()
      table.timestamp('last_stats_at').nullable()
    })
  }

  async down() {
    this.schema.alterTable(this.tableName, (table) => {
      table.dropColumn('last_player_count')
      table.dropColumn('last_max_count')
      table.dropColumn('last_stats_at')
    })
  }
}
