import User from '#models/user'
import { CreateUserValidator, LoginUserValidator } from '#validators/user'
import type { HttpContext } from '@adonisjs/core/http'
import hash from '@adonisjs/core/services/hash'
import mail from '@adonisjs/mail/services/main'

export default class AuthController {
  async login({ request, response }: HttpContext) {
    const data = request.only(['email', 'password'])
    const validatedUserData = await LoginUserValidator.validate(data)
    const user = await User.findBy('email', validatedUserData.email)
    if (!user) return response.notFound('User not found')
    const passwordsMatch = await hash.verify(user.password, validatedUserData.password)
    if (!passwordsMatch) return response.badRequest('Invalid password')
    return response.ok(user)
  }

  async register({ request, response }: HttpContext) {
    const data = request.only(['name', 'email', 'password'])
    const validatedUserData = await CreateUserValidator.validate(data)
    const user = await User.create(validatedUserData)
    await mail.sendLater((message) => {
      message.from('no-reply@minecraft-stats.fr')
      message.to(user.email)
      message.subject('Verify your email address')
      message.text(`Please verify your email address with this code: ${user.verificationToken}`)
    })
    return response.ok(user)
  }
}
