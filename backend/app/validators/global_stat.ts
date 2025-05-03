import vine from '@vinejs/vine'

export const GlobalStatValidator = vine.compile(
  vine.object({
    fromDate: vine.number().optional(),
    toDate: vine.number().optional(),
    interval: vine
      .enum(['30 minutes', '1 hour', '1 day', '2 hours', '6 hours', '1 week'])
      .optional(),
  })
) 