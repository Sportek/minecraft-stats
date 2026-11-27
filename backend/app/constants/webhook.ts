export type WebhookEvent = 'ownership_claim.created' | 'server.submitted' | 'server_report.created'

export const WEBHOOK_EVENTS: WebhookEvent[] = [
  'ownership_claim.created',
  'server.submitted',
  'server_report.created',
]

// Webhook Discord uniquement : bloque toute autre destination (SSRF, fuite de données).
export const DISCORD_WEBHOOK_URL =
  /^https:\/\/(?:(?:ptb|canary)\.)?discord(?:app)?\.com\/api\/webhooks\/\d+\/[\w-]+$/
