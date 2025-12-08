import { headers } from "next/headers";
import {
  DOMAIN_CONFIG,
  DEFAULT_DOMAIN,
  extractDomainKey,
  isLocalhost,
  getLocalhostConfig,
  type DomainConfig,
} from "./domain";

/**
 * Gets the current domain configuration based on the request headers (Server-side)
 * This function must be called from a Server Component or Server Action
 */
export async function getDomainConfig(): Promise<DomainConfig> {
  try {
    const headersList = await headers();
    const host = headersList.get("host") || headersList.get("x-forwarded-host") || "";

    // Remove port if present
    const hostname = host.split(":")[0];

    // Handle localhost/development environment
    if (isLocalhost(hostname)) {
      // For server-side, we need to construct the origin from headers
      const protocol = headersList.get("x-forwarded-proto") || "http";
      const origin = `${protocol}://${host}`;
      return getLocalhostConfig(origin);
    }

    // Try to find matching domain configuration
    const domainKey = extractDomainKey(hostname);
    if (domainKey && DOMAIN_CONFIG[domainKey]) {
      return DOMAIN_CONFIG[domainKey];
    }
  } catch {
    // headers() might fail in certain contexts (e.g., static generation)
  }

  // Fallback to environment variables or default
  return {
    baseUrl: process.env.NEXT_PUBLIC_BASE_URL || DOMAIN_CONFIG[DEFAULT_DOMAIN].baseUrl,
    apiUrl: process.env.NEXT_PUBLIC_API_URL || DOMAIN_CONFIG[DEFAULT_DOMAIN].apiUrl,
    backendUrl: process.env.NEXT_PUBLIC_BACKEND_URL || DOMAIN_CONFIG[DEFAULT_DOMAIN].backendUrl,
  };
}

/**
 * Gets the base URL for the current domain (Server-side)
 */
export async function getBaseUrl(): Promise<string> {
  const config = await getDomainConfig();
  return config.baseUrl;
}

/**
 * Gets the API URL for the current domain (Server-side)
 */
export async function getApiUrl(): Promise<string> {
  const config = await getDomainConfig();
  return config.apiUrl;
}

/**
 * Gets the backend URL for the current domain (Server-side)
 */
export async function getBackendUrl(): Promise<string> {
  const config = await getDomainConfig();
  return config.backendUrl;
}
