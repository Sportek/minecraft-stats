import { BaseSchema } from '@adonisjs/lucid/schema'

/**
 * Drop le doublon `server_stats_server_id_created_at_idx` (créé par 1735573222630).
 * On conserve `server_stats_server_id_created_at_index` (créé par 1732930662009),
 * chronologiquement plus ancien et nommé plus proprement. Postgres ignorait l'un des
 * deux à la lecture mais payait la maintenance des deux à chaque INSERT (P.1.5).
 */
export default class extends BaseSchema {
  protected tableName = 'server_stats'

  async up() {
    this.schema.alterTable(this.tableName, (table) => {
      table.dropIndex(['server_id', 'created_at'], 'server_stats_server_id_created_at_idx')
    })
  }

  async down() {
    this.schema.alterTable(this.tableName, (table) => {
      table.index(['server_id', 'created_at'], 'server_stats_server_id_created_at_idx')
    })
  }
}
