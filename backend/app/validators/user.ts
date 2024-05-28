import vine from '@vinejs/vine'

export const CreateUserValidator = vine.compile(
  vine.object({
    username: vine.string().maxLength(254).minLength(3),
    email: vine.string().email().maxLength(254),
    password: vine.string().maxLength(72).minLength(8),
  })
)

export const UpdateUserValidator = vine.compile(
  vine.object({
    username: vine.string().maxLength(254).minLength(3).optional(),
    email: vine.string().email().maxLength(254).optional(),
    password: vine.string().maxLength(72).minLength(8).optional(),
  })
)

export const LoginUserValidator = vine.compile(
  vine.object({
    email: vine.string().email().maxLength(254),
    password: vine.string().maxLength(72).minLength(8),
  })
)
