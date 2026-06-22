import { BaseModel, beforeSave, belongsTo, column, hasOne, manyToMany } from '@adonisjs/lucid/orm'
import * as relations from '@adonisjs/lucid/types/relations'
import { DateTime } from 'luxon'
import Category from './category.js'
import Language from './language.js'
import ServerGrowthStat from './server_growth_stat.js'
import User from './user.js'
import { LanguageCode } from '../constants/languages.js'
import type { ServerType } from '../constants/server_type.js'
import { normalizeWebsite } from '#utils/website'
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

  // Édition du serveur — détermine le protocole de ping (cf. minecraft_ping.ts).
  @column()
  declare type: ServerType

  @column()
  declare version: string | null

  // Server website, derived from the address (play.test.com -> test.com) on
  // create/update, or provided by the owner. NULL when it can't be determined.
  @column()
  declare website: string | null

  @column()
  declare motd: string | null

  @column()
  declare imageUrl: string | null

  // Empreintes de détection de doublon (cf. DuplicateDetectionService).
  // Toutes indexées : la recherche de doublon se fait par égalité de hash.
  @column({ columnName: 'favicon_hash' })
  declare faviconHash: string | null

  @column({ columnName: 'resolved_endpoint' })
  declare resolvedEndpoint: string | null

  @column({ columnName: 'motd_hash' })
  declare motdHash: string | null

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

  // Pic all-time de joueurs simultanés. Mis à jour à chaque ping réussi quand le
  // compte courant dépasse l'ancien pic (cf. start/scheduler.ts).
  @column()
  declare peakPlayerCount: number | null

  @column.dateTime({ columnName: 'peak_player_at' })
  declare peakPlayerAt: DateTime | null

  // Quand le serveur doit être pingué prochainement (cadence différentielle, P.5.1).
  // NULL = "ASAP". Mis à jour à chaque ping selon le résultat (Hot / Normal / Cold / Dead).
  @column.dateTime({ columnName: 'next_ping_at' })
  declare nextPingAt: DateTime | null

  @column.dateTime({ autoCreate: true })
  declare createdAt: DateTime

  @column.dateTime({ autoCreate: true, autoUpdate: true })
  declare updatedAt: DateTime

  // Standardise the website at the persistence layer so the column never stores
  // a scheme (https://…), regardless of the write path (controllers, API, MCP).
  // Idempotent: clean values are left untouched; already-polluted rows self-heal
  // on their next save (e.g. the scheduler's ping updates).
  @beforeSave()
  static normalizeWebsiteColumn(server: Server) {
    if (server.website) {
      server.website = normalizeWebsite(server.website)
    }
  }

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
