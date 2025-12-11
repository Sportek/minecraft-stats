import Post from '#models/post'
import PostPolicy from '#policies/post_policy'
import { CreatePostValidator, UpdatePostValidator } from '#validators/post'
import type { HttpContext } from '@adonisjs/core/http'
import { DateTime } from 'luxon'

export default class PostsController {
  /**
   * List all published posts (public)
   * Returns posts ordered by published_at desc
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
   * Get a single post by slug (public)
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
   * List all posts for writers/admins (includes drafts)
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
   * Create a new post (writers and admins)
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
   * Update a post (writers can update their own, admins can update any)
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
   * Delete a post (writers can delete their own, admins can delete any)
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
   * Publish a post (writers can publish their own, admins can publish any)
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
   * Unpublish a post (writers can unpublish their own, admins can unpublish any)
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
}
