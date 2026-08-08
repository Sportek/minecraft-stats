import { BaseCommand, flags } from '@adonisjs/core/ace'
import { type CommandOptions } from '@adonisjs/core/types/ace'
import BoostDetectionService from '#services/boost_detection_service'
import ServerBoostScore from '#models/server_boost_score'
import { BOOST_WATCH_THRESHOLD } from '../app/constants/server_boost.js'

/**
 * Recalcule les scores de gonflage des connectés à la demande.
 *
 * Le scheduler fait déjà tourner ce balayage chaque nuit ; cette commande sert au
 * premier remplissage après la migration, et à revérifier une calibration après avoir
 * touché aux poids.
 *
 * Idempotent : chaque passage réécrit la ligne de score du serveur.
 *
 * Usage :
 *   node ace boost:scan
 *   node ace boost:scan --server-id=369
 */
export default class BoostScan extends BaseCommand {
  static commandName = 'boost:scan'
  static description = 'Recompute player-count inflation scores for every server'

  static options: CommandOptions = {
    startApp: true,
    allowUnknownFlags: false,
    staysAlive: false,
  }

  @flags.number({ description: 'Score a single server instead of sweeping all of them' })
  declare serverId: number

  async run() {
    if (this.serverId) {
      const score = await BoostDetectionService.scoreServer(this.serverId)
      if (!score) {
        this.logger.warning(`Serveur ${this.serverId} : données insuffisantes, aucun score écrit`)
        return
      }
      this.logger.info(`Serveur ${this.serverId} : ${score.score}/100 (${score.level})`)
      for (const signal of score.signals) {
        this.logger.info(`  ${signal.key} +${signal.points} — ${signal.detail}`)
      }
      return
    }

    const start = Date.now()
    const { scored, skipped } = await BoostDetectionService.scanAll()
    this.logger.success(
      `${scored} serveurs notés, ${skipped} ignorés (données insuffisantes) en ${Date.now() - start}ms`
    )

    const flagged = await ServerBoostScore.query()
      .where('score', '>=', BOOST_WATCH_THRESHOLD)
      .preload('server', (query) => query.select('id', 'name', 'address'))
      .orderBy('score', 'desc')

    if (flagged.length === 0) {
      this.logger.info('Aucun serveur au-dessus du seuil de surveillance.')
      return
    }

    this.logger.info(`${flagged.length} serveurs au-dessus du seuil de surveillance :`)
    for (const entry of flagged) {
      const factor = entry.detectedFactor ? ` ×${entry.detectedFactor}` : ''
      this.logger.info(
        `  ${String(entry.score).padStart(3)}/100  ${entry.level.padEnd(6)}  ${entry.server.name} (${entry.server.address})${factor}`
      )
    }
  }
}
