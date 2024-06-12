import ServerStat from '#models/server_stat'
import ServerPolicy from '#policies/server_policy'
import type { HttpContext } from '@adonisjs/core/http'
import { isPingPossible } from '../../minecraft-ping/minecraft_ping.js'
import Server from '../models/server.js'
import { CreateServerValidator, UpdateServerValidator } from '#validators/server'
import Category from '#models/category'

export default class ServersController {
  async index() {
    const servers = await Server.query().preload('user')
    const serversWithStats = await Promise.all(
      servers.map(async (server) => {
        const categories = await server.related('categories').query()
        const stat = await this.getActualStats(server)
        return { server, stat, categories }
      })
    )
    return serversWithStats
  }

  async store({ request, auth, response }: HttpContext) {
    const data = request.only(['name', 'address', 'port', 'imageUrl', 'categories'])
    const user = auth.user
    if (!user) {
      return response.unauthorized({ message: 'Unauthorized' })
    }

    const validatedData = await CreateServerValidator.validate(data)

    const successPing = await isPingPossible(validatedData.address, validatedData.port)
    if (!successPing) {
      return response.badRequest({ message: 'Server is not reachable' })
    }

    const { categories, ...dataToCreate } = validatedData

    const server = await Server.create(dataToCreate)

    const categoriesToAttach = await Promise.all(
      categories.map((name) => Category.findBy('name', name))
    )

    await server
      .related('categories')
      .attach(categoriesToAttach.filter((c) => c !== null).map((c) => c!.id))
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
    if (!server) return response.notFound({ message: 'Server not found' })
    const stat = await this.getActualStats(server)
    const categories = await server.related('categories').query()
    return { server, stat, categories }
  }

  async update({ params, request, response, bouncer }: HttpContext) {
    const data = request.only(['name', 'address', 'port', 'imageUrl', 'categories'])
    const validatedData = await UpdateServerValidator.validate(data)
    const server = await Server.findByOrFail('id', params.id)
    if (await bouncer.with(ServerPolicy).denies('update', server)) {
      return response.forbidden({ message: 'Unauthorized' })
    }

    const { categories, ...dataToUpdate } = validatedData

    const successPing = await isPingPossible(
      validatedData.address ?? server.address,
      validatedData.port ?? server.port
    )
    if (!successPing) {
      return response.badRequest({ message: 'Server is not reachable' })
    }

    if (categories) {
      const categoriesToAttach = await Promise.all(
        categories.map((name) => Category.findBy('name', name))
      )

      await server
        .related('categories')
        .sync(categoriesToAttach.filter((c) => c !== null).map((c) => c!.id))
    }

    return server.merge(dataToUpdate).save()
  }

  async destroy({ params, response, bouncer }: HttpContext) {
    const server = await Server.find(params.id)
    if (!server) {
      return response.notFound({ message: 'Server not found' })
    }
    if (await bouncer.with(ServerPolicy).denies('destroy', server)) {
      return response.forbidden({ message: 'Unauthorized' })
    }
    await server.delete()
    return response.noContent()
  }
}
