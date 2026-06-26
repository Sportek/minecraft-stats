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

export const fetcher = (input: RequestInfo, init?: RequestInit) =>
  fetch(input, { ...init, headers: { ...localeHeaders(), ...init?.headers } }).then((res) => res.json());

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
