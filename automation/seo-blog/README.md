# SEO Blog Automation

A scheduled Claude agent that writes **one English SEO blog article per week** and creates it as
a **draft** for review (it never auto-publishes). It picks topics itself: it looks at what's
already on the blog (via the Minecraft-Stats MCP), chooses the least-covered content type, and
generates a fresh, data-backed topic.

## Files
- `PLAYBOOK.md` — the instructions the agent follows every run. Edit this to change behaviour.
- `content-types.md` — the article archetypes it chooses from (no manual topic list).

## How it reads vs writes
- **Reads** (existing posts, servers, live stats) → Minecraft-Stats **MCP** (read-only),
  connected to the routine.
- **Writes** (create the draft) → REST `POST /admin/posts` with an **API token**, because the
  MCP cannot publish.
- `.fr` and `.com` share one database, so everything targets the `.fr` API and the article shows
  on both domains.

## Setup (one-time)

1. **Dedicated writer account** — create one on the site (e.g. `seo-bot@…`); an admin grants it
   the `writer` role (`PATCH /api/v1/admin/users/:id/role` → `{ "role": "writer" }`).
2. **API token** — log in as that account, go to **Account → API Tokens**, create a token
   (e.g. name "SEO bot", 365 days), copy the `oat_…` value once.
3. **Store the secrets on the cloud environment** running the routine (claude.ai/code →
   environment settings), never in the repo:
   - `MCSTATS_API_URL=https://api.minecraft-stats.fr/api/v1`
   - `MCSTATS_TOKEN=oat_…`
4. **MCP connector** — the routine attaches the read-only MCP at
   `https://mcp.minecraft-stats.fr/mcp` (ensure that URL is publicly deployed).

## Review flow
Each run drops a draft into https://minecraft-stats.com/admin/posts. Review, tweak, publish.
Once you trust the output you can switch the playbook to auto-publish by adding a publish step
(`POST /admin/posts/{id}/publish`).
