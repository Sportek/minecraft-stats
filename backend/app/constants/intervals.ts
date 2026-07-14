/**
 * Intervalles d'agrégation autorisés pour les stats — source unique de vérité.
 *
 * Auparavant l'ensemble était recopié dans deux validators (`stat.ts`,
 * `global_stat.ts`) ; ajouter une taille de bucket demandait d'éditer les deux et
 * de penser au switch `StatsService.intervalToSeconds`. On centralise l'ensemble
 * ici ; `intervalToSeconds` reste l'autorité pour la conversion en secondes.
 */
export const STAT_INTERVALS = [
  '30 minutes',
  '1 hour',
  '2 hours',
  '6 hours',
  '1 day',
  '1 week',
] as const

export type StatInterval = (typeof STAT_INTERVALS)[number]
