import vine from '@vinejs/vine'

const withProtocol = (url: string) => (/^https?:\/\//i.test(url) ? url : `https://${url}`)

/**
 * Demande de réclamation manuelle : le demandeur décrit sa preuve (tag Discord,
 * explication…) et peut joindre un lien vers une preuve hébergée ailleurs. Pas
 * d'upload de fichier en v1 — texte + URL suffisent à une revue admin.
 */
export const CreateManualClaimValidator = vine.compile(
  vine.object({
    evidence: vine.string().trim().minLength(10).maxLength(2000),
    evidenceUrl: vine
      .string()
      .trim()
      .url({ protocols: ['http', 'https'] })
      .maxLength(2048)
      .transform(withProtocol)
      .optional(),
  })
)

/** Décision admin sur une demande manuelle : note facultative (motif de refus, etc.). */
export const ReviewClaimValidator = vine.compile(
  vine.object({
    note: vine.string().trim().maxLength(2000).optional(),
  })
)
