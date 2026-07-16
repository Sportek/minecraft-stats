import { BaseSchema } from '@adonisjs/lucid/schema'

/**
 * La migration de création de `users` a été éditée après coup ('github' → 'google'
 * dans l'enum provider) sans migration corrective : les bases ayant exécuté la
 * version d'origine gardent un CHECK qui refuse 'google', ce qui fait échouer
 * toute création de compte via Google OAuth. On recrée la contrainte à
 * l'identique du fichier actuel, quel que soit l'état de départ.
 */
export default class extends BaseSchema {
  protected tableName = 'users'

  async up() {
    this.defer(async (db) => {
      await db.rawQuery('ALTER TABLE users DROP CONSTRAINT IF EXISTS users_provider_check')
      await db.rawQuery(
        `ALTER TABLE users ADD CONSTRAINT users_provider_check
         CHECK (provider = ANY (ARRAY['google'::text, 'discord'::text]))`
      )
    })
  }

  async down() {
    // Pas de retour à l'ancienne contrainte ('github') : elle était erronée.
  }
}
