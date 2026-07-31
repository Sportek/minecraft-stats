import TierLimitException from '#exceptions/tier_limit_exception'
import { TIERS, type Entitlements } from '../constants/tiers.js'
import type { HttpContext } from '@adonisjs/core/http'

/**
 * Résout le palier de l'appelant et arbitre les limites qui en découlent.
 *
 * Les endpoints publics ne montent pas `middleware.auth()` : c'est
 * `middleware.silentAuth()` qui renseigne `ctx.auth.user` quand un jeton est
 * présent, sans jamais refuser la requête. Sans lui, tout le monde est invité.
 */
export default class EntitlementsService {
  static resolve(ctx: HttpContext): Entitlements {
    return ctx.auth.user ? TIERS.member : TIERS.guest
  }

  /**
   * Refuse une demande qui dépasse le plafond du palier. `limit` nomme le plafond
   * touché (`statBuckets`, `historyDays`…) : c'est ce que le client lit pour savoir
   * quel verrou mettre en avant.
   */
  static assertWithinLimit(params: {
    limit: string
    requested: number
    allowed: number
    entitlements: Entitlements
    message: string
  }) {
    if (params.requested <= params.allowed) return

    throw new TierLimitException(params.message, {
      limit: params.limit,
      allowed: params.allowed,
      requested: params.requested,
      tier: params.entitlements.tier,
    })
  }

  /**
   * Verrou tout-ou-rien, là où {@link assertWithinLimit} gradue : la fonctionnalité
   * est ouverte au palier, ou elle ne l'est pas. Le client reçoit la même forme
   * d'erreur dans les deux cas et affiche le même appel à créer un compte.
   */
  static assertFeature(params: {
    feature: string
    enabled: boolean
    entitlements: Entitlements
    message: string
  }) {
    if (params.enabled) return

    throw new TierLimitException(params.message, {
      limit: params.feature,
      allowed: 0,
      requested: 1,
      tier: params.entitlements.tier,
    })
  }
}
