import StatsService from '#services/stat_service'
import { StatValidator } from '#validators/stat'
import { Exception } from '@adonisjs/core/exceptions'
import type { HttpContext } from '@adonisjs/core/http'
import { DateTime } from 'luxon'

export default class StatsController {
  public async index({ request, response }: HttpContext) {
    try {
      const validatedData = await StatValidator.validate({
        ...request.params(),
        ...request.qs(),
      })

      const serverId = validatedData.server_id
      if (!serverId) {
        throw new Exception('Server id is required', { status: 400 })
      }

      // ---------------------------------------
      // exactTime => on fait la logique dédiée
      // ---------------------------------------
      if (validatedData.exactTime) {
        const exactDateTime = DateTime.fromMillis(validatedData.exactTime)
        if (!exactDateTime.isValid) {
          throw new Exception('Invalid exactTime format', { status: 400 })
        }
        const row = await StatsService.getExactTimeRow(serverId, exactDateTime)
        return response.status(200).json(row.map(StatsService.convertToCamelCase))
      }

      // ---------------------------------------
      // fromDate / toDate => filtrage éventuel
      // ---------------------------------------
      let fromDateSql: string | undefined
      let toDateSql: string | undefined

      if (validatedData.fromDate) {
        const fromDateTime = DateTime.fromMillis(validatedData.fromDate)
        if (!fromDateTime.isValid) {
          throw new Exception('Invalid fromDate format', { status: 400 })
        }
        fromDateSql = fromDateTime.toSQL()
      }
      if (validatedData.toDate) {
        const toDateTime = DateTime.fromMillis(validatedData.toDate)
        if (!toDateTime.isValid) {
          throw new Exception('Invalid toDate format', { status: 400 })
        }
        toDateSql = toDateTime.toSQL()
      }

      // ---------------------------------------
      // interval => regroupement
      // ---------------------------------------
      if (validatedData.interval) {
        const rows = await StatsService.getStatsWithInterval(
          serverId,
          validatedData.interval,
          fromDateSql,
          toDateSql
        )

        // // Optionnel : filtrer les rows où player_count = 0
        // const filtered = rows.filter((row: any) => row.player_count > 0)

        return response.status(200).json(rows.map(StatsService.convertToCamelCase))
      }

      // ---------------------------------------
      // Sinon => stats brutes
      // ---------------------------------------
      const results = await StatsService.getRawStats(
        serverId,
        fromDateSql,
        toDateSql
      )
      return response.status(200).json(results.map(StatsService.convertToCamelCase))
    } catch (error) {
      console.error(error)
      return response.status(500).json({
        error: error.message || 'Internal server error',
      })
    }
  }
}