import Server from '#models/server'
import { HttpContext } from '@adonisjs/core/http'

export default class ServerCategoriesController {
  async index({ request, response }: HttpContext) {
    const { serverId } = request.params()
    const server = await Server.findOrFail(serverId)
    await server.load('categories')
    return response.ok(server.categories)
  }

  async store({ request, response }: HttpContext) {
    const { serverId, categoryId } = request.body()
    const server = await Server.findOrFail(serverId)
    await server.related('categories').attach([categoryId])
    return response.ok(server.categories)
  }
}
