import vine from '@vinejs/vine'
import { DISCORD_WEBHOOK_URL, WEBHOOK_EVENTS } from '../constants/webhook.js'

const events = vine.array(vine.enum(WEBHOOK_EVENTS)).minLength(1).distinct()

export const CreateWebhookValidator = vine.compile(
  vine.object({
    name: vine.string().trim().minLength(1).maxLength(100),
    url: vine.string().trim().regex(DISCORD_WEBHOOK_URL),
    events,
  })
)

export const UpdateWebhookValidator = vine.compile(
  vine.object({
    name: vine.string().trim().minLength(1).maxLength(100).optional(),
    events: events.clone().optional(),
    enabled: vine.boolean().optional(),
  })
)
