import type Server from '#models/server'
import type ServerOwnershipClaim from '#models/server_ownership_claim'
import type ServerReport from '#models/server_report'
import type User from '#models/user'
import Webhook from '#models/webhook'
import {
  type DiscordEmbed,
  ownershipClaimMessage,
  serverReportMessage,
  serverSubmittedMessage,
  testMessage,
} from '#services/webhook_messages'
import logger from '@adonisjs/core/services/logger'
import { DateTime } from 'luxon'
import type { WebhookEvent } from '../constants/webhook.js'

const SEND_TIMEOUT_MS = 5000

export interface WebhookDelivery {
  ok: boolean
  status: number | null
  error: string | null
}

const truncate = (text: string, max: number) =>
  text.length > max ? `${text.slice(0, max - 1)}…` : text

export default class WebhookService {
  static async notifyOwnershipClaim(claim: ServerOwnershipClaim, server: Server, user: User) {
    await this.notify('ownership_claim.created', ownershipClaimMessage(claim, server, user))
  }

  static async notifyServerSubmitted(server: Server, user: User) {
    await this.notify('server.submitted', serverSubmittedMessage(server, user))
  }

  static async notifyServerReport(report: ServerReport, server: Server, reporter: User) {
    await this.notify('server_report.created', serverReportMessage(report, server, reporter))
  }

  static sendTest(webhook: Webhook): Promise<WebhookDelivery> {
    return this.deliver(webhook, testMessage(webhook))
  }

  // La requête qui déclenche l'événement n'attend que la lecture des webhooks, pas Discord.
  private static async notify(event: WebhookEvent, embed: DiscordEmbed) {
    try {
      const webhooks = await Webhook.query()
        .where('enabled', true)
        .whereRaw('events @> ?::jsonb', [JSON.stringify([event])])
      for (const webhook of webhooks) {
        void this.deliver(webhook, embed)
      }
    } catch (error) {
      logger.warn({ event, err: (error as Error).message }, 'WEBHOOK: lookup failed')
    }
  }

  static async deliver(webhook: Webhook, embed: DiscordEmbed): Promise<WebhookDelivery> {
    const delivery = await this.post(webhook.url, {
      username: 'Minecraft Stats',
      allowed_mentions: { parse: [] },
      embeds: [{ ...embed, timestamp: new Date().toISOString() }],
    })

    try {
      webhook.merge({
        lastStatus: delivery.status,
        lastError: delivery.error,
        lastSentAt: DateTime.now(),
      })
      await webhook.save()
    } catch (error) {
      logger.warn(
        { webhookId: webhook.id, err: (error as Error).message },
        'WEBHOOK: status save failed'
      )
    }
    return delivery
  }

  private static async post(url: string, body: unknown): Promise<WebhookDelivery> {
    try {
      const response = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
        signal: AbortSignal.timeout(SEND_TIMEOUT_MS),
      })
      if (response.ok) return { ok: true, status: response.status, error: null }
      const text = await response.text().catch(() => '')
      return {
        ok: false,
        status: response.status,
        error: truncate(text || response.statusText, 500),
      }
    } catch (error) {
      return { ok: false, status: null, error: truncate((error as Error).message, 500) }
    }
  }
}
