import vine from '@vinejs/vine'
import { MODERATION_VERDICTS } from '../constants/server_moderation.js'

export const ReviewServerModerationValidator = vine.compile(
  vine.object({
    verdict: vine.enum(MODERATION_VERDICTS),
    note: vine.string().trim().maxLength(2000).optional(),
  })
)
