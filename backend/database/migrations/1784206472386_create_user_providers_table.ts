import { BaseSchema } from '@adonisjs/lucid/schema'

export default class extends BaseSchema {
  protected tableName = 'user_providers'

  async up() {
    this.schema.createTable(this.tableName, (table) => {
      table.increments('id')
      table.integer('user_id').unsigned().references('users.id').onDelete('CASCADE').notNullable()
      table.enum('provider', ['google', 'discord']).notNullable()

      // Id du compte côté fournisseur (sub Google, id Discord) : plus stable que
      // l'email, qui peut changer chez le fournisseur. Nullable car inconnu pour
      // les liens rétro-remplis depuis l'ancienne colonne users.provider.
      table.string('provider_user_id').nullable()

      // Lien en attente de confirmation par email : on ne stocke que le hash
      // SHA-256 du token (même principe que le reset de mot de passe). Le lien
      // n'autorise la connexion qu'une fois `confirmed_at` renseigné.
      table.string('link_token_hash').nullable().index()
      table.timestamp('link_token_expires_at', { useTz: true }).nullable()
      table.timestamp('confirmed_at', { useTz: true }).nullable()

      table.timestamp('created_at')
      table.timestamp('updated_at')

      table.unique(['user_id', 'provider'])
    })

    // Rétro-remplissage : chaque compte créé via OAuth garde sa méthode de
    // connexion actuelle, confirmée d'office (elle était déjà la seule autorisée).
    this.defer(async (db) => {
      await db.rawQuery(
        `INSERT INTO user_providers (user_id, provider, confirmed_at, created_at, updated_at)
         SELECT id, provider, now(), now(), now() FROM users WHERE provider IS NOT NULL`
      )
    })
  }

  async down() {
    this.schema.dropTable(this.tableName)
  }
}
