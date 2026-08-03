import { DateTime } from 'luxon'
import { BaseModel, column } from '@adonisjs/lucid/orm'

export default class BlacklistedIdentifierUser extends BaseModel {
  @column({ isPrimary: true })
  declare id: number

  @column()
  declare blacklistedIdentifierId: number

  @column()
  declare userId: number

  @column.dateTime({ autoCreate: true })
  declare createdAt: DateTime
}
