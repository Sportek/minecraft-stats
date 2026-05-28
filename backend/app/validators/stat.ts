import vine from '@vinejs/vine'
import { epochMsField } from './helpers.js'

export const StatValidator = vine.compile(
  vine.object({
    server_id: vine.number(),
    exactTime: epochMsField().optional(),
    fromDate: epochMsField().optional(),
    toDate: epochMsField().optional(),
    interval: vine
      .enum(['30 minutes', '1 hour', '1 day', '2 hours', '6 hours', '1 week'])
      .optional(),
  })
)
