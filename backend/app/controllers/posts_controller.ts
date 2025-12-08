import type { HttpContext } from '@adonisjs/core/http'
import Post from '#models/post'
import { CreatePostValidator, UpdatePostValidator } from '#validators/post'
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
      .preload('author', (query) => {
        query.select('id', 'username', 'avatarUrl')
      })
      .firstOrFail()

    return response.ok(post)
  }

  /**
   * List all posts for admin (includes drafts)
   */
  async adminIndex({ request, response }: HttpContext) {
    const page = request.input('page', 1)
    const limit = request.input('limit', 20)
    const status = request.input('status', 'all') // all, published, draft

    const query = Post.query().preload('author', (query) => {
      query.select('id', 'username', 'avatarUrl')
    })

    if (status === 'published') {
      query.where('published', true)
    } else if (status === 'draft') {
      query.where('published', false)
    }

    const posts = await query.orderBy('created_at', 'desc').paginate(page, limit)

    return response.ok(posts)
  }

  /**
   * Create a new post (admin only)
   */
  async store({ request, auth, response }: HttpContext) {
    const user = auth.user

    if (!user) {
      return response.unauthorized({ error: 'Unauthorized' })
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
   * Update a post (admin only)
   */
  async update({ params, request, response }: HttpContext) {
    const post = await Post.findOrFail(params.id)
    const data = await request.validateUsing(UpdatePostValidator)

    post.merge(data)
    await post.save()

    await post.load('author')

    return response.ok(post)
  }

  /**
   * Delete a post (admin only)
   */
  async destroy({ params, response }: HttpContext) {
    const post = await Post.findOrFail(params.id)
    await post.delete()

    return response.noContent()
  }

  /**
   * Publish a post (admin only)
   */
  async publish({ params, response }: HttpContext) {
    const post = await Post.findOrFail(params.id)

    post.published = true
    post.publishedAt = DateTime.now()
    await post.save()

    await post.load('author')

    return response.ok(post)
  }

  /**
   * Unpublish a post (admin only)
   */
  async unpublish({ params, response }: HttpContext) {
    const post = await Post.findOrFail(params.id)

    post.published = false
    post.publishedAt = null
    await post.save()

    await post.load('author')

    return response.ok(post)
  }
}
