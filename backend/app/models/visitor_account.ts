import { DateTime } from 'luxon'
import { BaseModel, belongsTo, column } from '@adonisjs/lucid/orm'
import type { BelongsTo } from '@adonisjs/lucid/types/relations'
import User from '#models/user'
import Visitor from '#models/visitor'

export default class VisitorAccount extends BaseModel {
  @column({ isPrimary: true })
  declare id: number

  @column()
  declare visitorId: number

  @column()
  declare userId: number

  @column.dateTime({ autoCreate: true })
  declare linkedAt: DateTime

  @column.dateTime({ autoCreate: true, autoUpdate: true })
  declare lastActiveAt: DateTime

  @belongsTo(() => Visitor)
  declare visitor: BelongsTo<typeof Visitor>

  @belongsTo(() => User)
  declare user: BelongsTo<typeof User>
}
