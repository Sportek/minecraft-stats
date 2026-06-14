# Blog article — "Connect Your AI to Live Minecraft Server Stats"

Ready-to-publish article for the Minecraft Stats blog. The fields below map directly to
the post form / API (`title`, `slug`, `excerpt`, `coverImage`, `content`). The body is
**Markdown** (converted to HTML automatically) and starts at `##` because the page
already renders the title as the heading and the excerpt as the lead paragraph — don't
repeat them in the body.

---

## Post fields

| Field | Value |
| --- | --- |
| **title** | `Connect Your AI to Live Minecraft Server Stats` |
| **slug** | `connect-your-ai-to-minecraft-server-stats` |
| **excerpt** | `Ask Claude, Cursor, or any AI assistant about Minecraft server trends and get real answers. Here's how to connect the Minecraft Stats MCP server in under two minutes — no API key, no account, completely free.` |
| **coverImage** | _Upload a cover (≈1200×630, e.g. a dashboard/chart screenshot or an "AI + Minecraft" visual) and paste its URL here._ |

> **Endpoint used throughout the article:** `https://mcp.minecraft-stats.com/mcp`

---

## Content (Markdown — paste into the editor body)

````markdown
Ever wished you could just *ask* your AI assistant which Minecraft server is growing fastest this week, or how a server's player count evolved over the last month? Now you can. The **Minecraft Stats MCP server** exposes our public statistics directly to AI agents like Claude, Cursor, and any other MCP-compatible client — and connecting it takes about two minutes.

## What is MCP?

The **Model Context Protocol (MCP)** is an open standard that lets AI assistants call external tools and data sources in a structured, secure way. Instead of copy-pasting data into a chat, you connect a *server* once and your assistant can query it on demand.

The Minecraft Stats MCP is **read-only**: it can fetch public server data and statistics, but it can never modify anything. It's the same data you already see on the site — just in a format your AI can reason about directly.

## What you can do with it

Once connected, you can ask your assistant things like:

- "Which Minecraft servers have the most players right now?"
- "Show me the player-count growth of server #125 over the last 30 days."
- "Compare the weekly trends of these three survival servers."
- "What are the most popular server categories on the platform?"
- "How many players are online across all servers combined?"

Under the hood, the server provides tools for listing and searching servers, fetching per-server time-series stats, aggregated global stats, categories, languages, and more.

## Prerequisites

- An MCP-compatible client. This guide covers **Claude Code** (CLI) and **Claude Desktop**, but any client supporting the Streamable HTTP transport works (Cursor, VS Code, Windsurf, …).
- That's it — **no API key, no account, no sign-up.** The endpoint is public.

The server endpoint is:

```
https://mcp.minecraft-stats.com/mcp
```

## Setup — Claude Code (CLI)

Run a single command:

```bash
claude mcp add --transport http minecraft-stats https://mcp.minecraft-stats.com/mcp
```

By default this adds the server to your current project. To make it available across **all** your projects, add the user scope:

```bash
claude mcp add --transport http --scope user minecraft-stats https://mcp.minecraft-stats.com/mcp
```

Verify the connection:

```bash
claude mcp list
```

You should see `minecraft-stats` listed as connected. Done!

## Setup — Claude Desktop (and other JSON-config clients)

Open your client's MCP configuration and add the server:

```json
{
  "mcpServers": {
    "minecraft-stats": {
      "type": "streamable-http",
      "url": "https://mcp.minecraft-stats.com/mcp"
    }
  }
}
```

In Claude Desktop you'll find this under **Settings → Developer → Edit Config**. Save the file and restart the app — the Minecraft Stats tools will appear in the tools menu.

## Try it out

Start a new conversation and ask:

> What are the top 5 Minecraft servers by current player count, and how have they trended over the past week?

Your assistant will call the relevant tools, fetch the live data, and answer with real numbers — no manual lookups required.

## How it works (for the curious)

The Minecraft Stats MCP is intentionally simple and transparent:

- **Auto-generated from our public API.** The server reads our live OpenAPI specification at startup and turns each public, read-only endpoint into an MCP tool. When our API evolves, the tools stay in sync automatically.
- **Streamable HTTP transport.** It uses the current MCP transport standard, so it works with every modern client out of the box.
- **Read-only by design.** Only an explicit allowlist of public `GET` endpoints is ever exposed. Authentication and admin endpoints are never reachable through the MCP — it's a pure, safe window into public stats.

## Troubleshooting

- **The client can't connect.** Double-check the URL ends in `/mcp` and that your client uses the **HTTP / Streamable HTTP** transport (not stdio).
- **No tools show up.** Restart the client after editing the config. In Claude Code, run `claude mcp list` to confirm the server status.
- **Behind a corporate proxy/firewall.** The endpoint is plain HTTPS on port 443, so it should pass through normally — but outbound filtering can block it.

## Wrapping up

In one command you've given your AI assistant a live window into Minecraft server statistics. Ask it to surface trends, compare servers, or summarize the platform — it now has the data to back up its answers.

Got an interesting use case or a feature request for the MCP? We'd love to hear it. Happy querying! 🎮📊
````

---

### Notes for publishing

- The blog now stores and renders **Markdown** (converted to HTML via markdown-it at
  render time), so you can paste this body directly into the editor — including the code
  blocks. Old HTML articles keep rendering correctly (markdown-it passes HTML through).
- **Cover image** is the only thing you still need to provide — upload one via the admin
  image upload and paste the returned URL into the `coverImage` field.
- The body intentionally omits a top‑level `#` heading and any title/excerpt repetition,
  since the blog template renders those from the dedicated fields. Sections start at `##`.
- Optional: you can embed **live stat placeholders** anywhere in the body (e.g.
  `%PLAYER_COUNT_REALTIME_125%`) — they're resolved server‑side at render time.
- The category badge on the article page is currently hard‑coded to "News".
