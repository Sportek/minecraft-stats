import { DateTime } from 'luxon'
import { BaseModel, column } from '@adonisjs/lucid/orm'

export default class BlacklistedIdentifier extends BaseModel {
  @column({ isPrimary: true })
  declare id: number

  @column()
  declare type: 'email' | 'ip'

  @column()
  declare value: string

  @column()
  declare reason: string | null

  @column()
  declare blacklistedBy: number | null

  @column.dateTime({ autoCreate: true })
  declare createdAt: DateTime
}
