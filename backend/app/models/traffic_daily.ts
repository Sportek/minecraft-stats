import { DateTime } from 'luxon'
import { BaseModel, column } from '@adonisjs/lucid/orm'

/**
 * Snapshot quotidien et durable des compteurs analytics Redis. Redis reste la
 * source temps réel ; cette table est alimentée par le job de snapshot et sert de
 * repli au dashboard quand Redis n'a plus la donnée (volume recréé ou TTL expiré).
 */
export default class TrafficDaily extends BaseModel {
  protected tableName = 'traffic_daily'

  @column({ isPrimary: true })
  declare id: number

  @column.date()
  declare date: DateTime

  @column()
  declare httpRequests: number

  @column()
  declare httpErrors: number

  @column()
  declare uniqueVisitors: number

  @column()
  declare countries: Record<string, number>

  @column.dateTime({ autoCreate: true })
  declare createdAt: DateTime

  @column.dateTime({ autoCreate: true, autoUpdate: true })
  declare updatedAt: DateTime
}
