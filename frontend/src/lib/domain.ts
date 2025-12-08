/**
 * Domain configuration for multi-domain support
 * Supports production, staging, and localhost environments
 */

interface DomainConfig {
  baseUrl: string;
  apiUrl: string;
  backendUrl: string;
}

/**
 * Production domain configurations
 */
const PRODUCTION_DOMAINS: Record<string, DomainConfig> = {
  "minecraft-stats.fr": {
    baseUrl: "https://minecraft-stats.fr",
    apiUrl: "https://api.minecraft-stats.fr/api/v1",
    backendUrl: "https://api.minecraft-stats.fr",
  },
  "minecraft-stats.com": {
    baseUrl: "https://minecraft-stats.com",
    apiUrl: "https://api.minecraft-stats.com/api/v1",
    backendUrl: "https://api.minecraft-stats.com",
  },
};

/**
 * Staging domain configurations
 */
const STAGING_DOMAINS: Record<string, DomainConfig> = {
  "staging.minecraft-stats.fr": {
    baseUrl: "https://staging.minecraft-stats.fr",
    apiUrl: "https://api-staging.minecraft-stats.fr/api/v1",
    backendUrl: "https://api-staging.minecraft-stats.fr",
  },
  "staging.minecraft-stats.com": {
    baseUrl: "https://staging.minecraft-stats.com",
    apiUrl: "https://api-staging.minecraft-stats.com/api/v1",
    backendUrl: "https://api-staging.minecraft-stats.com",
  },
};

/**
 * Combined domain configurations
 */
const DOMAIN_CONFIG: Record<string, DomainConfig> = {
  ...PRODUCTION_DOMAINS,
  ...STAGING_DOMAINS,
};

type DomainKey = keyof typeof DOMAIN_CONFIG;

/**
 * Default domain configuration (fallback)
 */
const DEFAULT_DOMAIN = "minecraft-stats.fr";

/**
 * Checks if the hostname is a localhost environment
 */
function isLocalhost(hostname: string): boolean {
  return (
    hostname === "localhost" ||
    hostname === "127.0.0.1" ||
    hostname.startsWith("192.168.") ||
    hostname.startsWith("10.") ||
    hostname.endsWith(".local")
  );
}

/**
 * Gets the localhost configuration using environment variables
 */
function getLocalhostConfig(origin?: string): DomainConfig {
  return {
    baseUrl: origin || process.env.NEXT_PUBLIC_BASE_URL || "http://localhost:3000",
    apiUrl: process.env.NEXT_PUBLIC_API_URL || "http://localhost:9000/api/v1",
    backendUrl: process.env.NEXT_PUBLIC_BACKEND_URL || "http://localhost:9000",
  };
}

/**
 * Extracts the matching domain key from a hostname
 * Handles exact matches and subdomain matches
 * e.g., "www.minecraft-stats.fr" -> "minecraft-stats.fr"
 *       "staging.minecraft-stats.com" -> "staging.minecraft-stats.com" (exact match first)
 */
function extractDomainKey(hostname: string): string | null {
  // First, check for exact match (important for staging domains)
  if (DOMAIN_CONFIG[hostname]) {
    return hostname;
  }

  // Then check for subdomain matches against production domains
  for (const domain of Object.keys(PRODUCTION_DOMAINS)) {
    if (hostname.endsWith(`.${domain}`)) {
      return domain;
    }
  }

  return null;
}

/**
 * Client-side domain detection
 * Use this in Client Components where headers() is not available
 */
export function getClientDomainConfig(): DomainConfig {
  if (globalThis.window === undefined) {
    // SSR initial render - use environment variables
    return {
      baseUrl: process.env.NEXT_PUBLIC_BASE_URL || DOMAIN_CONFIG[DEFAULT_DOMAIN].baseUrl,
      apiUrl: process.env.NEXT_PUBLIC_API_URL || DOMAIN_CONFIG[DEFAULT_DOMAIN].apiUrl,
      backendUrl: process.env.NEXT_PUBLIC_BACKEND_URL || DOMAIN_CONFIG[DEFAULT_DOMAIN].backendUrl,
    };
  }

  const hostname = globalThis.window.location.hostname;

  // Handle localhost/development environment
  if (isLocalhost(hostname)) {
    return getLocalhostConfig(globalThis.window.location.origin);
  }

  // Try to find matching domain configuration
  const domainKey = extractDomainKey(hostname);
  if (domainKey && DOMAIN_CONFIG[domainKey]) {
    return DOMAIN_CONFIG[domainKey];
  }

  // Fallback for unknown domains - use environment variables
  return {
    baseUrl: globalThis.window.location.origin,
    apiUrl: process.env.NEXT_PUBLIC_API_URL || DOMAIN_CONFIG[DEFAULT_DOMAIN].apiUrl,
    backendUrl: process.env.NEXT_PUBLIC_BACKEND_URL || DOMAIN_CONFIG[DEFAULT_DOMAIN].backendUrl,
  };
}

/**
 * Gets the client-side base URL
 */
export function getClientBaseUrl(): string {
  return getClientDomainConfig().baseUrl;
}

/**
 * Gets the client-side API URL
 */
export function getClientApiUrl(): string {
  return getClientDomainConfig().apiUrl;
}

/**
 * Gets the client-side backend URL
 */
export function getClientBackendUrl(): string {
  return getClientDomainConfig().backendUrl;
}

// Re-export domain config for use in other modules
export { DEFAULT_DOMAIN, DOMAIN_CONFIG, extractDomainKey, getLocalhostConfig, isLocalhost };
export type { DomainConfig, DomainKey };
