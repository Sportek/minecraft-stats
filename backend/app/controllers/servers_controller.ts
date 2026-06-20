import Category from '#models/category'
import ServerStat from '#models/server_stat'
import ServerPolicy from '#policies/server_policy'
import { CreateServerValidator, UpdateServerValidator } from '#validators/server'
import type { HttpContext } from '@adonisjs/core/http'
import {
  INTERACTIVE_PING_TIMEOUT,
  isPingPossible,
  pingMinecraftServer,
} from '../../minecraft-ping/minecraft_ping.js'
import type { NormalizedPing } from '../../minecraft-ping/minecraft_ping.js'
import Server from '../models/server.js'
import CacheService from '#services/cache_service'
import StatsService from '#services/stat_service'
import DuplicateDetectionService from '#services/duplicate_detection_service'
import Language from '#models/language'

export default class ServersController {
  /**
   * @listServers
   * @operationId listServers
   * @tag SERVERS
   * @summary List all servers (lightweight)
   * @description Returns a lightweight list of every server, without preloads or stats. Used by the sitemap, ServerSelect dropdown, and the "Monitored servers" counter. Each item contains only the minimal server fields. Publicly accessible.
   * @responseBody 200 - [{"server": {"id": 1, "name": "Hypixel", "address": "mc.hypixel.net", "port": 25565, "image_url": "/images/servers/1.webp", "last_player_count": 42000, "last_stats_at": "2026-05-28T12:00:00.000Z", "created_at": "2025-01-01T00:00:00.000Z", "updated_at": "2026-05-28T12:00:00.000Z"}}]
   */
  async index() {
    // Endpoint léger : pas de préloads (user/categories/growthStat/languages), pas de stats par serveur.
    // Consommé par le sitemap, le ServerSelect et le compteur "Monitored servers" — tous se contentent du
    // {id, name, updatedAt} de chaque serveur. Forme `[{ server }]` conservée pour compat frontend.
    const servers = await Server.query().select(
      'id',
      'name',
      'address',
      'port',
      'type',
      'image_url',
      'last_player_count',
      'last_stats_at',
      'created_at',
      'updated_at'
    )
    return servers.map((server) => ({ server }))
  }

  /**
   * @createServer
   * @operationId createServer
   * @tag SERVERS
   * @summary Create a new server
   * @description Creates a new Minecraft server entry owned by the authenticated user. The controller first performs an interactive ping that doubles as a reachability check and as the source for duplicate-detection fingerprints (favicon, MOTD, version). If the server cannot be reached the request is rejected with 400. If the fingerprint matches an existing server the request is rejected with 409 and includes the duplicate metadata. Requires authentication.
   * @requestBody <CreateServerValidator>
   * @responseBody 200 - <Server>
   * @responseBody 400 - {"message": "Server is not reachable"}
   * @responseBody 401 - {"message": "Unauthorized"}
   * @responseBody 409 - {"message": "This server appears to already be listed on Minecraft Stats.", "existingServer": {"id": 1, "name": "Hypixel"}, "score": 95, "matchedSignals": ["faviconHash", "motdHash"]}
   * @responseBody 422 - {"errors": [{"message": "Validation failed", "field": "address"}]}
   */
  async store({ request, auth, response }: HttpContext) {
    const data = request.only([
      'name',
      'address',
      'port',
      'type',
      'imageUrl',
      'categories',
      'languages',
    ])
    const user = auth.user
    if (!user) {
      return response.unauthorized({ message: 'Unauthorized' })
    }

    const validatedData = await CreateServerValidator.validate(data)
    const type = validatedData.type ?? 'java'

    // Ping interactif : sert à la fois de test de joignabilité ET de source
    // pour les empreintes de détection de doublon (favicon, MOTD, version).
    let pingData: NormalizedPing | null = null
    try {
      pingData = await pingMinecraftServer(
        type,
        validatedData.address,
        validatedData.port,
        INTERACTIVE_PING_TIMEOUT
      )
    } catch {
      pingData = null
    }
    if (!pingData) {
      return response.badRequest({ message: 'Server is not reachable' })
    }

    // Détection de doublon : un même serveur listé sous plusieurs adresses
    // (play./mc./IP brute). Lookups indexés — cf. DuplicateDetectionService.
    const fingerprint = await DuplicateDetectionService.fingerprint(
      validatedData.address,
      validatedData.port,
      pingData
    )
    const duplicate = await DuplicateDetectionService.findDuplicate(fingerprint)
    if (duplicate) {
      return response.conflict({
        message: 'This server appears to already be listed on Minecraft Stats.',
        existingServer: { id: duplicate.server.id, name: duplicate.server.name },
        score: duplicate.score,
        matchedSignals: duplicate.signals,
      })
    }

    const { categories, languages, ...dataToCreate } = validatedData

    const server = await Server.create({
      ...dataToCreate,
      type,
      version: fingerprint.version,
      faviconHash: fingerprint.faviconHash,
      resolvedEndpoint: fingerprint.resolvedEndpoint,
      motdHash: fingerprint.motdHash,
    })

    const categoriesToAttach = await Promise.all(
      categories.map((name) => Category.findBy('name', name))
    )

    await server.related('categories').attach(categoriesToAttach.flatMap((c) => (c ? [c.id] : [])))

    const languagesToAttach = await Promise.all(
      languages.map((code) => Language.findBy('code', code))
    )

    await server.related('languages').attach(languagesToAttach.flatMap((l) => (l ? [l.id] : [])))

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

  /**
   * @showServer
   * @operationId showServer
   * @tag SERVERS
   * @summary Get a single server by id
   * @description Returns a single server with its preloaded categories, languages, growthStat, and the most recent ServerStat snapshot. Publicly accessible.
   * @paramPath id - The server id - @type(number) @example(134) @required
   * @responseBody 200 - {"server": "<Server>", "stats": ["<ServerStat>"], "categories": ["<Category>"], "growthStat": "<ServerGrowthStat>"}
   * @responseBody 404 - {"message": "Server not found"}
   */
  async show({ params, response }: HttpContext) {
    let server = await Server.query()
      .where('id', params.id)
      .preload('user', (userQuery) => userQuery.select('id', 'username', 'avatarUrl'))
      .preload('growthStat')
      .preload('categories')
      .preload('languages')
      .first()
    if (!server) return response.notFound({ message: 'Server not found' })
    const stats = await this.getActualStats(server)
    return { server, stats, categories: server.categories, growthStat: server.growthStat }
  }

  /**
   * @updateServer
   * @operationId updateServer
   * @tag SERVERS
   * @summary Update an existing server
   * @description Updates a server owned by the authenticated user. Re-pings the server with the new (or current) address/port to confirm reachability before persisting changes. Categories and languages, when provided, are synced (replace semantics). Requires authentication and ownership.
   * @paramPath id - The server id - @type(number) @example(134) @required
   * @requestBody <UpdateServerValidator>
   * @responseBody 200 - <Server>
   * @responseBody 400 - {"message": "Server is not reachable"}
   * @responseBody 403 - {"message": "Unauthorized"}
   * @responseBody 404 - {"message": "Row not found"}
   * @responseBody 422 - {"errors": [{"message": "Validation failed", "field": "port"}]}
   */
  async update({ params, request, response, bouncer }: HttpContext) {
    const data = request.only([
      'name',
      'address',
      'port',
      'type',
      'imageUrl',
      'categories',
      'languages',
    ])
    const validatedData = await UpdateServerValidator.validate(data)
    const server = await Server.findByOrFail('id', params.id)
    if (await bouncer.with(ServerPolicy).denies('update', server)) {
      return response.forbidden({ message: 'Unauthorized' })
    }

    const { categories, languages, ...dataToUpdate } = validatedData

    const successPing = await isPingPossible(
      validatedData.type ?? server.type,
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

      await server.related('categories').sync(categoriesToAttach.flatMap((c) => (c ? [c.id] : [])))
    }

    if (languages) {
      const languagesToAttach = await Promise.all(
        languages.map((code) => Language.findBy('code', code))
      )

      await server.related('languages').sync(languagesToAttach.flatMap((l) => (l ? [l.id] : [])))
    }

    return server.merge(dataToUpdate).save()
  }

  /**
   * @deleteServer
   * @operationId deleteServer
   * @tag SERVERS
   * @summary Delete a server
   * @description Permanently deletes a server owned by the authenticated user. Requires authentication and ownership.
   * @paramPath id - The server id - @type(number) @example(134) @required
   * @responseBody 204 - No content
   * @responseBody 403 - {"message": "Unauthorized"}
   * @responseBody 404 - {"message": "Server not found"}
   */
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

  /**
   * @paginateServers
   * @operationId paginateServers
   * @tag SERVERS
   * @summary Paginated list of servers with 24h stats
   * @description Returns a paginated list of servers with their preloaded categories, languages, growthStat, and a stats array containing hourly buckets over the last 24 hours plus the latest live snapshot prepended. Servers whose last ping is older than 30 minutes are demoted in the ordering (treated as stale) regardless of their last player count. Responses are cached (60s by default, 30s when the `ids` filter is used); pass `nocache=1` to bypass the cache (effective in non-production environments or for admin users). The `ids` query parameter restricts results to a specific set of server ids (used by the favorites section). It accepts either a CSV string (`?ids=1,2,3`) or a repeated query param (`?ids=1&ids=2&ids=3`); values are parsed as positive integers, deduplicated, and capped at MAX_IDS=20 (additional ids are silently dropped). When `ids` is provided but yields zero valid ids after parsing, an empty page is returned instead of falling back to the global ranking. Publicly accessible.
   * @paramQuery page - Page number (1-indexed) - @type(number) @example(1)
   * @paramQuery limit - Items per page - @type(number) @example(10)
   * @paramQuery categoryIds - CSV of category ids to filter on (e.g. "1,2,3") - @type(string) @example(1,3,5)
   * @paramQuery languageIds - CSV of language ids to filter on (e.g. "1,2,3") - @type(string) @example(1,2)
   * @paramQuery search - Case-insensitive substring matched against name and address - @type(string) @example(hypixel)
   * @paramQuery type - Filter by server edition. Any other value is ignored. - @type(string) @enum(java, bedrock)
   * @paramQuery ids - Restrict to specific server ids. Accepts CSV ("1,2,3") OR repeated param ("ids=1&ids=2"). Positive integers only, deduplicated, max 20 ids (extras dropped). Used for the favorites section. - @type(string) @example(12,34,56)
   * @paramQuery nocache - Set to "1" to bypass the response cache. Only honored in non-production environments or for admin users. - @type(string) @enum(1)
   * @responseBody 200 - {"data": [{"server": "<Server>", "stats": [{"serverId": 1, "createdAt": "2026-05-28T12:00:00.000Z", "playerCount": 1200, "maxCount": 5000}], "categories": ["<Category>"], "growthStat": "<ServerGrowthStat>"}], "meta": {"total": 100, "perPage": 10, "currentPage": 1, "lastPage": 10, "firstPage": 1}}
   */
  async paginate(ctx: HttpContext) {
    const { request } = ctx
    const page = Math.max(1, Number.parseInt(request.input('page', 1), 10) || 1)
    const limit = Math.min(100, Math.max(1, Number.parseInt(request.input('limit', 10), 10) || 10))
    const categoryIds = request.input('categoryIds')
    const languageIds = request.input('languageIds')
    const search = request.input('search', '')
    const idsParam = request.input('ids')
    // Édition (java/bedrock). Toute autre valeur est ignorée (pas de filtre).
    const typeParam = request.input('type')
    const type = typeParam === 'java' || typeParam === 'bedrock' ? typeParam : undefined

    // `ids` restreint la requête à une liste explicite de serveurs — utilisé par
    // la section "favoris", qui affiche les favoris de l'utilisateur dans leur
    // propre bloc, indépendamment de la pagination classique du classement.
    const ids = this.parseIdList(idsParam)

    // Garde-fou : `ids` fourni mais rien d'exploitable après parsing → set vide.
    // Sans ça, runPaginateQuery sauterait le `whereIn` et renverrait le
    // classement global, que le client prendrait à tort pour des favoris.
    const hasIdsParam = idsParam !== undefined && idsParam !== null && idsParam !== ''
    if (hasIdsParam && ids.length === 0) {
      return {
        data: [],
        meta: { total: 0, perPage: Number(limit), currentPage: 1, lastPage: 1, firstPage: 1 },
      }
    }

    const cacheKey = CacheService.hashParams('paginate', {
      page,
      limit,
      categoryIds,
      languageIds,
      search,
      type,
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
          type,
          ids,
        })
        return result
      },
      { bypass }
    )
  }

  private static readonly MAX_IDS = 20

  /**
   * Normalise le paramètre `ids` en liste d'entiers positifs, dédupliquée et
   * plafonnée à MAX_IDS. AdonisJS (qs) parse `?ids=1` en STRING "1" mais
   * `?ids=1,2` (virgule) ET `?ids=1&ids=2` en ARRAY. On accepte donc string ET
   * array — sinon la requête favoris dégénère en classement global dès qu'il y
   * a 2+ IDs (cf. FavoritesSection côté frontend).
   */
  private parseIdList(raw: unknown): number[] {
    const tokens: string[] = Array.isArray(raw)
      ? raw.flatMap((v) => String(v).split(','))
      : typeof raw === 'string'
        ? raw.split(',')
        : []

    const ids: number[] = []
    const seen = new Set<number>()
    for (const part of tokens) {
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
    type?: 'java' | 'bedrock'
    ids: number[]
  }) {
    const { page, limit, categoryIds, languageIds, search, type, ids } = opts

    // Ordering : on ne classe par `last_player_count` que si le dernier ping
    // réussi est récent (< 30 min, soit ~3 cycles de 10 min). Sinon le serveur
    // est traité comme "stale" et descend en bas, peu importe son ancien count.
    // Évite qu'un serveur down depuis des jours reste top juste parce qu'il
    // avait 500 joueurs avant de tomber.
    let query = Server.query()
      .preload('user', (userQuery) => userQuery.select('id', 'username', 'avatarUrl'))
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

    if (type) {
      query = query.where('type', type)
    }

    if (categoryIds) {
      try {
        const categoryIdList = categoryIds
          .split(',')
          .map((id: string) => Number.parseInt(id.trim(), 10))
          .filter((id: number) => !Number.isNaN(id))
        if (categoryIdList.length > 0) {
          query = query.whereHas('categories', (builder) => {
            builder.whereIn('categories.id', categoryIdList)
          })
        }
      } catch (error) {
        console.error('Error processing categoryIds:', error)
      }
    }

    if (languageIds) {
      try {
        const languageIdList = languageIds
          .split(',')
          .map((id: string) => Number.parseInt(id.trim(), 10))
          .filter((id: number) => !Number.isNaN(id))
        if (languageIdList.length > 0) {
          query = query.whereHas('languages', (builder) => {
            builder.whereIn('languages.id', languageIdList)
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
