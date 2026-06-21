# Content Types

The agent does NOT use a manual list of titles. Instead it picks from these article
**archetypes**, favouring the type that is currently the **least represented** among existing
posts, then invents a specific, data-driven topic within that type.

Each run: count how many existing posts fall into each type (classify by title/angle), pick the
least-covered type (ties → free choice), and generate one fresh topic for it.

| # | Type | What it is | Example angles |
|---|------|------------|----------------|
| 1 | **Server spotlight** | Deep-dive on one real, notable server using its live stats | "Inside <Server>: How It Reached <X> Players" |
| 2 | **Growth analysis** | Data story on which servers/types are rising, using real growth numbers | "The Fastest-Growing Minecraft Servers This Month" |
| 3 | **Rankings / list** | Curated "top N" built from real data | "Top 10 Most Popular Minecraft Servers Right Now" |
| 4 | **Beginner guide** | Evergreen how-to with clear search intent | "How to Choose the Right Minecraft Server" |
| 5 | **Server type explainer** | Explains a genre/category (SMP, anarchy, minigames, skyblock…) | "Anarchy Servers Explained: Rules, Risks, Appeal" |
| 6 | **Trends & insights** | Aggregate trends from global stats | "What Server Player-Count Data Tells Us About Minecraft in <Year>" |

Rules:
- Every type except #4/#5 should lean on **real data** from the API/MCP (counts, rankings,
  growth). Use live placeholders (`%PLAYER_COUNT_REALTIME_<id>%`) so numbers stay current.
- Never reuse an angle already covered by an existing post (check via MCP `getPosts`).
- Keep variety: don't produce the same type two runs in a row unless it's clearly the most
  under-covered.
