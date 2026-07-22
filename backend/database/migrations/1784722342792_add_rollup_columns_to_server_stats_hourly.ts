import { BaseSchema } from '@adonisjs/lucid/schema'

/**
 * Le rollup horaire ne portait que la moyenne : `max_player_count` contenait en
 * réalité `MAX(max_count)`, c'est-à-dire la **capacité en slots** du serveur, pas
 * un pic de joueurs. On renomme la colonne pour ce qu'elle est et on ajoute le
 * vrai pic + le vrai creux, sans quoi les graphiques ne peuvent afficher qu'une
 * moyenne dès que la plage dépasse 24 h (le rollup devient alors la source).
 *
 * Les deux nouvelles colonnes restent nullables : les lignes existantes sont
 * renseignées par `node ace backfill:hourly-stats`.
 */
export default class extends BaseSchema {
  protected tableName = 'server_stats_hourly'

  async up() {
    this.schema.alterTable(this.tableName, (table) => {
      table.renameColumn('max_player_count', 'max_slot_count')
      table.integer('peak_player_count').nullable()
      table.integer('min_player_count').nullable()
    })
  }

  async down() {
    this.schema.alterTable(this.tableName, (table) => {
      table.dropColumn('peak_player_count')
      table.dropColumn('min_player_count')
      table.renameColumn('max_slot_count', 'max_player_count')
    })
  }
}
