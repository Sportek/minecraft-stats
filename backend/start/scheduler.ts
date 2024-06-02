import Server from '#models/server'
import ServerStat from '#models/server_stat'
import logger from '@adonisjs/core/services/logger'
import scheduler from 'adonisjs-scheduler/services/main'
import { pingMinecraftJava } from '../minecraft-ping/minecraft_ping.js'

scheduler
  .call(async () => {
    const servers = await Server.all()
    await Promise.all(
      servers.map(async (server) => {
        try {
          const data = await pingMinecraftJava(server.address)
          if (!data) return

          server.version = data.version.name
          await server.save()

          const stat = await ServerStat.create({
            playerCount: data.players.online,
            maxCount: data.players.max,
          })

          stat.related('server').associate(server)
          await stat.save()

          logger.info(`Updated server ${server.id}`)
        } catch (error) {
          logger.error(`Failed to update server ${server.id}: ${error}`)
        }
      })
    )
  })
  .everyTwoMinutes()
