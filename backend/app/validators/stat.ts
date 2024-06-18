import vine from '@vinejs/vine'

export const StatValidator = vine.compile(
  vine.object({
    server_id: vine.number(),
    exactTime: vine.number().optional(),
    fromDate: vine.number().optional(),
    toDate: vine.number().optional(),
    interval: vine.string().optional(),
  })
)
