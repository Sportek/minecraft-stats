# Plan — Système d'analytics & tracking d'utilisateurs (first-party)

> Statut : **proposition** (pas encore implémenté) · Auteur : préparé avec Claude Code · Date : 2026-06-24

## Objectif

Construire un système d'analytics **maison** (données dans notre propre base PostgreSQL) qui :

1. Mesure le trafic réel du site (pages vues, visiteurs uniques, requêtes API).
2. Identifie les visiteurs par `visitor_id` anonyme + empreinte serveur (IP hashée + user-agent).
3. Relie une identité anonyme à un **compte réel** au moment du login (rétroactivement).
4. Alimente un dashboard admin.

Ce système est **complémentaire** aux outils déjà branchés (Umami, Google Tag Manager, Microsoft Clarity dans `frontend/src/app/layout.tsx`). Aucun de ces outils ne stocke les données chez nous, ne relie une visite au compte, ni ne donne le trafic par IP — c'est ce vide qu'on comble.

## Décisions actées

| Décision | Choix retenu |
|---|---|
| Identification IP | **IP hashée** — `HMAC-SHA256(ip, secret)`, jamais en clair |
| Approche | **100% maison** (seule option donnant le lien IP↔compte + données dans notre DB) |
| Outils tiers existants | Conservés en parallèle (Umami/GTM/Clarity), non remplacés |

---

## 1. Cadrage légal (RGPD / Loi 25 Québec)

Tracker par IP + navigateur = donnée personnelle. Relier l'anonyme au compte = profil nominatif. Légal sous conditions, qui deviennent des specs :

| Exigence | Implémentation |
|---|---|
| Consentement (tracking non essentiel) | Bandeau de consentement ; le tracking first-party ne s'active **qu'après opt-in** |
| Minimisation / anonymisation | IP stockée **uniquement hashée** (`HMAC-SHA256(ip, APP_KEY)`). Adresse brute jamais persistée |
| Rétention limitée | Events bruts purgés > 90 j après agrégation |
| Droit à l'effacement | Suppression possible de toutes les données d'un `visitor_id` / `user_id` |

---

## 2. Stratégie d'identité

Trois couches, du plus fiable au moins fiable :

1. **`visitor_id` anonyme** — UUID généré côté client, stocké en cookie 1ʳᵉ partie + `localStorage`. Identifiant **primaire**, stable entre visites.
2. **Empreinte serveur** — `ip_hash` + `user_agent` (+ langue, plateforme, `CF-IPCountry`). **Secours** pour recoller un visiteur ayant vidé son `localStorage`, et base du comptage de trafic.
3. **Comptes liés** — relation **plusieurs-à-plusieurs**, pas une colonne `user_id` unique.

### ⚠️ Un visiteur/IP/navigateur peut avoir plusieurs comptes

C'est le cas réel à modéliser :
- Un **ordinateur partagé** (famille, cybercafé) → un même `ip_hash` + `user_agent` couvre plusieurs `visitor_id` et plusieurs comptes.
- Un **même navigateur dans le temps** → l'utilisateur A se déconnecte, B se connecte → le même `visitor_id` est associé successivement à deux comptes.
- Un **même compte sur plusieurs appareils** → un `user_id` ↔ plusieurs `visitor_id`.

Conséquence : on **ne stocke pas** un `user_id` figé sur le visiteur. On enregistre **chaque association observée** (event « identify ») dans une table de liaison horodatée. Le « propriétaire actuel » d'une session est simplement la dernière association active pour ce `visitor_id`.

```
                 N:N
visitor_id ◄──────────────► user_id      (table de liaison visitor_accounts)
    ▲                                      chaque login = une ligne horodatée
    │ N:1 (souple, non exclusif)
ip_hash + user_agent  ──► regroupe N visitor_id et N comptes
```

---

## 3. Modèle de données (PostgreSQL)

En miroir de `backend/app/models/advertisement_event.ts` (template d'events existant) et de la convention de migration `database/migrations/<epochMillis>_<snake_case>.ts`.

### `visitors`
| Colonne | Type | Notes |
|---|---|---|
| `id` | pk | |
| `visitor_id` | uuid | unique, indexé |
| `ip_hash` | string | `HMAC-SHA256(ip)` |
| `user_agent` | string | |
| `country` | string | header Cloudflare `CF-IPCountry` (gratuit) |
| `first_seen_at` / `last_seen_at` | timestamp | |

> Pas de `user_id` ici : un visiteur peut être lié à **plusieurs** comptes dans le temps. Le lien vit dans `visitor_accounts`.

### `visitor_accounts` (liaison N:N visiteur ↔ compte)
| Colonne | Type | Notes |
|---|---|---|
| `id` | pk | |
| `visitor_id` | FK → visitors | indexé |
| `user_id` | FK → users | indexé |
| `linked_at` | timestamp | horodatage de l'event « identify » (login) |
| `last_active_at` | timestamp | dernière activité de ce couple |
| `views_count` | int | compteur dénormalisé optionnel |

Unique partiel sur `(visitor_id, user_id)`. Le « compte courant » d'un `visitor_id` = la ligne au `last_active_at` le plus récent. Permet : *un visiteur → N comptes*, *un compte → N visiteurs*, *une IP → N comptes* (via les `visitor_id` partageant l'`ip_hash`).

### `page_views`
| Colonne | Type | Notes |
|---|---|---|
| `id` | pk | |
| `visitor_id` | FK → visitors | |
| `user_id` | FK → users | nullable — **snapshot** du compte actif au moment de la vue (null si anonyme) |
| `path` | string | indexé |
| `referrer` | string | nullable |
| `title` | string | nullable |
| `duration_ms` | int | temps sur page |
| `created_at` | timestamp | indexé (autoCreate, pas d'updatedAt) |

### `page_view_daily` (agrégat)
| Colonne | Type | Notes |
|---|---|---|
| `date` | date | |
| `path` | string | |
| `views` | int | |
| `unique_visitors` | int | |

> Le dashboard lit **les agrégats** (rapides), qui survivent à la purge des events bruts.

---

## 4. Collecte

### Frontend (pageviews SPA fiables)
- Nouveau `frontend/src/http/analytics.ts`, calqué sur `recordAdImpression` (`src/http/advertisement.ts:40`) : `fetch` `keepalive: true`, fire-and-forget, `.catch(() => {})`.
- Hook `usePageTracking()` branché sur `usePathname` (App Router), monté dans `src/app/client-layout.tsx` (~ligne 37, à côté de `<Metrics />`) **à l'intérieur de `AuthProvider`** pour connaître le `user_id`.
- Au login (`src/contexts/auth.tsx`) → `POST /api/v1/analytics/identify`.

### Backend (trafic réel, API + bots)
- Middleware cloné sur `app/middleware/logger_middleware.ts` (extrait déjà `CF-Connecting-IP` + durée), enregistré dans le **router stack** (`start/kernel.ts:38`) pour accéder à `ctx.auth`.
- Compte **toutes** les requêtes → répond à « combien de trafic mon site génère » (req/min, endpoints les plus appelés), au-delà des seuls pageviews humains.

### Endpoints (à ajouter vers `start/routes.ts:162`, public, `NO_STORE`, `throttleLight`)
- `POST analytics/pageview`
- `POST analytics/identify` (auth)
- `GET analytics/dashboard` (**admin only**, via middleware `admin` existant)

---

## 5. Métriques obtenues

- **Trafic** : requêtes/jour, pageviews, visiteurs uniques (par `visitor_id` et par `ip_hash`), pic horaire.
- **Comportement** : pages les plus vues, parcours entrée/sortie, temps par page, taux de retour.
- **Audience** : pays (Cloudflare), navigateurs/OS (user-agent), referrers.
- **Conversion** : combien d'anonymes créent un compte, et leur activité *avant* inscription.
- **Par compte** : pages visitées par un utilisateur connecté donné.
- **Comptes liés / multi-comptes** : via `visitor_accounts`, détecter qu'un même appareil/IP héberge plusieurs comptes (utile anti-fraude / multi-comptes), et qu'un compte se connecte depuis plusieurs appareils.

---

## 6. Dashboard

Page admin sous `frontend/src/app/account/...`, lisant `GET analytics/dashboard`, rendue avec **AG Charts** (déjà utilisé pour les stats serveurs). Lit les tables agrégées.

---

## 7. Découpage en phases

| Phase | Contenu | Valeur livrée |
|---|---|---|
| **0** | Bandeau de consentement + config IP-hash (`HMAC-SHA256`, secret = `APP_KEY`) | Conformité avant collecte |
| **1** | Migrations + modèles (`visitor`, `page_view`) + endpoint `pageview` + hook frontend | Pageviews capturés dans notre DB |
| **2** | `identify` au login → upsert dans `visitor_accounts` (N:N) ; backfill `user_id` des pageviews **restées anonymes** avant ce 1ᵉʳ login | Lien anonyme ↔ compte(s) |
| **3** | Middleware backend de trafic global | Volume réel de trafic |
| **4** | Job d'agrégation quotidien (`page_view_daily`) + purge rétention (90 j) | Performance + conformité |
| **5** | Dashboard admin AG Charts | Visualisation |

---

## Anchors techniques (où le code se branche)

- Migration : `backend/database/migrations/<newTimestamp>_create_visitors_table.ts` et `..._create_page_views_table.ts` (structure de `1778400000002_create_advertisement_events_table.ts`).
- Modèles : `backend/app/models/visitor.ts`, `page_view.ts` (miroir de `advertisement_event.ts`).
- Routes : `backend/start/routes.ts` ~ligne 162 (pattern d'écriture des events ads).
- Middleware trafic : clone de `app/middleware/logger_middleware.ts`, enregistré `start/kernel.ts:38` (router stack).
- Frontend emit : `frontend/src/http/analytics.ts` + hook dans `src/app/client-layout.tsx:37`.
- Identité utilisateur sur requête : `ctx.auth.user?.id` (auth = Bearer token DB, `app/models/user.ts:56`).
