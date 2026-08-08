import type { HttpContext } from '@adonisjs/core/http'
import Server from '#models/server'
import BoostDetectionService from '#services/boost_detection_service'
import { ReviewBoostValidator } from '#validators/server_boost'

export default class ServerBoostController {
  /**
   * @adminIndex
   * @operationId adminListBoostReports
   * @tag SERVER BOOST
   * @summary List servers suspected of inflating their player count (admin)
   * @description Returns every server whose boost score reaches the watch threshold, most suspicious first, with the per-signal breakdown that produced the score. Admin only.
   * @responseBody 200 - [{"serverId": 1, "score": 100, "level": "likely", "detectedFactor": 4, "estimatedRealPlayers": 609, "signals": [{"key": "valueLattice", "points": 70, "detail": "100.0 % des relevés sont divisibles par 4 — multiplicateur ×4"}], "server": "<Server>"}]
   * @responseBody 403 - {"error": "Access denied. Admin privileges required."}
   */
  async adminIndex() {
    return BoostDetectionService.listQueue()
  }

  /**
   * @review
   * @operationId adminReviewBoostReport
   * @tag SERVER BOOST
   * @summary Record an admin verdict on a suspected server (admin)
   * @description Stores the verdict alongside a frozen copy of the score and signals that motivated it, and updates the server's public boost status. Admin only.
   * @paramPath id - The server id - @type(number) @required
   * @requestBody <ReviewBoostValidator>
   * @responseBody 200 - {"message": "Verdict recorded.", "server": "<Server>"}
   * @responseBody 404 - {"message": "Server not found"}
   */
  async review(ctx: HttpContext) {
    const { params, request, auth, response, i18n } = ctx
    const server = await Server.find(params.id)
    if (!server) return response.notFound({ message: i18n.t('messages.serverBoost.notFound') })

    const { verdict, note } = await ReviewBoostValidator.validate(request.only(['verdict', 'note']))
    await BoostDetectionService.review(server, auth.user!, verdict, note)

    return { message: i18n.t('messages.serverBoost.reviewed'), server }
  }
}
