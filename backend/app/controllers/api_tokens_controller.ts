import User from '#models/user'
import { CreateApiTokenValidator } from '#validators/api_token'
import type { HttpContext } from '@adonisjs/core/http'

/**
 * Personal API tokens: long-lived, named access tokens a user can mint to
 * authenticate automated clients (e.g. the SEO blog bot). They authenticate
 * exactly like a session token but carry a `name`, which also shields them
 * from the bulk "log out everywhere" / password-change revocations.
 */
export default class ApiTokensController {
  /**
   * @index
   * @operationId listApiTokens
   * @tag API TOKENS
   * @summary List the authenticated user's API tokens
   * @description Returns the user's named API tokens (secrets are never included). Session tokens issued at login are excluded.
   * @responseBody 200 - [{"id": "1", "name": "SEO bot", "abilities": ["*"], "lastUsedAt": null, "expiresAt": "2027-06-21T12:00:00.000Z", "createdAt": "2026-06-21T12:00:00.000Z"}]
   * @responseBody 401 - {"errors": [{"message": "Unauthorized access"}]}
   */
  async index({ auth }: HttpContext) {
    const user = auth.getUserOrFail()
    const tokens = await User.accessTokens.all(user)
    return tokens
      .filter((token) => token.name !== null)
      .map((token) => ({
        id: token.identifier,
        name: token.name,
        abilities: token.abilities,
        lastUsedAt: token.lastUsedAt,
        expiresAt: token.expiresAt,
        createdAt: token.createdAt,
      }))
  }

  /**
   * @store
   * @operationId createApiToken
   * @tag API TOKENS
   * @summary Create a new API token
   * @description Mints a named, long-lived access token for the authenticated user. The plaintext token is returned only once in this response and cannot be retrieved later. Defaults to a one-year expiry.
   * @requestBody <CreateApiTokenValidator>
   * @responseBody 201 - {"type": "bearer", "name": "SEO bot", "token": "oat_...", "abilities": ["*"], "lastUsedAt": null, "expiresAt": "2027-06-21T12:00:00.000Z"}
   * @responseBody 401 - {"errors": [{"message": "Unauthorized access"}]}
   * @responseBody 422 - {"errors": [{"message": "The name field must be defined", "rule": "required", "field": "name"}]}
   */
  async store({ auth, request, response }: HttpContext) {
    const user = auth.getUserOrFail()
    const { name, expiresInDays } = await request.validateUsing(CreateApiTokenValidator)
    const token = await User.accessTokens.create(user, ['*'], {
      name,
      expiresIn: `${expiresInDays ?? 365} days`,
    })
    return response.created(token)
  }

  /**
   * @destroy
   * @operationId revokeApiToken
   * @tag API TOKENS
   * @summary Revoke an API token
   * @description Permanently revokes one of the authenticated user's API tokens by id. Only named API tokens can be revoked through this endpoint.
   * @paramPath id - The token identifier - @type(string) @required
   * @responseBody 204 - No content
   * @responseBody 401 - {"errors": [{"message": "Unauthorized access"}]}
   * @responseBody 404 - {"message": "Token not found"}
   */
  async destroy({ auth, params, response }: HttpContext) {
    const user = auth.getUserOrFail()
    const tokens = await User.accessTokens.all(user)
    const target = tokens.find(
      (token) => String(token.identifier) === String(params.id) && token.name !== null
    )
    if (!target) return response.notFound({ message: 'Token not found' })
    await User.accessTokens.delete(user, target.identifier)
    return response.noContent()
  }
}
