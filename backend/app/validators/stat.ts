import vine from '@vinejs/vine'

export const StatValidator = vine.compile(
  vine.object({
    serverId: vine.number(),
    exactTime: vine.date(),
    fromDate: vine.date(),
    toDate: vine.date(),
    interval: vine.enum(['minute', 'hour', 'day']),
  })
)
