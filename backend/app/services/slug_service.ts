import string from '@adonisjs/core/helpers/string'
import PostTranslation from '#models/post_translation'

export class SlugService {
  /**
   * Génère un slug URL-safe unique pour une locale. Déduplique contre les
   * traductions de la même langue (les collisions entre langues sont permises),
   * en ignorant optionnellement une traduction (utile en mise à jour).
   */
  static async uniqueSlug(locale: string, source: string, ignoreId?: number): Promise<string> {
    let slug = string.slug(source, { lower: true, strict: true }) || `post-${Date.now()}`

    const query = PostTranslation.query().where('locale', locale).where('slug', slug)
    if (ignoreId) {
      query.whereNot('id', ignoreId)
    }
    const existing = await query.first()
    if (existing) {
      slug = `${slug}-${Date.now()}`
    }

    return slug
  }
}
