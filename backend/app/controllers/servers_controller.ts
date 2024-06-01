import ServerPolicy from '#policies/server_policy'
import type { HttpContext } from '@adonisjs/core/http'
import Server from '../models/server.js'

export default class ServersController {
  async index() {
    return Server.all()
  }

  async store({ request, auth, response }: HttpContext) {
    const data = request.only(['name', 'address', 'port', 'imageUrl'])
    const user = auth.user
    if (!user) {
      return response.unauthorized('Unauthorized')
    }

    const server = await Server.create(data)
    await server.related('user').associate(user)
    return server
  }

  async show({ params }: HttpContext) {
    return Server.find(params.id)
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
