import { BaseSchema } from '@adonisjs/lucid/schema'

/**
 * Signal "domaine racine" pour la détection de doublons.
 *
 * Le signal manquant le plus évident : `mc.hypixel.net` et `hypixel.net`
 * partagent le même domaine enregistrable (eTLD+1 → `hypixel.net`). On stocke
 * ce domaine, dérivé de l'adresse, dans une colonne indexée pour pouvoir
 * retrouver d'un coup tous les serveurs d'un même domaine.
 *
 * La colonne est nullable et peuplée par le hook `@beforeSave` du modèle Server
 * (cf. `normalizeWebsiteColumn`/`deriveHostDomainColumn`). Aucun backfill ici :
 * les lignes existantes se remplissent d'elles-mêmes à leur prochain `save()`
 * (le scheduler re-pingue chaque serveur en continu) — même logique d'auto-
 * guérison que les autres empreintes (favicon_hash, motd_hash…).
 */
export default class extends BaseSchema {
  protected tableName = 'servers'

  async up() {
    this.schema.alterTable(this.tableName, (table) => {
      table.string('host_domain').nullable()
      table.index(['host_domain'], 'servers_host_domain_idx')
    })
  }

  async down() {
    this.schema.alterTable(this.tableName, (table) => {
      table.dropIndex(['host_domain'], 'servers_host_domain_idx')
      table.dropColumn('host_domain')
    })
  }
}
