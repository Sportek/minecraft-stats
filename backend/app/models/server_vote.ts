import { BaseModel, belongsTo, column } from '@adonisjs/lucid/orm'
import * as relations from '@adonisjs/lucid/types/relations'
import { DateTime } from 'luxon'
import Server from './server.js'
import User from './user.js'

export default class ServerVote extends BaseModel {
  @column({ isPrimary: true })
  declare id: number

  @belongsTo(() => Server)
  declare server: relations.BelongsTo<typeof Server>

  @column({ columnName: 'server_id' })
  declare serverId: number

  // Lien vers l'utilisateur tracké (PK du visiteur anonyme). Nullable : SET NULL
  // à la suppression du visiteur.
  @column({ columnName: 'visitor_id' })
  declare visitorId: number | null

  @belongsTo(() => User)
  declare user: relations.BelongsTo<typeof User>

  @column({ columnName: 'user_id' })
  declare userId: number | null

  @column()
  declare username: string

  @column({ columnName: 'mojang_uuid' })
  declare mojangUuid: string | null

  @column({ columnName: 'ip_hash' })
  declare ipHash: string | null

  @column()
  declare country: string | null

  @column.dateTime({ autoCreate: true })
  declare createdAt: DateTime

  @column.dateTime({ autoCreate: true, autoUpdate: true })
  declare updatedAt: DateTime
}
