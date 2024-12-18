import ServerStat from '#models/server_stat'
import { StatValidator } from '#validators/stat'
import { Exception } from '@adonisjs/core/exceptions'
import type { HttpContext } from '@adonisjs/core/http'
import Database from '@adonisjs/lucid/services/db'
import { DateTime } from 'luxon'

export default class StatsController {
  async index({ request, response }: HttpContext) {
    try {
      const validatedData = await StatValidator.validate({ ...request.params(), ...request.qs() })
      if (!validatedData.server_id) {
        throw new Exception('Server id is required', { status: 400 })
      }

      let query = ServerStat.query().where({ server_id: validatedData.server_id })

      if (validatedData.exactTime) {
        const exactDateTime = DateTime.fromMillis(validatedData.exactTime)
        if (exactDateTime.isValid) {
          query = query.where('created_at', exactDateTime.toSQL())
        }
      }

      if (validatedData.fromDate && validatedData.toDate) {
        const fromDateTime = DateTime.fromMillis(validatedData.fromDate)
        const toDateTime = DateTime.fromMillis(validatedData.toDate)
        if (!fromDateTime.isValid || !toDateTime.isValid) {
          throw new Exception('Invalid date format', { status: 400 })
        }
        query = query.whereBetween('created_at', [fromDateTime.toSQL(), toDateTime.toSQL()])
      }

      if (validatedData.interval) {
        const baseQuery = query.toQuery().replace(/^\s*select\s+\*\s+from\s+/i, '')

        const rawQuery = `
          WITH intervals AS (
            SELECT generate_series(
                (SELECT min(date_trunc('hour', created_at)) FROM ${baseQuery}),
                (SELECT max(date_trunc('hour', created_at)) FROM ${baseQuery}),
                interval '${validatedData.interval}'
            ) AS interval_time
          )
          SELECT
              i.interval_time AS created_at,
              t.server_id,
              ROUND(AVG(t.player_count)) AS player_count
          FROM
              intervals i
          LEFT JOIN
              server_stats t
          ON
              date_trunc('minute', t.created_at) = i.interval_time
              AND t.server_id = ${validatedData.server_id}
          GROUP BY
              i.interval_time, t.server_id
          ORDER BY
              i.interval_time
        `

        const stats = await Database.rawQuery(rawQuery)
        return response.status(200).json(
          stats.rows.map((row: any) => ({
            serverId: row.server_id,
            createdAt: row.created_at,
            playerCount: Number(row.player_count),
          }))
        )
      }

      const stats = await query.orderBy('created_at', 'asc')
      return response.status(200).json(stats)
    } catch (error) {
      console.log(error)
      return response.status(500).json({ error: error.messages || 'Internal server error' })
    }
  }
}
