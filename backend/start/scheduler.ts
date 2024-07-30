import Server from '#models/server'
import ServerStat from '#models/server_stat'
import logger from '@adonisjs/core/services/logger'
import scheduler from 'adonisjs-scheduler/services/main'
import fs from 'node:fs'
import path, { dirname } from 'node:path'
import { fileURLToPath } from 'node:url'
import { pingMinecraftJava } from '../minecraft-ping/minecraft_ping.js'

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
 * Met à jour les informations du serveur et enregistre les statistiques.
 * @param server - Le serveur à mettre à jour.
 * @param overwriteImage - Indique si l'image doit être écrasée.
 */
async function updateServerInfo(server: Server, overwriteImage = false) {
  let playerOnline: number | null = null
  let maxPlayer: number | null = null

  try {
    const data = await pingMinecraftJava(server.address, server.port)
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
    logger.info(`Updated server ${server.id}`)
  } catch (error) {
    logger.error(`Failed to update server ${server.id}: ${error}`)
  } finally {
    const stat = await ServerStat.create({
      playerCount: playerOnline,
      maxCount: maxPlayer,
    })

    stat.related('server').associate(server)
    await stat.save()
  }
}

scheduler
  .call(async () => {
    const servers = await Server.all()
    await Promise.all(servers.map((server) => updateServerInfo(server, false)))
  })
  .everyTenMinutes()

scheduler
  .call(async () => {
    const servers = await Server.all()
    await Promise.all(servers.map((server) => updateServerInfo(server, true)))
  })
  .everySixHours()
