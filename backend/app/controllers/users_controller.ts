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
      return response.forbidden('Unauthorized')
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
    if (!user) return response.notFound('User not found')
    await user.merge(validatedUserData)
    await user.save()
    return response.ok(user)
  }

  async destroy({ params, response, bouncer }: HttpContext) {
    if (await bouncer.with(UserPolicy).denies('destroy')) {
      return response.forbidden('Unauthorized')
    }
    const user = await User.find(params.id)
    if (!user) return response.notFound('User not found')
    await user.delete()
    return response.ok(user)
  }
}
