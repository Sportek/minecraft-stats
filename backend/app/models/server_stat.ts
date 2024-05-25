import { BaseModel, belongsTo, column } from '@adonisjs/lucid/orm'
import * as relations from '@adonisjs/lucid/types/relations'
import { DateTime } from 'luxon'
import Server from './server.js'

export default class ServerStat extends BaseModel {
  @column({ isPrimary: true })
  declare id: number

  @belongsTo(() => Server)
  declare server: relations.BelongsTo<typeof Server>

  @column()
  declare playerCount: number

  @column.dateTime({ autoCreate: true })
  declare createdAt: DateTime
}
