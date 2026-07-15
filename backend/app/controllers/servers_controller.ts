import ServerStat from '#models/server_stat'
import ServerPolicy from '#policies/server_policy'
import { CreateServerValidator, UpdateServerValidator } from '#validators/server'
import type { HttpContext } from '@adonisjs/core/http'
import Server from '../models/server.js'
import CacheService from '#services/cache_service'
import ServerListingService from '#services/server_listing_service'
import ServerRegistrationService from '#services/server_registration_service'

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
   * @mine
   * @operationId listMyServers
   * @tag SERVERS
   * @summary List the authenticated user's servers
   * @description Returns every server owned by the authenticated user, with preloaded categories, languages and growthStat, ordered by newest first. Used by the account "My Servers" dashboard. Requires authentication.
   * @responseBody 200 - [{"server": "<Server>", "categories": ["<Category>"], "growthStat": "<ServerGrowthStat>"}]
   * @responseBody 401 - {"message": "Unauthorized"}
   */
  async mine({ auth, response, i18n }: HttpContext) {
    const user = auth.user
    if (!user) {
      return response.unauthorized({ message: i18n.t('messages.servers.unauthorized') })
    }

    const servers = await Server.query()
      .where('user_id', user.id)
      .preload('categories')
      .preload('languages')
      .preload('growthStat')
      .orderBy('created_at', 'desc')

    return servers.map((server) => ({
      server,
      categories: server.categories,
      growthStat: server.growthStat,
    }))
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
  async store({ request, auth, response, i18n }: HttpContext) {
    const data = request.only([
      'name',
      'address',
      'port',
      'type',
      'imageUrl',
      'website',
      'categories',
      'languages',
    ])
    const user = auth.user
    if (!user) {
      return response.unauthorized({ message: i18n.t('messages.servers.unauthorized') })
    }

    const validatedData = await CreateServerValidator.validate(data)

    // Orchestration ping → fingerprint → doublon → création → taxonomie dans le
    // service (testable sans HttpContext). Le controller ne fait que mapper le
    // résultat sur la réponse HTTP.
    const result = await ServerRegistrationService.register(validatedData, user)
    switch (result.status) {
      case 'unreachable':
        return response.badRequest({ message: i18n.t('messages.servers.notReachable') })
      case 'duplicate':
        return response.conflict({
          message: i18n.t('messages.servers.duplicate'),
          existingServer: {
            id: result.duplicate.server.id,
            name: result.duplicate.server.name,
          },
          score: result.duplicate.score,
          matchedSignals: result.duplicate.signals,
        })
      case 'created':
        return result.server
    }
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
  async show({ params, response, i18n }: HttpContext) {
    let server = await Server.query()
      .where('id', params.id)
      .preload('user', (userQuery) => userQuery.select('id', 'username', 'avatarUrl'))
      .preload('growthStat')
      .preload('categories')
      .preload('languages')
      .first()
    if (!server) return response.notFound({ message: i18n.t('messages.servers.notFound') })
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
  async update({ params, request, response, bouncer, i18n }: HttpContext) {
    const data = request.only([
      'name',
      'address',
      'port',
      'type',
      'imageUrl',
      'website',
      'categories',
      'languages',
    ])
    const validatedData = await UpdateServerValidator.validate(data)
    const server = await Server.findByOrFail('id', params.id)
    if (await bouncer.with(ServerPolicy).denies('update', server)) {
      return response.forbidden({ message: i18n.t('messages.servers.unauthorized') })
    }

    // Re-ping de joignabilité + sync taxonomie + persistance dans le service.
    const result = await ServerRegistrationService.update(server, validatedData)
    if (result.status === 'unreachable') {
      return response.badRequest({ message: i18n.t('messages.servers.notReachable') })
    }
    return result.server
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
  async destroy({ params, response, bouncer, i18n }: HttpContext) {
    const server = await Server.find(params.id)
    if (!server) {
      return response.notFound({ message: i18n.t('messages.servers.notFound') })
    }
    if (await bouncer.with(ServerPolicy).denies('destroy', server)) {
      return response.forbidden({ message: i18n.t('messages.servers.unauthorized') })
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
   * @paramQuery sort - Ranking order. "players" (default) = most current players online (stale servers demoted); "trending" = highest weekly player growth; "peak" = highest all-time peak player count; "newest" = most recently added; "votes" = most votes in the current month. Any other value falls back to "players". Powers the /rankings leaderboards. - @type(string) @enum(players, trending, peak, newest, votes)
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

    // Tri du classement (page /rankings). Whitelist stricte, fallback 'players'
    // = ordre historique par joueurs actuels.
    const sortParam = request.input('sort')
    const sort = ServersController.RANKING_SORTS.includes(sortParam) ? sortParam : 'players'

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
      sort,
      ids: ids.join(','),
    })

    const bypass = CacheService.bypassAllowed(ctx)

    // TTL réduit quand la requête est personnalisée (favoris) — la fragmentation
    // cache coûte moins en stockage, et les stats changent toutes les 10 min.
    const ttl = ids.length > 0 ? 30 : 60

    return CacheService.cacheOrFetch(
      cacheKey,
      ttl,
      async () => {
        const result = await ServerListingService.paginate({
          page,
          limit,
          categoryIds,
          languageIds,
          search,
          type,
          sort,
          ids,
        })
        return result
      },
      { bypass }
    )
  }

  private static readonly MAX_IDS = 20

  // Valeurs de tri acceptées pour le classement (hors défaut 'players').
  private static readonly RANKING_SORTS = ['trending', 'peak', 'newest', 'votes'] as const

  /**
   * Découpe le paramètre `ids` brut en tokens. AdonisJS (qs) parse `?ids=1` en
   * STRING mais `?ids=1,2` ET `?ids=1&ids=2` en ARRAY — on accepte donc les deux.
   */
  private static toTokens(raw: unknown): string[] {
    if (Array.isArray(raw)) return raw.flatMap((v) => String(v).split(','))
    if (typeof raw === 'string') return raw.split(',')
    return []
  }

  /**
   * Normalise le paramètre `ids` en liste d'entiers positifs, dédupliquée et
   * plafonnée à MAX_IDS. AdonisJS (qs) parse `?ids=1` en STRING "1" mais
   * `?ids=1,2` (virgule) ET `?ids=1&ids=2` en ARRAY. On accepte donc string ET
   * array — sinon la requête favoris dégénère en classement global dès qu'il y
   * a 2+ IDs (cf. FavoritesSection côté frontend).
   */
  private parseIdList(raw: unknown): number[] {
    const tokens = ServersController.toTokens(raw)

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
}
