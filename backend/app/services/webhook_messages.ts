import type Server from '#models/server'
import type ServerOwnershipClaim from '#models/server_ownership_claim'
import type ServerReport from '#models/server_report'
import type User from '#models/user'
import type Webhook from '#models/webhook'
import env from '#start/env'
import type { ReportReason } from '../constants/server_report.js'
import type { WebhookEvent } from '../constants/webhook.js'

export interface DiscordEmbed {
  title: string
  url?: string
  color: number
  description?: string
  fields?: { name: string; value: string; inline?: boolean }[]
  thumbnail?: { url: string }
  footer?: { text: string }
  timestamp?: string
}

const COLORS = {
  claim: 0x3b82f6,
  submitted: 0xf59e0b,
  report: 0xef4444,
  test: 0x22c55e,
} as const

const REPORT_REASON_LABELS: Record<ReportReason, string> = {
  scam: 'Arnaque',
  inappropriate_content: 'Contenu inapproprié',
  offline: 'Toujours hors ligne / injoignable',
  fake_playercount: 'Nombre de connectés truqué',
  other: 'Autre',
}

const EVENT_LABELS: Record<WebhookEvent, string> = {
  'ownership_claim.created': 'Demandes de propriété',
  'server.submitted': 'Serveurs à modérer',
  'server_report.created': 'Signalements',
}

const DEFAULT_PORT = 25565

const truncate = (text: string, max: number) =>
  text.length > max ? `${text.slice(0, max - 1)}…` : text

const escapeMarkdown = (text: string) => text.replace(/([\\`*_~|>[\]()])/g, '\\$1')

const quote = (text: string, max = 900) =>
  truncate(text.trim(), max)
    .split('\n')
    .map((line) => `> ${escapeMarkdown(line)}`)
    .join('\n')

const withBase = (base: string | undefined, path: string) =>
  base ? `${base.replace(/\/$/, '')}${path}` : undefined

const siteUrl = (path: string) => withBase(env.get('WEBSITE_URL'), path)

const serverAddress = (server: Server) =>
  `\`${server.port === DEFAULT_PORT ? server.address : `${server.address}:${server.port}`}\``

const serverThumbnail = (server: Server) => {
  const url = server.imageUrl && withBase(env.get('S3_CDN_URL'), `${server.imageUrl}.png`)
  return url ? { url } : undefined
}

const link = (label: string, url: string | undefined) => (url ? `[${label}](${url})` : undefined)

const lines = (...parts: (string | null | undefined | false)[]) => parts.filter(Boolean).join('\n')

const footer = (section: string) => ({ text: `Minecraft Stats · ${section}` })

export function ownershipClaimMessage(
  claim: ServerOwnershipClaim,
  server: Server,
  user: User
): DiscordEmbed {
  const adminLink = siteUrl('/admin/ownership-claims')
  return {
    title: truncate(`🛡️ Demande de propriété · ${server.name}`, 256),
    url: adminLink,
    color: COLORS.claim,
    description: lines(
      `**${escapeMarkdown(user.username)}** affirme être le propriétaire de ce serveur.`,
      claim.evidence && `\n${quote(claim.evidence)}`,
      claim.evidenceUrl && `\n🔗 ${link('Voir la preuve', claim.evidenceUrl)}`
    ),
    fields: [
      { name: 'Adresse', value: serverAddress(server), inline: true },
      {
        name: 'Liens',
        value:
          lines(
            link('Page du serveur', siteUrl(`/servers/${server.id}`)),
            link('Traiter la demande', adminLink)
          ) || '—',
        inline: true,
      },
    ],
    thumbnail: serverThumbnail(server),
    footer: footer('Propriété'),
  }
}

export function serverSubmittedMessage(server: Server, user: User): DiscordEmbed {
  const adminLink = siteUrl('/admin/servers-pending')
  return {
    title: truncate(`🆕 Serveur à modérer · ${server.name}`, 256),
    url: adminLink,
    color: COLORS.submitted,
    description: `Soumis par **${escapeMarkdown(user.username)}**. Il reste invisible sur le site tant qu'il n'est pas approuvé.`,
    fields: [
      { name: 'Adresse', value: serverAddress(server), inline: true },
      ...(server.version
        ? [{ name: 'Version', value: escapeMarkdown(truncate(server.version, 100)), inline: true }]
        : []),
      ...(adminLink
        ? [{ name: 'Action', value: link('Approuver ou refuser', adminLink)!, inline: true }]
        : []),
    ],
    thumbnail: serverThumbnail(server),
    footer: footer('Modération'),
  }
}

export function serverReportMessage(
  report: ServerReport,
  server: Server,
  reporter: User
): DiscordEmbed {
  const adminLink = siteUrl('/admin/servers-pending')
  return {
    title: truncate(`🚩 Signalement · ${server.name}`, 256),
    url: adminLink,
    color: COLORS.report,
    description: lines(
      `**${REPORT_REASON_LABELS[report.reason]}** · signalé par **${escapeMarkdown(reporter.username)}**`,
      report.details && `\n${quote(report.details)}`
    ),
    fields: [
      { name: 'Adresse', value: serverAddress(server), inline: true },
      {
        name: 'Liens',
        value:
          lines(
            link('Page du serveur', siteUrl(`/servers/${server.id}`)),
            link('Traiter le signalement', adminLink)
          ) || '—',
        inline: true,
      },
    ],
    thumbnail: serverThumbnail(server),
    footer: footer('Signalements'),
  }
}

export function testMessage(webhook: Webhook): DiscordEmbed {
  return {
    title: '✅ Webhook connecté',
    color: COLORS.test,
    description: lines(
      `**${escapeMarkdown(webhook.name)}** recevra désormais :`,
      ...webhook.events.map((event) => `• ${EVENT_LABELS[event]}`)
    ),
    footer: footer('Webhooks'),
  }
}
