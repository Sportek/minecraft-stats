import Post from '#models/post'
import PostTranslation from '#models/post_translation'
import { SlugService } from '#services/slug_service'
import { type CreatePostValidator, type UpdatePostValidator } from '#validators/post'
import db from '@adonisjs/lucid/services/db'
import { DateTime } from 'luxon'

type CreatePostData = Awaited<ReturnType<typeof CreatePostValidator.validate>>
type UpdatePostData = Awaited<ReturnType<typeof UpdatePostValidator.validate>>

export interface PostFeedbackInput {
  helpful: boolean
  visitorId: string
  userId: number | null
}

/**
 * Logique métier des articles — extraite du controller (qui était le plus gros du
 * repo) pour être testable et pour que les transactions, la génération de slug,
 * l'upsert de traductions, la sérialisation et l'agrégation analytics vivent au
 * même endroit plutôt que dispersées dans les handlers HTTP.
 */
export default class PostService {
  // ---------------------------------------------------------------------------
  // Sérialisation
  // ---------------------------------------------------------------------------

  static serializeAuthor(post: Post) {
    if (!post.author) return undefined
    return { id: post.author.id, username: post.author.username, avatarUrl: post.author.avatarUrl }
  }

  /** Forme publique : champs article + traduction résolue (avec fallback) + slugs. */
  static serialize(post: Post, locale: string) {
    const resolved = post.forLocale(locale)
    return {
      id: post.id,
      title: resolved.title,
      slug: resolved.slug,
      content: resolved.content,
      excerpt: resolved.excerpt,
      coverImage: post.coverImage,
      published: post.published,
      viewCount: post.viewCount,
      publishedAt: post.publishedAt,
      defaultLocale: post.defaultLocale,
      localeUsed: resolved.localeUsed,
      slugs: post.slugsByLocale(),
      userId: post.userId,
      createdAt: post.createdAt,
      updatedAt: post.updatedAt,
      author: this.serializeAuthor(post),
    }
  }

  /** Forme admin : la forme publique (langue principale) + toutes les traductions brutes. */
  static serializeAdmin(post: Post) {
    return {
      ...this.serialize(post, post.defaultLocale),
      availableLocales: post.translations.map((t) => t.locale),
      translations: post.translations.map((t) => ({
        locale: t.locale,
        title: t.title,
        slug: t.slug,
        content: t.content,
        excerpt: t.excerpt,
      })),
    }
  }

  // ---------------------------------------------------------------------------
  // Écritures
  // ---------------------------------------------------------------------------

  /** Crée un brouillon + ses traductions (slugs générés par locale) dans une transaction. */
  static async create(userId: number, data: CreatePostData): Promise<Post> {
    const post = await db.transaction(async (trx) => {
      const created = await Post.create(
        {
          userId,
          published: false,
          coverImage: data.coverImage || null,
          defaultLocale: data.defaultLocale,
        },
        { client: trx }
      )

      for (const translation of data.translations) {
        const slug = await SlugService.uniqueSlug(
          translation.locale,
          translation.slug || translation.title
        )
        await created.related('translations').create({
          locale: translation.locale,
          title: translation.title,
          slug,
          content: translation.content,
          excerpt: translation.excerpt || null,
        })
      }

      return created
    })

    await post.load('author')
    await post.load('translations')
    return post
  }

  /** Met à jour les champs partagés et upsert les traductions fournies. */
  static async update(post: Post, data: UpdatePostData): Promise<Post> {
    await db.transaction(async (trx) => {
      post.useTransaction(trx)
      if (data.defaultLocale !== undefined) post.defaultLocale = data.defaultLocale
      if (data.coverImage !== undefined) post.coverImage = data.coverImage || null
      await post.save()

      for (const entry of data.translations ?? []) {
        const existing = await PostTranslation.query({ client: trx })
          .where('post_id', post.id)
          .where('locale', entry.locale)
          .first()

        if (existing) {
          if (entry.title !== undefined) existing.title = entry.title
          if (entry.content !== undefined) existing.content = entry.content
          if (entry.excerpt !== undefined) existing.excerpt = entry.excerpt || null
          if (entry.slug !== undefined) {
            existing.slug = await SlugService.uniqueSlug(entry.locale, entry.slug, existing.id)
          }
          existing.useTransaction(trx)
          await existing.save()
        } else if (entry.title && entry.content) {
          // Nouvelle langue : nécessite au minimum titre + contenu.
          const slug = await SlugService.uniqueSlug(entry.locale, entry.slug || entry.title)
          await post.related('translations').create({
            locale: entry.locale,
            title: entry.title,
            slug,
            content: entry.content,
            excerpt: entry.excerpt || null,
          })
        }
      }
    })

    await post.load('author')
    await post.load('translations')
    return post
  }

  /** Bascule l'état de publication et (dé)positionne `publishedAt`. */
  static async setPublished(post: Post, published: boolean): Promise<Post> {
    post.published = published
    post.publishedAt = published ? DateTime.now() : null
    await post.save()
    await post.load('author')
    await post.load('translations')
    return post
  }

  /** Incrémente le compteur de vues (partagé entre toutes les traductions). */
  static async recordView(slug: string): Promise<void> {
    const translation = await PostTranslation.query().where('slug', slug).first()
    if (translation) {
      await Post.query()
        .where('id', translation.postId)
        .where('published', true)
        .increment('view_count', 1)
    }
  }

  /** Enregistre un feedback « article utile ? », dédupliqué par visiteur anonyme. */
  static async recordFeedback(post: Post, input: PostFeedbackInput): Promise<void> {
    const now = DateTime.now().toSQL()
    await db
      .table('post_feedbacks')
      .insert({
        post_id: post.id,
        visitor_id: input.visitorId,
        user_id: input.userId,
        helpful: input.helpful,
        created_at: now,
        updated_at: now,
      })
      .onConflict(['post_id', 'visitor_id'])
      .merge({ helpful: input.helpful, user_id: input.userId, updated_at: now })
  }

  // ---------------------------------------------------------------------------
  // Analytics d'engagement
  // ---------------------------------------------------------------------------

  /**
   * Agrège vues + feedback + lecteurs récents d'un article. L'analytics enregistre
   * les vues par chemin exact ; un article a un chemin par langue (slug par locale),
   * on agrège donc sur tous ses slugs. Sort les requêtes SQL analytics hors du
   * controller.
   */
  static async engagement(post: Post) {
    const paths = post.translations.map((t) => `/blog/${t.slug}`)
    const resolved = post.forLocale(post.defaultLocale)

    const [analyticsRow, feedbackRow, recentViewers] = await Promise.all([
      db
        .from('page_views')
        .whereIn('path', paths)
        .select(db.raw('count(*) as consented_views'))
        .select(db.raw('count(*) filter (where user_id is not null) as logged_in_views'))
        .select(db.raw('count(distinct visitor_id) as unique_visitors'))
        .first(),

      db
        .from('post_feedbacks')
        .where('post_id', post.id)
        .select(db.raw('count(*) filter (where helpful) as helpful'))
        .select(db.raw('count(*) filter (where not helpful) as not_helpful'))
        .first(),

      db
        .from('page_views')
        .join('users', 'users.id', 'page_views.user_id')
        .whereIn('page_views.path', paths)
        .select('users.id as id', 'users.username as username', 'users.avatar_url as avatar_url')
        .select(db.raw('max(page_views.created_at) as last_viewed_at'))
        .groupBy('users.id', 'users.username', 'users.avatar_url')
        .orderByRaw('max(page_views.created_at) desc')
        .limit(50),
    ])

    return {
      post: {
        id: post.id,
        title: resolved.title,
        slugs: post.slugsByLocale(),
        viewCount: post.viewCount,
      },
      views: {
        total: post.viewCount,
        consented: Number(analyticsRow?.consented_views ?? 0),
        loggedIn: Number(analyticsRow?.logged_in_views ?? 0),
        uniqueVisitors: Number(analyticsRow?.unique_visitors ?? 0),
      },
      feedback: {
        helpful: Number(feedbackRow?.helpful ?? 0),
        notHelpful: Number(feedbackRow?.not_helpful ?? 0),
      },
      recentViewers: recentViewers.map((row) => ({
        id: Number(row.id),
        username: row.username,
        avatarUrl: row.avatar_url,
        lastViewedAt: row.last_viewed_at,
      })),
    }
  }
}
