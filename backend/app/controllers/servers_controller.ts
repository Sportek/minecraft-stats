import type { HttpContext } from '@adonisjs/core/http'
import Server from '../models/server.js'
import User from '../models/user.js'

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
    return Server.create(data)
  }

  async show({ params }: HttpContext) {
    return Server.find(params.id)
  }

  async update({ params, request, response, auth }: HttpContext) {
    const data = request.only(['name', 'address', 'port', 'imageUrl'])
    const server = await Server.find(params.id)
    if (!server) {
      return response.notFound('Server not found')
    }
    const user = auth.user
    if (!user || !this.isOwner(server, user)) {
      return response.unauthorized('Unauthorized')
    }
    return server.merge(data).save()
  }

  async destroy({ params, response, auth }: HttpContext) {
    const server = await Server.find(params.id)
    if (!server) {
      return response.notFound('Server not found')
    }
    const user = auth.user
    if (!user || !this.isOwner(server, user)) {
      return response.unauthorized('Unauthorized')
    }
    return server.delete()
  }

  isOwner(server: Server, user: User) {
    return server.user.id === user.id
  }
}
