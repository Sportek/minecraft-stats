import ServerStat from '#models/server_stat'
import ServerPolicy from '#policies/server_policy'
import type { HttpContext } from '@adonisjs/core/http'
import { isPingPossible } from '../../minecraft-ping/minecraft_ping.js'
import Server from '../models/server.js'

export default class ServersController {
  async index() {
    const servers = await Server.query().preload('user')
    const serversWithStats = await Promise.all(
      servers.map(async (server) => {
        const stat = await this.getActualStats(server)
        return { server, stat }
      })
    )
    return serversWithStats
  }

  async store({ request, auth, response }: HttpContext) {
    const data = request.only(['name', 'address', 'port', 'imageUrl'])
    const user = auth.user
    if (!user) {
      return response.unauthorized('Unauthorized')
    }

    const successPing = await isPingPossible(data.address, data.port)
    if (!successPing) {
      return response.badRequest('Server is not reachable')
    }

    const server = await Server.create(data)
    await server.related('user').associate(user)
    return server
  }

  private async getActualStats(server: Server) {
    const stats = await ServerStat.query()
      .where('server_id', server.id)
      .orderBy('created_at', 'desc')
      .first()
    return stats
  }

  async show({ params, response }: HttpContext) {
    let server = await Server.query().where('id', params.id).preload('user').first()
    if (!server) return response.notFound('Server not found')
    const stat = await this.getActualStats(server)
    return { server, stat }
  }

  async update({ params, request, response, bouncer }: HttpContext) {
    const data = request.only(['name', 'address', 'port', 'imageUrl'])
    const server = await Server.find(params.id)
    if (!server) return response.notFound('Server not found')
    if (await bouncer.with(ServerPolicy).denies('update', server)) {
      return response.forbidden('Unauthorized')
    }
    return server.merge(data).save()
  }

  async destroy({ params, response, bouncer }: HttpContext) {
    const server = await Server.find(params.id)
    if (!server) {
      return response.notFound('Server not found')
    }
    if (await bouncer.with(ServerPolicy).denies('destroy', server)) {
      return response.forbidden('Unauthorized')
    }
    return server.delete()
  }
}
