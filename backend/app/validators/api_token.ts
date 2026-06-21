import vine from '@vinejs/vine'

export const CreateApiTokenValidator = vine.compile(
  vine.object({
    name: vine.string().trim().minLength(1).maxLength(100),
    expiresInDays: vine.number().positive().max(3650).optional(),
  })
)
