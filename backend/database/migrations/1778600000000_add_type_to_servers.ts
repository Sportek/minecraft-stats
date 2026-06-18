import { BaseSchema } from '@adonisjs/lucid/schema'

/**
 * Support des serveurs Bedrock. `type` distingue l'édition à pinger : le protocole
 * diffère (Java = handshake TCP 25565, Bedrock = Unconnected Ping RakNet UDP 19132).
 * Défaut 'java' : tous les serveurs déjà listés sont des serveurs Java.
 */
export default class extends BaseSchema {
  protected tableName = 'servers'

  async up() {
    this.schema.alterTable(this.tableName, (table) => {
      table.string('type').notNullable().defaultTo('java')
    })
  }

  async down() {
    this.schema.alterTable(this.tableName, (table) => {
      table.dropColumn('type')
    })
  }
}
