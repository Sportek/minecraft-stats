import { BaseModel, belongsTo, column } from '@adonisjs/lucid/orm'
import * as relations from '@adonisjs/lucid/types/relations'
import { DateTime } from 'luxon'
import Server from './server.js'
import User from './user.js'
import type { ModerationVerdict } from '../constants/server_moderation.js'

export default class ServerModerationReview extends BaseModel {
  @column({ isPrimary: true })
  declare id: number

  @column({ columnName: 'server_id' })
  declare serverId: number

  @belongsTo(() => Server)
  declare server: relations.BelongsTo<typeof Server>

  @column()
  declare verdict: ModerationVerdict

  @column({ columnName: 'reviewed_by' })
  declare reviewedBy: number | null

  @belongsTo(() => User, { foreignKey: 'reviewedBy' })
  declare reviewer: relations.BelongsTo<typeof User>

  @column()
  declare note: string | null

  @column.dateTime({ autoCreate: true })
  declare createdAt: DateTime

  @column.dateTime({ autoCreate: true, autoUpdate: true })
  declare updatedAt: DateTime
}
