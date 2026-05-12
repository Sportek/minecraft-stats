import { BaseSchema } from '@adonisjs/lucid/schema'

/**
 * P.3.1 — Ajoute des index sur les tables pivot `server_categories` et `server_languages`
 * pour que les filtres `categoryId` / `languageId` dans `getGlobalStats` et `paginate`
 * fassent un Index Scan plutôt qu'un Seq Scan.
 *
 * Note : `server_languages` a une UNIQUE (server_id, language_id) qui couvre déjà les
 * lookups par `server_id` seul. L'index explicite est conservé pour cohérence avec
 * `server_categories` et lisibilité (cf. AC #1).
 */
export default class extends BaseSchema {
  async up() {
    this.schema.alterTable('server_categories', (table) => {
      table.index(['server_id'], 'server_categories_server_id_idx')
      table.index(['category_id'], 'server_categories_category_id_idx')
    })
    this.schema.alterTable('server_languages', (table) => {
      table.index(['server_id'], 'server_languages_server_id_idx')
      table.index(['language_id'], 'server_languages_language_id_idx')
    })
  }

  async down() {
    this.schema.alterTable('server_categories', (table) => {
      table.dropIndex(['server_id'], 'server_categories_server_id_idx')
      table.dropIndex(['category_id'], 'server_categories_category_id_idx')
    })
    this.schema.alterTable('server_languages', (table) => {
      table.dropIndex(['server_id'], 'server_languages_server_id_idx')
      table.dropIndex(['language_id'], 'server_languages_language_id_idx')
    })
  }
}
