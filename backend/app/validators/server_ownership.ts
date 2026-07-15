import vine from '@vinejs/vine'

/**
 * Demande de réclamation manuelle : le demandeur décrit sa preuve (tag Discord,
 * explication…) et peut joindre un lien vers une preuve hébergée ailleurs. Pas
 * d'upload de fichier en v1 — texte + URL suffisent à une revue admin.
 */
export const CreateManualClaimValidator = vine.compile(
  vine.object({
    evidence: vine.string().trim().minLength(10).maxLength(2000),
    evidenceUrl: vine.string().trim().url().maxLength(2048).optional(),
  })
)

/** Décision admin sur une demande manuelle : note facultative (motif de refus, etc.). */
export const ReviewClaimValidator = vine.compile(
  vine.object({
    note: vine.string().trim().maxLength(2000).optional(),
  })
)
