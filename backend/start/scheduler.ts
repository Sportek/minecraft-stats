import Server from '#models/server'
import { snapshotTrafficDay } from '#services/analytics_counters'
import DuplicateDetectionService from '#services/duplicate_detection_service'
import ImageStorageService from '#services/image_storage_service'
import StatsService from '#services/stat_service'
import logger from '@adonisjs/core/services/logger'
import Database from '@adonisjs/lucid/services/db'
import redis from '@adonisjs/redis/services/main'
import scheduler from 'adonisjs-scheduler/services/main'
import { DateTime } from 'luxon'
import pLimit from 'p-limit'
import { DEFAULT_PING_TIMEOUT, pingMinecraftServer } from '../minecraft-ping/minecraft_ping.js'

type ServerStatRow = {
  server_id: number
  player_count: number | null
  max_count: number | null
  created_at: Date
}

/**
 * Concurrence du pinger (Niveau 1.1 de P.5.1).
 * 20 = bon compromis : on sature le réseau sortant sans dépasser le pool DB
 * (les UPDATE individuels de `servers` se font à concurrence du même nombre).
 */
const PING_CONCURRENCY = 20

/**
 * Cadences (Niveau 2.1 — cadence différentielle).
 */
const CADENCE = {
  hot: { minutes: 5 },
  normal: { minutes: 10 },
  recentFailure: { minutes: 10 },
  cold: { minutes: 30 },
  dead: { hours: 6 },
}
const HOT_THRESHOLD_PLAYERS = 100

/**
 * TTL du lock Redis "ping en cours" (Niveau 2.3).
 * Garantit qu'un ping abandonné/crashé ne bloque pas le serveur > 60s.
 */
const PING_LOCK_TTL_SECONDS = 60

/**
 * Calcule quand on va re-pinger un serveur, en fonction du résultat du ping et de
 * son historique. Voir CADENCE ci-dessus.
 */
function computeNextPingAt(server: Server, success: boolean): DateTime {
  const now = DateTime.now()

  if (success) {
    if ((server.lastPlayerCount ?? 0) > HOT_THRESHOLD_PLAYERS) {
      return now.plus(CADENCE.hot)
    }
    return now.plus(CADENCE.normal)
  }

  // Échec — on grade en fonction de l'ancienneté du dernier succès.
  const lastSuccess = server.lastStatsAt
  if (!lastSuccess) {
    // Jamais pingué avec succès → on le considère "cold" d'emblée (pas d'acharnement).
    return now.plus(CADENCE.cold)
  }
  const hoursSince = now.diff(lastSuccess, 'hours').hours
  if (hoursSince < 1) return now.plus(CADENCE.recentFailure)
  if (hoursSince < 6) return now.plus(CADENCE.cold)
  return now.plus(CADENCE.dead)
}

/**
 * Verrou Redis (NX + TTL) pour empêcher qu'un même serveur soit pingué deux fois
 * simultanément (Niveau 2.3). Si Redis est indisponible, on dégrade gracieusement
 * (on ping quand même — le lock est un confort, pas une condition de sûreté).
 */
async function tryAcquirePingLock(serverId: number): Promise<boolean> {
  const key = `ping:lock:${serverId}`
  try {
    const result = await redis.set(key, '1', 'EX', PING_LOCK_TTL_SECONDS, 'NX')
    return result === 'OK'
  } catch (error) {
    logger.warn(
      { serverId, err: error instanceof Error ? error.message : String(error) },
      'PING_LOCK: redis unavailable, proceeding without lock'
    )
    return true
  }
}

async function releasePingLock(serverId: number): Promise<void> {
  const key = `ping:lock:${serverId}`
  try {
    await redis.del(key)
  } catch {
    // Pas grave — le TTL nettoiera le lock.
  }
}

/**
 * Empreinte du favicon : sert à la fois à la détection de doublon et à décider
 * s'il faut réécrire l'image. On ne réuploade sur le stockage (S3 en prod) que si
 * le favicon a réellement changé — ou s'il n'existe pas encore. Réécrire des
 * octets identiques à chaque ping ne ferait que générer des PUT S3 inutiles (les
 * favicons ne changent quasi jamais), ce qui a dominé la facture AWS. Le hash
 * suffit donc à détecter les vrais changements.
 *
 * Mute le serveur sans le sauvegarder — l'appelant persiste.
 */
async function storeFaviconIfChanged(server: Server, favicon?: string): Promise<void> {
  if (!favicon) return

  const faviconHash = DuplicateDetectionService.hashFavicon(favicon)
  if (server.imageUrl && faviconHash === server.faviconHash) return

  try {
    server.imageUrl = await ImageStorageService.storeServerFavicon(server.id, favicon)
    server.faviconHash = faviconHash
  } catch (error) {
    // On n'avance pas faviconHash : le prochain ping retentera l'upload.
    logger.warn(
      { serverId: server.id, err: (error as Error).message },
      'SCHEDULER: image processing failed'
    )
  }
}

/**
 * Met à jour les informations du serveur et retourne la stat à insérer.
 * - 1 seule tentative (Niveau 1.2/1.3 — pas de retry sur les pings périodiques)
 * - Timeout court (DEFAULT_PING_TIMEOUT côté lib)
 * - Petit jitter pour étaler les départs concurrents (Niveau 1.4)
 * - Met à jour `next_ping_at` même en cas d'échec
 */
async function updateServerInfo(server: Server, overwriteImage = false): Promise<ServerStatRow> {
  // Petit jitter (0-200ms) pour éviter que tous les pings concurrents partent au
  // même millième de seconde — étale les pics de bande passante et de DNS lookups.
  await new Promise((resolve) => setTimeout(resolve, Math.random() * 200))

  let playerOnline: number | null = null
  let maxPlayer: number | null = null
  let success = false
  const createdAt = new Date()

  try {
    // `overwriteImage` marque le balayage 6h : c'est là qu'on peut se permettre un
    // appel API dédié par serveur chez un hébergeur mutualisé, seul moyen d'obtenir
    // son favicon (l'instantané mutualisé du cycle 5 min ne l'expose pas).
    const data = await pingMinecraftServer(
      server.type,
      server.address,
      server.port,
      DEFAULT_PING_TIMEOUT,
      { detailed: overwriteImage }
    )
    if (data) {
      await storeFaviconIfChanged(server, data.favicon)

      playerOnline = data.players?.online ?? 0
      maxPlayer = data.players?.max ?? 0

      // Absente quand les stats viennent d'une API d'hébergeur : on garde la connue.
      if (data.version) server.version = data.version.name
      server.lastPlayerCount = playerOnline
      server.lastMaxCount = maxPlayer
      server.lastStatsAt = DateTime.fromJSDate(createdAt)
      server.lastOnlineAt = DateTime.fromJSDate(createdAt)

      // Pic all-time : on ne le déplace que vers le haut.
      if (playerOnline > (server.peakPlayerCount ?? 0)) {
        server.peakPlayerCount = playerOnline
        server.peakPlayerAt = DateTime.fromJSDate(createdAt)
      }

      // Rafraîchit les empreintes de détection de doublon. Le favicon est déjà
      // haché plus haut ; le MOTD est recalculé à chaque ping (il bouge souvent) ;
      // l'endpoint DNS, qui ne change quasi jamais, n'est re-résolu que lors du
      // job 6h (overwriteImage).
      server.motdHash = DuplicateDetectionService.hashMotd(data.description)
      if (overwriteImage) {
        server.resolvedEndpoint = await DuplicateDetectionService.resolveEndpoint(
          server.address,
          server.port
        )
      }

      success = true
    }
  } catch (error) {
    logger.warn(
      `SCHEDULER: ping failed for ${server.name} (${server.address}:${server.port}): ${error instanceof Error ? error.message : String(error)}`
    )
  }

  // Mettre à jour `next_ping_at` même en cas d'échec — sinon le serveur resterait
  // éligible à chaque tick et on le pingerait en boucle.
  server.nextPingAt = computeNextPingAt(server, success)
  await server.save()

  return {
    server_id: server.id,
    player_count: playerOnline,
    max_count: maxPlayer,
    created_at: createdAt,
  }
}

/**
 * Wrapper qui acquiert le lock Redis avant de pinger. Retourne null si un autre
 * pinger a déjà le lock pour ce serveur.
 */
async function pingWithLock(
  server: Server,
  overwriteImage: boolean
): Promise<ServerStatRow | null> {
  const acquired = await tryAcquirePingLock(server.id)
  if (!acquired) {
    logger.info(`SCHEDULER: skip server ${server.id} — ping already in flight`)
    return null
  }
  try {
    return await updateServerInfo(server, overwriteImage)
  } finally {
    await releasePingLock(server.id)
  }
}

/**
 * Insère un lot de stats en une seule requête `server_stats`.
 */
async function flushStatsBatch(batch: ServerStatRow[]): Promise<void> {
  if (batch.length === 0) return
  await Database.table('server_stats').multiInsert(batch)
  logger.info(`SCHEDULER: bulk-inserted ${batch.length} server_stats rows`)
}

/**
 * Ping tous les serveurs dont `next_ping_at` est passé (ou NULL = jamais pingué).
 * Parallélisme borné par `PING_CONCURRENCY`. Verrou Redis par serveur (P.5.1 N.2.3).
 *
 * @param overwriteImage - Force la régénération de l'image (utilisé par le job 6h)
 */
async function pingDueServers(overwriteImage = false): Promise<void> {
  const start = Date.now()

  const due = await Server.query()
    .where((builder) => {
      builder.whereNull('next_ping_at').orWhere('next_ping_at', '<=', DateTime.now().toSQL())
    })
    .orderBy('next_ping_at', 'asc')

  if (due.length === 0) {
    logger.debug('SCHEDULER: no servers due for ping')
    return
  }

  const limit = pLimit(PING_CONCURRENCY)
  const results = await Promise.all(
    due.map((server) => limit(() => pingWithLock(server, overwriteImage)))
  )

  const statsBatch = results.filter((row): row is ServerStatRow => row !== null)
  await flushStatsBatch(statsBatch)

  logger.info(
    `SCHEDULER: pingDueServers done in ${Date.now() - start}ms — ${statsBatch.length}/${due.length} pinged`
  )
}

// ============================================================================
// Planification
// ============================================================================

// Ping périodique — tick toutes les 5 min, ne ping que les serveurs dus.
// Concrètement : Hot servers pingés à chaque tick, Normal toutes les 2 ticks,
// Cold toutes les 6, Dead toutes les ~72.
scheduler
  .call(async () => {
    try {
      await pingDueServers(false)
    } catch (error) {
      logger.error(
        { err: error instanceof Error ? error.message : String(error) },
        'SCHEDULER: pingDueServers failed'
      )
    }
  })
  .everyFiveMinutes()

// Balayage complet toutes les 6h sur TOUS les serveurs (pas seulement les dus).
// Re-résout l'endpoint DNS (overwriteImage) et rattrape un favicon changé sur un
// serveur "dead" rarement pingué. Les favicons ne sont réécrits que si leur hash
// a changé (voir updateServerInfo), donc ce job ne génère plus de PUT S3 inutiles.
scheduler
  .call(async () => {
    const start = Date.now()
    const servers = await Server.all()
    if (servers.length === 0) return

    const limit = pLimit(PING_CONCURRENCY)
    const results = await Promise.all(
      servers.map((server) => limit(() => pingWithLock(server, true)))
    )

    const statsBatch = results.filter((row): row is ServerStatRow => row !== null)
    await flushStatsBatch(statsBatch)

    logger.info(
      `SCHEDULER: favicon refresh job done in ${Date.now() - start}ms — ${statsBatch.length}/${servers.length} pinged`
    )
  })
  .everySixHours()

scheduler
  .call(async () => {
    const start = Date.now()
    const countResult = await Server.query().count('* as total')
    const serverCount = countResult[0].$extras.total
    await StatsService.calculateAndStoreGrowthStats()
    logger.info(
      `SCHEDULER: growth_stats job completed in ${Date.now() - start}ms for ${serverCount} servers`
    )
  })
  .everySixHours()

// Agrégation horaire des stats brutes vers server_stats_hourly (P.4.1).
// Tourne toutes les heures et upsert l'heure qui vient juste de se terminer.
scheduler
  .call(async () => {
    const start = Date.now()
    const result = await Database.rawQuery(`
      INSERT INTO server_stats_hourly (server_id, hour, avg_player_count, peak_player_count, min_player_count, max_slot_count, samples_count)
      SELECT
        server_id,
        date_trunc('hour', created_at) AS hour,
        ROUND(AVG(player_count))::int AS avg_player_count,
        MAX(player_count)::int AS peak_player_count,
        MIN(player_count)::int AS min_player_count,
        MAX(max_count) AS max_slot_count,
        COUNT(*)::int AS samples_count
      FROM server_stats
      WHERE created_at >= date_trunc('hour', now() - interval '1 hour')
        AND created_at <  date_trunc('hour', now())
        AND server_id IS NOT NULL
      GROUP BY server_id, hour
      ON CONFLICT (server_id, hour) DO UPDATE SET
        avg_player_count  = EXCLUDED.avg_player_count,
        peak_player_count = EXCLUDED.peak_player_count,
        min_player_count  = EXCLUDED.min_player_count,
        max_slot_count    = EXCLUDED.max_slot_count,
        samples_count     = EXCLUDED.samples_count
    `)
    const rowCount = result.rowCount ?? 0
    logger.info(
      `SCHEDULER: hourly_stats aggregation completed in ${Date.now() - start}ms (${rowCount} rows upserted)`
    )
  })
  .hourly()

// Palier journalier, agrégé depuis l'horaire (jamais depuis le brut : 24 lignes à
// lire au lieu de 144). Recalcule hier + aujourd'hui à chaque heure — idempotent,
// ce qui rattrape la journée en cours au fil de l'eau sans job de fin de journée.
scheduler
  .call(async () => {
    const start = Date.now()
    const result = await Database.rawQuery(`
      INSERT INTO server_stats_daily (server_id, day, avg_player_count, peak_player_count, min_player_count, max_slot_count, samples_count)
      SELECT
        server_id,
        date_trunc('day', hour) AS day,
        ROUND(
          SUM(avg_player_count::bigint * samples_count)::numeric /
          NULLIF(SUM(samples_count), 0)
        )::int AS avg_player_count,
        MAX(peak_player_count)::int AS peak_player_count,
        MIN(min_player_count)::int AS min_player_count,
        MAX(max_slot_count)::int AS max_slot_count,
        SUM(samples_count)::int AS samples_count
      FROM server_stats_hourly
      WHERE hour >= date_trunc('day', now() - interval '1 day')
      GROUP BY server_id, day
      ON CONFLICT (server_id, day) DO UPDATE SET
        avg_player_count  = EXCLUDED.avg_player_count,
        peak_player_count = EXCLUDED.peak_player_count,
        min_player_count  = EXCLUDED.min_player_count,
        max_slot_count    = EXCLUDED.max_slot_count,
        samples_count     = EXCLUDED.samples_count
    `)
    logger.info(
      `SCHEDULER: daily_stats aggregation completed in ${Date.now() - start}ms (${result.rowCount ?? 0} rows upserted)`
    )
  })
  .hourly()

// Pré-création de la partition du mois suivant (P.4.2).
// No-op si `server_stats` n'est pas une table partitionnée — détecté via pg_class.
scheduler
  .call(async () => {
    const isPartitioned = await Database.rawQuery(`
      SELECT 1 FROM pg_class
       WHERE relname = 'server_stats' AND relkind = 'p'
       LIMIT 1
    `)
    if (isPartitioned.rows.length === 0) {
      logger.debug('SCHEDULER: partition_maintenance — server_stats is not partitioned, skipping')
      return
    }

    await Database.rawQuery(`
      DO $$
      DECLARE
        next_month date := date_trunc('month', now() + interval '1 month')::date;
        month_after date := (date_trunc('month', now() + interval '1 month') + interval '1 month')::date;
        part_name text := format('server_stats_y%sm%s', to_char(next_month, 'YYYY'), to_char(next_month, 'MM'));
      BEGIN
        EXECUTE format(
          'CREATE TABLE IF NOT EXISTS %I PARTITION OF server_stats FOR VALUES FROM (%L) TO (%L)',
          part_name, next_month, month_after
        );
      END $$;
    `)
    logger.info('SCHEDULER: partition_maintenance — ensured next month partition exists')
  })
  .everySixHours()

// ============================================================================
// Analytics first-party
// ============================================================================
// Le trafic et les visiteurs uniques anonymes sont comptés en temps réel dans
// Redis (compteurs + HyperLogLog) — voir `#services/analytics_counters`.

// Snapshot durable des compteurs Redis vers `traffic_daily`, chaque heure, pour
// hier + aujourd'hui. Idempotent (GREATEST sur conflit) : protège l'historique
// d'une recréation du volume Redis ou de l'expiration des clés (TTL ~100 j).
scheduler
  .call(async () => {
    const start = Date.now()
    const today = DateTime.now()
    await snapshotTrafficDay(today.minus({ days: 1 }))
    await snapshotTrafficDay(today)
    logger.info(`SCHEDULER: traffic_daily snapshot completed in ${Date.now() - start}ms`)
  })
  .hourly()

// Agrégation des pages vues vers `page_view_daily`. Recalcule hier + aujourd'hui
// à chaque heure (idempotent) pour rattraper les vues arrivées en retard.
scheduler
  .call(async () => {
    const start = Date.now()
    const result = await Database.rawQuery(`
      INSERT INTO page_view_daily (date, path, views, unique_visitors)
      SELECT created_at::date AS date,
             path,
             count(*)::int AS views,
             count(distinct visitor_id)::int AS unique_visitors
      FROM page_views
      WHERE created_at >= date_trunc('day', now() - interval '1 day')
      GROUP BY created_at::date, path
      ON CONFLICT (date, path) DO UPDATE SET
        views = EXCLUDED.views,
        unique_visitors = EXCLUDED.unique_visitors
    `)
    logger.info(
      `SCHEDULER: page_view_daily aggregation completed in ${Date.now() - start}ms (${result.rowCount ?? 0} rows)`
    )
  })
  .hourly()

// Purge de rétention (RGPD / Loi 25) : les pages vues brutes de plus de 90 jours
// sont supprimées (les agrégats `page_view_daily` sont conservés). On nettoie
// aussi les visiteurs anonymes orphelins, plus vus depuis 90 jours.
scheduler
  .call(async () => {
    const start = Date.now()
    const views = await Database.from('page_views')
      .where('created_at', '<', DateTime.now().minus({ days: 90 }).toSQL())
      .delete()

    const visitors = await Database.from('visitors')
      .where('last_seen_at', '<', DateTime.now().minus({ days: 90 }).toSQL())
      .whereNotExists((sub) => {
        sub.from('page_views').whereRaw('page_views.visitor_id = visitors.id')
      })
      .whereNotExists((sub) => {
        sub.from('visitor_accounts').whereRaw('visitor_accounts.visitor_id = visitors.id')
      })
      .delete()

    logger.info(
      `SCHEDULER: analytics retention purge in ${Date.now() - start}ms — ${views} page_views, ${visitors} visitors removed`
    )
  })
  .dailyAt('03:30')
