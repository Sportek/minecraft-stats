import { BaseSchema } from '@adonisjs/lucid/schema'

/**
 * Masquage d'un serveur à la demande de son propriétaire vérifié.
 *
 * Un serveur masqué disparaît de toutes les surfaces publiques (classements, fiche,
 * stats, votes, sitemap, MCP) et n'est plus pingué, mais sa ligne est conservée :
 * ses empreintes continuent d'alimenter la détection de doublon, ce qui empêche un
 * tiers de le référencer à nouveau.
 *
 * Index partiel : seule une poignée de serveurs sera masquée ; les lectures publiques
 * filtrent sur `hidden_at IS NULL`, couvert par le scan existant.
 */
export default class extends BaseSchema {
  protected tableName = 'servers'

  async up() {
    this.schema.alterTable(this.tableName, (table) => {
      table.timestamp('hidden_at', { useTz: true }).nullable()
    })

    this.schema.raw(
      `CREATE INDEX servers_hidden_at_index ON servers (hidden_at) WHERE hidden_at IS NOT NULL`
    )
  }

  async down() {
    this.schema.raw(`DROP INDEX IF EXISTS servers_hidden_at_index`)
    this.schema.alterTable(this.tableName, (table) => {
      table.dropColumn('hidden_at')
    })
  }
}
