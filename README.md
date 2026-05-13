# Minecraft Stats

![Minecraft Stats Banner](./frontend/public/images/minecraft-stats/banner.png)

[![Live](https://img.shields.io/badge/Live-minecraft--stats.com-1F8B4C?style=for-the-badge)](https://minecraft-stats.com)
[![GitHub](https://img.shields.io/badge/GitHub-Sportek%2Fminecraft--stats-100000?style=for-the-badge&logo=github&logoColor=white)](https://github.com/Sportek/minecraft-stats)
[![Discord](https://img.shields.io/badge/Discord-Communauté-5865F2?style=for-the-badge&logo=discord&logoColor=white)](https://discord.gg/dGEqqPEaXP)
[![License](https://img.shields.io/badge/License-GPL%20v3-blue.svg?style=for-the-badge)](LICENSE)

> Plateforme web qui suit en continu le nombre de joueurs sur les serveurs Minecraft référencés, et publie leurs courbes historiques.

Accessible sur **[minecraft-stats.fr](https://minecraft-stats.fr)** et **[minecraft-stats.com](https://minecraft-stats.com)** — même application, deux domaines.

---

## Le projet

Minecraft Stats ping chaque serveur Minecraft référencé toutes les 10 minutes et stocke les mesures. Le résultat : des courbes de joueurs sur plusieurs mois, des classements par activité réelle, des métriques de croissance hebdomadaires et mensuelles — au lieu des classements par votes accumulés des sites concurrents.

Aujourd'hui : **~520 serveurs référencés**, **~28 000 visiteurs uniques par mois**, hébergé sur un VPS en France.

---

## Ce que fait le site

**Collecte automatisée**
Un scheduler ping chaque serveur toutes les 10 minutes via `@minescope/mineping`, espace les requêtes pour ne pas saturer les serveurs cibles, et bulk insert les mesures dans PostgreSQL. Toutes les 6 heures, un second job rafraîchit les favicons (Sharp → WebP) et recalcule les métriques de croissance.

**Visualisation**
Page d'accueil avec stats globales (24 h, 7 j, 30 j, 6 mois, 1 an) et intervalles d'agrégation (30 min, 1 h, 6 h, 1 jour, 1 semaine). Chaque page serveur affiche son historique complet via AG Charts, son pic, sa moyenne, sa médiane, sa croissance.

**Recherche et filtres**
Pagination côté serveur, recherche par nom ou IP, filtres multi-sélection par catégorie (Survival, Creative, PvP, Roleplay, Minigames…) et langue (FR, EN, ES, DE, IT, PT, RU…).

**Comptes**
Inscription email avec vérification (MJML + Resend), OAuth Google et Discord (Ally), hash Argon2, rate limiting par route. Un utilisateur connecté peut soumettre un serveur et gérer ceux qu'il a ajoutés. Rôles : `user`, `writer` (blog), `admin`.

**Blog et API publique**
Blog d'articles avec éditeur Tiptap côté admin. API REST versionnée `/api/v1`, documentée automatiquement via Swagger/Scalar UI sur `/docs`. Cache Redis applicatif + headers `Cache-Control` sur les endpoints publics.

---

## Stack

| Couche | Techno |
|---|---|
| Frontend | Next.js 16 (App Router) + React 19 |
| Charts | AG Charts Community |
| Forms | React Hook Form + Zod |
| Styling | Tailwind CSS + Radix UI (shadcn) |
| Backend | AdonisJS 6 |
| ORM | Lucid |
| Base de données | PostgreSQL |
| Cache + rate limiting | Redis |
| Auth OAuth | Ally |
| Email | Resend + MJML |
| Images | Sharp (PNG → WebP) |
| Ping Minecraft | @minescope/mineping |
| Monitoring | Prometheus + Grafana |
| Hébergement | VPS Pulseheberg (France) |

---

## Architecture

```
                        ┌────────────────────┐
                        │   Cloudflare CDN   │
                        └──────────┬─────────┘
                                   │
              ┌────────────────────┴───────────────────┐
              │                                        │
        ┌─────▼──────┐                          ┌──────▼─────┐
        │  Next.js   │  ── REST /api/v1 ──▶     │ AdonisJS 6 │
        │  App Router│                          │  (Node 24) │
        │  ISR + SSR │                          └──────┬─────┘
        └────────────┘                                 │
                                  ┌────────────────────┼───────────────────┐
                                  │                    │                   │
                            ┌─────▼─────┐       ┌──────▼──────┐     ┌──────▼──────┐
                            │ PostgreSQL│       │    Redis    │     │  Scheduler  │
                            │  (Lucid)  │       │ cache + RL  │     │ pings 10min │
                            └───────────┘       └─────────────┘     │ growth 6h   │
                                                                    └──────┬──────┘
                                                                           │
                                                                    ┌──────▼──────┐
                                                                    │ Minecraft   │
                                                                    │ servers (×N)│
                                                                    └─────────────┘
```

### Schéma de données — l'essentiel

- `servers` — un serveur Minecraft référencé
- `server_stats` — une mesure de ping (one row per serveur per 10 min), table time-series partitionnable mensuellement
- `server_stats_hourly` — agrégation horaire pré-calculée pour les vues longues plages
- `server_growth_stats` — métriques de croissance hebdomadaires/mensuelles recalculées par cron
- `categories`, `languages` + tables pivot — taxonomie many-to-many
- `users`, `access_tokens`, `posts` — comptes, OAuth, blog

---

## API publique

Documentation interactive sur `/docs` (Scalar UI), spec OpenAPI sur `/swagger`.

| Endpoint | Description |
|---|---|
| `GET /api/v1/servers` | Liste tous les serveurs avec leurs stats récentes |
| `GET /api/v1/servers/paginate` | Pagination + filtres (catégories, langues, recherche) |
| `GET /api/v1/servers/:id` | Détails d'un serveur |
| `GET /api/v1/servers/:id/stats` | Historique d'un serveur (`fromDate`, `toDate`, `interval`) |
| `GET /api/v1/global-stats` | Agrégation des joueurs sur tous les serveurs |
| `GET /api/v1/website-stats` | Statistiques globales de la plateforme |
| `GET /api/v1/categories`, `/languages` | Taxonomie publique |
| `POST /api/v1/login`, `/register`, `/verify-email` | Auth email |
| `GET /api/v1/login/:provider` | OAuth (Google, Discord) |
| `GET /metrics` | Métriques Prometheus |

Rate limiting adaptatif par route, validation VineJS, CORS configuré pour les deux domaines.

---

## Structure du repo

```
code/
├── backend/         AdonisJS 6 — API REST + scheduler + ping Minecraft
├── frontend/        Next.js 16 — App Router + ISR + SSR
├── docs/            Documentation interne, scripts ops
├── analytics/       Données SQLite extraites pour analyses ad-hoc
└── CLAUDE.md        Guide pour le développement assisté par IA
```

---

## Licence

GPL-3.0 — voir [LICENSE](LICENSE).

---

## Auteur

**Gabriel Landry** (Sportek) — [github.com/Sportek](https://github.com/Sportek) — [gabriel-landry.dev](https://gabriel-landry.dev)

Nom de domaine `minecraft-stats.com` offert par **Pol Marnette** ([pol.tf](https://pol.tf)).
