import vine from '@vinejs/vine'

export const CreatePostValidator = vine.compile(
  vine.object({
    title: vine.string().minLength(3).maxLength(255),
    slug: vine.string().minLength(3).maxLength(255).optional(),
    content: vine.string().minLength(10),
    excerpt: vine.string().maxLength(500).optional(),
    coverImage: vine.string().maxLength(500).optional(),
  })
)

export const UpdatePostValidator = vine.compile(
  vine.object({
    title: vine.string().minLength(3).maxLength(255).optional(),
    slug: vine.string().minLength(3).maxLength(255).optional(),
    content: vine.string().minLength(10).optional(),
    excerpt: vine.string().maxLength(500).optional(),
    coverImage: vine.string().maxLength(500).optional(),
  })
)

export const PreviewPlaceholderValidator = vine.compile(
  vine.object({
    placeholderName: vine.string(),
    serverId: vine.number().positive(),
  })
)

export const ResolvePlaceholdersValidator = vine.compile(
  vine.object({
    placeholders: vine
      .array(vine.string().regex(/^%[A-Z_]+_\d+%$/))
      .minLength(1)
      .maxLength(50),
  })
)
