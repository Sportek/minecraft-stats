# SEO Blog Automation — Playbook

This file is the single source of truth for the scheduled agent that writes English SEO blog
articles for Minecraft-Stats. The agent reads this file at the start of every run and follows
it step by step. Edit this file to change the behaviour.

## Mission

Once per run, produce **one** high-quality, original, English-language SEO article and create
it as a **draft** via the API. **Do not publish** — Gabriel reviews drafts in the admin and
publishes manually.

Quality over quantity. One excellent, data-backed article beats three generic ones. If you
cannot produce something genuinely useful this run, create the best draft you can and flag your
concerns in the summary.

## Configuration

`.fr` and `.com` share the same backend/database, so reading and writing both target the `.fr`
API; published articles appear on both domains.

| Variable          | Value                                     | Purpose                                 |
| ----------------- | ----------------------------------------- | --------------------------------------- |
| `MCSTATS_API_URL` | `https://api.minecraft-stats.fr/api/v1`   | REST API (used for the authed write)    |
| `MCSTATS_TOKEN`   | `oat_…` (env secret)                       | API token of a `writer`/`admin` account |

- **MCP (reads):** the Minecraft-Stats MCP is connected to this routine (read-only). Prefer its
  tools — `getPosts`, `getPostsBySlug`, `getServers`, `getServersPaginate`, `getServerStats`,
  `getGlobalStats`, `getCategories` — for discovery, dedup, and gathering live data.
- **REST (write):** publishing/creating is NOT available via MCP. The single create call uses
  the REST API with `MCSTATS_TOKEN`.
- Internal links in articles should point to `https://minecraft-stats.com` (English audience).

## Step-by-step

### 1. Survey what already exists
- Use MCP `getPosts` to list existing published articles (titles, slugs, angles).
- Also fetch drafts via REST so you never duplicate a pending one:
  `GET {MCSTATS_API_URL}/admin/posts?status=all&limit=100` with `Authorization: Bearer {MCSTATS_TOKEN}`.
- This combined list is the authoritative "already covered" set.

### 2. Choose the content type, then the topic
- Read `automation/seo-blog/content-types.md`. Classify existing posts by type and pick the
  **least-covered** type (ties → free choice; avoid repeating last run's type).
- Invent one specific, search-worthy topic within that type, with a clear primary keyword. It
  must NOT overlap an existing post (loose match on title/keyword).

### 3. Gather real data (our SEO moat)
Original, factual data is what ranks. Via MCP:
- `getServers` / `getServersPaginate` for real servers, names, rankings, player counts.
- `getServerStats` for a server's history/growth; `getGlobalStats` for site-wide trends.
- Available dynamic placeholders: `GET {MCSTATS_API_URL}/posts/placeholders/list`. Tokens like
  `%PLAYER_COUNT_REALTIME_<serverId>%` are resolved server-side at render time, so the published
  article always shows **live** numbers. Use them wherever it keeps the content fresh.
- You may use WebSearch for general Minecraft context, but never invent server names or numbers —
  every concrete figure must come from the API or a live placeholder.

### 4. Write the article (Markdown)
- **Title (`title`)**: 50–60 chars, includes the primary keyword, compelling.
- **`excerpt`**: 140–160 chars — becomes the meta description; must stand alone and entice.
- **Body**: 700–1500 words of genuinely useful Markdown. Logical H2/H3 structure, short
  paragraphs, lists/tables where helpful. Natural keyword usage — no stuffing.
- **Internal links**: at least 2 to relevant `https://minecraft-stats.com` pages (a server page,
  the blog, a category).
- **Tone**: helpful, factual, English-native. Not promotional fluff, not obviously AI-generated.
- Cover image is optional — omit `coverImage` if you don't have a real one (never invent a URL).

### 5. Create the draft (REST)
```
POST {MCSTATS_API_URL}/admin/posts
Authorization: Bearer {MCSTATS_TOKEN}
Content-Type: application/json

{
  "title":   "<title>",
  "content": "<markdown body>",
  "excerpt": "<meta description>"
}
```
Expect `201`. The post is created with `published: false`. **Do NOT call the publish endpoint.**

### 6. Report
Output a short summary: chosen content type, title, primary keyword, word count, the draft's
slug/id, and the review URL `https://minecraft-stats.com/admin/posts`. Flag any quality concerns.

## Guardrails
- One article per run. Never publish. Never edit or delete existing posts.
- Never commit or print the token. Treat `MCSTATS_TOKEN` as secret.
- If the API returns 401/403, stop and report — the token is missing/expired or lacks the role.
- Dedup relies on the live post list (step 1), not on any local file, because each cloud run
  starts from a fresh checkout.
