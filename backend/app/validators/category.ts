import vine from '@vinejs/vine'

export const CreateCategoryValidator = vine.compile(
  vine.object({
    name: vine.string().trim(),
  })
)

export const CategoryIdValidator = vine.compile(
  vine.object({
    id: vine.number().positive(),
  })
)

export const UpdateCategoryValidator = vine.compile(
  vine.object({
    id: vine.number().positive(),
    name: vine.string().trim(),
  })
)
