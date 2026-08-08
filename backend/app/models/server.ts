import {
  BaseModel,
  beforeSave,
  belongsTo,
  column,
  hasMany,
  hasOne,
  manyToMany,
} from '@adonisjs/lucid/orm'
import * as relations from '@adonisjs/lucid/types/relations'
import { DateTime } from 'luxon'
import Category from './category.js'
import Language from './language.js'
import ServerBoostScore from './server_boost_score.js'
import ServerGrowthStat from './server_growth_stat.js'
import ServerOwnershipClaim from './server_ownership_claim.js'
import ServerVote from './server_vote.js'
import User from './user.js'
import { LanguageCode } from '../constants/languages.js'
import type { BoostStatus } from '../constants/server_boost.js'
import type { OwnershipMethod } from '../constants/server_ownership.js'
import type { ServerType } from '../constants/server_type.js'
import { normalizeWebsite } from '#utils/website'
import { deriveServerWebsite } from '#utils/server_website'
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

  // Domaine racine (eTLD+1) dérivé de l'adresse : `mc.hypixel.net` -> `hypixel.net`.
  // Indexé, peuplé par `deriveHostDomainColumn` ci-dessous. Sert de signal fort
  // à la détection de doublon (cf. DuplicateDetectionService).
  @column({ columnName: 'host_domain' })
  declare hostDomain: string | null

  // Nullable : un serveur devient orphelin (user_id = NULL) quand son propriétaire
  // supprime son compte (FK ON DELETE SET NULL). Il reste suivi mais n'est plus
  // éditable que par un admin.
  @column({ columnName: 'user_id' })
  declare userId: number | null

  @belongsTo(() => User)
  declare user: relations.BelongsTo<typeof User>

  // Horodatage de la preuve de propriété. NULL = le `user_id` n'est qu'un "ajouteur"
  // non confirmé ; une preuve DNS (ou une décision admin) peut alors transférer le
  // serveur. Non-NULL = propriété confirmée, protégée (cf. ServerOwnershipService).
  @column.dateTime({ columnName: 'owner_verified_at' })
  declare ownerVerifiedAt: DateTime | null

  @column({ columnName: 'owner_verified_method' })
  declare ownerVerifiedMethod: OwnershipMethod | null

  @hasMany(() => ServerOwnershipClaim)
  declare ownershipClaims: relations.HasMany<typeof ServerOwnershipClaim>

  @hasOne(() => ServerGrowthStat)
  declare growthStat: relations.HasOne<typeof ServerGrowthStat>

  @hasOne(() => ServerBoostScore)
  declare boostScore: relations.HasOne<typeof ServerBoostScore>

  // Verdict admin sur le gonflage des connectés (cf. BoostDetectionService).
  // NULL = jamais revu. 'boosting' déclenche le badge public sur la fiche et la
  // rétrogradation dans les classements basés sur le nombre de joueurs.
  @column({ columnName: 'boost_status' })
  declare boostStatus: BoostStatus | null

  @column.dateTime({ columnName: 'boost_reviewed_at' })
  declare boostReviewedAt: DateTime | null

  @hasMany(() => ServerVote)
  declare votes: relations.HasMany<typeof ServerVote>

  // Compteur total dénormalisé (all-time), incrémenté à chaque vote. Le classement
  // mensuel agrège `server_votes` sur la fenêtre du mois courant.
  @column()
  declare voteCount: number

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

  // Keep `host_domain` in sync with the address on every write path (create,
  // owner edit, scheduler ping). Derived from the address — the same eTLD+1
  // extraction used for the website. Existing rows self-heal on their next save.
  @beforeSave()
  static deriveHostDomainColumn(server: Server) {
    if (server.$dirty.address !== undefined || server.hostDomain === null) {
      server.hostDomain = deriveServerWebsite(server.address)
    }
  }

  /**
   * Résout des noms de catégories en ids existants (les inconnus sont ignorés).
   * Mutualise le lookup nom→id dupliqué entre la création et la mise à jour d'un
   * serveur (attach vs sync).
   */
  static async resolveCategoryIds(names: string[]): Promise<number[]> {
    const categories = await Promise.all(names.map((name) => Category.findBy('name', name)))
    return categories.flatMap((c) => (c ? [c.id] : []))
  }

  /**
   * Résout des codes de langues en ids existants (les inconnus sont ignorés).
   * Pendant de {@link resolveCategoryIds} pour la relation langues.
   */
  static async resolveLanguageIds(codes: string[]): Promise<number[]> {
    const languages = await Promise.all(codes.map((code) => Language.findBy('code', code)))
    return languages.flatMap((l) => (l ? [l.id] : []))
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
