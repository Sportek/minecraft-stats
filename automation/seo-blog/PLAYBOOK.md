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

| Variable          | Value                                     | Purpose                                          |
| ----------------- | ----------------------------------------- | ------------------------------------------------ |
| `MCSTATS_API_URL` | `https://api.minecraft-stats.fr/api/v1`   | REST API (used for the authed write + upload)    |
| `MCSTATS_TOKEN`   | `oat_…` (env secret)                       | API token of a `writer`/`admin` account          |
| `KIE_API_KEY`     | `…` (env secret)                           | kie.ai key for Nano Banana Pro cover generation  |

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

### 2. Find the topic (signal-driven ideation)
Don't invent a topic from thin air — **discover** one from real signals, then frame it as an
archetype. The archetype is how you *frame* the signal, not the starting point. Run this funnel:

**2a. Mine our own data first (the moat).** This is the unique angle no competitor can copy.
Via MCP, scan for what's genuinely newsworthy *this run*:
- **Biggest mover** — the server with the largest weekly/monthly growth, or the sharpest drop
  (`getServers`/`getServersPaginate` + `getServerStats`, growth stats).
- **Milestone / record just crossed** — a server passing a round number (10k/50k peak), a new
  all-time peak, or a category total crossing a threshold (`getGlobalStats`, `getCategories`).
- **Fast-climbing newcomer**, or an unusual pattern (weekend vs weekday, month-over-month shift).
Keep 3–5 candidate "data angles", each backed by a striking real number.

**2b. Pull external trend & demand signals.** Confirm a candidate matches real-world interest, or
surface a fresher angle. These sources are **verified to work in this environment** (see tool
notes below):
- **New Minecraft versions/features — timely, high demand.** WebFetch
  `https://minecraft.wiki/w/Java_Edition` for the current release, then
  `https://minecraft.wiki/w/Java_Edition_<version>` for its changelog. New mobs/features drive
  predictable search spikes ("what's new in `<version>`", "update your server to `<version>`").
- **Long-tail search demand.** WebSearch real user questions — `how to …`, `why is …`,
  `best … 2026`. The related-question cluster that comes back is both your outline and proof of
  demand.
- **Rising server genres & names.** WebSearch `best Minecraft <genre> servers 2026` or
  `trending Minecraft servers <month> 2026`. Surfaces hot game modes (e.g. lifesteal, oneblock)
  and server names even though the list sites block direct fetching.
- **Community discussion.** WebSearch `reddit admincraft <topic> 2026` for what admins/players
  actively debate (hosting, lag, software). Qualitative signal only.
- **Opportunistic macro trends.** WebFetch `https://trends.google.com/trending/rss?geo=US`; act
  only if a Minecraft-adjacent term actually spikes (usually none — never force it).

**2c. Pick & frame.** Choose the single best topic by combining: a striking real number we own
(2a) ✚ proven search demand or timeliness (2b) ✚ not already covered (step 1) ✚ fills an
under-represented archetype (`content-types.md`; tie-break for variety — don't repeat last run's
type). Settle on one specific, search-worthy topic with a clear primary keyword.

**Tool notes (this environment).** WebSearch is Google-style, **US-only**, and knows the current
month/year — include the year (and month for trends) in queries for fresh results, and **don't
use the `site:` operator** (it's ignored; put the site name in as a plain keyword instead).
WebFetch only works reliably on **minecraft.wiki** and the Google Trends RSS URL above — Reddit,
minecraft.net, and server-list sites are bot-blocked, so reach those **through WebSearch** rather
than fetching them directly.

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
- Don't set `coverImage` here — it's produced in step 5 below from a generated image.

### 5. Generate the cover image (Nano Banana Pro → upload)
Generate one original cover illustration for the article's topic with kie.ai's Nano Banana Pro,
then upload it to our own storage and use the returned path as `coverImage`. Never put a raw
kie.ai URL in `coverImage` — those expire; always re-host via our upload endpoint.

1. **Write the image prompt** from the article's topic. Every cover must read as part of the
   Minecraft-Stats brand, so the blog feels like one consistent visual family run after run.
   Build the prompt from this fixed **brand brief** plus a per-article subject:
   - **Identity:** Minecraft-Stats is a *data/analytics* product, not a generic blocky-Minecraft
     skin. The hero motif is **server statistics**: ascending bar charts, glowing line/growth
     curves, dashboard panels, leaderboards — visualised with a tasteful Minecraft-world accent
     (a few voxel/cube elements, a blocky server silhouette), never a full pixel-art scene.
   - **Palette (use these, don't drift):** deep navy background (`#0b1622` → `#002e4d`), with the
     "stats-blue" scale for the data and glow — `#0099FF` (hero blue), `#66C2FF` and `#CCEBFF`
     (light highlights), `#005C99` (dark blue). Cool blues on dark navy is the signature look;
     keep accents to this blue family rather than rainbow colours.
   - **Style:** clean, modern, editorial — soft depth, subtle gradients and glow, generous
     negative space. Cohesive with a dark-mode analytics dashboard. No text, no watermark, no
     logos, no UI chrome/cursors. 16:9 landscape composition.
   - **Per-article angle:** specialise the subject to the topic (e.g. a server spotlight → a
     blocky server lit by a rising bar chart; a growth piece → an upward line graph over a voxel
     landscape; a ranking piece → a podium of chart bars). Keep the palette and style above fixed.
2. **Create the task:**
   ```
   POST https://api.kie.ai/api/v1/jobs/createTask
   Authorization: Bearer {KIE_API_KEY}
   Content-Type: application/json

   {
     "model": "nano-banana-pro",
     "input": {
       "prompt": "<image prompt>",
       "aspect_ratio": "16:9",
       "resolution": "2K",
       "output_format": "jpg"
     }
   }
   ```
   Expect `code: 200`; read `data.taskId`.
3. **Poll for the result:** `GET https://api.kie.ai/api/v1/jobs/recordInfo?taskId={taskId}` with
   `Authorization: Bearer {KIE_API_KEY}`. Wait a few seconds between polls (generation usually
   takes ~10–40 s). Read `data.state`:
   - `waiting` / `queuing` / `generating` → keep polling (cap at ~10 tries, ~90 s total).
   - `success` → parse `data.resultJson` (a JSON **string**) and take `resultUrls[0]`.
   - `fail` → log `data.failMsg`, skip the cover (continue without `coverImage`), and note it in
     the summary. A draft with no cover is fine; a failed run is not.
4. **Re-host on our storage:** download `resultUrls[0]`, then upload it:
   ```
   POST {MCSTATS_API_URL}/uploads/image
   Authorization: Bearer {MCSTATS_TOKEN}
   Content-Type: multipart/form-data   (form field name: image)
   ```
   The response is `{ "url": "/images/blog/<uuid>.webp" }` (server converts to WebP). Use that
   relative `url` as `coverImage` in the next step.

### 6. Create the draft (REST)
```
POST {MCSTATS_API_URL}/admin/posts
Authorization: Bearer {MCSTATS_TOKEN}
Content-Type: application/json

{
  "title":      "<title>",
  "content":    "<markdown body>",
  "excerpt":    "<meta description>",
  "coverImage": "<url from step 5, omit if generation failed>"
}
```
Expect `201`. The post is created with `published: false`. **Do NOT call the publish endpoint.**

### 7. Report
Output a short summary: chosen content type, title, primary keyword, word count, whether a cover
image was generated (and its stored path, or why it was skipped), the draft's slug/id, and the
review URL `https://minecraft-stats.com/admin/posts`. Flag any quality concerns.

## Guardrails
- One article per run. Never publish. Never edit or delete existing posts.
- Never commit or print the tokens. Treat `MCSTATS_TOKEN` and `KIE_API_KEY` as secrets.
- The cover image is best-effort: if `KIE_API_KEY` is missing or generation fails, create the
  draft without `coverImage` rather than aborting the run.
- If the API returns 401/403, stop and report — the token is missing/expired or lacks the role.
- Dedup relies on the live post list (step 1), not on any local file, because each cloud run
  starts from a fresh checkout.
