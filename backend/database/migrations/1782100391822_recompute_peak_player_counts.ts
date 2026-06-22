import { BaseSchema } from '@adonisjs/lucid/schema'

export default class extends BaseSchema {
  protected tableName = 'servers'

  /**
   * Recalcule le pic all-time de joueurs pour TOUS les serveurs depuis l'historique
   * brut `server_stats`. Corrige les `peak_player_count` restés NULL ou désynchronisés.
   * Les `server_stats` ne sont jamais purgés, donc cette source est exhaustive.
   *
   * Corrige le bug du backfill initial (`1782056332671`) : un ping raté insère une
   * ligne `server_stats` avec `player_count = NULL`, et `ORDER BY player_count DESC`
   * trie les NULL en premier (NULLS FIRST par défaut en Postgres) — `DISTINCT ON`
   * choisissait alors une ligne NULL et écrasait le pic. D'où le filtre explicite
   * `player_count IS NOT NULL`.
   *
   * DISTINCT ON garde, par serveur, la ligne au plus grand `player_count` non-NULL —
   * et, à égalité, la plus ancienne (première fois que le pic a été atteint).
   *
   * Le scheduler ne fait ensuite que monter le pic (cf. start/scheduler.ts), donc ce
   * recalcul one-shot suffit à resynchroniser.
   */
  async up() {
    this.defer(async (db) => {
      await db.rawQuery(`
        UPDATE servers s
        SET peak_player_count = sub.peak_count,
            peak_player_at = sub.peak_at
        FROM (
          SELECT DISTINCT ON (server_id)
            server_id,
            player_count AS peak_count,
            created_at AS peak_at
          FROM server_stats
          WHERE server_id IS NOT NULL
            AND player_count IS NOT NULL
          ORDER BY server_id, player_count DESC, created_at ASC
        ) sub
        WHERE s.id = sub.server_id
          AND (
            s.peak_player_count IS NULL
            OR s.peak_player_count <> sub.peak_count
            OR s.peak_player_at IS DISTINCT FROM sub.peak_at
          )
      `)
    })
  }

  /**
   * Recalcul de données uniquement — rien à défaire. Les valeurs restent maintenues
   * par le scheduler.
   */
  async down() {}
}
