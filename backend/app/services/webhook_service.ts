import type Server from '#models/server'
import type ServerOwnershipClaim from '#models/server_ownership_claim'
import type ServerReport from '#models/server_report'
import type User from '#models/user'
import Webhook from '#models/webhook'
import env from '#start/env'
import logger from '@adonisjs/core/services/logger'
import { DateTime } from 'luxon'
import type { WebhookEvent } from '../constants/webhook.js'

const SEND_TIMEOUT_MS = 5000

const COLORS = {
  info: 0x3b82f6,
  warning: 0xf59e0b,
  danger: 0xef4444,
  success: 0x22c55e,
} as const

interface DiscordEmbed {
  title: string
  url?: string
  color: number
  description?: string
  fields?: { name: string; value: string; inline?: boolean }[]
  timestamp?: string
}

export interface WebhookDelivery {
  ok: boolean
  status: number | null
  error: string | null
}

const truncate = (text: string, max: number) =>
  text.length > max ? `${text.slice(0, max - 1)}…` : text

const adminUrl = (path: string) => {
  const base = env.get('WEBSITE_URL')
  return base ? `${base.replace(/\/$/, '')}${path}` : undefined
}

const serverField = (server: Server) => ({
  name: 'Serveur',
  value: truncate(`${server.name} (${server.address}:${server.port})`, 1024),
})

export default class WebhookService {
  static async notifyOwnershipClaim(claim: ServerOwnershipClaim, server: Server, user: User) {
    const fields = [serverField(server), { name: 'Demandeur', value: user.username, inline: true }]
    if (claim.evidence) fields.push({ name: 'Preuve', value: truncate(claim.evidence, 1024) })
    if (claim.evidenceUrl)
      fields.push({ name: 'Lien de preuve', value: truncate(claim.evidenceUrl, 1024) })

    await this.notify('ownership_claim.created', {
      title: 'Nouvelle demande de propriété',
      url: adminUrl('/admin/ownership-claims'),
      color: COLORS.info,
      fields,
    })
  }

  static async notifyServerSubmitted(server: Server, user: User) {
    await this.notify('server.submitted', {
      title: 'Nouveau serveur à modérer',
      url: adminUrl('/admin/servers-pending'),
      color: COLORS.warning,
      fields: [serverField(server), { name: 'Soumis par', value: user.username, inline: true }],
    })
  }

  static async notifyServerReport(report: ServerReport, server: Server, reporter: User) {
    const fields = [
      serverField(server),
      { name: 'Motif', value: report.reason, inline: true },
      { name: 'Signalé par', value: reporter.username, inline: true },
    ]
    if (report.details) fields.push({ name: 'Détails', value: truncate(report.details, 1024) })

    await this.notify('server_report.created', {
      title: 'Nouveau signalement',
      url: adminUrl('/admin/servers-pending'),
      color: COLORS.danger,
      fields,
    })
  }

  static sendTest(webhook: Webhook): Promise<WebhookDelivery> {
    return this.deliver(webhook, {
      title: 'Webhook connecté',
      color: COLORS.success,
      description: `Le webhook « ${webhook.name} » recevra : ${webhook.events.join(', ')}.`,
    })
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
