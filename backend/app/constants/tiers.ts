/**
 * Ce que chaque palier d'utilisateur a le droit de demander — source unique de
 * vérité, côté serveur comme côté client (le front lit ces valeurs via
 * `GET /entitlements` plutôt que de les recopier).
 *
 * Le palier ne change jamais la *donnée* renvoyée pour une requête donnée : il
 * décide seulement si la requête est recevable. C'est ce qui permet aux réponses
 * de rester mutualisées dans le cache Redis, invités et membres confondus.
 */

export type Tier = 'guest' | 'member'

export interface Entitlements {
  tier: Tier
  /** Plafond de points qu'un graphique peut demander (plage ÷ intervalle). */
  maxStatBuckets: number
  /** Plafond de lignes d'un export — plus haut que l'affichage, un CSV n'a pas à rester lisible à l'œil. */
  maxExportRows: number
  /** Profondeur d'historique interrogeable, en jours (`null` = illimité). */
  maxHistoryDays: number | null
  /** Fenêtre d'observation maximale de la « journée type », en jours. */
  maxRhythmDays: number
  canExportStats: boolean
}

/**
 * Les plafonds membres restent modérés à dessein : au-delà de ~6 000 points un
 * graphique n'est plus lisible et la réponse dépasse le mégaoctet. Le levier
 * d'acquisition est le rapport entre les deux paliers, pas la valeur absolue.
 */
export const TIERS: Record<Tier, Entitlements> = {
  guest: {
    tier: 'guest',
    maxStatBuckets: 1500,
    maxExportRows: 0,
    maxHistoryDays: 365,
    maxRhythmDays: 90,
    canExportStats: false,
  },
  member: {
    tier: 'member',
    maxStatBuckets: 6000,
    maxExportRows: 50_000,
    maxHistoryDays: null,
    maxRhythmDays: 730,
    canExportStats: true,
  },
}
