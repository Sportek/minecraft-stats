import VerifyENotification from '#mails/verify_e_notification'
import User from '#models/user'
import env from '#start/env'
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
  /**
   * @login
   * @operationId login
   * @tag AUTH
   * @summary Login with email and password
   * @description Authenticates a user using email and password credentials. Returns the user object and a newly created access token on success. Rejects unverified accounts and accounts that were registered via a third-party OAuth provider.
   * @requestBody <LoginUserValidator>
   * @responseBody 200 - {"user": {"id": 1, "username": "player", "verified": true, "provider": "", "role": "user", "avatarUrl": "", "createdAt": "2026-05-28T12:00:00.000Z", "updatedAt": "2026-05-28T12:00:00.000Z"}, "accessToken": {"type": "bearer", "token": "oat_...", "expiresAt": "2026-06-27T12:00:00.000Z"}}
   * @responseBody 400 - {"message": "Email not verified"}
   * @responseBody 400 - {"message": "You are using a third-party provider"}
   * @responseBody 400 - {"errors": [{"message": "Invalid user credentials"}]}
   * @responseBody 422 - {"errors": [{"message": "The email field must be a valid email address", "rule": "email", "field": "email"}]}
   */
  async login({ request, response }: HttpContext) {
    const data = await request.validateUsing(LoginUserValidator)
    const user = await User.verifyCredentials(data.email, data.password)
    if (!user.verified) return response.badRequest({ message: 'Email not verified' })
    if (user.provider)
      return response.badRequest({ message: 'You are using a third-party provider' })
    return {
      user,
      accessToken: await User.accessTokens.create(user),
    }
  }

  /**
   * @verifyEmail
   * @operationId verifyEmail
   * @tag AUTH
   * @summary Verify a user's email address
   * @description Validates a JWT verification token previously sent by email, marks the matching user as verified, and clears the stored verification token and its expiry.
   * @requestBody <VerifyEmailValidator>
   * @responseBody 200 - {"id": 1, "username": "player", "verified": true, "provider": "", "role": "user", "avatarUrl": "", "createdAt": "2026-05-28T12:00:00.000Z", "updatedAt": "2026-05-28T12:00:00.000Z"}
   * @responseBody 404 - {"message": "User not found"}
   * @responseBody 400 - {"message": "Email already verified"}
   * @responseBody 400 - {"message": "Invalid verification token"}
   * @responseBody 400 - {"message": "Verification token expired"}
   * @responseBody 422 - {"errors": [{"message": "The token field must be defined", "rule": "required", "field": "token"}]}
   */
  async verifyEmail({ request, response }: HttpContext) {
    const data = request.only(['token'])
    const validatedUserData = await VerifyEmailValidator.validate(data)
    const jwtToken = jwt.verify(validatedUserData.token, env.get('APP_KEY')) as {
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

  /**
   * @register
   * @operationId register
   * @tag AUTH
   * @summary Register a new user account
   * @description Creates a new user (unverified), generates a JWT email verification token and queues a verification email via the mail service. Returns the created user. The account remains unverified until verifyEmail is called.
   * @requestBody <CreateUserValidator>
   * @responseBody 200 - {"id": 1, "username": "player", "verified": false, "provider": "", "role": "user", "avatarUrl": "", "createdAt": "2026-05-28T12:00:00.000Z", "updatedAt": "2026-05-28T12:00:00.000Z"}
   * @responseBody 400 - {"message": "Email already registered"}
   * @responseBody 422 - {"errors": [{"message": "The email field must be a valid email address", "rule": "email", "field": "email"}]}
   */
  async register({ request, response }: HttpContext) {
    const data = request.only(['username', 'email', 'password'])
    const validatedUserData = await CreateUserValidator.validate(data)
    const user = await User.findBy('email', validatedUserData.email)
    if (user) return response.badRequest({ message: 'Email already registered' })
    const newUser = await User.create(validatedUserData)
    const jwtToken = jwt.sign(
      { email: newUser.email, verificationToken: newUser.verificationToken },
      env.get('APP_KEY')
    )
    await mail.sendLater(new VerifyENotification(newUser, jwtToken))
    return response.ok(newUser)
  }

  /**
   * @retrieveUser
   * @operationId getCurrentUser
   * @tag AUTH
   * @summary Get the currently authenticated user
   * @description Returns the user record associated with the bearer access token provided in the Authorization header. Requires authentication.
   * @responseBody 200 - {"user": {"id": 1, "username": "player", "verified": true, "provider": "", "role": "user", "avatarUrl": "", "createdAt": "2026-05-28T12:00:00.000Z", "updatedAt": "2026-05-28T12:00:00.000Z"}}
   * @responseBody 401 - {"errors": [{"message": "Unauthorized access"}]}
   */
  async retrieveUser({ response, auth }: HttpContext) {
    return response.ok({ user: auth.user })
  }

  /**
   * @changePassword
   * @operationId changePassword
   * @tag AUTH
   * @summary Change the authenticated user's password
   * @description Updates the password of the currently authenticated user after verifying the old password. Requires authentication and a verified email. Not usable for accounts created via a third-party provider that have no usable password.
   * @requestBody <ChangePasswordValidator>
   * @responseBody 200 - {"id": 1, "username": "player", "verified": true, "provider": "", "role": "user", "avatarUrl": "", "createdAt": "2026-05-28T12:00:00.000Z", "updatedAt": "2026-05-28T12:00:00.000Z"}
   * @responseBody 404 - {"message": "User not found"}
   * @responseBody 400 - {"message": "Email not verified"}
   * @responseBody 400 - {"message": "Invalid old password"}
   * @responseBody 401 - {"errors": [{"message": "Unauthorized access"}]}
   * @responseBody 422 - {"errors": [{"message": "The newPassword field must have at least 8 characters", "rule": "minLength", "field": "newPassword"}]}
   */
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

  /**
   * @providerLogin
   * @operationId oauthProviderLogin
   * @tag AUTH
   * @summary Start an OAuth login flow with a third-party provider
   * @description Issues an HTTP redirect to the chosen OAuth provider's authorization URL. The provider will redirect back to the corresponding callback endpoint (googleCallback or discordCallback) once the user has approved or denied access.
   * @paramPath provider - The OAuth provider to use - @type(string) @enum(google,discord) @required
   * @responseBody 302 - Redirect to the provider's authorization URL
   * @responseBody 400 - {"errors": [{"message": "Unknown OAuth provider"}]}
   */
  async providerLogin({ ally, request }: HttpContext) {
    const driverInstance = ally.use(request.param('provider') as 'discord' | 'google')
    return await driverInstance.redirect()
  }

  /**
   * @discordCallback
   * @operationId oauthDiscordCallback
   * @tag AUTH
   * @summary OAuth callback endpoint for Discord
   * @description Handles the redirect from Discord after the user grants or denies access. On success, finds or creates the user (using Discord nickname, avatar and verified-email state), then returns the user along with a freshly issued access token. Errors during the OAuth handshake (cancellation, state mismatch, generic provider error) are returned as 400 responses.
   * @responseBody 200 - {"user": {"id": 1, "username": "discord_user", "verified": true, "provider": "discord", "role": "user", "avatarUrl": "https://cdn.discordapp.com/avatars/...", "createdAt": "2026-05-28T12:00:00.000Z", "updatedAt": "2026-05-28T12:00:00.000Z"}, "accessToken": {"type": "bearer", "token": "oat_...", "expiresAt": "2026-06-27T12:00:00.000Z"}}
   * @responseBody 400 - {"message": "You have cancelled the login process"}
   * @responseBody 400 - {"message": "We are unable to verify the request. Please try again"}
   * @responseBody 400 - {"message": "An error occurred while logging in. Please try again"}
   * @responseBody 400 - {"message": "Cannot login with this third-party provider"}
   */
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

    if (!user.provider && user.provider !== 'discord')
      return response.badRequest({ message: 'Cannot login with this third-party provider' })

    return {
      user,
      accessToken: await User.accessTokens.create(user),
    }
  }

  /**
   * @googleCallback
   * @operationId oauthGoogleCallback
   * @tag AUTH
   * @summary OAuth callback endpoint for Google
   * @description Handles the redirect from Google after the user grants or denies access. On success, finds or creates the user (Google accounts are treated as verified) and returns the user with a freshly issued access token. Errors during the OAuth handshake (cancellation, state mismatch, generic provider error) are returned as 400 responses.
   * @responseBody 200 - {"user": {"id": 1, "username": "Google User", "verified": true, "provider": "google", "role": "user", "avatarUrl": "https://lh3.googleusercontent.com/...", "createdAt": "2026-05-28T12:00:00.000Z", "updatedAt": "2026-05-28T12:00:00.000Z"}, "accessToken": {"type": "bearer", "token": "oat_...", "expiresAt": "2026-06-27T12:00:00.000Z"}}
   * @responseBody 400 - {"message": "You have cancelled the login process"}
   * @responseBody 400 - {"message": "We are unable to verify the request. Please try again"}
   * @responseBody 400 - {"message": "An error occurred while logging in. Please try again"}
   * @responseBody 400 - {"message": "Cannot login with this third-party provider"}
   */
  async googleCallback({ ally, response }: HttpContext) {
    const driverInstance = ally.use('google')
    const googleUser = await driverInstance.user()

    if (driverInstance.accessDenied())
      return response.badRequest({ message: 'You have cancelled the login process' })

    if (driverInstance.stateMisMatch())
      return response.badRequest({
        message: 'We are unable to verify the request. Please try again',
      })

    if (driverInstance.hasError())
      return response.badRequest({
        message: 'An error occurred while logging in. Please try again',
      })

    const user = await User.firstOrCreate(
      { email: googleUser.email },
      {
        username: googleUser.name,
        password: Math.random().toString(36).slice(2),
        verified: true,
        provider: 'google',
        avatarUrl: googleUser.avatarUrl,
      }
    )

    if (!user.provider && user.provider !== 'google')
      return response.badRequest({ message: 'Cannot login with this third-party provider' })

    return {
      user,
      accessToken: await User.accessTokens.create(user),
    }
  }
}
