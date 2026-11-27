import type { HttpContext } from '@adonisjs/core/http'
import Server from '#models/server'
import ServerModerationService from '#services/server_moderation_service'
import { ReviewServerModerationValidator } from '#validators/server_moderation'

export default class ServerModerationController {
  /**
   * @adminIndex
   * @operationId adminListPendingServers
   * @tag SERVER MODERATION
   * @summary List servers awaiting moderation (admin or support)
   * @description Returns every server whose submission is still pending approval, oldest first. These servers are invisible on every public surface and are not pinged until approved. Admin or support only.
   * @responseBody 200 - [{"id": 1, "name": "Hypixel", "address": "mc.hypixel.net", "moderationStatus": "pending", "createdAt": "2026-05-28T12:00:00.000Z"}]
   * @responseBody 403 - {"error": "Access denied. Moderator privileges required."}
   */
  async adminIndex() {
    return ServerModerationService.listPending()
  }

  /**
   * @search
   * @operationId adminSearchServersForModeration
   * @tag SERVER MODERATION
   * @summary Search any server to approve/block it (admin or support)
   * @description Case-insensitive substring match against name and address, across every server regardless of moderation status (unlike adminIndex, which only lists the pending queue). This is how a support or admin user acts on a server that wasn't reported through any queue — a Discord ticket, for instance. Returns at most 25 results, biggest servers first. Admin or support only.
   * @paramQuery search - Substring matched against name and address (case-insensitive) - @type(string) @example(hypixel)
   * @responseBody 200 - [{"id": 1, "name": "Hypixel", "address": "mc.hypixel.net", "moderationStatus": "approved"}]
   * @responseBody 403 - {"error": "Access denied. Moderator privileges required."}
   */
  async search({ request }: HttpContext) {
    const term = request.input('search', '').trim()
    if (term.length < 2) return []
    return ServerModerationService.search(term)
  }

  /**
   * @review
   * @operationId adminReviewServerModeration
   * @tag SERVER MODERATION
   * @summary Approve or block a server (admin or support)
   * @description Records a moderation verdict. `approved` lists the server on every public surface and resumes pinging immediately — this is also how a previous block is lifted, there is no separate "unblock" action. `blocked` removes it from every public surface and stops pinging, independently of the owner's own hide toggle (`hidden_at`): only an admin or support can lift it. Admin or support only.
   * @paramPath id - The server id - @type(number) @example(134) @required
   * @requestBody <ReviewServerModerationValidator>
   * @responseBody 200 - {"message": "Verdict recorded.", "server": "<Server>"}
   * @responseBody 404 - {"message": "Server not found"}
   */
  async review(ctx: HttpContext) {
    const { params, request, auth, response, i18n } = ctx
    const server = await Server.query()
      .apply((scopes) => scopes.withHidden())
      .where('id', params.id)
      .first()
    if (!server) {
      return response.notFound({ message: i18n.t('messages.serverModeration.notFound') })
    }

    const { verdict, note } = await ReviewServerModerationValidator.validate(
      request.only(['verdict', 'note'])
    )
    await ServerModerationService.review(server, auth.user!, verdict, note)

    return { message: i18n.t('messages.serverModeration.reviewed'), server }
  }
}
