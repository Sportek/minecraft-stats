import ResetPasswordNotification from '#mails/reset_password_notification'
import VerifyENotification from '#mails/verify_e_notification'
import User from '#models/user'
import ImageStorageService from '#services/image_storage_service'
import TurnstileService from '#services/turnstile_service'
import env from '#start/env'
import {
  ChangePasswordValidator,
  ChangeUsernameValidator,
  CreateUserValidator,
  ForgotPasswordValidator,
  LoginUserValidator,
  ResetPasswordValidator,
  VerifyEmailValidator,
} from '#validators/user'
import type { HttpContext } from '@adonisjs/core/http'
import mail from '@adonisjs/mail/services/main'
import jwt from 'jsonwebtoken'
import { DateTime } from 'luxon'
import { createHash, randomBytes } from 'node:crypto'
import fs from 'node:fs/promises'

export default class AuthController {
  /**
   * @login
   * @operationId login
   * @tag AUTH
   * @summary Login with email and password
   * @description Authenticates a user using email and password credentials. Returns the user object and a newly created access token on success. Rejects unverified accounts and accounts that were registered via a third-party OAuth provider.
   * @requestBody <LoginUserValidator>
   * @responseBody 200 - {"user": {"id": 1, "username": "player", "verified": true, "provider": "", "role": "user", "avatarUrl": "", "createdAt": "2026-05-28T12:00:00.000Z", "updatedAt": "2026-05-28T12:00:00.000Z"}, "accessToken": {"type": "bearer", "token": "oat_...", "expiresAt": "2026-06-27T12:00:00.000Z"}}
   * @responseBody 400 - {"message": "Captcha verification failed"}
   * @responseBody 400 - {"message": "Email not verified"}
   * @responseBody 400 - {"message": "You are using a third-party provider"}
   * @responseBody 400 - {"errors": [{"message": "Invalid user credentials"}]}
   * @responseBody 422 - {"errors": [{"message": "The email field must be a valid email address", "rule": "email", "field": "email"}]}
   */
  async login({ request, response, i18n }: HttpContext) {
    if (!(await TurnstileService.verify(request.input('turnstileToken'), request.ip()))) {
      return response.badRequest({ message: i18n.t('messages.auth.captchaFailed') })
    }
    const data = await request.validateUsing(LoginUserValidator)
    const user = await User.verifyCredentials(data.email, data.password)
    if (!user.verified)
      return response.badRequest({ message: i18n.t('messages.auth.emailNotVerified') })
    if (user.provider)
      return response.badRequest({ message: i18n.t('messages.auth.usingThirdPartyProvider') })
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
  async verifyEmail({ request, response, i18n }: HttpContext) {
    const data = request.only(['token'])
    const validatedUserData = await VerifyEmailValidator.validate(data)
    const jwtToken = jwt.verify(validatedUserData.token, env.get('APP_KEY')) as {
      email: string
      verificationToken: string
    }
    const user = await User.findBy('email', jwtToken.email)
    if (!user) return response.notFound({ message: i18n.t('messages.auth.userNotFound') })
    if (user.verified)
      return response.badRequest({ message: i18n.t('messages.auth.emailAlreadyVerified') })
    if (user.verificationToken !== jwtToken.verificationToken)
      return response.badRequest({ message: i18n.t('messages.auth.invalidVerificationToken') })
    if (user.verificationTokenExpires && user.verificationTokenExpires < DateTime.now())
      return response.badRequest({ message: i18n.t('messages.auth.verificationTokenExpired') })
    user.verificationToken = null
    user.verified = true
    user.verificationTokenExpires = null
    await user.save()
    return response.ok(user)
  }

  /**
   * @forgotPassword
   * @operationId forgotPassword
   * @tag AUTH
   * @summary Request a password reset email
   * @description Sends a password reset link to the account matching the given email, when one exists. To prevent account enumeration the endpoint always returns the same 200 response whether or not an account was found. A reset link is only sent for verified, non-OAuth accounts; the emailed token is high-entropy and only its hash is stored server-side, expiring after 1 hour.
   * @requestBody <ForgotPasswordValidator>
   * @responseBody 200 - {"message": "If an account matches this email, a password reset link has been sent."}
   * @responseBody 400 - {"message": "Captcha verification failed"}
   * @responseBody 422 - {"errors": [{"message": "The email field must be a valid email address", "rule": "email", "field": "email"}]}
   */
  async forgotPassword({ request, response, i18n }: HttpContext) {
    if (!(await TurnstileService.verify(request.input('turnstileToken'), request.ip()))) {
      return response.badRequest({ message: i18n.t('messages.auth.captchaFailed') })
    }
    const { email } = await ForgotPasswordValidator.validate(request.only(['email']))
    const user = await User.findBy('email', email)

    // Anti-énumération : la réponse est toujours identique. On n'envoie le mail que
    // pour un compte local vérifié — les comptes OAuth n'ont pas de mot de passe
    // utilisable (le login les rejette), un reset ne leur servirait à rien.
    if (user && user.verified && !user.provider) {
      // Token brut fort envoyé par mail ; seul son hash SHA-256 est persisté, donc
      // une fuite de la table ne permet pas de forger un reset. Valide 1h.
      const rawToken = randomBytes(32).toString('base64url')
      user.passwordResetToken = createHash('sha256').update(rawToken).digest('hex')
      user.passwordResetTokenExpires = DateTime.now().plus({ hours: 1 })
      await user.save()
      await mail.sendLater(new ResetPasswordNotification(user, rawToken, i18n.locale))
    }

    return response.ok({ message: i18n.t('messages.auth.passwordResetSent') })
  }

  /**
   * @resetPassword
   * @operationId resetPassword
   * @tag AUTH
   * @summary Reset a password using an emailed token
   * @description Validates the reset token from the emailed link (matched against the stored hash and its 1-hour expiry), sets the new password, clears the token so it cannot be reused, and revokes every existing session of the account. Invalid and expired tokens return the same generic error to avoid leaking token state.
   * @requestBody <ResetPasswordValidator>
   * @responseBody 200 - {"message": "Your password has been reset. You can now sign in."}
   * @responseBody 400 - {"message": "This password reset link is invalid or has expired."}
   * @responseBody 422 - {"errors": [{"message": "The password field must have at least 8 characters", "rule": "minLength", "field": "password"}]}
   */
  async resetPassword({ request, response, i18n }: HttpContext) {
    const { token, password } = await ResetPasswordValidator.validate(
      request.only(['token', 'password'])
    )

    const tokenHash = createHash('sha256').update(token).digest('hex')
    const user = await User.findBy('password_reset_token', tokenHash)

    // Message unique pour token inconnu OU expiré : on ne distingue pas les deux.
    if (
      !user ||
      !user.passwordResetTokenExpires ||
      user.passwordResetTokenExpires < DateTime.now()
    ) {
      return response.badRequest({ message: i18n.t('messages.auth.invalidResetToken') })
    }

    user.password = password
    user.passwordResetToken = null
    user.passwordResetTokenExpires = null
    await user.save()

    // Un reset invalide tous les accès précédents (sécurité en cas de compromission).
    const tokens = await User.accessTokens.all(user)
    await Promise.all(
      tokens.map((accessToken) => User.accessTokens.delete(user, accessToken.identifier))
    )

    return response.ok({ message: i18n.t('messages.auth.passwordResetSuccess') })
  }

  /**
   * @register
   * @operationId register
   * @tag AUTH
   * @summary Register a new user account
   * @description Creates a new user (unverified), generates a JWT email verification token and queues a verification email via the mail service. Returns the created user. The account remains unverified until verifyEmail is called.
   * @requestBody <CreateUserValidator>
   * @responseBody 200 - {"id": 1, "username": "player", "verified": false, "provider": "", "role": "user", "avatarUrl": "", "createdAt": "2026-05-28T12:00:00.000Z", "updatedAt": "2026-05-28T12:00:00.000Z"}
   * @responseBody 400 - {"message": "Captcha verification failed"}
   * @responseBody 400 - {"message": "Email already registered"}
   * @responseBody 422 - {"errors": [{"message": "The email field must be a valid email address", "rule": "email", "field": "email"}]}
   */
  async register({ request, response, i18n }: HttpContext) {
    if (!(await TurnstileService.verify(request.input('turnstileToken'), request.ip()))) {
      return response.badRequest({ message: i18n.t('messages.auth.captchaFailed') })
    }
    const data = request.only(['username', 'email', 'password'])
    const validatedUserData = await CreateUserValidator.validate(data)
    const user = await User.findBy('email', validatedUserData.email)
    if (user)
      return response.badRequest({ message: i18n.t('messages.auth.emailAlreadyRegistered') })
    const newUser = await User.create(validatedUserData)
    const jwtToken = jwt.sign(
      { email: newUser.email, verificationToken: newUser.verificationToken },
      env.get('APP_KEY')
    )
    await mail.sendLater(new VerifyENotification(newUser, jwtToken, i18n.locale))
    return response.ok(newUser)
  }

  /**
   * @retrieveUser
   * @operationId getCurrentUser
   * @tag AUTH
   * @summary Get the currently authenticated user
   * @description Returns the user record associated with the bearer access token provided in the Authorization header. Requires authentication.
   * @responseBody 200 - {"user": {"id": 1, "username": "player", "email": "player@example.com", "verified": true, "provider": "", "role": "user", "avatarUrl": "", "createdAt": "2026-05-28T12:00:00.000Z", "updatedAt": "2026-05-28T12:00:00.000Z"}}
   * @responseBody 401 - {"errors": [{"message": "Unauthorized access"}]}
   */
  async retrieveUser({ response, auth }: HttpContext) {
    const user = auth.getUserOrFail()
    // `email` is `serializeAs: null` on the User model, so it is never included
    // in any public response (server.user, post authors, admin user lists…).
    // We re-attach it here only: /me is behind auth middleware and returns the
    // requester's OWN record, so an email can only ever reach its owner.
    return response.ok({ user: { ...user.serialize(), email: user.email } })
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
  async changePassword({ request, response, auth, i18n }: HttpContext) {
    const data = request.only(['oldPassword', 'newPassword'])
    const validatedUserData = await ChangePasswordValidator.validate(data)
    const user = auth.user
    if (!user) return response.notFound({ message: i18n.t('messages.auth.userNotFound') })
    if (!user.verified)
      return response.badRequest({ message: i18n.t('messages.auth.emailNotVerified') })
    if (!(await User.verifyCredentials(user.email, validatedUserData.oldPassword)))
      return response.badRequest({ message: i18n.t('messages.auth.invalidOldPassword') })
    user.password = validatedUserData.newPassword
    await user.save()

    const currentTokenId = user.currentAccessToken?.identifier
    const tokens = await User.accessTokens.all(user)
    await Promise.all(
      tokens
        // Revoke other sessions, but keep named API tokens (e.g. automation tokens).
        .filter((token) => token.identifier !== currentTokenId && token.name === null)
        .map((token) => User.accessTokens.delete(user, token.identifier))
    )

    return response.ok(user)
  }

  /**
   * @changeUsername
   * @operationId changeUsername
   * @tag AUTH
   * @summary Change the authenticated user's username
   * @description Updates the display username of the currently authenticated user. Usernames are not unique. Requires authentication. Returns the updated user (including their own email).
   * @requestBody <ChangeUsernameValidator>
   * @responseBody 200 - {"user": {"id": 1, "username": "new_name", "email": "player@example.com", "verified": true, "provider": "", "role": "user", "avatarUrl": "", "createdAt": "2026-05-28T12:00:00.000Z", "updatedAt": "2026-05-28T12:00:00.000Z"}}
   * @responseBody 401 - {"errors": [{"message": "Unauthorized access"}]}
   * @responseBody 422 - {"errors": [{"message": "The username field must have at least 3 characters", "rule": "minLength", "field": "username"}]}
   */
  async changeUsername({ request, response, auth }: HttpContext) {
    const user = auth.getUserOrFail()
    const { username } = await ChangeUsernameValidator.validate(request.only(['username']))
    user.username = username
    await user.save()
    return response.ok({ user: { ...user.serialize(), email: user.email } })
  }

  /**
   * @updateAvatar
   * @operationId updateAvatar
   * @tag AUTH
   * @summary Upload the authenticated user's avatar
   * @description Accepts a multipart upload under the form field `avatar` (max 5 MB, extensions `jpg`, `jpeg`, `png`, `webp`, `gif`). The image is converted to a 256x256 WebP, stored via Drive, and its relative URL is saved on the user. Returns the updated user. Requires authentication.
   * @requestFormDataBody {"avatar": {"type": "string", "format": "binary"}}
   * @responseBody 200 - {"user": {"id": 1, "username": "player", "email": "player@example.com", "verified": true, "provider": "", "role": "user", "avatarUrl": "/images/avatars/1-3f1c2c5e-8b7d-4f1a-9b6e-1d8a0c2e3f44.webp", "createdAt": "2026-05-28T12:00:00.000Z", "updatedAt": "2026-05-28T12:00:00.000Z"}}
   * @responseBody 400 - {"error": "No image provided"}
   * @responseBody 401 - {"errors": [{"message": "Unauthorized access"}]}
   */
  async updateAvatar({ request, response, auth, i18n }: HttpContext) {
    const user = auth.getUserOrFail()
    const image = request.file('avatar', {
      size: '5mb',
      extnames: ['jpg', 'jpeg', 'png', 'webp', 'gif'],
    })

    if (!image) return response.badRequest({ error: i18n.t('messages.auth.noImageProvided') })
    if (!image.isValid) return response.badRequest({ error: image.errors })
    if (!image.tmpPath) return response.badRequest({ error: i18n.t('messages.auth.invalidUpload') })

    const buffer = await fs.readFile(image.tmpPath)
    const previousAvatar = user.avatarUrl
    user.avatarUrl = await ImageStorageService.storeUserAvatar(user.id, buffer)
    await user.save()

    // Remove the previous avatar (only our own uploads — never an OAuth URL).
    if (previousAvatar?.startsWith('/images/avatars/')) {
      await ImageStorageService.deletePublicAsset(previousAvatar)
    }

    return response.ok({ user: { ...user.serialize(), email: user.email } })
  }

  /**
   * @logout
   * @operationId logout
   * @tag AUTH
   * @summary Log out of the current session
   * @description Revokes the access token presented on this request, invalidating only the current session server-side. Requires authentication.
   * @responseBody 200 - {"message": "Logged out"}
   * @responseBody 401 - {"errors": [{"message": "Unauthorized access"}]}
   */
  async logout({ auth, response, i18n }: HttpContext) {
    const user = auth.getUserOrFail()
    await User.accessTokens.delete(user, user.currentAccessToken.identifier)
    return response.ok({ message: i18n.t('messages.auth.loggedOut') })
  }

  /**
   * @logoutAll
   * @operationId logoutAll
   * @tag AUTH
   * @summary Revoke all sessions (log out of every device)
   * @description Revokes every access token of the authenticated user, including the current one, signing them out on all devices. Useful after a suspected compromise. Requires authentication.
   * @responseBody 200 - {"message": "All sessions revoked", "revoked": 3}
   * @responseBody 401 - {"errors": [{"message": "Unauthorized access"}]}
   */
  async logoutAll({ auth, response, i18n }: HttpContext) {
    const user = auth.getUserOrFail()
    const tokens = await User.accessTokens.all(user)
    // Only revoke session tokens; named API tokens are managed separately.
    const sessions = tokens.filter((token) => token.name === null)
    await Promise.all(sessions.map((token) => User.accessTokens.delete(user, token.identifier)))
    return response.ok({
      message: i18n.t('messages.auth.allSessionsRevoked'),
      revoked: sessions.length,
    })
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
  async providerLogin({ ally, request, response, i18n }: HttpContext) {
    const provider = request.param('provider')
    if (provider !== 'discord' && provider !== 'google') {
      return response.badRequest({ error: i18n.t('messages.auth.unsupportedProvider') })
    }
    const driverInstance = ally.use(provider)
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
  async discordCallback({ ally, response, i18n }: HttpContext) {
    const discordInstance = ally.use('discord')
    const discordUser = await discordInstance.user()

    if (discordInstance.accessDenied())
      return response.badRequest({ message: i18n.t('messages.auth.oauthCancelled') })

    if (discordInstance.stateMisMatch())
      return response.badRequest({
        message: i18n.t('messages.auth.oauthStateMismatch'),
      })

    if (discordInstance.hasError())
      return response.badRequest({
        message: i18n.t('messages.auth.oauthError'),
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

    if (user.provider !== 'discord')
      return response.badRequest({ message: i18n.t('messages.auth.cannotLoginWithProvider') })

    await this.rehostProviderAvatar(user)

    return {
      user,
      accessToken: await User.accessTokens.create(user),
    }
  }

  /**
   * If the user's avatar is still an external provider URL, download it once and
   * store it on our own storage so we don't depend on (or hotlink) the provider's
   * CDN. Best-effort: on failure we keep the external URL.
   */
  private async rehostProviderAvatar(user: User): Promise<void> {
    if (!user.avatarUrl || !/^https?:\/\//i.test(user.avatarUrl)) return

    const stored = await ImageStorageService.storeUserAvatarFromUrl(user.id, user.avatarUrl)
    if (stored) {
      user.avatarUrl = stored
      await user.save()
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
  async googleCallback({ ally, response, i18n }: HttpContext) {
    const driverInstance = ally.use('google')
    const googleUser = await driverInstance.user()

    if (driverInstance.accessDenied())
      return response.badRequest({ message: i18n.t('messages.auth.oauthCancelled') })

    if (driverInstance.stateMisMatch())
      return response.badRequest({
        message: i18n.t('messages.auth.oauthStateMismatch'),
      })

    if (driverInstance.hasError())
      return response.badRequest({
        message: i18n.t('messages.auth.oauthError'),
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

    if (user.provider !== 'google')
      return response.badRequest({ message: i18n.t('messages.auth.cannotLoginWithProvider') })

    await this.rehostProviderAvatar(user)

    return {
      user,
      accessToken: await User.accessTokens.create(user),
    }
  }
}
