import vine from '@vinejs/vine'
import { BOOST_STATUSES } from '../constants/server_boost.js'

/**
 * Verdict admin sur un serveur suspecté de gonfler ses connectés. `inconclusive`
 * existe pour que l'admin puisse trancher « je ne sais pas » sans laisser le dossier
 * en attente : le journal des revues sert de jeu étiqueté, et une non-décision
 * explicite y est une information, pas un trou.
 */
export const ReviewBoostValidator = vine.compile(
  vine.object({
    verdict: vine.enum(BOOST_STATUSES),
    note: vine.string().trim().maxLength(2000).optional(),
  })
)
