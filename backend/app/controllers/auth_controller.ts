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
    if (!user) return response.notFound({ error: 'User not found' })
    if (!user.verified) return response.badRequest({ error: 'Email not verified' })
    const passwordsMatch = await hash.verify(user.password, validatedUserData.password)
    if (!passwordsMatch) return response.badRequest({ error: 'Invalid password' })
    return response.ok(user)
  }

  async verifyEmail({ request, response }: HttpContext) {
    const data = request.only(['token'])
    const validatedUserData = await VerifyEmailValidator.validate(data)
    const jwtToken = jwt.verify(validatedUserData.token, process.env.JWT_SECRET as string) as {
      email: string
      verificationToken: string
    }

    const user = await User.findBy('email', jwtToken.email)
    if (!user) return response.notFound({ error: 'User not found' })
    if (user.verificationToken !== jwtToken.verificationToken)
      return response.badRequest({ error: 'Invalid verification token' })
    if (user.verified) return response.badRequest({ error: 'Email already verified' })
    if (user.verificationTokenExpires && user.verificationTokenExpires < DateTime.now())
      return response.badRequest({ error: 'Verification token expired' })
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

  async providerLogin({ ally, request }: HttpContext) {
    const driverInstance = ally.use(request.param('provider') as 'discord' | 'github')
    return await driverInstance.redirect()
  }

  async discordCallback({ ally, response }: HttpContext) {
    const discordInstance = ally.use('discord')
    const discordUser = await discordInstance.user()

    if (discordInstance.accessDenied())
      return response.badRequest({ error: 'You have cancelled the login process' })

    if (discordInstance.stateMisMatch())
      return response.badRequest({ error: 'We are unable to verify the request. Please try again' })

    if (discordInstance.hasError())
      return response.badRequest({ error: 'An error occurred while logging in. Please try again' })

    const user = await User.findBy('email', discordUser.email)

    if (user) return response.ok(user)

    await User.create({
      username: discordUser.nickName,
      email: discordUser.email,
      password: Math.random().toString(36).slice(2),
      verified: discordUser.emailVerificationState === 'verified',
      provider: 'discord',
      avatarUrl: discordUser.avatarUrl,
    })

    return response.ok(user)
  }

  async githubCallback({ ally }: HttpContext) {
    const driverInstance = ally.use('github')
    const user = await driverInstance.user()
    console.log(user)
    return user
  }
}
