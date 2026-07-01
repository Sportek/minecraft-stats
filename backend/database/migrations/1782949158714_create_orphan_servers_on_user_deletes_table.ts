import { BaseSchema } from '@adonisjs/lucid/schema'

export default class extends BaseSchema {
  protected tableName = 'servers'

  async up() {
    // Supprimer un compte ne doit plus détruire ses serveurs (ni tout leur
    // historique de stats via cascade transitive). On passe le FK de CASCADE à
    // SET NULL : les serveurs deviennent orphelins (user_id = NULL) et restent
    // suivis ; seuls les admins peuvent alors les gérer.
    this.schema.alterTable(this.tableName, (table) => {
      table.dropForeign(['user_id'])
    })
    this.schema.alterTable(this.tableName, (table) => {
      table.setNullable('user_id')
      table.foreign('user_id').references('users.id').onDelete('SET NULL')
    })
  }

  async down() {
    this.schema.alterTable(this.tableName, (table) => {
      table.dropForeign(['user_id'])
    })
    this.schema.alterTable(this.tableName, (table) => {
      table.foreign('user_id').references('users.id').onDelete('CASCADE')
    })
  }
}
