import vine from '@vinejs/vine'

export const StatValidator = vine.compile(
  vine.object({
    server_id: vine.number(),
    exactTime: vine.number().optional(),
    fromDate: vine.number().optional(),
    toDate: vine.number().optional(),
    interval: vine
      .enum(['30 minutes', '1 hour', '1 day', '2 hours', '6 hours', '1 week'])
      .optional(),
  })
)
