import { BaseSchema } from '@adonisjs/lucid/schema'

export default class extends BaseSchema {
  protected tableName = 'server_stats'

  public async up () {
    this.schema.alterTable(this.tableName, (table) => {
      table.index(['server_id', 'created_at'], 'server_stats_server_id_created_at_idx')
    })
  }

  public async down () {
    this.schema.alterTable(this.tableName, (table) => {
      table.dropIndex(['server_id', 'created_at'], 'server_stats_server_id_created_at_idx')
    })
  }
}