---
name: i18n-architecture
description: How translation works (next-intl + @adonisjs/i18n) and how to add/translate strings
metadata:
  type: project
---

Le site est bilingue FR/EN (branche d'origine `feat/i18n-routing-infra`, partie de `staging`).

**Frontend (next-intl 4)**
- Routing hybride : `src/i18n/routing.ts` — `localePrefix: 'as-needed'` + `domains`. Chaque domaine
  expose `[fr, en]`, seule la langue par défaut (non préfixée) change : `.fr`→fr, `.com`→en. Donc
  `.fr/en/...` et `.com/fr/...` existent. Le middleware est `src/middleware.ts` (alias `proxy` ;
  Next 16 le déprécie au profit de `proxy.ts`, non bloquant) et injecte `x-pathname`.
- Toutes les routes sont sous `src/app/[locale]/`. `sitemap.ts`/`robots.ts`/`manifest.ts`/`feed.xml`/
  `api/` restent à la racine de `app/` (hors locale).
- **Catalogue éclaté** : `frontend/messages/<locale>/<feature>.json`. Le **nom de fichier = namespace
  capitalisé** (`home.json` → `useTranslations("Home")`). `src/i18n/request.ts` fusionne tous les
  fichiers d'une locale. **Ajouter une feature = déposer un fichier dans chaque dossier de locale**
  (en = source, fr = traduction). `outputFileTracingIncludes` embarque `messages/**` en standalone.
- Navigation interne : importer `Link`/`useRouter`/`usePathname` depuis `@/i18n/navigation` (PAS
  `next/link`/`next/navigation`). `notFound`/`useParams`/`useSearchParams` restent sur `next/navigation`.
- Formatage : `useFormatter()` (client) / `getFormatter()` (serveur), jamais de locale codée en dur.
- SEO : `buildAlternates(locale, path)` / `getOpenGraphLocales(locale)` dans `src/lib/domain-server.ts` ;
  canonical aligné domaine (fr→.fr, en→.com). Sélecteur de langue : `src/components/language-switcher.tsx`.
- Validation : Zod localisé globalement via `src/components/zod-locale-config.tsx` (`z.config(z.locales.*)`)
  monté dans `client-layout`; messages `.refine` custom passés par `t()` (schéma in-component).

**Backend (@adonisjs/i18n)**
- `config/i18n.ts` + `app/middleware/detect_user_locale_middleware.ts` (négocie `Accept-Language`,
  défaut `en`, branche aussi le messagesProvider VineJS). Traductions dans
  `resources/lang/{en,fr}/{messages,validator,emails}.json`. Messages contrôleurs via `ctx.i18n.t('messages.<groupe>.*')`.
- Le frontend propage `Accept-Language` (depuis `<html lang>`) via le fetcher SWR + les mutations auth
  (`localeHeaders()` dans `src/app/_cheatcode.tsx`).

**À savoir**
- Les **articles de blog sont traduisibles par locale** : table `post_translations` (title/slug/content/
  excerpt par locale), `posts.default_locale` (fallback), image de couverture partagée. API publique via
  `?locale=` (réponse : champs résolus + `localeUsed` + map `slugs`) ; admin via onglets EN/FR
  (`post-form` + `lib/post-form.ts`, fetch single-post `GET /admin/posts/:id`). hreflang/canonical par
  slug via `buildAlternatesForSlugs`. Slug unique **par locale** (`SlugService`).
- Les **noms de catégories** restent mono-langue. Le modèle `Language` = langues des serveurs, pas la
  locale UI.
- Les pages légales FR (CGU `/cgu`, confidentialité `/privacy`) sont **traduites par IA** et doivent
  passer une **relecture humaine/juridique**.
