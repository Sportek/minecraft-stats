import User from '#models/user'
import BlacklistedIdentifier from '#models/blacklisted_identifier'
import BlacklistedIdentifierUser from '#models/blacklisted_identifier_user'
import AnalyticsService from '#services/analytics_service'
import db from '@adonisjs/lucid/services/db'
import { DateTime } from 'luxon'
import type { HttpContext } from '@adonisjs/core/http'

export default class BlacklistService {
  /**
   * Bans a user: flags the account, records the email (and any IP hashes tied
   * to it via visitor_accounts → visitors, best-effort — see
   * DuplicateAccountService.forUser for the same join) into
   * blacklisted_identifiers so re-registration is blocked even if this user
   * row is later deleted, and immediately revokes every session token — same
   * filter as AuthController.logoutAll. Each identifier is linked back to this
   * user (blacklisted_identifier_users) so unbanning them can safely lift the
   * block later — see `unblacklistUser`.
   */
  static async blacklistUser(
    targetUser: User,
    adminUser: User,
    reason: string | null
  ): Promise<void> {
    targetUser.blacklistedAt = DateTime.now()
    targetUser.blacklistedBy = adminUser.id
    targetUser.blacklistReason = reason
    await targetUser.save()

    const emailIdentifier = await BlacklistedIdentifier.updateOrCreate(
      { type: 'email', value: targetUser.email.trim().toLowerCase() },
      { reason, blacklistedBy: adminUser.id }
    )
    await this.linkIdentifier(emailIdentifier.id, targetUser.id)

    const links = await db
      .from('visitor_accounts')
      .where('user_id', targetUser.id)
      .select('visitor_id')
    const visitorIds = links.map((row) => row.visitor_id)
    if (visitorIds.length > 0) {
      const ipHashRows = await db
        .from('visitors')
        .whereIn('id', visitorIds)
        .whereNotNull('ip_hash')
        .select('ip_hash')
        .distinct()
      for (const { ip_hash: ipHash } of ipHashRows) {
        const ipIdentifier = await BlacklistedIdentifier.updateOrCreate(
          { type: 'ip', value: ipHash },
          { reason, blacklistedBy: adminUser.id }
        )
        await this.linkIdentifier(ipIdentifier.id, targetUser.id)
      }
    }

    const tokens = await User.accessTokens.all(targetUser)
    const sessions = tokens.filter((token) => token.name === null)
    await Promise.all(
      sessions.map((token) => User.accessTokens.delete(targetUser, token.identifier))
    )
  }

  /**
   * Clears the ban flag on the user row, then lifts the block on the
   * email/IP identifiers this ban created — but only the ones no longer tied
   * to any other currently-banned user (e.g. two banned accounts sharing an
   * IP: unbanning one must not unblock the IP for the other).
   */
  static async unblacklistUser(targetUser: User): Promise<void> {
    targetUser.blacklistedAt = null
    targetUser.blacklistedBy = null
    targetUser.blacklistReason = null
    await targetUser.save()

    const links = await db
      .from('blacklisted_identifier_users')
      .where('user_id', targetUser.id)
      .select('blacklisted_identifier_id')
    const identifierIds = links.map((row) => row.blacklisted_identifier_id)
    if (identifierIds.length === 0) return

    await db.from('blacklisted_identifier_users').where('user_id', targetUser.id).delete()

    const stillLinkedRows = await db
      .from('blacklisted_identifier_users')
      .whereIn('blacklisted_identifier_id', identifierIds)
      .select('blacklisted_identifier_id')
      .distinct()
    const stillLinkedIds = new Set(stillLinkedRows.map((row) => row.blacklisted_identifier_id))
    const freeIds = identifierIds.filter((id) => !stillLinkedIds.has(id))

    if (freeIds.length > 0) {
      await BlacklistedIdentifier.query().whereIn('id', freeIds).delete()
    }
  }

  /**
   * Checks whether an email or IP is on the blacklist — used by register()/OAuth
   * account creation to block re-registration by a banned actor.
   */
  static async isEmailOrIpBlacklisted(params: {
    email: string
    ipHash: string | null
  }): Promise<boolean> {
    const query = BlacklistedIdentifier.query().where((q) => {
      q.where((q2) => q2.where('type', 'email').where('value', params.email.trim().toLowerCase()))
      if (params.ipHash) {
        q.orWhere((q2) => q2.where('type', 'ip').where('value', params.ipHash!))
      }
    })
    return (await query.first()) !== null
  }

  /** Convenience wrapper around AnalyticsService for register()/OAuth callers. */
  static ipHash(request: HttpContext['request']): string | null {
    return AnalyticsService.hashIp(AnalyticsService.realIp(request))
  }

  private static async linkIdentifier(identifierId: number, userId: number): Promise<void> {
    await BlacklistedIdentifierUser.updateOrCreate(
      { blacklistedIdentifierId: identifierId, userId },
      {}
    )
  }
}
