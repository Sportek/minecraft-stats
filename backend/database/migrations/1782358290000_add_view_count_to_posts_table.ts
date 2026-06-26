import { BaseSchema } from '@adonisjs/lucid/schema'

export default class extends BaseSchema {
  protected tableName = 'posts'

  async up() {
    this.schema.alterTable(this.tableName, (table) => {
      // Compteur de vues brut, incrémenté pour chaque lecteur (connecté ou non,
      // consentement ou non) : il ne stocke aucune donnée personnelle.
      table.integer('view_count').unsigned().notNullable().defaultTo(0)
    })
  }

  async down() {
    this.schema.alterTable(this.tableName, (table) => {
      table.dropColumn('view_count')
    })
  }
}
