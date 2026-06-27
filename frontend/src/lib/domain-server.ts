import { headers } from "next/headers";
import { routing } from "@/i18n/routing";
import {
  DEFAULT_DOMAIN,
  DOMAIN_CONFIG,
  extractDomainKey,
  getLocalhostConfig,
  isLocalhost,
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
    googleSearchId: process.env.NEXT_PUBLIC_GOOGLE_TAG_MANAGER || DOMAIN_CONFIG[DEFAULT_DOMAIN].googleSearchId,
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

/**
 * Production home domain per locale. hreflang/canonical always point at these
 * (not staging/localhost) so search engines index the real URLs. Each locale is
 * unprefixed on its own home domain, so the path passed in must be locale-free.
 */
const LOCALE_HOME: Record<string, string> = {
  fr: "https://minecraft-stats.fr",
  en: "https://minecraft-stats.com",
};

/**
 * Builds the hreflang map + the per-locale canonical for a given locale-free path
 * (e.g. "" for the homepage, "/servers/12/foo" for a server page). The canonical
 * is the current locale's home domain; every locale also gets an alternate, and
 * x-default points at the English (.com) URL.
 */
/**
 * Reads the current request path (without its locale prefix) from the `x-pathname`
 * header that the proxy middleware injects, so generateMetadata can build the
 * hreflang/canonical URLs. Returns "" for the homepage.
 */
export async function getLocaleFreePathname(): Promise<string> {
  const headersList = await headers();
  const pathname = headersList.get("x-pathname") ?? "";
  const segments = pathname.split("/");
  if (segments[1] && (routing.locales as readonly string[]).includes(segments[1])) {
    segments.splice(1, 1);
  }
  const stripped = segments.join("/");
  return stripped === "/" ? "" : stripped;
}

/** hreflang map (locale → absolute URL) for a locale-free path. */
export function alternateLanguages(path: string = ""): Record<string, string> {
  return {
    fr: `${LOCALE_HOME.fr}${path}`,
    en: `${LOCALE_HOME.en}${path}`,
  };
}

export function buildAlternates(locale: string, path: string = ""): { canonical: string; languages: Record<string, string> } {
  return {
    canonical: `${LOCALE_HOME[locale] ?? LOCALE_HOME.en}${path}`,
    languages: {
      ...alternateLanguages(path),
      "x-default": `${LOCALE_HOME.en}${path}`,
    },
  };
}

/**
 * hreflang map for a resource with a DIFFERENT slug per locale (blog posts).
 * Only includes locales that actually have a translation, so we never advertise
 * a phantom URL. `slugs` is the locale→slug map returned by the API.
 */
export function sitemapLanguagesForSlugs(
  slugs: Record<string, string | undefined> | undefined | null,
  prefix: string = "/blog"
): Record<string, string> {
  const languages: Record<string, string> = {};
  // `slugs` can be absent (an API without translations yet, or a malformed post).
  for (const [locale, slug] of Object.entries(slugs ?? {})) {
    if (slug) {
      languages[locale] = `${LOCALE_HOME[locale] ?? LOCALE_HOME.en}${prefix}/${slug}`;
    }
  }
  return languages;
}

/**
 * Per-locale-slug variant of buildAlternates for blog posts. Advertises only the
 * existing translations; x-default points at the English URL when present; the
 * canonical is the current locale's URL, or the English/first one for a fallback
 * render (locale without its own translation).
 */
export function buildAlternatesForSlugs(
  locale: string,
  slugs: Record<string, string | undefined>,
  prefix: string = "/blog"
): { canonical: string; languages: Record<string, string> } {
  const languages = sitemapLanguagesForSlugs(slugs, prefix);
  if (languages.en) {
    languages["x-default"] = languages.en;
  }
  const canonical = languages[locale] ?? languages.en ?? Object.values(languages)[0] ?? LOCALE_HOME.en;
  return { canonical, languages };
}

// OpenGraph wants the underscore form; our locale tokens are the short fr/en.
const OG_LOCALE: Record<string, string> = { fr: "fr_FR", en: "en_US" };

export function getOpenGraphLocales(locale: string): { locale: string; alternateLocale: string } {
  return {
    locale: OG_LOCALE[locale] ?? OG_LOCALE.en,
    alternateLocale: locale === "fr" ? OG_LOCALE.en : OG_LOCALE.fr,
  };
}
