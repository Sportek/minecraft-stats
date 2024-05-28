import User from '#models/user'
import { CreateUserValidator, LoginUserValidator, VerifyEmailValidator } from '#validators/user'
import type { HttpContext } from '@adonisjs/core/http'
import hash from '@adonisjs/core/services/hash'
import mail from '@adonisjs/mail/services/main'
import jwt from 'jsonwebtoken'
import { DateTime } from 'luxon'

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

  async verifyEmail({ request, response }: HttpContext) {
    const data = request.only(['token'])
    const validatedUserData = await VerifyEmailValidator.validate(data)

    const jwtToken = jwt.verify(validatedUserData.token, process.env.JWT_SECRET as string)
    console.log(jwtToken)

    const user = await User.findBy('verificationToken', validatedUserData.token)
    if (!user) return response.notFound('User not found')
    if (user.verificationToken !== validatedUserData.token)
      return response.badRequest('Invalid verification token')
    if (user.verified) return response.badRequest('Email already verified')
    if (user.verificationTokenExpires && user.verificationTokenExpires < DateTime.now())
      return response.badRequest('Verification token expired')
    user.verificationToken = null
    user.verified = true
    user.verificationTokenExpires = null
    await user.save()
    return response.ok(user)
  }

  async register({ request, response }: HttpContext) {
    const data = request.only(['username', 'email', 'password'])
    const validatedUserData = await CreateUserValidator.validate(data)
    const user = await User.create(validatedUserData)
    const jwtToken = jwt.sign(
      { email: user.email, verificationToken: user.verificationToken },
      process.env.JWT_SECRET as string
    )
    await mail.sendLater((message) => {
      message.from('no-reply@minecraft-stats.fr')
      message.to(user.email)
      message.subject('Verify your email address')
      message.text(
        `Please verify your email address with this link: ${process.env.WEBSITE_URL}/verify-email/${jwtToken} or with this code : ${user.verificationToken}`
      )
    })
    return response.ok(user)
  }
}
