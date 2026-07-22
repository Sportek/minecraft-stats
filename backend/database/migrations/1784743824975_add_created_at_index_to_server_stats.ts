import { BaseSchema } from '@adonisjs/lucid/schema'

/**
 * La vue globale filtre sur `created_at` seul, sans `server_id`. Aucun des index
 * existants ne commence par cette colonne : `server_stats_pkey` porte sur `id`, les
 * deux autres sur `(server_id, …)`. Postgres n'avait donc aucun chemin d'accès et
 * balayait la table entière — 8,2 M lignes rejetées par worker pour en retenir
 * 11 071 sur une fenêtre de 24 h.
 *
 * Mesuré sur staging (23,7 M lignes), même requête à chaud :
 *   sans index   1 065 ms   155 765 blocs
 *   BRIN            628 ms    25 990 blocs   (56 ko)
 *   btree            46 ms       835 blocs   (527 Mo)  ← retenu
 *
 * Le BRIN est 10 000× plus petit mais une fenêtre de 24 h reste éparpillée sur trop
 * de plages de blocs, chacune ramenée en entier. Le btree coûte de l'espace, et on
 * en récupère une partie en supprimant `server_id_player_count` (181 Mo) que
 * `pg_stat_user_indexes` donne à 0 scan depuis la mise en service.
 *
 * `CONCURRENTLY` : la table fait 28 M lignes en production et le scheduler y écrit
 * toutes les 10 minutes. Un `CREATE INDEX` classique poserait un verrou bloquant les
 * écritures pendant toute la construction (~13 s mesurées sur staging).
 * D'où `disableTransactions` — Postgres refuse `CONCURRENTLY` dans une transaction.
 */
export default class extends BaseSchema {
  protected tableName = 'server_stats'

  /**
   * `CREATE INDEX CONCURRENTLY` ne peut pas s'exécuter dans une transaction, et
   * Lucid enveloppe les migrations dans une transaction par défaut.
   */
  static disableTransactions = true

  async up() {
    this.schema.raw(
      `CREATE INDEX CONCURRENTLY IF NOT EXISTS server_stats_created_at_index
         ON server_stats (created_at)`
    )
    this.schema.raw(`DROP INDEX CONCURRENTLY IF EXISTS server_stats_server_id_player_count_index`)
  }

  async down() {
    this.schema.raw(
      `CREATE INDEX CONCURRENTLY IF NOT EXISTS server_stats_server_id_player_count_index
         ON server_stats (server_id, player_count)`
    )
    this.schema.raw(`DROP INDEX CONCURRENTLY IF EXISTS server_stats_created_at_index`)
  }
}
