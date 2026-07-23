import vine from '@vinejs/vine'
import { DateTime } from 'luxon'
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

/**
 * Le fuseau part directement dans `AT TIME ZONE` et entre dans la clé de cache :
 * un identifiant inconnu ferait remonter une erreur Postgres en 500. On tranche
 * donc en amont, avec la base de données de fuseaux de Luxon.
 */
const ianaTimezoneRule = vine.createRule((value: unknown, _options: undefined, field) => {
  if (typeof value !== 'string') return
  if (!DateTime.local().setZone(value).isValid) {
    field.report('The {{ field }} field must be a valid IANA time zone', 'ianaTimezone', field)
  }
})

export const DailyRhythmValidator = vine.compile(
  vine.object({
    server_id: vine.number(),
    days: vine
      .number()
      .min(1)
      .max(730)
      .parse((value) => value ?? 30),
    timezone: vine
      .string()
      .maxLength(64)
      .use(ianaTimezoneRule())
      .parse((value) => value ?? 'UTC'),
  })
)
