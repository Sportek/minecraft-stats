import Category from '#models/category'
import ServerStat from '#models/server_stat'
import ServerPolicy from '#policies/server_policy'
import { CreateServerValidator, UpdateServerValidator } from '#validators/server'
import type { HttpContext } from '@adonisjs/core/http'
import { isPingPossible } from '../../minecraft-ping/minecraft_ping.js'
import Server from '../models/server.js'
import CacheService from '#services/cache_service'
import StatsService from '#services/stat_service'
import Language from '#models/language'

export default class ServersController {
  async index() {
    // Endpoint léger : pas de préloads (user/categories/growthStat/languages), pas de stats par serveur.
    // Consommé par le sitemap, le ServerSelect et le compteur "Monitored servers" — tous se contentent du
    // {id, name, updatedAt} de chaque serveur. Forme `[{ server }]` conservée pour compat frontend.
    const servers = await Server.query().select(
      'id',
      'name',
      'address',
      'port',
      'image_url',
      'last_player_count',
      'last_stats_at',
      'created_at',
      'updated_at'
    )
    return servers.map((server) => ({ server }))
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

  async paginate(ctx: HttpContext) {
    const { request } = ctx
    const page = request.input('page', 1)
    const limit = request.input('limit', 10)
    const categoryIds = request.input('categoryIds')
    const languageIds = request.input('languageIds')
    const search = request.input('search', '')
    const idsParam = request.input('ids')

    // `ids` restreint la requête à une liste explicite de serveurs — utilisé par
    // la section "favoris", qui affiche les favoris de l'utilisateur dans leur
    // propre bloc, indépendamment de la pagination classique du classement.
    const ids = this.parseIdList(idsParam)

    const cacheKey = CacheService.hashParams('paginate', {
      page,
      limit,
      categoryIds,
      languageIds,
      search,
      ids: ids.join(','),
    })

    const nocache = request.input('nocache') === '1'
    const bypass =
      nocache && (process.env.NODE_ENV !== 'production' || ctx.auth?.user?.role === 'admin')

    // TTL réduit quand la requête est personnalisée (favoris) — la fragmentation
    // cache coûte moins en stockage, et les stats changent toutes les 10 min.
    const ttl = ids.length > 0 ? 30 : 60

    return CacheService.cacheOrFetch(
      cacheKey,
      ttl,
      async () => {
        const result = await this.runPaginateQuery({
          page,
          limit,
          categoryIds,
          languageIds,
          search,
          ids,
        })
        return result
      },
      { bypass }
    )
  }

  private static readonly MAX_IDS = 20

  private parseIdList(raw: unknown): number[] {
    if (typeof raw !== 'string' || raw.length === 0) return []
    const ids: number[] = []
    const seen = new Set<number>()
    for (const part of raw.split(',')) {
      const n = Number.parseInt(part.trim(), 10)
      if (!Number.isInteger(n) || n <= 0 || seen.has(n)) continue
      seen.add(n)
      ids.push(n)
      if (ids.length >= ServersController.MAX_IDS) break
    }
    return ids
  }

  private async runPaginateQuery(opts: {
    page: number
    limit: number
    categoryIds?: string
    languageIds?: string
    search: string
    ids: number[]
  }) {
    const { page, limit, categoryIds, languageIds, search, ids } = opts

    // Ordering : on ne classe par `last_player_count` que si le dernier ping
    // réussi est récent (< 30 min, soit ~3 cycles de 10 min). Sinon le serveur
    // est traité comme "stale" et descend en bas, peu importe son ancien count.
    // Évite qu'un serveur down depuis des jours reste top juste parce qu'il
    // avait 500 joueurs avant de tomber.
    let query = Server.query()
      .preload('user')
      .preload('categories')
      .preload('growthStat')
      .preload('languages')

    // Restriction à une liste explicite d'IDs (section favoris) : `whereIn` avec
    // bindings, donc safe même si les IDs venaient d'une source moins fiable.
    if (ids.length > 0) {
      query = query.whereIn('id', ids)
    }

    query = query
      .orderByRaw(
        `CASE
          WHEN last_stats_at > now() - interval '30 minutes'
            THEN COALESCE(last_player_count, -1)
          ELSE -1
         END DESC`
      )
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

    const now = Date.now()
    const fromDate = now - 24 * 60 * 60 * 1000

    // Important : Lucid SimplePaginator étend Array, donc `servers.map(...)` retourne
    // une *nouvelle SimplePaginator* (via Symbol.species), pas un Array standard.
    // Ce paginator a un `.toJSON()` qui réécrit la réponse en `{meta, data}` →
    // double nesting côté HTTP. On extrait `servers.all()` (le rows[] réel) avant map.
    const serverRows = servers.all()
    const serverIds = serverRows.map((s) => s.id)
    const statsByServer = await StatsService.getStatsBatch({
      serverIds,
      fromDate,
      toDate: now,
      interval: '1 hour',
    })

    const serversWithStats = serverRows.map((server) => {
      const bucketed = (statsByServer.get(server.id) ?? []).map((row) => ({
        serverId: server.id,
        createdAt: row.created_at,
        playerCount: row.player_count,
        maxCount: row.max_count,
      }))

      const lastStat =
        server.lastStatsAt !== null && server.lastPlayerCount !== null
          ? [
              {
                serverId: server.id,
                createdAt: server.lastStatsAt,
                playerCount: server.lastPlayerCount,
                maxCount: server.lastMaxCount,
              },
            ]
          : []

      return {
        server,
        stats: [...lastStat, ...bucketed],
        categories: server.categories,
        growthStat: server.growthStat,
      }
    })

    return {
      data: serversWithStats,
      meta: servers.getMeta(),
    }
  }
}
