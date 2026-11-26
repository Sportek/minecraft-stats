import { BaseModel, belongsTo, column } from '@adonisjs/lucid/orm'
import * as relations from '@adonisjs/lucid/types/relations'
import { DateTime } from 'luxon'
import Server from './server.js'
import User from './user.js'
import type { ReportReason, ReportStatus } from '../constants/server_report.js'

export default class ServerReport extends BaseModel {
  @column({ isPrimary: true })
  declare id: number

  @column({ columnName: 'server_id' })
  declare serverId: number

  @belongsTo(() => Server)
  declare server: relations.BelongsTo<typeof Server>

  @column({ columnName: 'reporter_id' })
  declare reporterId: number | null

  @belongsTo(() => User, { foreignKey: 'reporterId' })
  declare reporter: relations.BelongsTo<typeof User>

  @column()
  declare reason: ReportReason

  @column()
  declare details: string | null

  @column()
  declare status: ReportStatus

  @column({ columnName: 'resolved_by' })
  declare resolvedBy: number | null

  @belongsTo(() => User, { foreignKey: 'resolvedBy' })
  declare resolver: relations.BelongsTo<typeof User>

  @column.dateTime({ columnName: 'resolved_at' })
  declare resolvedAt: DateTime | null

  @column.dateTime({ autoCreate: true })
  declare createdAt: DateTime

  @column.dateTime({ autoCreate: true, autoUpdate: true })
  declare updatedAt: DateTime
}
