import User from '#models/user'
import UserPolicy from '#policies/user_policy'
import { CreateUserValidator, UpdateUserValidator } from '#validators/user'
import type { HttpContext } from '@adonisjs/core/http'

export default class UsersController {
  /**
   * @listUsers
   * @operationId listUsers
   * @tag USERS
   * @summary List all users (admin only)
   * @description Returns the full collection of users registered on the platform. Requires an authenticated admin (gated by `UserPolicy.manage`).
   * @responseBody 200 - <User[]>
   * @responseBody 401 - {"message": "Unauthorized"}
   * @responseBody 403 - {"message": "Unauthorized"}
   */
  async index({ response, bouncer }: HttpContext) {
    if (await bouncer.with(UserPolicy).denies('manage')) {
      return response.forbidden({ message: 'Unauthorized' })
    }
    const users = await User.all()
    return response.ok(users)
  }

  /**
   * @createUser
   * @operationId createUser
   * @tag USERS
   * @summary Create a new user
   * @description Creates a new user account. The request is gated by `UserPolicy.store` so the caller must be authenticated and authorized. The body is validated against `CreateUserValidator` (username 3-254 chars, email, password 8-72 chars).
   * @requestBody <CreateUserValidator>
   * @responseBody 200 - <User>
   * @responseBody 403 - {"message": "Unauthorized"}
   * @responseBody 422 - {"errors": [{"message": "Validation failed", "field": "email"}]}
   */
  async store({ request, response, bouncer }: HttpContext) {
    if (await bouncer.with(UserPolicy).denies('store')) {
      return response.forbidden({ message: 'Unauthorized' })
    }
    const data = request.only(['username', 'email', 'password'])
    const validatedUserData = await CreateUserValidator.validate(data)
    const user = await User.create(validatedUserData)
    return response.ok(user)
  }

  /**
   * @showUser
   * @operationId showUser
   * @tag USERS
   * @summary Get a single user (admin only)
   * @description Returns the user identified by `id`. Requires an authenticated admin (gated by `UserPolicy.manage`). Responds with `null` (HTTP 200) when no user matches the id, since the controller uses `User.find` rather than `findOrFail`.
   * @paramPath id - User ID - @type(number) @example(7) @required
   * @responseBody 200 - <User>
   * @responseBody 401 - {"message": "Unauthorized"}
   * @responseBody 403 - {"message": "Unauthorized"}
   */
  async show({ params, response, bouncer }: HttpContext) {
    if (await bouncer.with(UserPolicy).denies('manage')) {
      return response.forbidden({ message: 'Unauthorized' })
    }
    const user = await User.find(params.id)
    return response.ok(user)
  }

  /**
   * @updateUser
   * @operationId updateUser
   * @tag USERS
   * @summary Update a user
   * @description Updates `username`, `email` and/or `password` of an existing user. The body is validated against `UpdateUserValidator` (all fields optional). Authorization is enforced by `UserPolicy.update`.
   * @paramPath id - User ID - @type(number) @example(7) @required
   * @requestBody <UpdateUserValidator>
   * @responseBody 200 - <User>
   * @responseBody 403 - "Unauthorized"
   * @responseBody 404 - {"message": "User not found"}
   * @responseBody 422 - {"errors": [{"message": "Validation failed", "field": "email"}]}
   */
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

  /**
   * @destroyUser
   * @operationId destroyUser
   * @tag USERS
   * @summary Delete a user
   * @description Permanently removes the user identified by `id`. Authorization is enforced by `UserPolicy.destroy`.
   * @paramPath id - User ID - @type(number) @example(7) @required
   * @responseBody 200 - <User>
   * @responseBody 403 - {"message": "Unauthorized"}
   * @responseBody 404 - {"message": "User not found"}
   */
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
   * @adminListUsers
   * @operationId adminListUsers
   * @tag USERS_ADMIN
   * @summary List users for admin management (paginated)
   * @description Returns a paginated list of users for the admin panel. Supports search across `username`/`email` and filtering by role. Requires an authenticated admin (gated by `UserPolicy.manage`).
   * @paramQuery page - Page number (defaults to 1) - @type(number) @example(1)
   * @paramQuery limit - Items per page (defaults to 20) - @type(number) @example(20)
   * @paramQuery search - Substring matched against username and email (case-insensitive) - @type(string) @example(gabriel)
   * @paramQuery role - Role filter: `admin`, `writer`, `user`, or `all` (default) - @type(string) @example(admin)
   * @responseBody 200 - {"meta": {"total": 100, "perPage": 20, "currentPage": 1, "lastPage": 5, "firstPage": 1, "firstPageUrl": "/?page=1", "lastPageUrl": "/?page=5", "nextPageUrl": "/?page=2", "previousPageUrl": ""}, "data": [{"id": 1, "username": "admin", "role": "admin", "verified": true, "provider": "", "avatarUrl": "", "createdAt": "2025-01-01T00:00:00.000Z", "updatedAt": "2026-05-28T12:00:00.000Z"}]}
   * @responseBody 401 - {"error": "Unauthorized"}
   * @responseBody 403 - {"error": "Access denied. Admin privileges required."}
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
   * @adminUpdateUserRole
   * @operationId adminUpdateUserRole
   * @tag USERS_ADMIN
   * @summary Update a user's role (admin only)
   * @description Sets the target user's role. The body must contain a `role` field whose value is one of `admin`, `writer`, or `user`; any other value is rejected with 400. Authorization is enforced by `UserPolicy.updateRole` against the target user.
   * @paramPath id - User ID of the user being updated - @type(number) @example(7) @required
   * @requestBody {"role": "admin"}
   * @responseBody 200 - <User>
   * @responseBody 400 - {"error": "Invalid role. Must be admin, writer, or user."}
   * @responseBody 401 - {"error": "Unauthorized"}
   * @responseBody 403 - {"error": "Access denied. Cannot change this user's role."}
   * @responseBody 404 - {"error": "User not found"}
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
