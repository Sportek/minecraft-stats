import { BaseSchema } from '@adonisjs/lucid/schema'

export default class extends BaseSchema {
  protected tableName = 'servers'

  async up() {
    this.schema.alterTable(this.tableName, (table) => {
      // Compteur total dénormalisé (all-time) : affichage cheap sur les cartes,
      // incrémenté à chaque vote. Le classement mensuel, lui, agrège `server_votes`.
      table.integer('vote_count').unsigned().notNullable().defaultTo(0)
      table.index(['vote_count'], 'servers_vote_count_index')
    })
  }

  async down() {
    this.schema.alterTable(this.tableName, (table) => {
      table.dropIndex(['vote_count'], 'servers_vote_count_index')
      table.dropColumn('vote_count')
    })
  }
}
