// This file provides utility functions for API calls
// Compatible with both Client-Side Rendering (CSR) and Server-Side Rendering (SSR)

import { getClientApiUrl } from "@/lib/domain";

/**
 * Accept-Language header carrying the active UI locale. On the client we read it
 * from <html lang>, which the locale layout sets, so a user who switched to a
 * locale different from their browser language still gets localized API messages.
 * Returns no header on the server (and when the DOM isn't ready), letting the
 * backend fall back to its own negotiation.
 */
export const localeHeaders = (): Record<string, string> => {
  if (globalThis.document === undefined) return {};
  const lang = document.documentElement.lang;
  return lang ? { "Accept-Language": lang } : {};
};

/**
 * Erreur HTTP porteuse du status, pour que les consommateurs (SWR, layouts)
 * puissent distinguer un vrai 404 d'un 429/5xx transitoire. SWR s'appuie
 * aussi sur `status` pour ne pas re-tenter les 404.
 */
export class HttpError extends Error {
  readonly status: number;

  constructor(message: string, status: number) {
    super(message);
    this.name = "HttpError";
    this.status = status;
  }
}

/** Extrait le message d'un corps d'erreur Adonis ({message} | {errors: [{message}]} | {error: {message}}). */
const readErrorMessage = async (res: Response): Promise<string | undefined> => {
  const body = (await res.json().catch(() => undefined)) as
    | { error?: { message?: string }; errors?: { message?: string }[]; message?: string }
    | undefined;
  return body?.error?.message || body?.errors?.[0]?.message || body?.message;
};

export const fetcher = async (input: RequestInfo, init?: RequestInit) => {
  const res = await fetch(input, { ...init, headers: { ...localeHeaders(), ...init?.headers } });
  if (!res.ok) {
    const message = await readErrorMessage(res);
    throw new HttpError(message ?? `Request failed with status ${res.status}`, res.status);
  }
  return res.json();
};

/**
 * Returns the base URL for API calls
 * Works in both browser (client-side) and server (SSR/Docker) contexts
 */
export const getBaseUrl = (): string => {
  // 1. Check if we're in the browser (client-side)
  if (globalThis.window !== undefined) {
    // Client-side: use domain-aware API URL
    return getClientApiUrl();
  }

  // 2. Server-side (SSR/Docker/generateMetadata)
  // First, try to use INTERNAL_API_URL for Docker internal communication
  // This avoids network loopback issues where containers can't call themselves via public URL
  if (process.env.INTERNAL_API_URL) {
    return process.env.INTERNAL_API_URL;
  }

  // Fallback to public API URL (works if NAT loopback is enabled or in simple deployments)
  if (process.env.NEXT_PUBLIC_API_URL) {
    return process.env.NEXT_PUBLIC_API_URL;
  }

  // Last resort fallback to production URL
  return "https://api.minecraft-stats.fr/api/v1";
};
