/**
 * P.4.2 — MIGRATION MANUELLE — Partitionnement de server_stats par mois.
 *
 * ⚠️ NE PAS PLACER DANS `database/migrations/`. Cette migration est destructive
 *     (copie + rename + drop), peut durer plusieurs heures, et requiert :
 *     - Une fenêtre de maintenance
 *     - Un dump complet AVANT exécution
 *     - Une validation manuelle sur une copie de prod
 *
 * Procédure :
 *   1. Faire un dump : `pg_dump -t server_stats > server_stats_backup.sql`
 *   2. Tester sur une copie de la base
 *   3. Exécuter via psql ou via un script ts manuel (`node --experimental-vm-modules ...`)
 *   4. Valider les endpoints en prod
 *   5. Drop la table _old après ≥ 24h sans incident
 *
 * Le schéma cible :
 *   - server_stats partitionnée par RANGE (created_at), partitions mensuelles
 *   - PK = (server_id, created_at) — Postgres impose que la PK contienne la colonne de partition
 *   - id auto-incrément supprimé (audit `grep` : non utilisé dans le code)
 */

import { BaseSchema } from '@adonisjs/lucid/schema'

export default class extends BaseSchema {
  async up() {
    // 1) Créer la nouvelle table parente partitionnée
    await this.db.rawQuery(`
      CREATE TABLE IF NOT EXISTS server_stats_partitioned (
        server_id integer NOT NULL,
        player_count integer NULL,
        max_count integer NULL,
        created_at timestamptz NOT NULL,
        PRIMARY KEY (server_id, created_at),
        CONSTRAINT server_stats_partitioned_server_fk
          FOREIGN KEY (server_id) REFERENCES servers(id) ON DELETE CASCADE
      ) PARTITION OF NOTHING;
    `)

    // 2) Créer les partitions mensuelles couvrant l'historique connu.
    //    À adapter dynamiquement selon `MIN(created_at)` réel — laissé en TODO
    //    pour exécution manuelle.
    //    Exemple :
    //    CREATE TABLE server_stats_y2024m01 PARTITION OF server_stats_partitioned
    //      FOR VALUES FROM ('2024-01-01') TO ('2024-02-01');

    // 3) Copier les données (peut durer plusieurs heures sur grosse base)
    //    INSERT INTO server_stats_partitioned (server_id, player_count, max_count, created_at)
    //    SELECT server_id, player_count, max_count, created_at FROM server_stats;

    // 4) Rename
    //    ALTER TABLE server_stats RENAME TO server_stats_old;
    //    ALTER TABLE server_stats_partitioned RENAME TO server_stats;

    // 5) Recréer les index nécessaires sur la nouvelle table (chaque partition les hérite)
    //    CREATE INDEX server_stats_server_id_created_at_index
    //      ON server_stats (server_id, created_at);

    // 6) Drop server_stats_old après validation (séparé, pas dans cette migration)

    throw new Error(
      'P.4.2 partition migration is intentionally not executable via `migration:run`. ' +
        'Read manual-migrations/README.md and run the SQL steps manually during a maintenance window.'
    )
  }

  async down() {
    throw new Error('Manual rollback only — see manual-migrations/README.md')
  }
}
