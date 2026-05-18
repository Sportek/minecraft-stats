import Server from '#models/server'
import DuplicateDetectionService from '#services/duplicate_detection_service'
import StatsService from '#services/stat_service'
import logger from '@adonisjs/core/services/logger'
import Database from '@adonisjs/lucid/services/db'
import redis from '@adonisjs/redis/services/main'
import scheduler from 'adonisjs-scheduler/services/main'
import { DateTime } from 'luxon'
import fs from 'node:fs'
import path, { dirname } from 'node:path'
import { fileURLToPath } from 'node:url'
import pLimit from 'p-limit'
import sharp from 'sharp'
import { pingMinecraftJava } from '../minecraft-ping/minecraft_ping.js'

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
 * Convertit une chaîne base64 en fichier image et l'enregistre sur le système de fichiers.
 */
function saveBase64Image(base64Image: string, outputPath: string) {
  const base64Data = base64Image.replace(/^data:image\/\w+;base64,/, '')
  const buffer = Buffer.from(base64Data, 'base64')
  fs.writeFileSync(outputPath, buffer, { flag: 'w' })
}

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
      { serverId, err: error.message },
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
    const data = await pingMinecraftJava(server.address, server.port)
    if (data) {
      if (data.favicon && (overwriteImage || !server.imageUrl)) {
        try {
          const filename = fileURLToPath(import.meta.url)
          const pathDirname = dirname(filename)

          const imageBase64 = data.favicon
          const imagePath = path.join(pathDirname, '../public/images/servers')
          const imageName = `${server.id}.png`
          const imageFullPath = path.join(imagePath, imageName)
          fs.mkdirSync(imagePath, { recursive: true })
          saveBase64Image(imageBase64, imageFullPath)

          const webpImageName = `${server.id}.webp`
          const webpImageFullPath = path.join(imagePath, webpImageName)
          const buffer = Buffer.from(imageBase64.replace(/^data:image\/\w+;base64,/, ''), 'base64')
          sharp(buffer)
            .toFormat('webp')
            .toFile(webpImageFullPath, (err) => {
              if (err) {
                logger.error(
                  `SCHEDULER: Failed to generate webp image for server ${server.name} (${server.address}:${server.port}): ${err.message}`
                )
              }
            })

          server.imageUrl = `/images/servers/${server.id}`
        } catch (imgErr) {
          logger.warn(
            { serverId: server.id, err: (imgErr as Error).message },
            'SCHEDULER: image processing failed'
          )
        }
      }

      playerOnline = data.players?.online ?? 0
      maxPlayer = data.players?.max ?? 0

      server.version = data.version.name
      server.lastPlayerCount = playerOnline
      server.lastMaxCount = maxPlayer
      server.lastStatsAt = DateTime.fromJSDate(createdAt)

      // Rafraîchit les empreintes de détection de doublon. favicon + MOTD sont
      // recalculés à chaque ping (le MOTD bouge souvent) ; l'endpoint DNS, qui
      // ne change quasi jamais, n'est re-résolu que lors du job 6h (overwriteImage).
      if (data.favicon) {
        server.faviconHash = DuplicateDetectionService.hashFavicon(data.favicon)
      }
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
      `SCHEDULER: ping failed for ${server.name} (${server.address}:${server.port}): ${error.message}`
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
      logger.error({ err: error.message }, 'SCHEDULER: pingDueServers failed')
    }
  })
  .everyFiveMinutes()

// Force-refresh des favicons toutes les 6h sur TOUS les serveurs (pas seulement dus).
// Utile pour rafraîchir les images qui auraient changé sans que le ping le détecte.
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
  .everyTenMinutes()

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
      INSERT INTO server_stats_hourly (server_id, hour, avg_player_count, max_player_count, samples_count)
      SELECT
        server_id,
        date_trunc('hour', created_at) AS hour,
        ROUND(AVG(player_count))::int AS avg_player_count,
        MAX(max_count) AS max_player_count,
        COUNT(*)::int AS samples_count
      FROM server_stats
      WHERE created_at >= date_trunc('hour', now() - interval '1 hour')
        AND created_at <  date_trunc('hour', now())
        AND server_id IS NOT NULL
      GROUP BY server_id, hour
      ON CONFLICT (server_id, hour) DO UPDATE SET
        avg_player_count = EXCLUDED.avg_player_count,
        max_player_count = EXCLUDED.max_player_count,
        samples_count    = EXCLUDED.samples_count
    `)
    const rowCount = result.rowCount ?? 0
    logger.info(
      `SCHEDULER: hourly_stats aggregation completed in ${Date.now() - start}ms (${rowCount} rows upserted)`
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
