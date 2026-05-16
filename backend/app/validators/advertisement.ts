import vine from '@vinejs/vine'

/**
 * Validateur de création d'une publicité.
 */
export const CreateAdvertisementValidator = vine.compile(
  vine.object({
    name: vine.string().trim().minLength(2).maxLength(255),
    type: vine.enum(['custom', 'network']).optional(),
    htmlContent: vine.string().minLength(1).maxLength(50000),
    enabled: vine.boolean().optional(),
    weight: vine.number().min(1).max(1000).optional(),
    showOnHome: vine.boolean().optional(),
    showOnServer: vine.boolean().optional(),
    startsAt: vine.string().trim().nullable().optional(),
    endsAt: vine.string().trim().nullable().optional(),
    categoryIds: vine.array(vine.number().positive()).optional(),
  })
)

/**
 * Validateur de mise à jour d'une publicité (tous les champs optionnels).
 */
export const UpdateAdvertisementValidator = vine.compile(
  vine.object({
    name: vine.string().trim().minLength(2).maxLength(255).optional(),
    type: vine.enum(['custom', 'network']).optional(),
    htmlContent: vine.string().minLength(1).maxLength(50000).optional(),
    enabled: vine.boolean().optional(),
    weight: vine.number().min(1).max(1000).optional(),
    showOnHome: vine.boolean().optional(),
    showOnServer: vine.boolean().optional(),
    startsAt: vine.string().trim().nullable().optional(),
    endsAt: vine.string().trim().nullable().optional(),
    categoryIds: vine.array(vine.number().positive()).optional(),
  })
)
