/**
 * Slug URL-safe partagé — source unique de vérité côté frontend.
 *
 * Historique : la même transformation était copiée à l'identique dans
 * `serverSlug` (server-url.ts) et `slugify` (post-form.ts). Toute évolution de la
 * règle (gestion des accents, de `&`, …) devait être faite aux deux endroits sous
 * peine de voir les URLs diverger. Un seul primitif désormais.
 *
 * NB : côté articles, le backend reste l'autorité (il génère le slug réellement
 * stocké via `string.slug`, unicode-aware) ; ce `slugify` n'alimente que l'aperçu
 * live du champ dans le formulaire d'édition.
 */
export function slugify(text: string): string {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");
}
