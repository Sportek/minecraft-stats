import vine from '@vinejs/vine'

/**
 * Validateur d'un évènement de page vue émis par le client.
 * `visitorId` est l'UUID anonyme généré et persisté côté navigateur.
 */
export const TrackPageViewValidator = vine.compile(
  vine.object({
    visitorId: vine.string().uuid(),
    path: vine.string().trim().minLength(1).maxLength(512),
    referrer: vine.string().trim().maxLength(2048).nullable().optional(),
    title: vine.string().trim().maxLength(512).nullable().optional(),
    durationMs: vine.number().min(0).max(86_400_000).optional(),
  })
)

/**
 * Validateur de l'évènement "identify" émis au login : relie le visiteur
 * anonyme courant au compte authentifié.
 */
export const IdentifyVisitorValidator = vine.compile(
  vine.object({
    visitorId: vine.string().uuid(),
  })
)
