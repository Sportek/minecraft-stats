import vine from '@vinejs/vine'

/**
 * Validateur d'un vote de serveur. `username` est un pseudo Minecraft (3-16
 * caractères alphanumériques + underscore) ; `visitorId` est l'UUID anonyme du
 * visiteur tracké ; `acceptedTerms` doit valoir `true` (le contrôleur le refuse
 * sinon) et vaut consentement RGPD ; `turnstileToken` est vérifié côté serveur
 * quand le captcha est activé.
 */
export const CreateServerVoteValidator = vine.compile(
  vine.object({
    username: vine
      .string()
      .trim()
      .regex(/^[a-zA-Z0-9_]{3,16}$/),
    visitorId: vine.string().uuid(),
    acceptedTerms: vine.boolean(),
    turnstileToken: vine.string().optional(),
  })
)

/**
 * Query string de `vote-status`. `visitorId` doit être un UUID valide : la
 * colonne `visitors.uuid` est de type PG `uuid`, une valeur mal formée ferait
 * échouer la requête en 500 au lieu d'un 422.
 */
export const ServerVoteStatusValidator = vine.compile(
  vine.object({
    visitorId: vine.string().uuid().optional(),
  })
)
