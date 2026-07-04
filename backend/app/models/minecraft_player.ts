import { BaseModel, column } from '@adonisjs/lucid/orm'
import { DateTime } from 'luxon'

export default class MinecraftPlayer extends BaseModel {
  @column({ isPrimary: true })
  declare id: number

  // UUID Mojang sans tirets.
  @column()
  declare uuid: string

  @column()
  declare username: string

  @column({ columnName: 'head_path' })
  declare headPath: string | null

  @column({ columnName: 'texture_hash' })
  declare textureHash: string | null

  @column.dateTime({ columnName: 'resolved_at' })
  declare resolvedAt: DateTime | null

  @column.dateTime({ autoCreate: true })
  declare createdAt: DateTime

  @column.dateTime({ autoCreate: true, autoUpdate: true })
  declare updatedAt: DateTime
}
