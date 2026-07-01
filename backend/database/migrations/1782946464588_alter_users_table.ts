import { BaseSchema } from '@adonisjs/lucid/schema'

export default class extends BaseSchema {
  protected tableName = 'users'

  async up() {
    this.schema.alterTable(this.tableName, (table) => {
      // On ne stocke que le hash SHA-256 du token de reset (le token brut ne vit
      // que dans le lien envoyé par mail) : une fuite de la table ne permet pas
      // de forger un reset. Indexé car le lookup au reset se fait par ce hash.
      table.string('password_reset_token').nullable().index()
      table.timestamp('password_reset_token_expires', { useTz: true }).nullable()
    })
  }

  async down() {
    this.schema.alterTable(this.tableName, (table) => {
      table.dropColumn('password_reset_token')
      table.dropColumn('password_reset_token_expires')
    })
  }
}
