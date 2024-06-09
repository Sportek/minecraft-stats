import vine from '@vinejs/vine'

export const CreateCategoryValidator = vine.compile(
  vine.object({
    name: vine.string().trim(),
  })
)
