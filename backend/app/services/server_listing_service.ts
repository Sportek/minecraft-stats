import Server from '#models/server'
import StatsService from '#services/stat_service'

export default class ServerListingService {
  /**
   * Construit la requête paginée du classement des serveurs à partir de
   * paramètres déjà parsés par le contrôleur, puis transforme chaque ligne
   * en y attachant ses stats (buckets horaires sur 24 h + dernier snapshot live).
   */
  static async paginate(opts: {
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
      const categoryIdList = categoryIds
        .split(',')
        .map((id: string) => Number.parseInt(id.trim(), 10))
        .filter((id: number) => !Number.isNaN(id))
      if (categoryIdList.length > 0) {
        query = query.whereHas('categories', (builder) => {
          builder.whereIn('categories.id', categoryIdList)
        })
      }
    }

    if (languageIds) {
      const languageIdList = languageIds
        .split(',')
        .map((id: string) => Number.parseInt(id.trim(), 10))
        .filter((id: number) => !Number.isNaN(id))
      if (languageIdList.length > 0) {
        query = query.whereHas('languages', (builder) => {
          builder.whereIn('languages.id', languageIdList)
        })
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
