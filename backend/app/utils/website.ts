function trimTrailingSlashes(value: string) {
  let end = value.length
  while (end > 0 && value[end - 1] === '/') end--
  return value.slice(0, end)
}

/**
 * Normalizes a server website to a bare host (+ optional path), stripping any
 * scheme — including malformed ones like `https//host` (missing colon) or
 * duplicated slashes — and trailing slashes. Keeps the column free of
 * `https://`/`http://` prefixes so links never double up. Returns null when empty.
 *
 * `https://example.com/` -> `example.com`, `https//example.com` -> `example.com`.
 */
export function normalizeWebsite(value: string | null | undefined): string | null {
  if (!value) return null
  const cleaned = trimTrailingSlashes(value.trim().replace(/^\s*https?:?\/\/+/i, ''))
  return cleaned || null
}
