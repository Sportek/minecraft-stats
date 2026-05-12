import Server from '#models/server'
import StatsService from '#services/stat_service'
import logger from '@adonisjs/core/services/logger'
import Database from '@adonisjs/lucid/services/db'
import scheduler from 'adonisjs-scheduler/services/main'
import fs from 'node:fs'
import path, { dirname } from 'node:path'
import { fileURLToPath } from 'node:url'
import pLimit from 'p-limit'
import { pingMinecraftJava } from '../minecraft-ping/minecraft_ping.js'
import sharp from 'sharp'
import { DateTime } from 'luxon'

type ServerStatRow = {
  server_id: number
  player_count: number | null
  max_count: number | null
  created_at: Date
}

/**
 * Convertit une chaîne base64 en fichier image et l'enregistre sur le système de fichiers.
 * @param base64Image - La chaîne base64 de l'image.
 * @param outputPath - Le chemin de sortie où l'image sera enregistrée.
 */
function saveBase64Image(base64Image: string, outputPath: string) {
  // Supprimer le préfixe de la chaîne base64 (par exemple, "data:image/png;base64,")
  const base64Data = base64Image.replace(/^data:image\/\w+;base64,/, '')

  // Créer un buffer à partir de la chaîne base64
  const buffer = Buffer.from(base64Data, 'base64')

  // Écrire le buffer dans un fichier avec l'option 'w' pour écraser les fichiers existants
  fs.writeFileSync(outputPath, buffer, { flag: 'w' })
}

/**
 * Retente une fonction asynchrone plusieurs fois en cas d'échec.
 * @param fn - La fonction asynchrone à exécuter.
 * @param retries - Nombre de tentatives avant d'abandonner.
 * @param delay - Temps d'attente entre chaque tentative (en ms).
 * @returns Le résultat de la fonction si elle réussit.
 */
async function retry<T>(fn: () => Promise<T>, retries = 3, delay = 1000): Promise<T> {
  for (let attempt = 0; attempt <= retries; attempt++) {
    try {
      return await fn()
    } catch (error) {
      if (attempt === retries) {
        throw error // Relancer l'erreur après le dernier échec.
      }
      await new Promise((resolve) => setTimeout(resolve, delay))
    }
  }
  throw new Error('Unreachable code') // Juste pour satisfaire TypeScript.
}

/**
 * Met à jour les informations du serveur et retourne la stat à insérer.
 * L'écriture des UPDATE `servers` reste individuelle, mais l'INSERT `server_stats` est
 * délégué au caller pour permettre un bulk insert en fin de cycle (cf. P.1.4).
 *
 * @param server - Le serveur à mettre à jour.
 * @param overwriteImage - Indique si l'image doit être écrasée.
 */
async function updateServerInfo(server: Server, overwriteImage = false): Promise<ServerStatRow> {
  let playerOnline: number | null = null
  let maxPlayer: number | null = null
  // Capturer l'horodatage au moment du ping (et non en fin de cycle) pour préserver l'exactitude.
  const createdAt = new Date()

  try {
    // On fait des retry pour éviter les erreurs de connexion
    const data = await retry(() => pingMinecraftJava(server.address, server.port), 3, 2000)
    if (!data) {
      return { server_id: server.id, player_count: null, max_count: null, created_at: createdAt }
    }

    if (data.favicon && (overwriteImage || !server.imageUrl)) {
      const filename = fileURLToPath(import.meta.url)
      const pathDirname = dirname(filename)

      const imageBase64 = data.favicon
      const imagePath = path.join(pathDirname, '../public/images/servers')
      const imageName = `${server.id}.png`
      const imageFullPath = path.join(imagePath, imageName)
      fs.mkdirSync(imagePath, { recursive: true })
      saveBase64Image(imageBase64, imageFullPath)

      // Génération d'une image webp
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
          } else {
            logger.info(
              `SCHEDULER: Generated webp image for server ${server.name} (${server.address}:${server.port})`
            )
          }
        })

      server.imageUrl = `/images/servers/${server.id}`
    }

    playerOnline = data.players?.online ?? 0
    maxPlayer = data.players?.max ?? 0

    server.version = data.version.name
    server.lastPlayerCount = playerOnline
    server.lastMaxCount = maxPlayer
    server.lastStatsAt = DateTime.fromJSDate(createdAt)
    await server.save()
    logger.info(`SCHEDULER: Updated server ${server.name} (${server.address}:${server.port})`)
  } catch (error) {
    logger.error(
      `SCHEDULER: Failed to update server ${server.name} (${server.address}:${server.port}): ${error.message}`
    )
  }

  return {
    server_id: server.id,
    player_count: playerOnline,
    max_count: maxPlayer,
    created_at: createdAt,
  }
}

/**
 * Insère un lot de stats en une seule requête `server_stats`.
 * Aucune action si le batch est vide.
 */
async function flushStatsBatch(batch: ServerStatRow[]): Promise<void> {
  if (batch.length === 0) return
  await Database.table('server_stats').multiInsert(batch)
  logger.info(`SCHEDULER: bulk-inserted ${batch.length} server_stats rows`)
}

/**
 * Met à jour les serveurs par lots avec un espacement uniforme des requêtes réseau.
 * L'espacement protège les serveurs Minecraft externes — il est **préservé**, seule
 * l'écriture DB est bulkée à la fin.
 */
async function updateServersWithUniformSpacing(totalTime = 10 * 60 * 1000) {
  const servers = await Server.all()
  if (servers.length === 0) return

  const delayBetweenRequests = totalTime / servers.length
  const limit = pLimit(1)
  const delay = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms))

  const statsBatch: ServerStatRow[] = []
  for (const server of servers) {
    const row = await limit(() => updateServerInfo(server, false))
    statsBatch.push(row)
    await delay(delayBetweenRequests)
  }

  await flushStatsBatch(statsBatch)
}

// Planification avec les schedulers
scheduler
  .call(async () => {
    // Espacer les requêtes uniformément sur 10 minutes
    await updateServersWithUniformSpacing(10 * 60 * 1000)
  })
  .everyTenMinutes()

scheduler
  .call(async () => {
    const servers = await Server.all()
    const rows = await Promise.all(servers.map((server) => updateServerInfo(server, true)))
    await flushStatsBatch(rows)
  })
  .everySixHours()

scheduler
  .call(async () => {
    const start = Date.now()
    const serverCount = (await Server.query().count('* as total'))[0].$extras.total
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
