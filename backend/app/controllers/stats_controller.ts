import ServerStat from '#models/server_stat'
import { StatValidator } from '#validators/stat'
import { Exception } from '@adonisjs/core/exceptions'
import type { HttpContext } from '@adonisjs/core/http'
import Database from '@adonisjs/lucid/services/db'

import { DateTime } from 'luxon'

export default class StatsController {
  async index({ request, response }: HttpContext) {
    try {
      const validatedData = await StatValidator.validate(request.qs())

      if (!validatedData.serverId) {
        throw new Exception('Server id is required', { status: 400 })
      }

      let query = ServerStat.query().where('server_id', validatedData.serverId)

      if (validatedData.exactTime) {
        const exactDateTime = DateTime.fromISO(validatedData.exactTime.toISOString())
        if (exactDateTime.isValid) {
          query = query.where('created_at', exactDateTime.toSQL())
        }
      }

      if (validatedData.fromDate && validatedData.toDate) {
        const fromDateTime = DateTime.fromISO(validatedData.fromDate.toISOString())
        const toDateTime = DateTime.fromISO(validatedData.toDate.toISOString())
        if (!fromDateTime.isValid || !toDateTime.isValid) {
          throw new Exception('Invalid date format', { status: 400 })
        }
        query = query.whereBetween('created_at', [fromDateTime.toSQL(), toDateTime.toSQL()])
      }

      if (validatedData.interval) {
        // Exemple pour une moyenne par intervalle d'une heure
        query = query
          .select(Database.raw(`DATE_TRUNC('${validatedData.interval}', created_at) as interval`))
          .select(Database.raw('AVG(player_count) as average_player_count'))
          .groupBy('interval')
      }

      const stats = await query
      return response.status(200).json(stats)
    } catch (error) {
      console.error(error)
      return response.status(500).json({ error: 'Internal server error' })
    }
  }
}
