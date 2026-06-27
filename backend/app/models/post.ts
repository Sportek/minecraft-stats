import { DateTime } from 'luxon'
import { BaseModel, belongsTo, column, hasMany } from '@adonisjs/lucid/orm'
import type { BelongsTo, HasMany } from '@adonisjs/lucid/types/relations'
import User from '#models/user'
import PostTranslation from '#models/post_translation'

export default class Post extends BaseModel {
  @column({ isPrimary: true })
  declare id: number

  @column()
  declare coverImage: string | null

  @column()
  declare published: boolean

  // Compteur de vues brut (cf. migration). Incrémenté pour chaque lecteur, sans
  // donnée personnelle ; partagé entre toutes les traductions de l'article.
  @column()
  declare viewCount: number

  // Langue principale de l'article : sert de fallback quand la locale demandée
  // n'a pas de traduction.
  @column()
  declare defaultLocale: string

  @column.dateTime()
  declare publishedAt: DateTime | null

  @column()
  declare userId: number

  @belongsTo(() => User)
  declare author: BelongsTo<typeof User>

  @hasMany(() => PostTranslation)
  declare translations: HasMany<typeof PostTranslation>

  @column.dateTime({ autoCreate: true })
  declare createdAt: DateTime

  @column.dateTime({ autoCreate: true, autoUpdate: true })
  declare updatedAt: DateTime

  /**
   * Résout le contenu pour une locale : traduction demandée, sinon langue
   * principale, sinon première disponible. `translations` doit être préchargé.
   */
  forLocale(locale: string) {
    const translations = this.translations ?? []
    const wanted =
      translations.find((t) => t.locale === locale) ??
      translations.find((t) => t.locale === this.defaultLocale) ??
      translations[0]

    return {
      title: wanted?.title ?? '',
      slug: wanted?.slug ?? '',
      content: wanted?.content ?? '',
      excerpt: wanted?.excerpt ?? null,
      localeUsed: wanted?.locale ?? this.defaultLocale,
    }
  }

  /** Map locale → slug des traductions existantes (préchargées). */
  slugsByLocale(): Record<string, string> {
    const slugs: Record<string, string> = {}
    for (const translation of this.translations ?? []) {
      slugs[translation.locale] = translation.slug
    }
    return slugs
  }
}
