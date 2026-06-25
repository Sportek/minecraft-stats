import { DateTime } from 'luxon'
import { BaseModel, belongsTo, column } from '@adonisjs/lucid/orm'
import type { BelongsTo } from '@adonisjs/lucid/types/relations'
import User from '#models/user'
import Visitor from '#models/visitor'

export default class PageView extends BaseModel {
  @column({ isPrimary: true })
  declare id: number

  @column()
  declare visitorId: number

  @column()
  declare userId: number | null

  @column()
  declare path: string

  @column()
  declare referrer: string | null

  @column()
  declare title: string | null

  @column()
  declare durationMs: number | null

  @column.dateTime({ autoCreate: true })
  declare createdAt: DateTime

  @belongsTo(() => Visitor)
  declare visitor: BelongsTo<typeof Visitor>

  @belongsTo(() => User)
  declare user: BelongsTo<typeof User>
}
