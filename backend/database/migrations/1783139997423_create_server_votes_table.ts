import { BaseSchema } from '@adonisjs/lucid/schema'

export default class extends BaseSchema {
  protected tableName = 'server_votes'

  async up() {
    this.schema.createTable(this.tableName, (table) => {
      table.increments('id')

      table
        .integer('server_id')
        .unsigned()
        .notNullable()
        .references('id')
        .inTable('servers')
        .onDelete('CASCADE')

      // Lien vers l'utilisateur tracké : la PK du visiteur anonyme (localStorage
      // UUID côté client). SET NULL comme `page_views` — un vote survit à la purge
      // éventuelle d'un visiteur.
      table
        .integer('visitor_id')
        .unsigned()
        .nullable()
        .references('id')
        .inTable('visitors')
        .onDelete('SET NULL')

      // Renseigné uniquement si le votant est aussi connecté à un compte.
      table
        .integer('user_id')
        .unsigned()
        .nullable()
        .references('id')
        .inTable('users')
        .onDelete('SET NULL')

      // Pseudo Minecraft saisi (non vérifié : l'enrichissement Mojang est best-effort).
      table.string('username').notNullable()

      // UUID Mojang résolu (sans tirets) quand le pseudo existe, sinon NULL.
      table.string('mojang_uuid', 32).nullable()

      // Empreinte IP HMAC-SHA256 — jamais l'IP en clair (RGPD / Loi 25).
      table.string('ip_hash', 64).nullable()

      table.string('country', 2).nullable()

      table.timestamp('created_at')
      table.timestamp('updated_at')

      // Cooldown (fenêtre 90 min) + agrégation du classement mensuel.
      table.index(['server_id', 'created_at'], 'server_votes_server_created_index')
      table.index(['ip_hash'], 'server_votes_ip_hash_index')
      table.index(['server_id', 'username'], 'server_votes_server_username_index')
    })
  }

  async down() {
    this.schema.dropTable(this.tableName)
  }
}
