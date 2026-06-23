# Content Types

The agent does NOT use a manual list of titles. Topic discovery is **signal-driven** (see
PLAYBOOK step 2): each run mines our own stats and external trend signals for something newsworthy,
then frames it as one of these **archetypes**. The archetype is the framing, not the source of
the idea.

Use the archetype mainly for **variety** and **coverage balance**: classify existing posts by
type, and when two candidate topics are equally strong, prefer the one that fills an
under-represented type (ties → free choice; avoid repeating last run's type).

| # | Type | What it is | Typical signal source | Example angles |
|---|------|------------|------------------------|----------------|
| 1 | **Server spotlight** | Deep-dive on one real, notable server using its live stats | Biggest mover / milestone in our data | "Inside <Server>: How It Reached <X> Players" |
| 2 | **Growth analysis** | Data story on which servers/types are rising, using real growth numbers | Our growth stats | "The Fastest-Growing Minecraft Servers This Month" |
| 3 | **Rankings / list** | Curated "top N" built from real data | Our rankings + rising genres from WebSearch | "Top 10 Most Popular Minecraft Servers Right Now" |
| 4 | **Beginner guide** | Evergreen how-to with clear search intent | Long-tail "how to…" WebSearch queries | "How to Choose the Right Minecraft Server" |
| 5 | **Server type explainer** | Explains a genre/category (SMP, anarchy, minigames, skyblock…) | Rising game modes from WebSearch | "Anarchy Servers Explained: Rules, Risks, Appeal" |
| 6 | **Trends & insights** | Aggregate trends from global stats | Our global stats; opportunistic macro trends | "What Server Player-Count Data Tells Us About Minecraft in <Year>" |
| 7 | **Version / update angle** | What a new Minecraft release means for servers & players | minecraft.wiki version pages | "What <Version> Changes for Server Owners" |

Rules:
- Types #1/#2/#3/#6 must lean on **real data** from the API/MCP (counts, rankings, growth). Use
  live placeholders (`%PLAYER_COUNT_REALTIME_<id>%`) so numbers stay current. #4/#5/#7 are
  search-/news-driven but should still link to relevant server/category pages.
- Type #7 is **timely** — only use it when there genuinely is a recent/upcoming version worth
  covering (check minecraft.wiki). Don't manufacture an update angle when nothing shipped.
- Never reuse an angle already covered by an existing post (check via MCP `getPosts`).
- Keep variety: don't produce the same type two runs in a row unless it's clearly the most
  under-covered.
