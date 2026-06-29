import vine from '@vinejs/vine'

const localeEnum = vine.enum(['fr', 'en', 'es'])

// Une traduction à la création : titre et contenu requis, slug/excerpt optionnels.
const translationCreate = vine.object({
  locale: localeEnum,
  title: vine.string().minLength(3).maxLength(255),
  slug: vine.string().minLength(3).maxLength(255).optional(),
  content: vine.string().minLength(10),
  excerpt: vine.string().maxLength(500).optional(),
})

// À la mise à jour, chaque entrée est un upsert partiel ; seule `locale` est requise.
const translationUpdate = vine.object({
  locale: localeEnum,
  title: vine.string().minLength(3).maxLength(255).optional(),
  slug: vine.string().minLength(3).maxLength(255).optional(),
  content: vine.string().minLength(10).optional(),
  excerpt: vine.string().maxLength(500).optional(),
})

export const CreatePostValidator = vine.compile(
  vine.object({
    defaultLocale: localeEnum,
    coverImage: vine.string().maxLength(500).optional(),
    translations: vine.array(translationCreate).minLength(1),
  })
)

export const UpdatePostValidator = vine.compile(
  vine.object({
    defaultLocale: localeEnum.optional(),
    coverImage: vine.string().maxLength(500).optional(),
    translations: vine.array(translationUpdate).optional(),
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

export const SubmitFeedbackValidator = vine.compile(
  vine.object({
    helpful: vine.boolean(),
    // UUID visiteur anonyme (clé de déduplication du vote).
    visitorId: vine.string().minLength(8).maxLength(64),
  })
)
