import Server from '#models/server'
import ServerStat from '#models/server_stat'
import logger from '@adonisjs/core/services/logger'
import scheduler from 'adonisjs-scheduler/services/main'
import fs from 'node:fs'
import path, { dirname } from 'node:path'
import { fileURLToPath } from 'node:url'
import { pingMinecraftJava } from '../minecraft-ping/minecraft_ping.js'
import pLimit from 'p-limit'

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
 * Met à jour les informations du serveur et enregistre les statistiques.
 * @param server - Le serveur à mettre à jour.
 * @param overwriteImage - Indique si l'image doit être écrasée.
 */
async function updateServerInfo(server: Server, overwriteImage = false) {
  let playerOnline: number | null = null
  let maxPlayer: number | null = null

  try {
    // On fait des retry pour éviter les erreurs de connexion
    const data = await retry(() => pingMinecraftJava(server.address, server.port), 3, 2000)
    if (!data) return

    if (data.favicon && (overwriteImage || !server.imageUrl)) {
      const filename = fileURLToPath(import.meta.url)
      const pathDirname = dirname(filename)

      const imageBase64 = data.favicon
      const imagePath = path.join(pathDirname, '../public/images/servers')
      const imageName = `${server.id}.png`
      const imageFullPath = path.join(imagePath, imageName)
      fs.mkdirSync(imagePath, { recursive: true })
      saveBase64Image(imageBase64, imageFullPath)
      server.imageUrl = `/images/servers/${imageName}`
    }

    playerOnline = data.players.online
    maxPlayer = data.players.max

    server.version = data.version.name
    await server.save()
    logger.info(`SCHEDULER: Updated server ${server.name} (${server.address}:${server.port})`)
  } catch (error) {
    logger.error(
      `SCHEDULER: Failed to update server ${server.name} (${server.address}:${server.port}): ${error.message}`
    )
  } finally {
    const stat = await ServerStat.create({
      playerCount: playerOnline,
      maxCount: maxPlayer,
    })

    stat.related('server').associate(server)
    await stat.save()
  }
}

/**
 * Met à jour les serveurs par lots avec une limite de parallélisme.
 */
async function updateServersInBatches(batchSize = 10, delayBetweenBatches = 10_000) {
  const servers = await Server.all()

  // Permet de limiter le nombre de tâches simultanées
  const limit = pLimit(batchSize)

  const delay = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms))

  // Exécute les mises à jour en lots avec limite
  for (let i = 0; i < servers.length; i += batchSize) {
    const batch = servers.slice(i, i + batchSize)
    await Promise.all(batch.map((server) => limit(() => updateServerInfo(server, false))))
    if (i + batchSize < servers.length) {
      await delay(delayBetweenBatches) // Attendre entre les lots
    }
  }
}

// Planification avec les schedulers

scheduler
  .call(async () => {
    // 10 serveurs à la fois, avec un délai de 10 secondes entre chaque lot
    await updateServersInBatches(10, 10_000)
  })
  .everyTenMinutes()

scheduler
  .call(async () => {
    const servers = await Server.all()
    await Promise.all(servers.map((server) => updateServerInfo(server, true)))
  })
  .everySixHours()
