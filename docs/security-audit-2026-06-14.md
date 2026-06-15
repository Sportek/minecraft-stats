# Audit de sécurité — Minecraft Stats

**Date :** 2026-06-14
**Périmètre :** backend AdonisJS 6, frontend Next.js 15, serveur MCP
**Méthode :** audit multi-agents sur 11 dimensions (authz, authn/OAuth, injection SQL, XSS, SSRF/fichiers, validation/mass-assignment, secrets/CORS/headers, rate-limiting/DoS, MCP, exposition de données, dépendances), suivi d'une **vérification adversariale** de chaque finding pour éliminer les faux positifs.

## Résumé

- **18 vulnérabilités confirmées** (3 hautes, 10 moyennes, 5 basses)
- **17 candidats écartés** comme faux positifs après vérification (voir §4)
- **14 corrigées** · **1 non applicable** (M5, neutralisé par le tunnel `cloudflared`) · **3 laissées à ta décision** (§4)

> Aucune injection SQL, aucun secret de production committé, et le serveur MCP (proxy public read-only) n'expose aucune faille exploitable — les candidats MCP ont tous été écartés (la frontière allowlist tient).

---

## 1. Vulnérabilités HAUTES

| # | Titre | Fichier | Statut |
|---|-------|---------|--------|
| H1 | **XSS stocké via le Markdown des articles** : `markdown-it` en `html:true` sans sanitizer, injecté dans `dangerouslySetInnerHTML`. Un compte `writer` (rôle moins privilégié) peut exécuter du JS chez tout visiteur. | `frontend/src/lib/markdown.ts` | ✅ **Corrigé** — sanitization DOMPurify (`isomorphic-dompurify`) du HTML rendu. `html:true` conservé (anciens posts HTML TipTap) mais `<script>`/handlers/`javascript:` supprimés. |
| H2 | **Injection JSON-LD** : `JSON.stringify` n'échappe pas `<`/`>`/`/`, donc un nom de serveur `</script>…` casse la balise (XSS stocké sur page serveur publique). | `frontend/src/components/seo/structured-data.tsx` | ✅ **Corrigé** — helper `toJsonLd()` échappant `<`,`>`,`&` sur les 5 occurrences. |
| H3 | **Next.js 16.1.1 vulnérable** : DoS (Server/Cache Components), SSRF via WebSocket upgrade, RSC deserialization DoS. | `frontend/package.json` | ✅ **Corrigé** — bump `next` → **16.2.9** + `eslint-config-next` assorti. |

## 2. Vulnérabilités MOYENNES

| # | Titre | Fichier | Statut |
|---|-------|---------|--------|
| M1 | **Account takeover OAuth inter-provider** : `firstOrCreate` matche sur l'email seul, et le garde `if (!user.provider && user.provider !== 'discord')` est **mort** (toujours faux). Un compte Google/mot-de-passe partageant l'email était silencieusement authentifié. | `backend/app/controllers/auth_controller.ts` | ✅ **Corrigé** — garde réparé en `if (user.provider !== 'discord')` (et idem Google) : rejet si provider ≠ provider appelant. *(Le flux de liaison de comptes reste un choix produit, voir §3.)* |
| M2 | **Aucune révocation / logout côté serveur** : tokens 30 jours, logout = suppression localStorage seulement. | `backend/start/routes.ts` | ✅ **Corrigé** — `POST /logout` (révoque le token courant) + `POST /logout-all` (révoque toutes les sessions). Logout frontend câblé pour appeler le backend ; bouton « Log out of all devices » ajouté dans les paramètres du compte. |
| M3 | **Le changement de mot de passe ne révoque pas les sessions** : un token volé survit 30 j à la remédiation. | `backend/app/controllers/auth_controller.ts` | ✅ **Corrigé** — révocation de toutes les autres sessions après changement (token courant conservé). |
| M4 | **Pagination non bornée** sur `/servers/paginate` public (`?limit=100000000` → scan + preloads massifs). | `backend/app/controllers/servers_controller.ts` | ✅ **Corrigé** — `page`/`limit` coercés en entiers, `limit` plafonné à 100. |
| M5 | **`CF-Connecting-IP` spoofable** : la clé de rate-limit fait confiance à l'en-tête sans vérifier l'origine Cloudflare → bypass des throttles auth si l'origine est joignable directement. | `backend/start/limiter.ts` | ✅ **Non applicable** — tout le trafic passe par un **tunnel `cloudflared`** (voir §3.2) : l'origine n'a aucun port entrant public, l'en-tête est réécrit par l'edge Cloudflare et ne peut pas être forgé. Risque accepté. |
| M6 | **XSS stocké via placeholders** : `%SERVER_VERSION%`/`%ADDRESS%` renvoient des données non fiables (ping distant) non échappées dans le sink HTML du blog. | `backend/app/services/placeholder_service.ts` | ✅ **Corrigé** — `escapeHtml()` sur `SERVER_VERSION` et `ADDRESS`. |
| M7 | **SSRF / scan réseau interne authentifié** : `address`+`port` arbitraires → le backend ouvre une connexion TCP (oracle de reachability via protocole Minecraft). | `servers_controller.ts`, `minecraft-ping/…` | 🟡 **Partiel** — blocage des IP littérales internes ajouté (M8). La protection anti DNS-rebinding et la restriction de ports restent à décider (§3). |
| M8 | **`address` sans validation de plage** (pas de blocage privé/loopback/link-local). | `backend/app/validators/server.ts` | ✅ **Corrigé** — nouveau `publicHostField()` rejetant 127/8, 10/8, 172.16/12, 192.168/16, 169.254/16 (métadonnées cloud), CGNAT, IPv6 loopback/link-local/ULA. |
| M9 | **DoS favicon** : octets attaquant-contrôlés écrits sur disque + décodés par `sharp` sans borne (jusqu'à PING_CONCURRENCY en vol). | `backend/start/scheduler.ts` | ✅ **Corrigé** — cap 128 Ko avant écriture, `sharp({ limitInputPixels, failOn:'error' })` + resize 64×64. |
| M10 | **Agrégation `global-stats` non bornée** : endpoint public, scan full-table si pas de plage ; cache contournable en variant les dates. | `backend/app/services/stat_service.ts` | ⚠️ **À décider** (§3) — borner la plage change le comportement de l'API publique. |

## 3. Vulnérabilités BASSES

| # | Titre | Statut |
|---|-------|--------|
| L1 | **Énumération d'utilisateurs** (register/login renvoient des messages distincts : email existant, non vérifié, OAuth). | ⚠️ **À décider** — uniformiser les messages change l'UX. |
| L2 | Pagination non bornée sur `users.adminIndex`, `posts.index` (public), `posts.adminIndex`. | ✅ **Corrigé** — même clamp (max 100). |
| L3 | **Aucun en-tête de sécurité** (pas de Shield). | ✅ **Corrigé** — middleware `security_headers_middleware` : `X-Content-Type-Options: nosniff`, `X-Frame-Options: DENY`, `Referrer-Policy`. *(CSP/HSTS volontairement omis : nécessitent du tuning.)* |
| L4 | **Garde stats par-serveur contournable** : `?interval=…` sans plage saute le garde anti-scan. | ⚠️ **À décider** — choix d'une fenêtre par défaut. |
| L5 | **Endpoints serveurs publics fuient l'objet `user` propriétaire** (`role`, `provider`, `verificationTokenExpires`) → énumération des comptes admin/writer. | ✅ **Corrigé** — `preload('user')` restreint à `id, username, avatarUrl` (aligné sur `posts`). |

---

## 4. À décider (non corrigé — nécessite ton arbitrage)

1. **M2 — ✅ Fait.** `POST /logout` + `POST /logout-all` implémentés et câblés au frontend (voir §1/§2).
2. **M5 — `CF-Connecting-IP` → résolu par le déploiement.** Tout le trafic passe par un **tunnel `cloudflared`** : l'origine n'expose aucun port entrant public, et Cloudflare réécrit l'en-tête à l'edge (la valeur client est supprimée). L'exploit nécessitait de joindre l'origine en direct — impossible ici. **Aucun correctif code requis.** Seul point à maintenir : que le `80/443` de l'hôte (Traefik/Dokploy) reste **non exposé publiquement** (pare-feu VPS), sinon on pourrait contourner le tunnel et re-spoofer l'en-tête. Le garde code « défense en profondeur » n'apporte rien dans cette config et n'est pas recommandé.
3. **M7 (suite) — SSRF.** Au-delà du blocage des IP littérales (fait), décider : (a) résoudre le hostname et re-valider l'IP au moment du connect (anti DNS-rebinding), (b) restreindre les ports. Impacte d'éventuels serveurs légitimes sur ports atypiques.
4. **M10 — `global-stats`.** Imposer/plafonner une plage temporelle (ex. 90 j max), ou servir depuis la table de rollup `server_stats_hourly`. Change le contrat de l'API publique.
5. **L1 — Énumération.** Réponses register/login uniformes (« si cet email est valide, un message a été envoyé »). Change l'UX d'inscription.
6. **L4 — Garde stats interval.** Exiger `fromDate` ou injecter une fenêtre par défaut (ex. 30 j) sur le chemin `interval`.

---

## 5. Faux positifs notables (vérifiés et écartés)

- **CORS `origin:true` + `credentials:true`** : sans danger ici — auth par Bearer/localStorage (pas de cookie ambiant), donc pas de CSRF/exfiltration cross-origin.
- **`APP_KEY` dans `.env.example`** : valeur d'exemple ; la vraie clé est injectée au runtime (`compose.yaml`), jamais committée. Blast radius limité au JWT de vérif email (qui exige aussi le token aléatoire par-user).
- **Token de vérif email 32 bits** : enveloppé dans un JWT signé `APP_KEY` — pas d'oracle de brute-force.
- **MCP** (CORS `*`, pas d'auth, DNS-rebinding off, /health) : proxy public read-only par conception, cible non attaquant-contrôlée (allowlist de 12 endpoints GET), aucune donnée non publique.
- **`lodash` / `mjml` transitifs** : déjà patchés ou non atteignables (entrée non attaquant-contrôlée).
- **Groupe de routes `/admin`** : les 15 handlers vérifient tous une policy Bouncer — pas de bypass.
- **`servers.categories` sans `auth()`** : échoue *fermé* (Bouncer refuse les invités) — bug fonctionnel, pas une faille.
- **Upload blog `sharp`** : auth + rôle writer + cap 5 Mo + extensions + `limitInputPixels` par défaut → pas de DoS réaliste.

---

## 6. Fichiers modifiés

**Backend :** `auth_controller.ts`, `posts_controller.ts`, `servers_controller.ts`, `users_controller.ts`, `services/placeholder_service.ts`, `validators/helpers.ts`, `validators/server.ts`, `start/kernel.ts`, `start/routes.ts`, `start/scheduler.ts`, **+ `middleware/security_headers_middleware.ts`** (nouveau).
**Frontend :** `lib/markdown.ts`, `components/seo/structured-data.tsx`, `contexts/auth.tsx`, `http/auth.ts`, `app/(pages)/account/settings/page.tsx`, `package.json` (next 16.2.9 + isomorphic-dompurify).

Validé : `tsc --noEmit` ✅ et `eslint` ✅ (backend + frontend), smoke-test DOMPurify SSR ✅.
