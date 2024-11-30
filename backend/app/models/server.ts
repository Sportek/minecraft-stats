import { BaseModel, belongsTo, column, manyToMany } from '@adonisjs/lucid/orm'
import * as relations from '@adonisjs/lucid/types/relations'
import { DateTime } from 'luxon'
import User from './user.js'
import Category from './category.js'

export default class Server extends BaseModel {
  @column({ isPrimary: true })
  declare id: number

  @column()
  declare name: string

  @column()
  declare address: string

  @column()
  declare port: number

  @column()
  declare version: string | null

  @column()
  declare motd: string | null

  @column()
  declare imageUrl: string | null

  @column({ columnName: 'user_id' })
  declare userId: number

  @belongsTo(() => User)
  declare user: relations.BelongsTo<typeof User>

  @manyToMany(() => Category, { pivotTimestamps: true, pivotTable: 'server_categories' })
  declare categories: relations.ManyToMany<typeof Category>

  @column.dateTime({ columnName: 'last_online_at' })
  declare lastOnlineAt: DateTime | null

  @column.dateTime({ autoCreate: true })
  declare createdAt: DateTime

  @column.dateTime({ autoCreate: true, autoUpdate: true })
  declare updatedAt: DateTime
}
