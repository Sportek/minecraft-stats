/**
 * Canonical URL + indexing helpers for server pages.
 *
 * Every server must resolve to a single URL. Internal links used to point at
 * `/servers/12/My Server` (the raw display name) while the canonical tag and the
 * sitemap advertised `/servers/12/my-server` (a slug). Google treated the two as
 * separate pages and dropped them as "duplicate without user-selected canonical".
 * These helpers give links, the sitemap, the canonical tag and the slug redirect
 * one shared definition so they always agree.
 */

/** Lowercase, hyphenated slug derived from a server's display name. */
export function serverSlug(name: string): string {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");
}

/**
 * Locale-free canonical path for a server. The slug segment is omitted when it
 * would be empty (a name with no a-z0-9 characters), keeping a single valid URL.
 */
export function serverPath(id: number, name: string): string {
  const slug = serverSlug(name);
  return slug ? `/servers/${id}/${slug}` : `/servers/${id}`;
}

/**
 * Days without a successful ping after which a server counts as dead. `lastStatsAt`
 * only advances when a ping succeeds (failed pings record a null-count stat without
 * moving it), so it is the truthful "last alive" signal.
 */
export const SERVER_STALE_DAYS = 30;

/**
 * Whether a server page is worth indexing. Dead servers — never pinged
 * successfully, or silent for {@link SERVER_STALE_DAYS} — are thin pages Google
 * reports as "crawled, currently not indexed". We keep them out of the sitemap and
 * mark them noindex so crawl budget goes to live servers.
 */
export function isServerIndexable(
  lastStatsAt: string | Date | null | undefined,
  now: number = Date.now(),
): boolean {
  if (!lastStatsAt) return false;
  const last = new Date(lastStatsAt).getTime();
  if (Number.isNaN(last)) return false;
  return now - last <= SERVER_STALE_DAYS * 24 * 60 * 60 * 1000;
}
