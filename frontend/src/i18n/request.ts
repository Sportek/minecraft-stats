import { promises as fs } from "node:fs";
import path from "node:path";
import { hasLocale } from "next-intl";
import { getRequestConfig } from "next-intl/server";
import { routing } from "./routing";

/**
 * The message catalog is split into one file per feature under
 * `messages/<locale>/<feature>.json`. We merge them into a single object keyed by
 * the capitalized file name, so `home.json` is reached via `useTranslations("Home")`.
 * Adding a feature is just dropping a new file in each locale folder.
 *
 * `messages/**` is added to `outputFileTracingIncludes` in next.config so these
 * files ship with the standalone build despite being read dynamically.
 */
async function loadMessages(locale: string) {
  const dir = path.join(process.cwd(), "messages", locale);
  const files = await fs.readdir(dir);
  const namespaces = await Promise.all(
    files
      .filter((file) => file.endsWith(".json"))
      .map(async (file) => {
        const name = file.slice(0, -".json".length);
        const key = name.charAt(0).toUpperCase() + name.slice(1);
        const content = await fs.readFile(path.join(dir, file), "utf8");
        return [key, JSON.parse(content)] as const;
      }),
  );

  return Object.fromEntries(namespaces);
}

export default getRequestConfig(async ({ requestLocale }) => {
  const requested = await requestLocale;
  const locale = hasLocale(routing.locales, requested) ? requested : routing.defaultLocale;

  return {
    locale,
    messages: await loadMessages(locale),
  };
});
