import { BaseModel, belongsTo, column } from '@adonisjs/lucid/orm'
import * as relations from '@adonisjs/lucid/types/relations'
import { DateTime } from 'luxon'
import Server from './server.js'

/**
 * Clé primaire composite `(server_id, created_at)`, que Lucid ne sait pas modéliser :
 * le modèle ne sert qu'en lecture. Les insertions passent par le query builder
 * (`multiInsert` du scheduler).
 */
export default class ServerStat extends BaseModel {
  @belongsTo(() => Server)
  declare server: relations.BelongsTo<typeof Server>

  @column({ columnName: 'server_id' })
  declare serverId: number

  @column()
  declare playerCount: number | null

  @column()
  declare maxCount: number | null

  @column.dateTime({ autoCreate: true })
  declare createdAt: DateTime
}
