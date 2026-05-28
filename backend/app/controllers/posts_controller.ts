import Post from '#models/post'
import PostPolicy from '#policies/post_policy'
import PlaceholderService from '#services/placeholder_service'
import { CreatePostValidator, UpdatePostValidator } from '#validators/post'
import type { HttpContext } from '@adonisjs/core/http'
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
    const page = request.input('page', 1)
    const limit = request.input('limit', 10)

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
   * @description Returns a single published post identified by its slug. Placeholders in the content (e.g. `%PLAYER_COUNT_REALTIME_125%`) are resolved server-side before the response is sent. Returns 404 if no published post matches the slug. Publicly accessible.
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

    // Replace placeholders in content
    post.content = await PlaceholderService.replacePlaceholders(post.content)

    return response.ok(post)
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

    const page = request.input('page', 1)
    const limit = request.input('limit', 20)
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
   * @responseBody 400 - {"error": "placeholderName and serverId are required"}
   * @responseBody 401 - {"error": "Unauthorized"}
   * @responseBody 403 - {"error": "Access denied. Writer privileges required."}
   */
  async previewPlaceholder({ request, response, auth, bouncer }: HttpContext) {
    const user = auth.user
    if (!user) {
      return response.unauthorized({ error: 'Unauthorized' })
    }

    if (await bouncer.with(PostPolicy).denies('manage')) {
      return response.forbidden({ error: 'Access denied. Writer privileges required.' })
    }

    const { placeholderName, serverId } = request.only(['placeholderName', 'serverId'])

    if (!placeholderName || !serverId) {
      return response.badRequest({ error: 'placeholderName and serverId are required' })
    }

    const placeholder = `%${placeholderName}_${serverId}%`
    const result = await PlaceholderService.replacePlaceholders(placeholder)

    return response.ok({
      placeholder,
      value: result,
      serverId: Number.parseInt(serverId),
      placeholderName,
    })
  }
}
