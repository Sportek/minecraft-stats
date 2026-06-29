import { defineRouting } from "next-intl/routing";

/**
 * Hybrid routing: the domain decides the default (unprefixed) language, but every
 * domain exposes all locales. On minecraft-stats.fr, `/` is French and `/en/...`
 * is English; on minecraft-stats.com it is the mirror. Adding a language means
 * adding it to `locales` here and to each domain's `locales` list.
 *
 * Staging hosts are listed so they behave like their production counterparts.
 * Any unlisted host (e.g. localhost) falls back to the top-level config below.
 */
export const routing = defineRouting({
  locales: ["fr", "en", "es"],
  defaultLocale: "fr",
  localePrefix: "as-needed",
  domains: [
    { domain: "minecraft-stats.fr", defaultLocale: "fr", locales: ["fr", "en", "es"] },
    { domain: "minecraft-stats.com", defaultLocale: "en", locales: ["fr", "en", "es"] },
    { domain: "staging.minecraft-stats.fr", defaultLocale: "fr", locales: ["fr", "en", "es"] },
    { domain: "staging.minecraft-stats.com", defaultLocale: "en", locales: ["fr", "en", "es"] },
  ],
});

export type Locale = (typeof routing.locales)[number];
