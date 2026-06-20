import vine from '@vinejs/vine'

export const attachServerCategoryValidator = vine.compile(
  vine.object({
    serverId: vine.number().positive(),
    categoryId: vine.number().positive(),
  })
)
