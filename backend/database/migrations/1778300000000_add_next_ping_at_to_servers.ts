import { BaseSchema } from '@adonisjs/lucid/schema'

/**
 * P.5.1 — Cadence différentielle (Niveau 2.1).
 *
 * Ajoute `next_ping_at` sur `servers` pour permettre un scheduling fin par serveur :
 * - hot (lastPlayerCount > 100) → toutes les 5 min
 * - normal (succès récent)      → toutes les 10 min
 * - cold (échec récent)         → toutes les 30 min
 * - dead (long historique d'échec) → toutes les 6h
 *
 * NULL = "à pinger ASAP" (cas d'un serveur juste créé ou jamais pingué).
 * Index partiel pour le scan des serveurs dus.
 */
export default class extends BaseSchema {
  protected tableName = 'servers'

  async up() {
    this.schema.alterTable(this.tableName, (table) => {
      table.timestamp('next_ping_at', { useTz: true }).nullable()
      table.index(['next_ping_at'], 'servers_next_ping_at_idx')
    })
  }

  async down() {
    this.schema.alterTable(this.tableName, (table) => {
      table.dropIndex(['next_ping_at'], 'servers_next_ping_at_idx')
      table.dropColumn('next_ping_at')
    })
  }
}
