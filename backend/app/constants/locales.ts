/**
 * Locales de contenu supportées par la plateforme — source unique de vérité,
 * alignée sur le routing i18n du frontend (`frontend/src/i18n/routing.ts`).
 *
 * Historique : la liste était dupliquée et divergente (le back ne connaissait que
 * `fr`/`en` alors que le front autorisait `es`). Résultat : un article espagnol
 * pouvait être créé — le validator accepte `es` — mais jamais servi, car la
 * résolution de lecture rabattait silencieusement `es` sur `en`. Un seul endroit
 * désormais, pour que création et lecture ne puissent plus diverger.
 */
export const SUPPORTED_LOCALES = ['fr', 'en', 'es'] as const

export type SupportedLocale = (typeof SUPPORTED_LOCALES)[number]

/** Langue de repli quand aucune locale valide n'est demandée. */
export const DEFAULT_LOCALE: SupportedLocale = 'en'

/** Locale demandée (ex: `?locale=`), validée contre les locales supportées. */
export function resolveLocale(value: unknown): SupportedLocale {
  return SUPPORTED_LOCALES.includes(value as SupportedLocale)
    ? (value as SupportedLocale)
    : DEFAULT_LOCALE
}
