import Server from '#models/server'
import ServerCategoryPolicy from '#policies/server_category_policy'
import { HttpContext } from '@adonisjs/core/http'

export default class ServerCategoriesController {
  async index({ request, response }: HttpContext) {
    const { serverId } = request.params()
    const server = await Server.findOrFail(serverId)
    await server.load('categories')
    return response.ok(server.categories)
  }

  async store({ request, response, bouncer }: HttpContext) {
    const { serverId, categoryId } = request.body()
    const server = await Server.findOrFail(serverId)
    if (await bouncer.with(ServerCategoryPolicy).denies('update', server)) {
      return response.forbidden({ message: 'Unauthorized' })
    }
    await server.related('categories').attach([categoryId])
    return response.ok(server.categories)
  }

  async destroy({ request, response, bouncer }: HttpContext) {
    const { serverId, categoryId } = request.body()
    const server = await Server.findOrFail(serverId)
    if (await bouncer.with(ServerCategoryPolicy).denies('destroy', server)) {
      return response.forbidden({ message: 'Unauthorized' })
    }
    await server.related('categories').detach([categoryId])
    return response.ok(server.categories)
  }
}
