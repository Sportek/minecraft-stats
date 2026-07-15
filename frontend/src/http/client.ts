import { getBaseUrl, HttpError } from "@/app/_cheatcode";

/**
 * Client HTTP profond partagé par tous les modules `src/http/*`.
 *
 * Avant : chaque fonction d'endpoint réécrivait à la main la même mécanique de
 * transport — construction de l'URL depuis `getBaseUrl()`, en-tête
 * `Authorization: Bearer`, `Content-Type`, `JSON.stringify`, test `!response.ok`
 * puis extraction du message d'erreur. Cette logique vit désormais à un seul
 * endroit ; un appel d'endpoint se réduit à `apiFetch<T>(path, opts)`.
 */

interface ApiErrorBody {
  error?: { message?: string };
  errors?: { message?: string }[];
  message?: string;
}

/** Extrait le message d'un corps d'erreur Adonis ({message} | {errors:[{message}]} | {error:{message}}). */
function extractMessage(body: unknown): string | undefined {
  const b = body as ApiErrorBody | undefined;
  return b?.error?.message || b?.errors?.[0]?.message || b?.message;
}

/**
 * Erreur HTTP enrichie du corps d'erreur parsé. Étend `HttpError` (donc porte le
 * `status`, ce sur quoi SWR s'appuie pour ne pas re-tenter un 404) et expose en
 * plus `body`, pour les rares appelants qui doivent lire des champs spécifiques
 * de la réponse d'erreur (ex. `existingServer` d'un conflit 409 de doublon).
 */
export class ApiError extends HttpError {
  readonly body: unknown;

  constructor(message: string, status: number, body: unknown) {
    super(message, status);
    this.name = "ApiError";
    this.body = body;
  }
}

export interface ApiOptions {
  method?: "GET" | "POST" | "PUT" | "PATCH" | "DELETE";
  /** Jeton d'accès ; ajouté en `Authorization: Bearer` quand présent. */
  token?: string;
  /** Corps de requête ; sérialisé en JSON, sauf `FormData` (envoyé tel quel). */
  body?: unknown;
  headers?: Record<string, string>;
  signal?: AbortSignal;
  /** Stratégie de cache fetch (ex. `"no-store"`). Transmise telle quelle. */
  cache?: RequestCache;
  /** Options ISR de Next (`revalidate`, `tags`). Transmises telles quelles. */
  next?: { revalidate?: number | false; tags?: string[] };
}

/**
 * Exécute une requête vers l'API et renvoie le JSON typé. Lève une {@link ApiError}
 * (message extrait du corps) sur réponse non-2xx. Renvoie `undefined` pour un 204.
 */
export async function apiFetch<T>(path: string, opts: ApiOptions = {}): Promise<T> {
  const { method = "GET", token, body, headers = {}, signal, cache, next } = opts;
  const isForm = typeof FormData !== "undefined" && body instanceof FormData;

  const finalHeaders: Record<string, string> = { ...headers };
  if (token) finalHeaders.Authorization = `Bearer ${token}`;
  if (body !== undefined && !isForm && finalHeaders["Content-Type"] === undefined) {
    finalHeaders["Content-Type"] = "application/json";
  }

  const response = await fetch(`${getBaseUrl()}${path}`, {
    method,
    headers: finalHeaders,
    body: body === undefined ? undefined : isForm ? (body as FormData) : JSON.stringify(body),
    signal,
    cache,
    next,
  });

  if (!response.ok) {
    const parsed = await response.json().catch(() => undefined);
    const message = extractMessage(parsed) ?? `Request failed with status ${response.status}`;
    throw new ApiError(message, response.status, parsed);
  }

  if (response.status === 204) return undefined as T;
  return response.json() as Promise<T>;
}
