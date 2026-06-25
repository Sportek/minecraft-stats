import { BaseSchema } from '@adonisjs/lucid/schema'

export default class extends BaseSchema {
  protected tableName = 'visitors'

  async up() {
    this.schema.createTable(this.tableName, (table) => {
      table.increments('id')
      // Identifiant anonyme généré côté client (UUID), stable entre les visites.
      table.uuid('uuid').notNullable().unique()
      // Empreinte serveur : l'IP n'est JAMAIS stockée en clair (RGPD / Loi 25),
      // seulement son HMAC-SHA256. Sert de secours quand le localStorage est vidé.
      table.string('ip_hash', 64).nullable()
      table.string('user_agent', 512).nullable()
      // Code pays ISO-2 déduit du header Cloudflare `CF-IPCountry`.
      table.string('country', 2).nullable()

      table.timestamp('first_seen_at')
      table.timestamp('last_seen_at')

      table.index(['ip_hash'], 'visitors_ip_hash_index')
    })
  }

  async down() {
    this.schema.dropTable(this.tableName)
  }
}
