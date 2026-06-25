import { DateTime } from 'luxon'
import { BaseModel, column, hasMany } from '@adonisjs/lucid/orm'
import type { HasMany } from '@adonisjs/lucid/types/relations'
import PageView from '#models/page_view'
import VisitorAccount from '#models/visitor_account'

export default class Visitor extends BaseModel {
  @column({ isPrimary: true })
  declare id: number

  @column()
  declare uuid: string

  @column()
  declare ipHash: string | null

  @column()
  declare userAgent: string | null

  @column()
  declare country: string | null

  @column.dateTime({ autoCreate: true })
  declare firstSeenAt: DateTime

  @column.dateTime({ autoCreate: true, autoUpdate: true })
  declare lastSeenAt: DateTime

  @hasMany(() => PageView)
  declare pageViews: HasMany<typeof PageView>

  @hasMany(() => VisitorAccount)
  declare accounts: HasMany<typeof VisitorAccount>
}
