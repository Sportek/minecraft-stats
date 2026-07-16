import User from '#models/user'
import UserProvider from '#models/user_provider'
import { LinkProviderValidator } from '#validators/user'
import type { HttpContext } from '@adonisjs/core/http'
import { DateTime } from 'luxon'
import { createHash } from 'node:crypto'

export default class UserProvidersController {
  /**
   * @confirm
   * @operationId confirmProviderLink
   * @tag AUTH
   * @summary Confirm adding an OAuth provider to an existing account
   * @description Validates the token from the confirmation email sent when an OAuth login matched an existing account (see googleCallback/discordCallback), marks the provider link as confirmed and clears the token. Clicking the emailed link proves ownership of the address, so the account is also marked verified and the user is signed in directly (user + fresh access token returned). Invalid and expired tokens return the same generic error to avoid leaking token state.
   * @requestBody <LinkProviderValidator>
   * @responseBody 200 - {"user": {"id": 1, "username": "player", "verified": true, "provider": "", "role": "user", "avatarUrl": "", "createdAt": "2026-05-28T12:00:00.000Z", "updatedAt": "2026-05-28T12:00:00.000Z"}, "accessToken": {"type": "bearer", "token": "oat_...", "expiresAt": "2026-06-27T12:00:00.000Z"}}
   * @responseBody 400 - {"message": "This confirmation link is invalid or has expired."}
   * @responseBody 422 - {"errors": [{"message": "The token field must be defined", "rule": "required", "field": "token"}]}
   */
  async confirm({ request, response, i18n }: HttpContext) {
    const { token } = await LinkProviderValidator.validate(request.only(['token']))

    const tokenHash = createHash('sha256').update(token).digest('hex')
    const link = await UserProvider.query()
      .where('link_token_hash', tokenHash)
      .preload('user')
      .first()

    // Message unique pour token inconnu OU expiré : on ne distingue pas les deux.
    if (!link || !link.linkTokenExpiresAt || link.linkTokenExpiresAt < DateTime.now()) {
      return response.badRequest({ message: i18n.t('messages.auth.invalidProviderLinkToken') })
    }

    link.confirmedAt = DateTime.now()
    link.linkTokenHash = null
    link.linkTokenExpiresAt = null
    await link.save()

    // Cliquer le lien reçu par email prouve la possession de l'adresse : on en
    // profite pour vérifier un compte local qui ne l'aurait jamais été.
    const user = link.user
    if (!user.verified) {
      user.verified = true
      await user.save()
    }

    return {
      user,
      accessToken: await User.accessTokens.create(user),
    }
  }

  /**
   * @index
   * @operationId listLinkedProviders
   * @tag AUTH
   * @summary List the OAuth providers linked to the authenticated account
   * @description Returns the confirmed OAuth sign-in methods of the current user, with the date each one was linked. Pending (unconfirmed) links are not included. Requires authentication.
   * @responseBody 200 - {"providers": [{"provider": "google", "linkedAt": "2026-05-28T12:00:00.000Z"}]}
   * @responseBody 401 - {"errors": [{"message": "Unauthorized access"}]}
   */
  async index({ auth }: HttpContext) {
    const user = auth.getUserOrFail()
    const links = await UserProvider.query()
      .where('user_id', user.id)
      .whereNotNull('confirmed_at')
      .orderBy('confirmed_at', 'asc')

    return {
      providers: links.map((link) => ({ provider: link.provider, linkedAt: link.confirmedAt })),
    }
  }

  /**
   * @destroy
   * @operationId unlinkProvider
   * @tag AUTH
   * @summary Unlink an OAuth provider from the authenticated account
   * @description Removes a confirmed OAuth sign-in method from the current user. Refused when it is the account's last usable sign-in method (accounts created via OAuth have no usable password). Requires authentication.
   * @paramPath provider - The OAuth provider to unlink - @type(string) @enum(google,discord) @required
   * @responseBody 200 - {"message": "Sign-in method removed"}
   * @responseBody 400 - {"message": "You cannot remove your only sign-in method"}
   * @responseBody 404 - {"message": "This provider is not linked to your account"}
   * @responseBody 401 - {"errors": [{"message": "Unauthorized access"}]}
   */
  async destroy({ auth, request, response, i18n }: HttpContext) {
    const user = auth.getUserOrFail()
    const provider = request.param('provider')

    const links = await UserProvider.query().where('user_id', user.id).whereNotNull('confirmed_at')
    const link = links.find((candidate) => candidate.provider === provider)
    if (!link) return response.notFound({ message: i18n.t('messages.auth.providerNotLinked') })

    // Garde-fou : ne jamais laisser un compte sans méthode de connexion. Les
    // comptes créés via OAuth (users.provider non nul) ont un mot de passe
    // aléatoire inutilisable — il leur faut au moins un autre provider confirmé.
    const hasPassword = user.provider === null
    if (!hasPassword && links.length <= 1)
      return response.badRequest({ message: i18n.t('messages.auth.cannotUnlinkLastMethod') })

    await link.delete()
    return response.ok({ message: i18n.t('messages.auth.providerUnlinked') })
  }
}
