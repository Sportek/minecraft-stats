import VerifyENotification from '#mails/verify_e_notification'
import User from '#models/user'
import {
  ChangePasswordValidator,
  CreateUserValidator,
  LoginUserValidator,
  VerifyEmailValidator,
} from '#validators/user'
import type { HttpContext } from '@adonisjs/core/http'
import mail from '@adonisjs/mail/services/main'
import jwt from 'jsonwebtoken'
import { DateTime } from 'luxon'

export default class AuthController {
  async login({ request, response }: HttpContext) {
    const data = await request.validateUsing(LoginUserValidator)
    const user = await User.verifyCredentials(data.email, data.password)
    if (!user.verified) return response.badRequest({ message: 'Email not verified' })
    return {
      user,
      accessToken: await User.accessTokens.create(user),
    }
  }

  async verifyEmail({ request, response }: HttpContext) {
    const data = request.only(['token'])
    const validatedUserData = await VerifyEmailValidator.validate(data)
    const jwtToken = jwt.verify(validatedUserData.token, process.env.JWT_SECRET as string) as {
      email: string
      verificationToken: string
    }
    const user = await User.findBy('email', jwtToken.email)
    if (!user) return response.notFound({ message: 'User not found' })
    if (user.verified) return response.badRequest({ message: 'Email already verified' })
    if (user.verificationToken !== jwtToken.verificationToken)
      return response.badRequest({ message: 'Invalid verification token' })
    if (user.verificationTokenExpires && user.verificationTokenExpires < DateTime.now())
      return response.badRequest({ message: 'Verification token expired' })
    user.verificationToken = null
    user.verified = true
    user.verificationTokenExpires = null
    await user.save()
    return response.ok(user)
  }

  async register({ request, response }: HttpContext) {
    const data = request.only(['username', 'email', 'password'])
    const validatedUserData = await CreateUserValidator.validate(data)
    const user = await User.findBy('email', validatedUserData.email)
    if (user) return response.badRequest({ message: 'Email already registered' })
    const newUser = await User.create(validatedUserData)
    const jwtToken = jwt.sign(
      { email: newUser.email, verificationToken: newUser.verificationToken },
      process.env.JWT_SECRET as string
    )
    await mail.sendLater(new VerifyENotification(newUser, jwtToken))
    return response.ok(newUser)
  }

  async retrieveUser({ response, auth }: HttpContext) {
    return response.ok({ user: auth.user })
  }

  async changePassword({ request, response, auth }: HttpContext) {
    const data = request.only(['oldPassword', 'newPassword'])
    const validatedUserData = await ChangePasswordValidator.validate(data)
    const user = auth.user
    if (!user) return response.notFound({ message: 'User not found' })
    if (!user.verified) return response.badRequest({ message: 'Email not verified' })
    if (!(await User.verifyCredentials(user.email, validatedUserData.oldPassword)))
      return response.badRequest({ message: 'Invalid old password' })
    user.password = validatedUserData.newPassword
    await user.save()
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
      return response.badRequest({ message: 'You have cancelled the login process' })

    if (discordInstance.stateMisMatch())
      return response.badRequest({
        message: 'We are unable to verify the request. Please try again',
      })

    if (discordInstance.hasError())
      return response.badRequest({
        message: 'An error occurred while logging in. Please try again',
      })

    const user = await User.firstOrCreate(
      { email: discordUser.email },
      {
        username: discordUser.nickName,
        password: Math.random().toString(36).slice(2),
        verified: discordUser.emailVerificationState === 'verified',
        provider: 'discord',
        avatarUrl: discordUser.avatarUrl,
      }
    )

    return {
      user,
      accessToken: await User.accessTokens.create(user),
    }
  }

  async githubCallback({ ally }: HttpContext) {
    const driverInstance = ally.use('github')
    const user = await driverInstance.user()
    return user
  }
}
