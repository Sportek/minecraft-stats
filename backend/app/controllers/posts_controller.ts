import Post from '#models/post'
import PostTranslation from '#models/post_translation'
import PostPolicy from '#policies/post_policy'
import PlaceholderService from '#services/placeholder_service'
import { SlugService } from '#services/slug_service'
import {
  CreatePostValidator,
  PreviewPlaceholderValidator,
  ResolvePlaceholdersValidator,
  SubmitFeedbackValidator,
  UpdatePostValidator,
} from '#validators/post'
import type { HttpContext } from '@adonisjs/core/http'
import db from '@adonisjs/lucid/services/db'
import { DateTime } from 'luxon'

const SUPPORTED_LOCALES = ['fr', 'en'] as const
const DEFAULT_LOCALE = 'en'

/** Locale demandée via `?locale=`, validée contre les locales supportées. */
function resolveLocale(value: unknown): string {
  return SUPPORTED_LOCALES.includes(value as never) ? (value as string) : DEFAULT_LOCALE
}

function serializeAuthor(post: Post) {
  if (!post.author) return undefined
  return { id: post.author.id, username: post.author.username, avatarUrl: post.author.avatarUrl }
}

/** Forme publique : champs article + traduction résolue (avec fallback) + slugs. */
function serializePost(post: Post, locale: string) {
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
    author: serializeAuthor(post),
  }
}

/** Forme admin : la forme publique (langue principale) + toutes les traductions brutes. */
function serializeAdminPost(post: Post) {
  return {
    ...serializePost(post, post.defaultLocale),
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

export default class PostsController {
  /**
   * @listPosts
   * @operationId listPosts
   * @tag POSTS
   * @summary List published posts
   * @description Returns a paginated list of published posts ordered by `published_at` descending. Each post is resolved to the requested `?locale` (falling back to the post's primary language) and includes its author and per-locale `slugs`. Publicly accessible.
   * @paramQuery page - Page number (default 1) - @type(number) @example(1)
   * @paramQuery limit - Number of items per page (default 10) - @type(number) @example(10)
   * @paramQuery locale - UI locale to resolve content for: `fr` or `en` (default `en`) - @type(string) @example(fr)
   * @responseBody 200 - {"meta": {"total": 42, "perPage": 10, "currentPage": 1, "lastPage": 5}, "data": [{"id": 1, "title": "Welcome", "slug": "welcome", "content": "<p>Hello</p>", "excerpt": "Hello", "coverImage": "/images/blog/cover.webp", "published": true, "publishedAt": "2026-05-28T12:00:00.000Z", "defaultLocale": "en", "localeUsed": "en", "slugs": {"en": "welcome", "fr": "bienvenue"}, "userId": 1, "createdAt": "2026-05-20T12:00:00.000Z", "updatedAt": "2026-05-28T12:00:00.000Z", "author": {"id": 1, "username": "admin", "avatarUrl": ""}}]}
   */
  async index({ request, response }: HttpContext) {
    const page = Math.max(1, Number.parseInt(request.input('page', 1), 10) || 1)
    const limit = Math.min(100, Math.max(1, Number.parseInt(request.input('limit', 10), 10) || 10))
    const locale = resolveLocale(request.input('locale'))

    const posts = await Post.query()
      .where('published', true)
      .whereNotNull('published_at')
      .preload('author', (query) => {
        query.select('id', 'username', 'avatarUrl')
      })
      .preload('translations')
      .orderBy('published_at', 'desc')
      .paginate(page, limit)

    return response.ok({
      meta: posts.toJSON().meta,
      data: posts.all().map((post) => serializePost(post, locale)),
    })
  }

  /**
   * @showPost
   * @operationId showPost
   * @tag POSTS
   * @summary Get a published post by slug
   * @description Returns a single published post matched by slug within the requested `?locale`. If no translation matches the slug in that locale, it resolves by slug across locales and falls back to the post's primary language. Content keeps its raw placeholder tokens (resolved client-side). Returns 404 if no published post matches. Publicly accessible.
   * @paramPath slug - Slug of the post (per-locale) - @type(string) @example(welcome-post) @required
   * @paramQuery locale - UI locale to resolve content for: `fr` or `en` (default `en`) - @type(string) @example(fr)
   * @responseBody 200 - <Post>
   * @responseBody 404 - {"message": "Post not found"}
   */
  async show({ params, request, response, i18n }: HttpContext) {
    const locale = resolveLocale(request.input('locale'))

    // 1. Slug exact dans la locale demandée ; 2. sinon n'importe quelle locale
    // (cas fallback : on visite le slug de la langue principale sous une autre UI).
    const translation =
      (await PostTranslation.query().where('locale', locale).where('slug', params.slug).first()) ??
      (await PostTranslation.query().where('slug', params.slug).first())

    if (!translation) {
      return response.notFound({ message: i18n.t('messages.posts.notFound') })
    }

    const post = await Post.query()
      .where('id', translation.postId)
      .where('published', true)
      .preload('author', (query) => {
        query.select('id', 'username', 'avatarUrl')
      })
      .preload('translations')
      .first()

    if (!post) {
      return response.notFound({ message: i18n.t('messages.posts.notFound') })
    }

    return response.ok(serializePost(post, locale))
  }

  /**
   * @recordPostView
   * @operationId recordPostView
   * @tag POSTS
   * @summary Record a view for a published post
   * @description Increments the raw view counter of the post owning this slug. The counter is shared across all of a post's translations. Consent-exempt, best-effort, always `204`. Publicly accessible.
   * @paramPath slug - Slug of the post (per-locale) - @type(string) @example(welcome-post) @required
   * @responseBody 204 - No content
   */
  async recordView({ params, response }: HttpContext) {
    const translation = await PostTranslation.query().where('slug', params.slug).first()
    if (translation) {
      await Post.query()
        .where('id', translation.postId)
        .where('published', true)
        .increment('view_count', 1)
    }

    return response.noContent()
  }

  /**
   * @submitPostFeedback
   * @operationId submitPostFeedback
   * @tag POSTS
   * @summary Submit "was this article helpful?" feedback
   * @description Records whether the reader found the article helpful, keyed at the post level (shared across translations) and deduplicated by the anonymous `visitorId`. Returns 404 if no published post matches the slug. Publicly accessible.
   * @paramPath slug - Slug of the post (per-locale) - @type(string) @example(welcome-post) @required
   * @requestBody {"helpful": true, "visitorId": "f47ac10b-58cc-4372-a567-0e02b2c3d479"}
   * @responseBody 204 - No content
   * @responseBody 404 - {"error": "Post not found"}
   * @responseBody 422 - {"errors": [{"message": "The helpful field must be defined", "field": "helpful", "rule": "required"}]}
   */
  async submitFeedback({ params, request, response, auth, i18n }: HttpContext) {
    const translation = await PostTranslation.query().where('slug', params.slug).first()
    const post = translation
      ? await Post.query().where('id', translation.postId).where('published', true).first()
      : null
    if (!post) {
      return response.notFound({ error: i18n.t('messages.posts.notFound') })
    }

    const { helpful, visitorId } = await request.validateUsing(SubmitFeedbackValidator)

    // L'endpoint est public : on lit l'utilisateur s'il est connecté sans l'imposer.
    await auth.check()

    const now = DateTime.now().toSQL()
    await db
      .table('post_feedbacks')
      .insert({
        post_id: post.id,
        visitor_id: visitorId,
        user_id: auth.user?.id ?? null,
        helpful,
        created_at: now,
        updated_at: now,
      })
      .onConflict(['post_id', 'visitor_id'])
      .merge({ helpful, user_id: auth.user?.id ?? null, updated_at: now })

    return response.noContent()
  }

  /**
   * @resolvePlaceholders
   * @operationId resolvePlaceholders
   * @tag POSTS
   * @summary Resolve content placeholders to their current values
   * @description Resolves a batch of placeholder tokens to their live values. Returns a map of token → value. Publicly accessible.
   * @requestBody {"placeholders": ["%PLAYER_COUNT_REALTIME_125%", "%SERVER_VERSION_125%"]}
   * @responseBody 200 - {"%PLAYER_COUNT_REALTIME_125%": "42", "%SERVER_VERSION_125%": "1.21.4"}
   * @responseBody 422 - {"errors": [{"message": "The placeholders field must be defined", "field": "placeholders", "rule": "required"}]}
   */
  async resolvePlaceholders({ request, response }: HttpContext) {
    const { placeholders } = await request.validateUsing(ResolvePlaceholdersValidator)
    const values = await PlaceholderService.resolveTokens(placeholders)
    return response.ok(values)
  }

  /**
   * @adminListPosts
   * @operationId adminListPosts
   * @tag POSTS_ADMIN
   * @summary List all posts (admin/writer)
   * @description Returns a paginated list of posts including drafts, shown in each post's primary language with the list of `availableLocales`. Writers only see their own posts. Requires `manage` ability.
   * @paramQuery page - Page number (default 1) - @type(number) @example(1)
   * @paramQuery limit - Number of items per page (default 20) - @type(number) @example(20)
   * @paramQuery status - Filter by status: `all`, `published`, or `draft` (default `all`) - @type(string) @example(all)
   * @responseBody 200 - {"meta": {"total": 42, "perPage": 20, "currentPage": 1, "lastPage": 3}, "data": [{"id": 1, "title": "Draft", "slug": "draft", "defaultLocale": "en", "availableLocales": ["en"], "published": false, "author": {"id": 1, "username": "writer", "avatarUrl": ""}}]}
   * @responseBody 401 - {"error": "Unauthorized"}
   * @responseBody 403 - {"error": "Access denied. Writer privileges required."}
   */
  async adminIndex({ request, response, auth, bouncer, i18n }: HttpContext) {
    const user = auth.user
    if (!user) {
      return response.unauthorized({ error: i18n.t('messages.posts.unauthorized') })
    }

    if (await bouncer.with(PostPolicy).denies('manage')) {
      return response.forbidden({ error: i18n.t('messages.posts.writerRequired') })
    }

    const page = Math.max(1, Number.parseInt(request.input('page', 1), 10) || 1)
    const limit = Math.min(100, Math.max(1, Number.parseInt(request.input('limit', 20), 10) || 20))
    const status = request.input('status', 'all')

    const query = Post.query()
      .preload('author', (authorQuery) => {
        authorQuery.select('id', 'username', 'avatarUrl')
      })
      .preload('translations')

    if (user.role === 'writer') {
      query.where('user_id', user.id)
    }

    if (status === 'published') {
      query.where('published', true)
    } else if (status === 'draft') {
      query.where('published', false)
    }

    const posts = await query.orderBy('created_at', 'desc').paginate(page, limit)

    return response.ok({
      meta: posts.toJSON().meta,
      data: posts.all().map((post) => serializeAdminPost(post)),
    })
  }

  /**
   * @adminShowPost
   * @operationId adminShowPost
   * @tag POSTS_ADMIN
   * @summary Get a single post with all its translations (admin/writer)
   * @description Returns one post including every translation (title/slug/content/excerpt per locale), the shared cover image and `defaultLocale`. Used by the edit screen. Writers may only access their own posts. Requires `update` ability.
   * @paramPath id - Post id - @type(number) @example(7) @required
   * @responseBody 200 - <Post>
   * @responseBody 401 - {"error": "Unauthorized"}
   * @responseBody 403 - {"error": "Access denied. You can only update your own posts."}
   * @responseBody 404 - {"message": "Row not found", "code": "E_ROW_NOT_FOUND"}
   */
  async adminShow({ params, response, auth, bouncer, i18n }: HttpContext) {
    const user = auth.user
    if (!user) {
      return response.unauthorized({ error: i18n.t('messages.posts.unauthorized') })
    }

    const post = await Post.query()
      .where('id', params.id)
      .preload('author', (query) => {
        query.select('id', 'username', 'avatarUrl')
      })
      .preload('translations')
      .firstOrFail()

    if (await bouncer.with(PostPolicy).denies('update', post)) {
      return response.forbidden({ error: i18n.t('messages.posts.updateOwnOnly') })
    }

    return response.ok(serializeAdminPost(post))
  }

  /**
   * @createPost
   * @operationId createPost
   * @tag POSTS_ADMIN
   * @summary Create a new post
   * @description Creates an unpublished draft owned by the authenticated user, with one or more translations and a shared cover image. The translation in `defaultLocale` is required. Slugs are generated per locale. Requires `manage` ability.
   * @requestBody <CreatePostValidator>
   * @responseBody 201 - <Post>
   * @responseBody 401 - {"error": "Unauthorized"}
   * @responseBody 403 - {"error": "Access denied. Writer privileges required."}
   * @responseBody 422 - {"errors": [{"message": "A translation in the primary language is required.", "field": "translations", "rule": "required"}]}
   */
  async store({ request, auth, response, bouncer, i18n }: HttpContext) {
    const user = auth.user
    if (!user) {
      return response.unauthorized({ error: i18n.t('messages.posts.unauthorized') })
    }

    if (await bouncer.with(PostPolicy).denies('manage')) {
      return response.forbidden({ error: i18n.t('messages.posts.writerRequired') })
    }

    const data = await request.validateUsing(CreatePostValidator)

    if (!data.translations.some((t) => t.locale === data.defaultLocale)) {
      return response.unprocessableEntity({
        errors: [
          {
            message: i18n.t('messages.posts.missingDefaultTranslation'),
            field: 'translations',
            rule: 'required',
          },
        ],
      })
    }

    const post = await db.transaction(async (trx) => {
      const created = await Post.create(
        {
          userId: user.id,
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

    return response.created(serializeAdminPost(post))
  }

  /**
   * @updatePost
   * @operationId updatePost
   * @tag POSTS_ADMIN
   * @summary Update an existing post
   * @description Updates the shared fields (cover image, primary language) and upserts the provided translations. A translation's slug is only regenerated when a `slug` is supplied (URLs stay stable otherwise). New locales can be added. Requires `update` ability.
   * @paramPath id - Post id - @type(number) @example(7) @required
   * @requestBody <UpdatePostValidator>
   * @responseBody 200 - <Post>
   * @responseBody 401 - {"error": "Unauthorized"}
   * @responseBody 403 - {"error": "Access denied. You can only update your own posts."}
   * @responseBody 404 - {"message": "Row not found", "code": "E_ROW_NOT_FOUND"}
   */
  async update({ params, request, response, auth, bouncer, i18n }: HttpContext) {
    const user = auth.user
    if (!user) {
      return response.unauthorized({ error: i18n.t('messages.posts.unauthorized') })
    }

    const post = await Post.findOrFail(params.id)

    if (await bouncer.with(PostPolicy).denies('update', post)) {
      return response.forbidden({ error: i18n.t('messages.posts.updateOwnOnly') })
    }

    const data = await request.validateUsing(UpdatePostValidator)

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

    return response.ok(serializeAdminPost(post))
  }

  /**
   * @deletePost
   * @operationId deletePost
   * @tag POSTS_ADMIN
   * @summary Delete a post
   * @description Permanently deletes a post and its translations (cascade). Writers may only delete their own posts. Requires `destroy` ability.
   * @paramPath id - Post id - @type(number) @example(7) @required
   * @responseBody 204 - {}
   * @responseBody 401 - {"error": "Unauthorized"}
   * @responseBody 403 - {"error": "Access denied. You can only delete your own posts."}
   * @responseBody 404 - {"message": "Row not found", "code": "E_ROW_NOT_FOUND"}
   */
  async destroy({ params, response, auth, bouncer, i18n }: HttpContext) {
    const user = auth.user
    if (!user) {
      return response.unauthorized({ error: i18n.t('messages.posts.unauthorized') })
    }

    const post = await Post.findOrFail(params.id)

    if (await bouncer.with(PostPolicy).denies('destroy', post)) {
      return response.forbidden({ error: i18n.t('messages.posts.deleteOwnOnly') })
    }

    await post.delete()

    return response.noContent()
  }

  /**
   * @publishPost
   * @operationId publishPost
   * @tag POSTS_ADMIN
   * @summary Publish a post
   * @description Marks a post as published and sets `publishedAt`. Requires `publish` ability.
   * @paramPath id - Post id - @type(number) @example(7) @required
   * @responseBody 200 - <Post>
   * @responseBody 401 - {"error": "Unauthorized"}
   * @responseBody 403 - {"error": "Access denied. You can only publish your own posts."}
   * @responseBody 404 - {"message": "Row not found", "code": "E_ROW_NOT_FOUND"}
   */
  async publish({ params, response, auth, bouncer, i18n }: HttpContext) {
    const user = auth.user
    if (!user) {
      return response.unauthorized({ error: i18n.t('messages.posts.unauthorized') })
    }

    const post = await Post.findOrFail(params.id)

    if (await bouncer.with(PostPolicy).denies('publish', post)) {
      return response.forbidden({ error: i18n.t('messages.posts.publishOwnOnly') })
    }

    post.published = true
    post.publishedAt = DateTime.now()
    await post.save()

    await post.load('author')
    await post.load('translations')

    return response.ok(serializeAdminPost(post))
  }

  /**
   * @unpublishPost
   * @operationId unpublishPost
   * @tag POSTS_ADMIN
   * @summary Unpublish a post
   * @description Marks a post as unpublished and clears `publishedAt`. Requires `publish` ability.
   * @paramPath id - Post id - @type(number) @example(7) @required
   * @responseBody 200 - <Post>
   * @responseBody 401 - {"error": "Unauthorized"}
   * @responseBody 403 - {"error": "Access denied. You can only unpublish your own posts."}
   * @responseBody 404 - {"message": "Row not found", "code": "E_ROW_NOT_FOUND"}
   */
  async unpublish({ params, response, auth, bouncer, i18n }: HttpContext) {
    const user = auth.user
    if (!user) {
      return response.unauthorized({ error: i18n.t('messages.posts.unauthorized') })
    }

    const post = await Post.findOrFail(params.id)

    if (await bouncer.with(PostPolicy).denies('publish', post)) {
      return response.forbidden({ error: i18n.t('messages.posts.unpublishOwnOnly') })
    }

    post.published = false
    post.publishedAt = null
    await post.save()

    await post.load('author')
    await post.load('translations')

    return response.ok(serializeAdminPost(post))
  }

  /**
   * @listPlaceholders
   * @operationId listPlaceholders
   * @tag POSTS
   * @summary List available content placeholders
   * @description Returns the catalog of placeholder tokens that can be embedded in post content. Publicly accessible.
   * @responseBody 200 - [{"name": "PLAYER_COUNT_REALTIME", "description": "Current number of online players", "example": "%PLAYER_COUNT_REALTIME_125%"}]
   */
  async getPlaceholders({ response }: HttpContext) {
    const placeholders = PlaceholderService.getAvailablePlaceholders()
    return response.ok(placeholders)
  }

  /**
   * @previewPlaceholder
   * @operationId previewPlaceholder
   * @tag POSTS_ADMIN
   * @summary Preview a placeholder substitution
   * @description Resolves a single placeholder for a given server. Requires `manage` ability.
   * @requestBody {"placeholderName": "PLAYER_COUNT_REALTIME", "serverId": "125"}
   * @responseBody 200 - {"placeholder": "%PLAYER_COUNT_REALTIME_125%", "value": "42", "serverId": 125, "placeholderName": "PLAYER_COUNT_REALTIME"}
   * @responseBody 401 - {"error": "Unauthorized"}
   * @responseBody 403 - {"error": "Access denied. Writer privileges required."}
   * @responseBody 422 - {"errors": [{"message": "The serverId field must be defined", "field": "serverId", "rule": "required"}]}
   */
  async previewPlaceholder({ request, response, auth, bouncer, i18n }: HttpContext) {
    const user = auth.user
    if (!user) {
      return response.unauthorized({ error: i18n.t('messages.posts.unauthorized') })
    }

    if (await bouncer.with(PostPolicy).denies('manage')) {
      return response.forbidden({ error: i18n.t('messages.posts.writerRequired') })
    }

    const { placeholderName, serverId } = await request.validateUsing(PreviewPlaceholderValidator)

    const placeholder = `%${placeholderName}_${serverId}%`
    const result = await PlaceholderService.replacePlaceholders(placeholder)

    return response.ok({
      placeholder,
      value: result,
      serverId,
      placeholderName,
    })
  }

  /**
   * @adminPostStats
   * @operationId adminPostStats
   * @tag POSTS_ADMIN
   * @summary Post views & feedback statistics (admin/writer)
   * @description Returns engagement statistics for a post, aggregating analytics across every per-locale slug path (`/blog/{slug}`). Requires `update` ability.
   * @paramPath id - Post id - @type(number) @example(7) @required
   * @responseBody 200 - {"post": {"id": 7, "title": "Welcome", "slugs": {"en": "welcome"}, "viewCount": 1234}, "views": {"total": 1234, "consented": 800, "loggedIn": 120, "uniqueVisitors": 640}, "feedback": {"helpful": 42, "notHelpful": 3}, "recentViewers": [{"id": 1, "username": "gabriel", "avatarUrl": "", "lastViewedAt": "2026-06-26T12:00:00.000Z"}]}
   * @responseBody 401 - {"error": "Unauthorized"}
   * @responseBody 403 - {"error": "Access denied. You can only view stats for your own posts."}
   * @responseBody 404 - {"message": "Row not found", "code": "E_ROW_NOT_FOUND"}
   */
  async adminStats({ params, response, auth, bouncer, i18n }: HttpContext) {
    const user = auth.user
    if (!user) {
      return response.unauthorized({ error: i18n.t('messages.posts.unauthorized') })
    }

    const post = await Post.query().where('id', params.id).preload('translations').firstOrFail()

    if (await bouncer.with(PostPolicy).denies('update', post)) {
      return response.forbidden({
        error: i18n.t('messages.posts.viewStatsOwnOnly'),
      })
    }

    // L'analytics enregistre les vues par chemin exact ; un article a un chemin
    // par langue (slug par locale), on agrège donc sur tous ses slugs.
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

    return response.ok({
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
    })
  }
}
