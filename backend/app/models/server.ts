import { BaseModel, belongsTo, column, hasOne, manyToMany } from '@adonisjs/lucid/orm'
import * as relations from '@adonisjs/lucid/types/relations'
import { DateTime } from 'luxon'
import Category from './category.js'
import Language from './language.js'
import ServerGrowthStat from './server_growth_stat.js'
import User from './user.js'
import { LanguageCode } from '../constants/languages.js'
import db from '@adonisjs/lucid/services/db'

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

  @manyToMany(() => Language, {
    pivotTable: 'server_languages',
    pivotColumns: ['server_id', 'language_id'],
    pivotTimestamps: true,
  })
  declare languages: relations.ManyToMany<typeof Language>

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

  async syncLanguages(languageCodes: LanguageCode[]) {
    const trx = await db.transaction()
    try {
      const languages = await Promise.all(languageCodes.map((code) => Language.getOrCreate(code)))
      const languageIds = languages.map((l) => l.id)

      await trx.from('server_languages').where('server_id', this.id).delete()

      const now = new Date()
      for (const languageId of languageIds) {
        await trx.table('server_languages').insert({
          server_id: this.id,
          language_id: languageId,
          created_at: now,
          updated_at: now,
        })
      }

      await trx.commit()
    } catch (error) {
      await trx.rollback()
      throw error
    }
  }
}
