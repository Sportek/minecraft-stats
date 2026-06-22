import { BaseSchema } from '@adonisjs/lucid/schema'

/**
 * Index `(server_id, player_count)` pour la résolution des placeholders de blog.
 * Le calcul de PLAYER_COUNT_PEAK_LOW trie l'historique d'un serveur par
 * `player_count` (DISTINCT ON ... ORDER BY server_id, player_count ASC) ; sans cet
 * index Postgres devait scanner + trier tout l'historique du serveur.
 */
export default class extends BaseSchema {
  protected tableName = 'server_stats'

  async up() {
    this.schema.alterTable(this.tableName, (table) => {
      table.index(['server_id', 'player_count'], 'server_stats_server_id_player_count_index')
    })
  }

  async down() {
    this.schema.alterTable(this.tableName, (table) => {
      table.dropIndex(['server_id', 'player_count'], 'server_stats_server_id_player_count_index')
    })
  }
}
