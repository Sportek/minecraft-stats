import Server from '#models/server'
import StatsService from '#services/stat_service'
import db from '@adonisjs/lucid/services/db'
import { DateTime } from 'luxon'

export default class ServerListingService {
  /**
   * Seuil de joueurs actuels sous lequel un serveur est exclu du classement
   * "tendance" : évite qu'un micro-serveur avec un pourcentage de croissance
   * énorme mais dérisoire en absolu ne domine le classement.
   */
  private static readonly TRENDING_MIN_PLAYERS = 75

  /**
   * Rétrogradation des serveurs dont un admin a confirmé qu'ils gonflent leurs
   * connectés (cf. BoostDetectionService). Ils sont relégués en fin de classement,
   * pas retirés : ils restent trouvables par recherche et par lien direct, et un
   * verdict se révise. Ne s'applique qu'aux tris fondés sur le nombre de joueurs —
   * « nouveautés » et « votes » ne sont pas faussés par un compteur gonflé.
   */
  private static readonly BOOST_DEMOTION_SQL = `CASE WHEN servers.boost_status = 'boosting' THEN 1 ELSE 0 END ASC`

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
    sort?: 'players' | 'trending' | 'peak' | 'newest' | 'votes'
    ids: number[]
  }) {
    const { page, limit, categoryIds, languageIds, search, type, ids } = opts
    const sort = opts.sort ?? 'players'

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

    // Tri du classement selon `sort`. Par défaut ('players'), l'ordre historique
    // stale-aware : on ne classe par `last_player_count` que si le dernier ping
    // réussi est récent (< 30 min). Les autres tris alimentent la page /rankings.
    if (sort === 'trending') {
      // Serveurs qui montent : croissance hebdo la plus forte. On JOIN la table
      // de croissance (relation hasOne, 1:1 → pas de multiplication de lignes) et
      // on ne garde que les croissances strictement positives. `select('servers.*')`
      // est indispensable : Server.query() émet un `select *` non qualifié, sans
      // ça les colonnes de server_growth_stats "bleedent" sur le modèle.
      //
      // Seuil minimum de joueurs : un petit serveur qui passe de 1 à 5 joueurs
      // affiche +400 % et trusterait le classement. On exclut donc les serveurs
      // sous TRENDING_MIN_PLAYERS pour que "tendance" reflète une vraie traction.
      query = query
        .select('servers.*')
        .leftJoin('server_growth_stats', 'server_growth_stats.server_id', 'servers.id')
        .whereNotNull('server_growth_stats.weekly_growth')
        .where('server_growth_stats.weekly_growth', '>', 0)
        .where('servers.last_player_count', '>=', ServerListingService.TRENDING_MIN_PLAYERS)
        .orderByRaw(ServerListingService.BOOST_DEMOTION_SQL)
        .orderBy('server_growth_stats.weekly_growth', 'desc')
    } else if (sort === 'peak') {
      // Records all-time. Postgres trie NULLS-first en DESC → NULLS LAST explicite
      // pour reléguer les serveurs sans pic connu en bas.
      query = query
        .orderByRaw(ServerListingService.BOOST_DEMOTION_SQL)
        .orderByRaw('peak_player_count DESC NULLS LAST')
    } else if (sort === 'newest') {
      query = query.orderBy('created_at', 'desc')
    } else if (sort === 'votes') {
      // Classement mensuel : on trie sur le nombre de votes du mois courant via un
      // sous-select corrélé sélectionné comme colonne (lu via $extras — même valeur
      // pour le tri et l'affichage, une seule passe). Pas de JOIN — évite tout
      // risque de multiplication de lignes ; le coût est absorbé par le cache du
      // classement (TTL 10 min). La borne du mois est calculée côté Node (luxon),
      // comme VoteService.monthlyCount : un date_trunc PG utiliserait le fuseau de
      // la session DB et pourrait diverger autour du changement de mois.
      const monthStart = DateTime.now().startOf('month').toSQL()!
      query = query
        .select('servers.*')
        .select(
          db.raw(
            `(
              SELECT count(*) FROM server_votes sv
              WHERE sv.server_id = servers.id
                AND sv.created_at >= ?
            ) as monthly_vote_count`,
            [monthStart]
          )
        )
        .orderByRaw('monthly_vote_count DESC')
    } else {
      query = query
        .orderByRaw(ServerListingService.BOOST_DEMOTION_SQL)
        .orderByRaw(
          `CASE
            WHEN last_stats_at > now() - interval '30 minutes'
              THEN COALESCE(last_player_count, -1)
            ELSE -1
           END DESC`
        )
        .orderBy('last_stats_at', 'desc')
    }

    // Départage stable : évite qu'un serveur "saute" d'une page à l'autre quand
    // plusieurs partagent la même valeur de tri (fréquent sur peak/newest).
    query = query.orderBy('servers.id', 'asc')

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
        // Colonne calculée du tri 'votes' ; absente (donc 0) pour les autres tris.
        monthlyVoteCount: Number(server.$extras.monthly_vote_count ?? 0),
      }
    })

    return {
      data: serversWithStats,
      meta: servers.getMeta(),
    }
  }
}
