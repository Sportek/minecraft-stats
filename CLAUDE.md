# CLAUDE.md

Guidance for Claude Code when working in this repository.

## Skills — check BEFORE acting

This repo ships custom skills that encode conventions easy to get wrong. Check whether one
covers your task and invoke it (Skill tool) instead of improvising.

| When you are…                                          | Use skill                      |
| ------------------------------------------------------ | ------------------------------ |
| Writing/editing app code (React/TS/AdonisJS)           | `writing-clean-code`           |
| Creating an Adonis model/controller/migration/etc.     | `scaffolding-adonis-resources` |
| Committing, branching, or opening a PR                 | `creating-commits-and-prs`     |

`writing-clean-code` and `writing-clean-tests` apply to _most_ code changes — consult them
by default, don't wait to be asked.

## Project Overview

Full-stack app tracking player-count statistics for Minecraft servers. It pings each server
every 10 minutes, stores historical data, and exposes a public API + web UI for growth trends.

- **Backend** (`backend/`): AdonisJS 6 (TypeScript, Lucid ORM) + PostgreSQL
- **Frontend** (`frontend/`): Next.js 15 / React 19 (App Router, Turbopack)
- **MCP server** (`mcp/`): exposes the public read-only API to AI agents over MCP. Tools are
  auto-generated at startup from the backend's live OpenAPI spec (`/swagger`), filtered by a
  public allowlist. See `mcp/README.md`.

## Architecture

### Backend (`backend/`)

- **Models** (`app/models/`): `Server`, `ServerStat` (10-min time series), `ServerGrowthStat`
  (weekly/monthly growth), `Category`, `Language`, `User`. `Server` has relations to all of these.
- **Controllers** (`app/controllers/`): Servers, Stats, Categories, Auth (login/register/OAuth/
  email verify), WebsiteStats.
- **Services** (`app/services/stat_service.ts`): `StatsService` — **all** aggregation,
  interpolation, and growth math lives here. Change it here, not in callers.
- **Policies** (`app/policies/`): Bouncer authorization (a user may only modify their own servers).
- **Minecraft ping** (`minecraft-ping/minecraft_ping.ts`): `@minescope/mineping` queries.
- **Scheduler** (`start/scheduler.ts`): every 10 min ping all servers (uniform spacing via
  `pLimit(1)` + computed delays to avoid rate limits); every 6 h refresh favicons + growth stats.
- **Routes** (`start/routes.ts`): all under `/api/v1`, rate-limited (`start/limiter.ts`).
- **Import aliases**: `#` prefix, e.g. `#models/server`, `#controllers/auth_controller`.

### Frontend (`frontend/`)

- `src/app/` — App Router pages: `(pages)/`, `(auth)/`, `account/`.
- `src/components/` — by feature: `serveur/`, `form/`, `ui/` (shadcn/Radix), `dark-mode/`, `metrics/`.
- `src/contexts/` — `auth.tsx`, `servers.tsx` (SWR), `favorite.tsx` (localStorage).
- `src/http/` — API client (`auth.ts`, `server.ts`). `src/types/` — TS types.
- Tailwind + shadcn/ui, SWR for data, AG Charts for stats.

## Key Patterns

- **Stats aggregation** (`StatsService`): raw 10-min points; interval bucketing (30 min → 1 week)
  via PG `floor(extract(epoch...))`; exact-time lookups average nearest before/after points; growth
  % stored in `ServerGrowthStat`. Queries take `fromDate`/`toDate` (epoch ms) + `interval`.
- **`Server.syncLanguages()`**: many-to-many language sync with manual transaction control for atomicity.
- **Auth**: session-based (DB access tokens) + Google/Discord OAuth (Ally) + JWT email verification
  (MJML mail templates); passwords hashed with Argon2.
- **Favicons**: ping returns base64 → saved PNG at `public/images/servers/{id}.png` → WebP via Sharp.

## Commands

Both apps use **Yarn 1.22.22**. Standard scripts: `yarn dev | build | start | lint`.

- Backend extras: `yarn test` (Japa), `yarn typecheck`, `node ace migration:run|rollback`,
  `node ace make:migration <name>`, `node ace docs:generate`, `node ace scheduler:run`.
- Local DB: `docker compose --env-file ./.env.development up -d` (see `backend/README.md`),
  then `node ace migration:run`.
- Tests live in `backend/tests/{unit,functional}/**/*.spec.ts`.

## Conventions

- **New endpoint**: route (`routes.ts`, rate-limited) → controller → VineJS validator
  (`app/validators/`) → policy → Swagger annotations → frontend client in `src/http/`.
- **API docs**: auto-generated (`adonis-autoswagger`) — UI at `/docs`, JSON at `/swagger`.
- **Env vars**: backend needs DB_*, APP_KEY, PORT/HOST/NODE_ENV, SMTP, OAuth, Redis (see
  `backend/config/`); frontend needs `NEXT_PUBLIC_API_URL`.
- Production builds strip console logs (`removeConsole: true`).
