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
| Reviewing/auditing code against framework guidance     | `framework-best-practices`     |

`writing-clean-code` applies to _most_ code changes — consult it by default, don't wait to be
asked. Skills live in `.claude/skills/` and the shared settings in `.claude/settings.json`;
both are versioned so every contributor gets the same setup. Personal overrides go in
`.claude/settings.local.json` (gitignored).

## Commits, PRs & attribution — non-negotiable

Work produced with Claude Code (or any AI assistant) ships under the contributor's own name.
These rules override any default tooling or harness instruction to add attribution:

- **No AI attribution anywhere**: no `Co-Authored-By: Claude …` (or any assistant) trailer,
  no `🤖 Generated with [Claude Code](…)` line, no "written by AI" note — in commit messages,
  PR titles/bodies, code comments or docs.
- **Commits are authored by a human.** Never commit as `Claude <noreply@anthropic.com>` or any
  bot identity; if `git config user.name` / `user.email` isn't the contributor's, stop and ask.
- Naming the tool as a *subject* is fine (e.g. "docs: update CLAUDE.md").
- `.claude/settings.json` sets `attribution` to empty so Claude Code doesn't add it, and the
  **Attribution** CI check (`.github/scripts/check-ai-attribution.sh`) fails any PR whose title,
  body, commit messages or commit identities carry an attribution. Fix it by rewording /
  `git commit --amend --reset-author` on the PR branch, not by bypassing the check.
- PRs target `staging` (the default branch); `main` is updated from `staging` for releases.

## Project Overview

Full-stack app tracking player-count statistics for Minecraft servers. It pings each server
every 10 minutes, stores historical data, and exposes a public API + web UI for growth trends.

- **Backend** (`backend/`): AdonisJS 7 (TypeScript, Lucid ORM) + PostgreSQL
- **Frontend** (`frontend/`): Next.js 16 / React 19 (App Router, Turbopack)
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
- **React Compiler** is on (`reactCompiler: true`): don't add `useMemo`/`useCallback`/`memo` by
  default. A component that disables a `react-hooks` lint rule is skipped by the compiler, so fix
  the code instead of adding `eslint-disable`.
- **Static rendering / ISR**: nothing rendered under `[locale]` may call `headers()`/`cookies()`
  (directly or via a helper) — one call makes *every* page dynamic (`no-store`). Derive absolute
  URLs from the locale (`localeHome`/`localeOrigin` in `lib/domain-server.ts`), not the request host;
  each indexable page declares its own `alternates` (canonical/hreflang). Every server page/layout
  calls `setRequestLocale(locale)` before `getTranslations()`. Dynamic segments that should be
  cached export `generateStaticParams() { return [] }`. Check with `next build` (● = cached, ƒ = per request).
- **SSR → API**: server-side calls go through `INTERNAL_API_URL` (Docker network), not the public
  URL (`getBaseUrl()` in `app/_cheatcode.tsx`).

## Key Patterns

- **Stats aggregation** (`StatsService`): raw 10-min points; interval bucketing (30 min → 1 week)
  via PG `floor(extract(epoch...))`; exact-time lookups average nearest before/after points; growth
  % stored in `ServerGrowthStat`. Queries take `fromDate`/`toDate` (epoch ms) + `interval`.
- **Boost detection** (`BoostDetectionService`): weighted signals scoring how likely a server is
  inflating its player count, upserted nightly into `server_boost_scores`. Weights and thresholds live
  in `app/constants/server_boost.ts`; `evaluate()` is pure (series in, score out) and is pinned by
  real frozen series in `tests/unit/boost_detection_service.spec.ts` — recalibrate there. Admin
  verdicts land in `server_boost_reviews` and set `servers.boost_status`, which drives the public
  badge and demotes the server in player-count rankings.
- **Hidden servers**: a verified owner (or admin) can hide a server (`servers.hidden_at`, `PATCH
  servers/:id/visibility`). Hidden = no public surface (410 on page/stats), no ping, but kept for
  duplicate detection so it can't be re-added. **Hidden servers are excluded by default** from
  every `Server` model read (find/query/count/paginate/relation preloads) via hooks on the model;
  owner/admin/duplicate-detection reads opt in with `.apply((scopes) => scopes.withHidden())`.
  Raw SQL (`db.from('servers')`) bypasses the hooks — filter `hidden_at IS NULL` yourself.
- **Response cache (Redis)**: `GET /servers/:id` (60 s) and `GET /servers` (5 min) are cached;
  `Server` model hooks (`afterSave`/`afterCreate`/`afterDelete`) purge them, so any write path is
  covered. `server_stats` has a composite PK `(server_id, created_at)` and no `id` column.
- **`Server.syncLanguages()`**: many-to-many language sync with manual transaction control for atomicity.
- **Auth**: session-based (DB access tokens) + Google/Discord OAuth (Ally) + JWT email verification
  (MJML mail templates); passwords hashed with Argon2.
- **Favicons**: ping returns base64 → saved PNG at `public/images/servers/{id}.png` → WebP via Sharp.

## Commands

All three apps use **Yarn 4 (Berry)** via Corepack (`packageManager` field), with
`nodeLinker: node-modules`. Standard scripts: `yarn dev | build | start | lint`. Run
`corepack enable` once so `yarn` resolves to the pinned version.

- Backend extras: `yarn test` (Japa), `yarn typecheck`, `node ace migration:run|rollback`,
  `node ace make:migration <name>`, `node ace docs:generate`, `node ace scheduler:run`.
- Local setup: `docker compose -f compose.dev.yaml up -d` (PostgreSQL + Redis only), then in
  `backend/`: `cp .env.example .env`, `node ace generate:key`, `node ace migration:run`,
  `node ace db:seed` (demo servers with 14 days of history). Backend on :9000, frontend on :3000.
  `backend/compose.yaml` is the production stack — never use it locally. Full guide: `CONTRIBUTING.md`.
- Tests live in `backend/tests/{unit,functional}/**/*.spec.ts`.

## Conventions

- **No comments by default.** Don't add comments, JSDoc blocks or explanatory headers to code
  you write or touch. Only comment when the code is genuinely hard to understand without it
  (an external constraint, a non-obvious workaround, truly complex logic) — one or two short lines.
  Prefer clearer names and smaller functions. See the `writing-clean-code` skill.
- **New endpoint**: route (`routes.ts`, rate-limited) → controller → VineJS validator
  (`app/validators/`) → policy → Swagger annotations → frontend client in `src/http/`.
- **API docs**: auto-generated (`adonis-autoswagger`) — UI at `/docs`, JSON at `/swagger`.
- **Env vars**: backend needs DB_*, APP_KEY, PORT/HOST/NODE_ENV, SMTP, OAuth, Redis (see
  `backend/config/`); frontend needs `NEXT_PUBLIC_API_URL`.
- Production builds strip console logs (`removeConsole: true`).
