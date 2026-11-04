import { BaseSchema } from '@adonisjs/lucid/schema'

/**
 * Peuple `last_online_at` avec la date du dernier relevé portant un `player_count`
 * (donc où le serveur répondait).
 *
 * En SQL brut volontairement : une migration ne doit pas dépendre des modèles, qui
 * décrivent le schéma FINAL. Passer par `Server` faisait échouer `migration:run` sur
 * une base vierge dès que le modèle référençait une colonne ajoutée par une migration
 * plus récente (ex. le filtre `hidden_at IS NULL` appliqué par défaut à ses lectures).
 */
export default class extends BaseSchema {
  async up() {
    this.defer(async (db) => {
      await db.rawQuery(`
        UPDATE servers s
        SET last_online_at = (
          SELECT max(st.created_at)
          FROM server_stats st
          WHERE st.server_id = s.id
            AND st.player_count IS NOT NULL
        )
      `)
    })
  }

  async down() {}
}
