import { BaseSchema } from '@adonisjs/lucid/schema'

/**
 * Détection de doublons à la création d'un serveur.
 *
 * Un même serveur Minecraft est souvent joignable via plusieurs adresses
 * (`play.example.com`, `mc.example.com`, une IP brute…). On stocke trois
 * empreintes qui, combinées, permettent de repérer qu'il est déjà listé :
 *  - `favicon_hash`      : SHA-256 de l'icône renvoyée par le ping.
 *  - `resolved_endpoint` : `ip:port` réel après résolution DNS (SRV + A/AAAA).
 *  - `motd_hash`         : SHA-256 du MOTD normalisé (couleurs + chiffres retirés).
 *
 * Voir DuplicateDetectionService. Les trois colonnes sont indexées car
 * interrogées en lecture à chaque création de serveur.
 */
export default class extends BaseSchema {
  protected tableName = 'servers'

  async up() {
    this.schema.alterTable(this.tableName, (table) => {
      table.string('favicon_hash').nullable()
      table.string('resolved_endpoint').nullable()
      table.string('motd_hash').nullable()
      table.index(['favicon_hash'], 'servers_favicon_hash_idx')
      table.index(['resolved_endpoint'], 'servers_resolved_endpoint_idx')
      table.index(['motd_hash'], 'servers_motd_hash_idx')
    })
  }

  async down() {
    this.schema.alterTable(this.tableName, (table) => {
      table.dropIndex(['favicon_hash'], 'servers_favicon_hash_idx')
      table.dropIndex(['resolved_endpoint'], 'servers_resolved_endpoint_idx')
      table.dropIndex(['motd_hash'], 'servers_motd_hash_idx')
      table.dropColumn('favicon_hash')
      table.dropColumn('resolved_endpoint')
      table.dropColumn('motd_hash')
    })
  }
}
