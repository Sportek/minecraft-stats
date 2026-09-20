import { BaseSchema } from '@adonisjs/lucid/schema'

/**
 * Personnalisation de la fiche par les propriétaires confirmés (bannière, style du
 * titre, effet de carte). Colonnes nullables sur `servers` plutôt qu'une table dédiée :
 * les cartes de la home les lisent à chaque page de classement, une jointure y serait
 * payée à chaque requête (même arbitrage que `boost_status`).
 *
 * NULL = pas de personnalisation. Polices et effets sont des clés d'une liste blanche
 * (cf. `constants/server_customization.ts`), jamais du CSS libre.
 */
export default class extends BaseSchema {
  protected tableName = 'servers'

  async up() {
    this.schema.alterTable(this.tableName, (table) => {
      table.string('banner_url').nullable()
      table.string('title_font', 32).nullable()
      table.string('title_color', 7).nullable()
      table.string('title_color_end', 7).nullable()
      table.string('card_effect', 32).nullable()
    })
  }

  async down() {
    this.schema.alterTable(this.tableName, (table) => {
      table.dropColumn('banner_url')
      table.dropColumn('title_font')
      table.dropColumn('title_color')
      table.dropColumn('title_color_end')
      table.dropColumn('card_effect')
    })
  }
}
