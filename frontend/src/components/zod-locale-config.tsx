"use client";

import { useLocale } from "next-intl";
import { z } from "zod";

// Localizes Zod's default validation messages app-wide. Form validation runs only
// on the client (forms are client components), so configuring the global Zod locale
// here is safe — no cross-request state on the server. Set synchronously on render
// so the active locale is in effect before any form schema parses.
export function ZodLocaleConfig() {
  const locale = useLocale();
  z.config(locale === "fr" ? z.locales.fr() : z.locales.en());
  return null;
}
