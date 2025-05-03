import { BaseModel, belongsTo, column, hasOne, manyToMany } from '@adonisjs/lucid/orm'
import * as relations from '@adonisjs/lucid/types/relations'
import { DateTime } from 'luxon'
import Category from './category.js'
import ServerGrowthStat from './server_growth_stat.js'
import User from './user.js'

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

  @hasOne(() => ServerGrowthStat)
  declare growthStat: relations.HasOne<typeof ServerGrowthStat>

  @manyToMany(() => Category, { pivotTimestamps: true, pivotTable: 'server_categories' })
  declare categories: relations.ManyToMany<typeof Category>

  @column.dateTime({ columnName: 'last_online_at' })
  declare lastOnlineAt: DateTime | null

  @column()
  declare lastPlayerCount: number | null

  @column()
  declare lastMaxCount: number | null

  @column.dateTime({ columnName: 'last_stats_at' })
  declare lastStatsAt: DateTime | null

  @column.dateTime({ autoCreate: true })
  declare createdAt: DateTime

  @column.dateTime({ autoCreate: true, autoUpdate: true })
  declare updatedAt: DateTime
}
