import { Exception } from '@adonisjs/core/exceptions'
import type { HttpContext } from '@adonisjs/core/http'
import type { Tier } from '../constants/tiers.js'

interface TierLimitPayload {
  /** Ce qui est plafonné, en clair pour le client : `statBuckets`, `historyDays`… */
  limit: string
  /** Plafond du palier courant. */
  allowed: number
  /** Ce que la requête demandait. */
  requested: number
  tier: Tier
}

/**
 * Refus dû au palier de l'appelant, et non à une requête malformée.
 *
 * Le corps est volontairement lisible par la machine : c'est `unlockedBy` qui
 * permet au front d'afficher « connecte-toi pour débloquer » là où une simple
 * chaîne d'erreur ne laisserait le choix qu'entre un message brut et un parsing
 * fragile. Toute future limite de palier passe par cette exception.
 */
export default class TierLimitException extends Exception {
  static status = 400
  static code = 'E_TIER_LIMIT'

  constructor(
    message: string,
    private readonly payload: TierLimitPayload
  ) {
    super(message)
  }

  async handle(error: this, ctx: HttpContext) {
    return ctx.response.status(TierLimitException.status).json({
      errors: [{ message: error.message, code: TierLimitException.code }],
      ...error.payload,
      // Un invité débloque en se connectant ; un membre au plafond est au bout de
      // ce que la plateforme propose, et n'a rien à débloquer.
      unlockedBy: error.payload.tier === 'guest' ? 'login' : null,
    })
  }
}
