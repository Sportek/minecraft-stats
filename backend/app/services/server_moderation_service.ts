import Server from '#models/server'
import ServerModerationReview from '#models/server_moderation_review'
import type User from '#models/user'
import CacheService from '#services/cache_service'
import { DateTime } from 'luxon'
import type { ModerationVerdict } from '../constants/server_moderation.js'

export default class ServerModerationService {
  static async listPending(): Promise<Server[]> {
    return Server.query()
      .apply((scopes) => scopes.withHidden())
      .where('moderation_status', 'pending')
      .orderBy('created_at', 'asc')
  }

  static async search(term: string): Promise<Server[]> {
    return Server.query()
      .apply((scopes) => scopes.withHidden())
      .where((query) => query.whereILike('name', `%${term}%`).orWhereILike('address', `%${term}%`))
      .orderBy('last_player_count', 'desc')
      .limit(25)
  }

  static async review(
    server: Server,
    reviewer: User,
    verdict: ModerationVerdict,
    note?: string
  ): Promise<ServerModerationReview> {
    const review = await ServerModerationReview.create({
      serverId: server.id,
      verdict,
      reviewedBy: reviewer.id,
      note: note ?? null,
    })

    server.moderationStatus = verdict
    server.moderationReviewedAt = DateTime.now()
    if (verdict === 'approved') server.nextPingAt = null
    await server.save()

    await CacheService.invalidatePattern('paginate:*')
    await CacheService.invalidate(CacheService.SERVERS_LIST_KEY)

    return review
  }
}
