import { BaseSchema } from '@adonisjs/lucid/schema'

/**
 * Verdict admin courant sur le gonflage des connectés, dénormalisé sur `servers`.
 *
 * Le verdict vit déjà dans `server_boost_reviews` (journal complet), mais les deux
 * usages de production le lisent sur le chemin chaud : le badge public sur la fiche
 * et la rétrogradation du classement, qui trie ~600 serveurs à chaque page. Une
 * jointure sur le journal pour retrouver la dernière décision y serait payée à
 * chaque requête.
 *
 * NULL = jamais revu. Indexé partiellement : seule une poignée de serveurs porte un
 * verdict, l'index n'a pas à couvrir les NULL.
 */
export default class extends BaseSchema {
  protected tableName = 'servers'

  async up() {
    this.schema.alterTable(this.tableName, (table) => {
      table.string('boost_status').nullable()
      table.timestamp('boost_reviewed_at', { useTz: true }).nullable()
    })

    this.schema.raw(
      `CREATE INDEX servers_boost_status_index ON servers (boost_status) WHERE boost_status IS NOT NULL`
    )
  }

  async down() {
    this.schema.raw(`DROP INDEX IF EXISTS servers_boost_status_index`)
    this.schema.alterTable(this.tableName, (table) => {
      table.dropColumn('boost_status')
      table.dropColumn('boost_reviewed_at')
    })
  }
}
