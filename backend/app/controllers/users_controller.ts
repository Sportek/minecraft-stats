import User from '#models/user'
import UserPolicy from '#policies/user_policy'
import { CreateUserValidator, UpdateUserValidator } from '#validators/user'
import type { HttpContext } from '@adonisjs/core/http'

export default class UsersController {
  async index({ response }: HttpContext) {
    const users = await User.all()
    return response.ok(users)
  }

  async store({ request, response, bouncer }: HttpContext) {
    if (await bouncer.with(UserPolicy).denies('store')) {
      return response.forbidden({ message: 'Unauthorized' })
    }
    const data = request.only(['username', 'email', 'password'])
    const validatedUserData = await CreateUserValidator.validate(data)
    const user = await User.create(validatedUserData)
    return response.ok(user)
  }

  async show({ params, response }: HttpContext) {
    const user = await User.find(params.id)
    return response.ok(user)
  }

  async update({ params, request, response, bouncer }: HttpContext) {
    if (await bouncer.with(UserPolicy).denies('update')) {
      return response.forbidden('Unauthorized')
    }
    const data = request.only(['username', 'email', 'password'])
    const validatedUserData = await UpdateUserValidator.validate(data)
    const user = await User.find(params.id)
    if (!user) return response.notFound({ message: 'User not found' })
    await user.merge(validatedUserData)
    await user.save()
    return response.ok(user)
  }

  async destroy({ params, response, bouncer }: HttpContext) {
    if (await bouncer.with(UserPolicy).denies('destroy')) {
      return response.forbidden({ message: 'Unauthorized' })
    }
    const user = await User.find(params.id)
    if (!user) return response.notFound({ message: 'User not found' })
    await user.delete()
    return response.ok(user)
  }

  /**
   * List all users for admin management (paginated)
   */
  async adminIndex({ request, response, auth, bouncer }: HttpContext) {
    const currentUser = auth.user
    if (!currentUser) {
      return response.unauthorized({ error: 'Unauthorized' })
    }

    if (await bouncer.with(UserPolicy).denies('manage')) {
      return response.forbidden({ error: 'Access denied. Admin privileges required.' })
    }

    const page = request.input('page', 1)
    const limit = request.input('limit', 20)
    const search = request.input('search', '')
    const role = request.input('role', 'all')

    const query = User.query().orderBy('created_at', 'desc')

    if (search) {
      query.where((q) => {
        q.whereILike('username', `%${search}%`).orWhereILike('email', `%${search}%`)
      })
    }

    if (role !== 'all') {
      query.where('role', role)
    }

    const users = await query.paginate(page, limit)

    return response.ok(users)
  }

  /**
   * Update a user's role (admin only)
   */
  async updateRole({ params, request, response, auth, bouncer }: HttpContext) {
    const currentUser = auth.user
    if (!currentUser) {
      return response.unauthorized({ error: 'Unauthorized' })
    }

    const targetUser = await User.find(params.id)
    if (!targetUser) {
      return response.notFound({ error: 'User not found' })
    }

    if (await bouncer.with(UserPolicy).denies('updateRole', targetUser)) {
      return response.forbidden({ error: "Access denied. Cannot change this user's role." })
    }

    const newRole = request.input('role')
    if (!['admin', 'writer', 'user'].includes(newRole)) {
      return response.badRequest({ error: 'Invalid role. Must be admin, writer, or user.' })
    }

    targetUser.role = newRole
    await targetUser.save()

    return response.ok(targetUser)
  }
}
