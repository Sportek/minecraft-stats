import type { HttpContext } from '@adonisjs/core/http'
import Server from '#models/server'
import ServerReport from '#models/server_report'
import ServerReportService from '#services/server_report_service'
import { CreateServerReportValidator } from '#validators/server_report'

export default class ServerReportsController {
  /**
   * @store
   * @operationId reportServer
   * @tag SERVER REPORTS
   * @summary Report a server (authenticated)
   * @description Flags a server for admin/support review — distinct from the moderation queue a new submission goes through: this is for a server already live (or pending) that a member finds problematic (scam, offline, inappropriate content…). Does not change the server's moderation status by itself. Rejects a second open report from the same member on the same server with 409. Requires authentication.
   * @paramPath id - The server id - @type(number) @example(134) @required
   * @requestBody <CreateServerReportValidator>
   * @responseBody 200 - {"message": "Report submitted."}
   * @responseBody 404 - {"message": "Server not found"}
   * @responseBody 409 - {"message": "You already have an open report on this server."}
   */
  async store(ctx: HttpContext) {
    const { params, request, auth, response, i18n } = ctx
    const user = auth.user
    if (!user) {
      return response.unauthorized({ message: i18n.t('messages.serverReports.unauthorized') })
    }

    const server = await Server.query()
      .apply((scopes) => scopes.withHidden())
      .where('id', params.id)
      .first()
    if (!server) {
      return response.notFound({ message: i18n.t('messages.serverReports.notFound') })
    }

    if (await ServerReportService.hasOpenReport(server.id, user.id)) {
      return response.conflict({ message: i18n.t('messages.serverReports.alreadyOpen') })
    }

    const { reason, details } = await CreateServerReportValidator.validate(
      request.only(['reason', 'details'])
    )
    await ServerReportService.create(server, user, reason, details)

    return { message: i18n.t('messages.serverReports.created') }
  }

  /**
   * @adminIndex
   * @operationId adminListServerReports
   * @tag SERVER REPORTS
   * @summary List open server reports (admin or support)
   * @description Returns every open report, oldest first, with the reported server and reporter preloaded — regardless of the server's own moderation status (pending/approved/blocked). Admin or support only.
   * @responseBody 200 - [{"id": 1, "reason": "scam", "details": "Took my payment, never gave the rank.", "createdAt": "2026-05-28T12:00:00.000Z", "server": "<Server>", "reporter": {"id": 2, "username": "player"}}]
   * @responseBody 403 - {"error": "Access denied. Moderator privileges required."}
   */
  async adminIndex() {
    return ServerReportService.listOpen()
  }

  /**
   * @resolve
   * @operationId adminResolveServerReport
   * @tag SERVER REPORTS
   * @summary Dismiss a report (admin or support)
   * @description Marks a report as resolved without touching the reported server's moderation status — use the moderation review endpoint separately if the server itself needs approving/blocking. Admin or support only.
   * @paramPath id - The report id - @type(number) @required
   * @responseBody 200 - {"message": "Report resolved."}
   * @responseBody 404 - {"message": "Report not found"}
   */
  async resolve(ctx: HttpContext) {
    const { params, auth, response, i18n } = ctx
    const report = await ServerReport.find(params.id)
    if (!report) {
      return response.notFound({ message: i18n.t('messages.serverReports.reportNotFound') })
    }

    await ServerReportService.resolve(report, auth.user!)

    return { message: i18n.t('messages.serverReports.resolved') }
  }
}
