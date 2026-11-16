import { BaseSchema } from '@adonisjs/lucid/schema'

/**
 * Remplace la clé `id` de `server_stats` par `(server_id, created_at)`.
 *
 * `server_stats_pkey` (sur `id`) faisait 841 Mo en production pour 0 scan : rien ne
 * lit un relevé par son `id`. La nouvelle clé primaire porte aussi l'index
 * `(server_id, created_at)` que toutes les lectures utilisent, qui devient donc
 * redondant (1,2 Go). Deux index en moins à maintenir à chaque insertion, ~840 Mo de
 * moins à garder en cache. C'est aussi la clé qu'impose le partitionnement prévu
 * (`manual-migrations/partition_server_stats.ts`).
 *
 * Préalables relevés en production (2026-11-16) : 832 lignes à `server_id` NULL
 * (orphelines, toutes antérieures à mai 2026) et 199 couples (server_id, created_at)
 * en double. Les orphelines sont supprimées, les doublons réduits à leur plus
 * ancienne ligne.
 *
 * Tourne sans verrou long sur une table de 35 M lignes alimentée en continu :
 * - index unique construit `CONCURRENTLY` ;
 * - NOT NULL posé via une contrainte CHECK validée à part (VALIDATE ne bloque pas
 *   les écritures ; SET NOT NULL réutilise alors la contrainte au lieu de scanner) ;
 * - la bascule n'est qu'une suite d'opérations de catalogue, dans une transaction
 *   courte.
 * Compter ~5 min sur la production (dédoublonnage et construction de l'index). Elle
 * y a été jouée à la main avant le déploiement ; elle n'y fait donc plus rien.
 */
export default class extends BaseSchema {
  protected tableName = 'server_stats'

  /** `CREATE INDEX CONCURRENTLY` est interdit dans une transaction. */
  static disableTransactions = true

  async up() {
    this.defer(async (db) => {
      const { rows } = await db.rawQuery(
        `SELECT 1 FROM information_schema.columns
          WHERE table_name = 'server_stats' AND column_name = 'id'`
      )
      if (rows.length === 0) return

      await db.rawQuery(`DELETE FROM server_stats WHERE server_id IS NULL`)
      await db.rawQuery(`
        DELETE FROM server_stats s
         USING (
           SELECT server_id, created_at, min(id) AS kept_id
             FROM server_stats
            GROUP BY server_id, created_at
           HAVING count(*) > 1
         ) d
         WHERE s.server_id = d.server_id
           AND s.created_at = d.created_at
           AND s.id <> d.kept_id
      `)

      // Un essai interrompu laisse un index INVALID du même nom : on repart de zéro.
      await db.rawQuery(`DROP INDEX CONCURRENTLY IF EXISTS server_stats_composite_pkey`)
      await db.rawQuery(
        `CREATE UNIQUE INDEX CONCURRENTLY server_stats_composite_pkey
           ON server_stats (server_id, created_at)`
      )

      for (const column of ['server_id', 'created_at']) {
        await db.rawQuery(
          `ALTER TABLE server_stats DROP CONSTRAINT IF EXISTS server_stats_${column}_not_null`
        )
        await db.rawQuery(
          `ALTER TABLE server_stats ADD CONSTRAINT server_stats_${column}_not_null
             CHECK (${column} IS NOT NULL) NOT VALID`
        )
        await db.rawQuery(
          `ALTER TABLE server_stats VALIDATE CONSTRAINT server_stats_${column}_not_null`
        )
      }

      await db.transaction(async (trx) => {
        // Les insertions du scheduler attendent quelques millisecondes ; on préfère
        // échouer (et relancer) plutôt que bloquer derrière une longue requête.
        await trx.rawQuery(`SET LOCAL lock_timeout = '10s'`)
        // Instruction distincte du DROP des CHECK : dans un même ALTER, la vérification
        // du NOT NULL passerait après leur suppression et rescannerait la table.
        await trx.rawQuery(`
          ALTER TABLE server_stats
            ALTER COLUMN server_id SET NOT NULL,
            ALTER COLUMN created_at SET NOT NULL
        `)
        await trx.rawQuery(`
          ALTER TABLE server_stats
            DROP CONSTRAINT server_stats_server_id_not_null,
            DROP CONSTRAINT server_stats_created_at_not_null,
            DROP CONSTRAINT server_stats_pkey
        `)
        await trx.rawQuery(`
          ALTER TABLE server_stats
            ADD CONSTRAINT server_stats_pkey PRIMARY KEY USING INDEX server_stats_composite_pkey
        `)
        await trx.rawQuery(`ALTER TABLE server_stats DROP COLUMN id`)
      })

      await db.rawQuery(`DROP INDEX CONCURRENTLY IF EXISTS server_stats_server_id_created_at_index`)
      await db.rawQuery(`ANALYZE server_stats`)
    })
  }

  async down() {
    this.defer(async (db) => {
      await db.rawQuery(
        `CREATE INDEX CONCURRENTLY IF NOT EXISTS server_stats_server_id_created_at_index
           ON server_stats (server_id, created_at)`
      )
      await db.transaction(async (trx) => {
        await trx.rawQuery(`ALTER TABLE server_stats DROP CONSTRAINT server_stats_pkey`)
        await trx.rawQuery(`ALTER TABLE server_stats ADD COLUMN id serial PRIMARY KEY`)
        await trx.rawQuery(`ALTER TABLE server_stats ALTER COLUMN server_id DROP NOT NULL`)
        await trx.rawQuery(`ALTER TABLE server_stats ALTER COLUMN created_at DROP NOT NULL`)
      })
    })
  }
}
