import Server from '#models/server'
import ServerStat from '#models/server_stat'
import { BaseSchema } from '@adonisjs/lucid/schema'

export default class extends BaseSchema {
  protected tableName = 'servers'

  async up() {
    const servers = await Server.all()
    // On peuple la colonne lastOnlineAt avec la date du dernier stat avec un playerCount > 0
    // (donc que le serveur est actif)
    for (const server of servers) {
      const stat = await ServerStat.query()
        .where({ serverId: server.id })
        .andWhereNotNull('playerCount')
        .orderBy('created_at', 'desc')
        .first()
      server.lastOnlineAt = stat?.createdAt ?? null
      await server.save()
    }
  }

  async down() {
    // this.schema.dropTable(this.tableName)
  }
}
