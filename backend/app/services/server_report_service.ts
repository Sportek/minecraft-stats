import type Server from '#models/server'
import ServerReport from '#models/server_report'
import type User from '#models/user'
import { DateTime } from 'luxon'
import type { ReportReason } from '../constants/server_report.js'

export default class ServerReportService {
  static async hasOpenReport(serverId: number, reporterId: number): Promise<boolean> {
    const existing = await ServerReport.query()
      .where('server_id', serverId)
      .where('reporter_id', reporterId)
      .where('status', 'open')
      .first()
    return existing !== null
  }

  static async create(
    server: Server,
    reporter: User,
    reason: ReportReason,
    details?: string
  ): Promise<ServerReport> {
    return ServerReport.create({
      serverId: server.id,
      reporterId: reporter.id,
      reason,
      details: details ?? null,
      status: 'open',
    })
  }

  static async listOpen(): Promise<ServerReport[]> {
    return ServerReport.query()
      .where('status', 'open')
      .preload('server', (query) => query.apply((scopes) => scopes.withHidden()))
      .preload('reporter', (query) => query.select('id', 'username'))
      .orderBy('created_at', 'asc')
  }

  static async resolve(report: ServerReport, resolver: User): Promise<ServerReport> {
    report.status = 'resolved'
    report.resolvedBy = resolver.id
    report.resolvedAt = DateTime.now()
    await report.save()
    return report
  }
}
