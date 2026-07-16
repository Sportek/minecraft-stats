import { BaseModel, belongsTo, column } from '@adonisjs/lucid/orm'
import * as relations from '@adonisjs/lucid/types/relations'
import { DateTime } from 'luxon'
import User from './user.js'

/**
 * Méthode de connexion OAuth liée à un compte. Une ligne n'autorise la connexion
 * qu'une fois confirmée (`confirmedAt` non nul) : avant cela elle ne porte que le
 * hash du token de confirmation envoyé par email.
 */
export default class UserProvider extends BaseModel {
  @column({ isPrimary: true })
  declare id: number

  @belongsTo(() => User)
  declare user: relations.BelongsTo<typeof User>

  @column({ columnName: 'user_id' })
  declare userId: number

  @column()
  declare provider: 'google' | 'discord'

  @column({ columnName: 'provider_user_id' })
  declare providerUserId: string | null

  @column({ columnName: 'link_token_hash', serializeAs: null })
  declare linkTokenHash: string | null

  @column.dateTime({ columnName: 'link_token_expires_at', serializeAs: null })
  declare linkTokenExpiresAt: DateTime | null

  @column.dateTime({ columnName: 'confirmed_at' })
  declare confirmedAt: DateTime | null

  @column.dateTime({ autoCreate: true })
  declare createdAt: DateTime

  @column.dateTime({ autoCreate: true, autoUpdate: true })
  declare updatedAt: DateTime
}
