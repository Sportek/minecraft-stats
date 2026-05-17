import { DateTime } from 'luxon'
import { BaseModel, belongsTo, column } from '@adonisjs/lucid/orm'
import type { BelongsTo } from '@adonisjs/lucid/types/relations'
import Advertisement from '#models/advertisement'

export default class AdvertisementEvent extends BaseModel {
  @column({ isPrimary: true })
  declare id: number

  @column()
  declare advertisementId: number

  @column()
  declare type: 'impression' | 'click'

  @column()
  declare placement: string | null

  @column()
  declare serverId: number | null

  @column()
  declare targetUrl: string | null

  @column.dateTime({ autoCreate: true })
  declare createdAt: DateTime

  @belongsTo(() => Advertisement)
  declare advertisement: BelongsTo<typeof Advertisement>
}
