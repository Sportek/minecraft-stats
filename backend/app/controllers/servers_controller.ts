import Category from '#models/category'
import ServerStat from '#models/server_stat'
import ServerPolicy from '#policies/server_policy'
import { CreateServerValidator, UpdateServerValidator } from '#validators/server'
import type { HttpContext } from '@adonisjs/core/http'
import { isPingPossible } from '../../minecraft-ping/minecraft_ping.js'
import Server from '../models/server.js'
import StatsService from '#services/stat_service'
import Language from '#models/language'

export default class ServersController {
  async index() {
    const servers = await Server.query()
      .preload('user')
      .preload('categories')
      .preload('growthStat')
      .preload('languages')
    const serversWithStats = await Promise.all(
      servers.map(async (server) => {
        const stats = await this.getActualStats(server)
        return { server, stats, categories: server.categories, growthStat: server.growthStat }
      })
    )
    return serversWithStats
  }

  async store({ request, auth, response }: HttpContext) {
    const data = request.only(['name', 'address', 'port', 'imageUrl', 'categories', 'languages'])
    const user = auth.user
    if (!user) {
      return response.unauthorized({ message: 'Unauthorized' })
    }

    const validatedData = await CreateServerValidator.validate(data)

    const successPing = await isPingPossible(validatedData.address, validatedData.port)
    if (!successPing) {
      return response.badRequest({ message: 'Server is not reachable' })
    }

    const { categories, languages, ...dataToCreate } = validatedData

    const server = await Server.create(dataToCreate)

    const categoriesToAttach = await Promise.all(
      categories.map((name) => Category.findBy('name', name))
    )

    await server
      .related('categories')
      .attach(categoriesToAttach.filter((c) => c !== null).map((c) => c!.id))

    const languagesToAttach = await Promise.all(
      languages.map((code) => Language.findBy('code', code))
    )

    await server
      .related('languages')
      .attach(languagesToAttach.filter((l) => l !== null).map((l) => l!.id))

    await server.related('user').associate(user)
    return server
  }

  private async getActualStats(server: Server, amount: number = 1) {
    const stats = await ServerStat.query()
      .where('server_id', server.id)
      .orderBy('created_at', 'desc')
      .limit(amount)
    return stats
  }

  async show({ params, response }: HttpContext) {
    let server = await Server.query()
      .where('id', params.id)
      .preload('user')
      .preload('growthStat')
      .preload('categories')
      .preload('languages')
      .first()
    if (!server) return response.notFound({ message: 'Server not found' })
    const stats = await this.getActualStats(server)
    return { server, stats, categories: server.categories, growthStat: server.growthStat }
  }

  async update({ params, request, response, bouncer }: HttpContext) {
    const data = request.only(['name', 'address', 'port', 'imageUrl', 'categories', 'languages'])
    const validatedData = await UpdateServerValidator.validate(data)
    const server = await Server.findByOrFail('id', params.id)
    if (await bouncer.with(ServerPolicy).denies('update', server)) {
      return response.forbidden({ message: 'Unauthorized' })
    }

    const { categories, languages, ...dataToUpdate } = validatedData

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

    if (languages) {
      const languagesToAttach = await Promise.all(
        languages.map((code) => Language.findBy('code', code))
      )

      await server
        .related('languages')
        .sync(languagesToAttach.filter((l) => l !== null).map((l) => l!.id))
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

  async paginate({ request }: HttpContext) {
    const page = request.input('page', 1)
    const limit = request.input('limit', 10)
    const categoryIds = request.input('categoryIds')
    const languageIds = request.input('languageIds')
    const search = request.input('search', '')

    let query = Server.query()
      .preload('user')
      .preload('categories')
      .preload('growthStat')
      .preload('languages')
      .orderByRaw('COALESCE(last_player_count, -1) DESC')
      .orderBy('last_stats_at', 'desc')

    if (search) {
      query = query.where((builder) => {
        builder.whereILike('name', `%${search}%`).orWhereILike('address', `%${search}%`)
      })
    }

    if (categoryIds) {
      try {
        const ids = categoryIds
          .split(',')
          .map((id: string) => Number.parseInt(id.trim(), 10))
          .filter((id: number) => !Number.isNaN(id))
        if (ids.length > 0) {
          query = query.whereHas('categories', (builder) => {
            builder.whereIn('categories.id', ids)
          })
        }
      } catch (error) {
        console.error('Error processing categoryIds:', error)
      }
    }

    if (languageIds) {
      try {
        const ids = languageIds
          .split(',')
          .map((id: string) => Number.parseInt(id.trim(), 10))
          .filter((id: number) => !Number.isNaN(id))
        if (ids.length > 0) {
          query = query.whereHas('languages', (builder) => {
            builder.whereIn('languages.id', ids)
          })
        }
      } catch (error) {
        console.error('Error processing languageIds:', error)
      }
    }

    const servers = await query.paginate(page, limit)

    const serversWithStats = await Promise.all(
      servers.map(async (server) => {
        const lastStat = await this.getActualStats(server, 1)
        const lastDayStats = await StatsService.getStats({
          server_id: server.id,
          fromDate: Date.now() - 24 * 60 * 60 * 1000,
          toDate: Date.now(),
        })
        return {
          server,
          stats: [...lastStat, ...lastDayStats],
          categories: server.categories,
          growthStat: server.growthStat,
        }
      })
    )

    return {
      data: serversWithStats,
      meta: servers.getMeta(),
    }
  }
}
