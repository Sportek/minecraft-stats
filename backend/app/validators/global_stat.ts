import vine from '@vinejs/vine'
import { epochMsField } from './helpers.js'
import { STAT_INTERVALS } from '../constants/intervals.js'

export const GlobalStatValidator = vine.compile(
  vine.object({
    fromDate: epochMsField().optional(),
    toDate: epochMsField().optional(),
    interval: vine.enum(STAT_INTERVALS).optional(),
    categoryId: vine.number().optional(),
    languageId: vine.number().optional(),
  })
)
