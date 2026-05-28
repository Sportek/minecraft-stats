import Server from '#models/server'
import ServerCategoryPolicy from '#policies/server_category_policy'
import { type HttpContext } from '@adonisjs/core/http'

export default class ServerCategoriesController {
  /**
   * @listServerCategories
   * @operationId listServerCategories
   * @tag SERVERS
   * @summary List categories of a server
   * @description Returns the categories currently attached to the server identified by `server_id`. Publicly accessible.
   * @paramPath server_id - Server ID - @type(number) @example(125) @required
   * @responseBody 200 - <Category[]>
   * @responseBody 404 - {"message": "Row not found"}
   */
  async index({ request, response }: HttpContext) {
    const { serverId } = request.params()
    const server = await Server.findOrFail(serverId)
    await server.load('categories')
    return response.ok(server.categories)
  }

  /**
   * @addServerCategory
   * @operationId addServerCategory
   * @tag SERVERS
   * @summary Attach a category to a server
   * @description Attaches a category to a server. Both `serverId` and `categoryId` are read from the request body. Authorization is enforced by `ServerCategoryPolicy.update` against the target server (typically only the owner or an admin).
   * @paramPath server_id - Server ID (path placeholder — actual id is read from the body) - @type(number) @example(125)
   * @requestBody {"serverId": 1, "categoryId": 2}
   * @responseBody 200 - <Category[]>
   * @responseBody 403 - {"message": "Unauthorized"}
   * @responseBody 404 - {"message": "Row not found"}
   */
  async store({ request, response, bouncer }: HttpContext) {
    const { serverId, categoryId } = request.body()
    const server = await Server.findOrFail(serverId)
    if (await bouncer.with(ServerCategoryPolicy).denies('update', server)) {
      return response.forbidden({ message: 'Unauthorized' })
    }
    await server.related('categories').attach([categoryId])
    return response.ok(server.categories)
  }

  /**
   * @removeServerCategory
   * @operationId removeServerCategory
   * @tag SERVERS
   * @summary Detach a category from a server
   * @description Detaches a category from a server. Both `serverId` and `categoryId` are read from the request body (not the URL placeholders). Authorization is enforced by `ServerCategoryPolicy.destroy` against the target server.
   * @paramPath server_id - Server ID (path placeholder — actual id is read from the body) - @type(number) @example(125)
   * @paramPath id - Category ID (path placeholder — actual id is read from the body) - @type(number) @example(3)
   * @requestBody {"serverId": 1, "categoryId": 2}
   * @responseBody 200 - <Category[]>
   * @responseBody 403 - {"message": "Unauthorized"}
   * @responseBody 404 - {"message": "Row not found"}
   */
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
