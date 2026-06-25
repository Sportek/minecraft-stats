const STORAGE_KEY = "mcstats_visitor_id";

/**
 * Returns the anonymous visitor UUID, creating and persisting one on first use.
 * Stored in localStorage so it stays stable across visits. Returns null during
 * SSR (no window) — callers should no-op in that case.
 */
export function getVisitorId(): string | null {
  if (typeof window === "undefined") return null;

  let id = localStorage.getItem(STORAGE_KEY);
  if (!id) {
    id = crypto.randomUUID();
    localStorage.setItem(STORAGE_KEY, id);
  }
  return id;
}
