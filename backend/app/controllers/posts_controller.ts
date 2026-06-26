import Post from '#models/post'
import PostPolicy from '#policies/post_policy'
import PlaceholderService from '#services/placeholder_service'
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

export default class PostsController {
  /**
   * @listPosts
   * @operationId listPosts
   * @tag POSTS
   * @summary List published posts
   * @description Returns a paginated list of published posts ordered by `published_at` descending. Each post includes its author (id, username, avatarUrl). Publicly accessible.
   * @paramQuery page - Page number (default 1) - @type(number) @example(1)
   * @paramQuery limit - Number of items per page (default 10) - @type(number) @example(10)
   * @responseBody 200 - {"meta": {"total": 42, "perPage": 10, "currentPage": 1, "lastPage": 5}, "data": [{"id": 1, "title": "Welcome", "slug": "welcome", "content": "<p>Hello</p>", "excerpt": "Hello", "coverImage": "/images/blog/cover.webp", "published": true, "publishedAt": "2026-05-28T12:00:00.000Z", "userId": 1, "createdAt": "2026-05-20T12:00:00.000Z", "updatedAt": "2026-05-28T12:00:00.000Z", "author": {"id": 1, "username": "admin", "avatarUrl": ""}}]}
   */
  async index({ request, response }: HttpContext) {
    const page = Math.max(1, Number.parseInt(request.input('page', 1), 10) || 1)
    const limit = Math.min(100, Math.max(1, Number.parseInt(request.input('limit', 10), 10) || 10))

    const posts = await Post.query()
      .where('published', true)
      .whereNotNull('published_at')
      .preload('author', (query) => {
        query.select('id', 'username', 'avatarUrl')
      })
      .orderBy('published_at', 'desc')
      .paginate(page, limit)

    return response.ok(posts)
  }

  /**
   * @showPost
   * @operationId showPost
   * @tag POSTS
   * @summary Get a published post by slug
   * @description Returns a single published post identified by its slug. Content is returned with its raw placeholder tokens (e.g. `%PLAYER_COUNT_REALTIME_125%`) intact — the client resolves them asynchronously via `POST /posts/placeholders/resolve` so the article renders immediately. Returns 404 if no published post matches the slug. Publicly accessible.
   * @paramPath slug - Unique slug of the post - @type(string) @example(welcome-post) @required
   * @responseBody 200 - <Post>
   * @responseBody 404 - {"message": "Row not found", "code": "E_ROW_NOT_FOUND"}
   */
  async show({ params, response }: HttpContext) {
    const post = await Post.query()
      .where('slug', params.slug)
      .where('published', true)
      .preload('author', (val) => {
        val.select('id', 'username', 'avatarUrl')
      })
      .firstOrFail()

    return response.ok(post)
  }

  /**
   * @recordPostView
   * @operationId recordPostView
   * @tag POSTS
   * @summary Record a view for a published post
   * @description Increments the raw view counter of a published post. Consent-exempt and best-effort: it stores only an aggregate counter (no visitor or account identifier), so it counts every reader — logged in or not, consent given or not — on the same privacy basis as the anonymous analytics hit. Detailed, consent-aware attribution (who viewed) is captured separately by the analytics page-view pipeline. Always responds `204 No Content`. Publicly accessible.
   * @paramPath slug - Unique slug of the post - @type(string) @example(welcome-post) @required
   * @responseBody 204 - No content
   */
  async recordView({ params, response }: HttpContext) {
    await Post.query()
      .where('slug', params.slug)
      .where('published', true)
      .increment('view_count', 1)

    return response.noContent()
  }

  /**
   * @submitPostFeedback
   * @operationId submitPostFeedback
   * @tag POSTS
   * @summary Submit "was this article helpful?" feedback
   * @description Records whether the reader found the article helpful. Deduplicated by the anonymous `visitorId` (one vote per device per post); re-submitting updates the existing vote. When the request carries a valid bearer token the vote is also attributed to the logged-in account. Aggregate results are visible to admins/writers only. Returns 404 if no published post matches the slug. Publicly accessible.
   * @paramPath slug - Unique slug of the post - @type(string) @example(welcome-post) @required
   * @requestBody {"helpful": true, "visitorId": "f47ac10b-58cc-4372-a567-0e02b2c3d479"}
   * @responseBody 204 - No content
   * @responseBody 404 - {"error": "Post not found"}
   * @responseBody 422 - {"errors": [{"message": "The helpful field must be defined", "field": "helpful", "rule": "required"}]}
   */
  async submitFeedback({ params, request, response, auth }: HttpContext) {
    const post = await Post.query().where('slug', params.slug).where('published', true).first()
    if (!post) {
      return response.notFound({ error: 'Post not found' })
    }

    const { helpful, visitorId } = await request.validateUsing(SubmitFeedbackValidator)

    // L'endpoint est public : on lit l'utilisateur s'il est connecté sans l'imposer,
    // pour qu'un visiteur anonyme puisse aussi voter.
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
   * @description Resolves a batch of placeholder tokens (e.g. `%PLAYER_COUNT_REALTIME_125%`) to their live values in a single request. Returns a map of token → value. Unknown servers resolve to a `[Server N not found]` marker. Used by the blog client to fill placeholders after the article has rendered. Publicly accessible.
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
   * @description Returns a paginated list of posts including drafts. Writers only see their own posts, admins see every post. Each post includes its author (id, username, avatarUrl). Requires authentication and `manage` ability on the Post policy.
   * @paramQuery page - Page number (default 1) - @type(number) @example(1)
   * @paramQuery limit - Number of items per page (default 20) - @type(number) @example(20)
   * @paramQuery status - Filter by status: `all`, `published`, or `draft` (default `all`) - @type(string) @example(all)
   * @responseBody 200 - {"meta": {"total": 42, "perPage": 20, "currentPage": 1, "lastPage": 3}, "data": [{"id": 1, "title": "Draft", "slug": "draft", "content": "<p>WIP</p>", "excerpt": "", "coverImage": "", "published": false, "publishedAt": "", "userId": 1, "createdAt": "2026-05-20T12:00:00.000Z", "updatedAt": "2026-05-28T12:00:00.000Z", "author": {"id": 1, "username": "writer", "avatarUrl": ""}}]}
   * @responseBody 401 - {"error": "Unauthorized"}
   * @responseBody 403 - {"error": "Access denied. Writer privileges required."}
   */
  async adminIndex({ request, response, auth, bouncer }: HttpContext) {
    const user = auth.user
    if (!user) {
      return response.unauthorized({ error: 'Unauthorized' })
    }

    if (await bouncer.with(PostPolicy).denies('manage')) {
      return response.forbidden({ error: 'Access denied. Writer privileges required.' })
    }

    const page = Math.max(1, Number.parseInt(request.input('page', 1), 10) || 1)
    const limit = Math.min(100, Math.max(1, Number.parseInt(request.input('limit', 20), 10) || 20))
    const status = request.input('status', 'all') // all, published, draft

    const query = Post.query().preload('author', (authorQuery) => {
      authorQuery.select('id', 'username', 'avatarUrl')
    })

    // Writers can only see their own posts, admins can see all
    if (user.role === 'writer') {
      query.where('user_id', user.id)
    }

    if (status === 'published') {
      query.where('published', true)
    } else if (status === 'draft') {
      query.where('published', false)
    }

    const posts = await query.orderBy('created_at', 'desc').paginate(page, limit)

    return response.ok(posts)
  }

  /**
   * @createPost
   * @operationId createPost
   * @tag POSTS_ADMIN
   * @summary Create a new post
   * @description Creates a new post owned by the authenticated user. The post is always created as an unpublished draft (`published: false`); use the publish endpoint to make it public. Requires authentication and `manage` ability on the Post policy.
   * @requestBody <CreatePostValidator>
   * @responseBody 201 - <Post>
   * @responseBody 401 - {"error": "Unauthorized"}
   * @responseBody 403 - {"error": "Access denied. Writer privileges required."}
   * @responseBody 422 - {"errors": [{"message": "The title field must be defined", "field": "title", "rule": "required"}]}
   */
  async store({ request, auth, response, bouncer }: HttpContext) {
    const user = auth.user
    if (!user) {
      return response.unauthorized({ error: 'Unauthorized' })
    }

    if (await bouncer.with(PostPolicy).denies('manage')) {
      return response.forbidden({ error: 'Access denied. Writer privileges required.' })
    }

    const data = await request.validateUsing(CreatePostValidator)

    const post = await Post.create({
      ...data,
      userId: user.id,
      published: false,
    })

    await post.load('author')

    return response.created(post)
  }

  /**
   * @updatePost
   * @operationId updatePost
   * @tag POSTS_ADMIN
   * @summary Update an existing post
   * @description Updates fields of an existing post. Writers may only update their own posts, admins may update any. Requires authentication and `update` ability on the Post policy. Returns 404 if the post does not exist.
   * @paramPath id - Post id - @type(number) @example(7) @required
   * @requestBody <UpdatePostValidator>
   * @responseBody 200 - <Post>
   * @responseBody 401 - {"error": "Unauthorized"}
   * @responseBody 403 - {"error": "Access denied. You can only update your own posts."}
   * @responseBody 404 - {"message": "Row not found", "code": "E_ROW_NOT_FOUND"}
   * @responseBody 422 - {"errors": [{"message": "The title field must have at least 3 characters", "field": "title", "rule": "minLength"}]}
   */
  async update({ params, request, response, auth, bouncer }: HttpContext) {
    const user = auth.user
    if (!user) {
      return response.unauthorized({ error: 'Unauthorized' })
    }

    const post = await Post.findOrFail(params.id)

    if (await bouncer.with(PostPolicy).denies('update', post)) {
      return response.forbidden({ error: 'Access denied. You can only update your own posts.' })
    }

    const data = await request.validateUsing(UpdatePostValidator)

    post.merge(data)
    await post.save()

    await post.load('author')

    return response.ok(post)
  }

  /**
   * @deletePost
   * @operationId deletePost
   * @tag POSTS_ADMIN
   * @summary Delete a post
   * @description Permanently deletes a post. Writers may only delete their own posts, admins may delete any. Requires authentication and `destroy` ability on the Post policy. Returns 404 if the post does not exist.
   * @paramPath id - Post id - @type(number) @example(7) @required
   * @responseBody 204 - {}
   * @responseBody 401 - {"error": "Unauthorized"}
   * @responseBody 403 - {"error": "Access denied. You can only delete your own posts."}
   * @responseBody 404 - {"message": "Row not found", "code": "E_ROW_NOT_FOUND"}
   */
  async destroy({ params, response, auth, bouncer }: HttpContext) {
    const user = auth.user
    if (!user) {
      return response.unauthorized({ error: 'Unauthorized' })
    }

    const post = await Post.findOrFail(params.id)

    if (await bouncer.with(PostPolicy).denies('destroy', post)) {
      return response.forbidden({ error: 'Access denied. You can only delete your own posts.' })
    }

    await post.delete()

    return response.noContent()
  }

  /**
   * @publishPost
   * @operationId publishPost
   * @tag POSTS_ADMIN
   * @summary Publish a post
   * @description Marks a post as published and sets `publishedAt` to the current timestamp. Writers may only publish their own posts, admins may publish any. Requires authentication and `publish` ability on the Post policy. Returns 404 if the post does not exist.
   * @paramPath id - Post id - @type(number) @example(7) @required
   * @responseBody 200 - <Post>
   * @responseBody 401 - {"error": "Unauthorized"}
   * @responseBody 403 - {"error": "Access denied. You can only publish your own posts."}
   * @responseBody 404 - {"message": "Row not found", "code": "E_ROW_NOT_FOUND"}
   */
  async publish({ params, response, auth, bouncer }: HttpContext) {
    const user = auth.user
    if (!user) {
      return response.unauthorized({ error: 'Unauthorized' })
    }

    const post = await Post.findOrFail(params.id)

    if (await bouncer.with(PostPolicy).denies('publish', post)) {
      return response.forbidden({ error: 'Access denied. You can only publish your own posts.' })
    }

    post.published = true
    post.publishedAt = DateTime.now()
    await post.save()

    await post.load('author')

    return response.ok(post)
  }

  /**
   * @unpublishPost
   * @operationId unpublishPost
   * @tag POSTS_ADMIN
   * @summary Unpublish a post
   * @description Marks a post as unpublished and clears its `publishedAt` timestamp. Writers may only unpublish their own posts, admins may unpublish any. Requires authentication and `publish` ability on the Post policy. Returns 404 if the post does not exist.
   * @paramPath id - Post id - @type(number) @example(7) @required
   * @responseBody 200 - <Post>
   * @responseBody 401 - {"error": "Unauthorized"}
   * @responseBody 403 - {"error": "Access denied. You can only unpublish your own posts."}
   * @responseBody 404 - {"message": "Row not found", "code": "E_ROW_NOT_FOUND"}
   */
  async unpublish({ params, response, auth, bouncer }: HttpContext) {
    const user = auth.user
    if (!user) {
      return response.unauthorized({ error: 'Unauthorized' })
    }

    const post = await Post.findOrFail(params.id)

    if (await bouncer.with(PostPolicy).denies('publish', post)) {
      return response.forbidden({ error: 'Access denied. You can only unpublish your own posts.' })
    }

    post.published = false
    post.publishedAt = null
    await post.save()

    await post.load('author')

    return response.ok(post)
  }

  /**
   * @listPlaceholders
   * @operationId listPlaceholders
   * @tag POSTS
   * @summary List available content placeholders
   * @description Returns the catalog of placeholder tokens that can be embedded in post content (e.g. `%PLAYER_COUNT_REALTIME_125%`). Each entry includes the placeholder name, a human-readable description, and an example string. Publicly accessible.
   * @responseBody 200 - [{"name": "PLAYER_COUNT_REALTIME", "description": "Current number of online players", "example": "%PLAYER_COUNT_REALTIME_125%"}, {"name": "PLAYER_COUNT_PEAK_HIGH", "description": "Highest number of players ever recorded", "example": "%PLAYER_COUNT_PEAK_HIGH_125%"}]
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
   * @description Resolves a single placeholder for a given server and returns both the raw placeholder string and the computed value, so the editor UI can show writers what the token will render to. Requires authentication and `manage` ability on the Post policy.
   * @requestBody {"placeholderName": "PLAYER_COUNT_REALTIME", "serverId": "125"}
   * @responseBody 200 - {"placeholder": "%PLAYER_COUNT_REALTIME_125%", "value": "42", "serverId": 125, "placeholderName": "PLAYER_COUNT_REALTIME"}
   * @responseBody 401 - {"error": "Unauthorized"}
   * @responseBody 403 - {"error": "Access denied. Writer privileges required."}
   * @responseBody 422 - {"errors": [{"message": "The serverId field must be defined", "field": "serverId", "rule": "required"}]}
   */
  async previewPlaceholder({ request, response, auth, bouncer }: HttpContext) {
    const user = auth.user
    if (!user) {
      return response.unauthorized({ error: 'Unauthorized' })
    }

    if (await bouncer.with(PostPolicy).denies('manage')) {
      return response.forbidden({ error: 'Access denied. Writer privileges required.' })
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
   * @description Returns engagement statistics for a single post: the raw view total, the consent-aware analytics breakdown derived from the page-view pipeline for `/blog/{slug}` (consented views, logged-in views, unique visitors), the helpful/not-helpful feedback tallies, and the most recent logged-in viewers (who viewed). Writers may only access stats for their own posts, admins for any. Requires authentication and `update` ability on the Post policy. Returns 404 if the post does not exist.
   * @paramPath id - Post id - @type(number) @example(7) @required
   * @responseBody 200 - {"post": {"id": 7, "title": "Welcome", "slug": "welcome", "viewCount": 1234}, "views": {"total": 1234, "consented": 800, "loggedIn": 120, "uniqueVisitors": 640}, "feedback": {"helpful": 42, "notHelpful": 3}, "recentViewers": [{"id": 1, "username": "gabriel", "avatarUrl": "", "lastViewedAt": "2026-06-26T12:00:00.000Z"}]}
   * @responseBody 401 - {"error": "Unauthorized"}
   * @responseBody 403 - {"error": "Access denied. You can only view stats for your own posts."}
   * @responseBody 404 - {"message": "Row not found", "code": "E_ROW_NOT_FOUND"}
   */
  async adminStats({ params, response, auth, bouncer }: HttpContext) {
    const user = auth.user
    if (!user) {
      return response.unauthorized({ error: 'Unauthorized' })
    }

    const post = await Post.findOrFail(params.id)

    if (await bouncer.with(PostPolicy).denies('update', post)) {
      return response.forbidden({
        error: 'Access denied. You can only view stats for your own posts.',
      })
    }

    // L'analytics enregistre les vues consenties par chemin exact (cf. AnalyticsService) :
    // on retrouve donc les vues d'un article via son URL publique `/blog/{slug}`.
    const path = `/blog/${post.slug}`

    const [analyticsRow, feedbackRow, recentViewers] = await Promise.all([
      db
        .from('page_views')
        .where('path', path)
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
        .where('page_views.path', path)
        .select('users.id as id', 'users.username as username', 'users.avatar_url as avatar_url')
        .select(db.raw('max(page_views.created_at) as last_viewed_at'))
        .groupBy('users.id', 'users.username', 'users.avatar_url')
        .orderByRaw('max(page_views.created_at) desc')
        .limit(50),
    ])

    return response.ok({
      post: { id: post.id, title: post.title, slug: post.slug, viewCount: post.viewCount },
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
