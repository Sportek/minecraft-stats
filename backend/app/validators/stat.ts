import vine from '@vinejs/vine'
import { epochMsField } from './helpers.js'
import { STAT_INTERVALS } from '../constants/intervals.js'

export const StatValidator = vine.compile(
  vine.object({
    server_id: vine.number(),
    exactTime: epochMsField().optional(),
    fromDate: epochMsField().optional(),
    toDate: epochMsField().optional(),
    interval: vine.enum(STAT_INTERVALS).optional(),
  })
)
