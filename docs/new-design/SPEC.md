# Minecraft Stats — Redesign implementation spec (for contributors)

This condenses the design comps in `docs/new-design/*.html` into actionable rules.
The comps use a template DSL (`<sc-for>`, `<sc-if>`, `{{ }}`) and inline `style`
with `hsl(var(--token))`. Build real React/Tailwind pages from the intent below.

## Design tokens (already wired in `frontend/src/app/globals.css`)
Use ONLY semantic token utilities — never raw hex or palette colors
(`zinc/gray/slate/sky/emerald/raw stats-blue`). Brand accent is blue
`hsl(204 100% 38%)` light / `55%` dark.

| Role | Utility |
| --- | --- |
| Page background | `bg-canvas` (set globally on body — don't re-apply) |
| Card / panel | `bg-card text-card-foreground border border-border` |
| Secondary chip / row hover | `bg-secondary` / `hover:bg-secondary/40` |
| Muted text | `text-muted-foreground` |
| Accent (links, CTAs, active) | `bg-accent text-accent-foreground` / `text-accent` / `border-accent` / `bg-accent/10` |
| Destructive | `text-destructive` / `bg-destructive` |
| Success / online | `text-success` / `bg-success` |
| Inputs | `border-input bg-background`, focus `focus-visible:ring-2 focus-visible:ring-ring` |

Radius: cards `rounded-xl` (12px) or `rounded-lg`; chips/pills `rounded-full`.
Elevation: `shadow-xs`, hover `hover:shadow-md hover:border-accent/50`.
Aesthetic: analytics-data-first (Vercel/Linear/Plausible) — generous spacing,
hairline borders, accent used sparingly. Section headers commonly use a small
`bg-accent/10 text-accent` rounded icon tile + a bold title.

## Reuse these existing components (do NOT restyle the primitives)
- `@/components/ui/*` — Button (variants `default|secondary|accent|destructive|outline|ghost|link`, sizes `sm|lg|icon`), Card*, Badge (`default|secondary|accent|destructive|success|outline`), Input, Label, Form*, Select*, Checkbox, Dialog*, Skeleton, Avatar, Tooltip.
- `@/components/serveur/card/server-image` — server avatar with letter-tile fallback (`imageUrl`, `name`, `className`).
- `@/components/serveur/stat-card` — `StatCard` (icon + title + value) for metric grids.
- `@/components/blog/post-card` — `PostCard` (`featured?`) for blog cards.
- `@/components/admin/*` — `AdminPageHeader`, `AdminFilterTabs`, `AdminBackLink`, `AdminLoadingState`/`AdminMessageState`, `PostForm`.

### Dashboard shell (use for Profile, Add Server — My Servers already uses it)
- `@/components/account/dashboard-layout` — `DashboardLayout` wraps content in the
  sidebar + content grid (sidebar auto-hidden on mobile).
- `@/components/account/dashboard-hero` — `DashboardHero` gradient banner.
  Props: `title`, `subtitle?`, `badge?`, `action?` (right node), `avatar?` ({fallback, src}).
  Profile uses the `avatar` variant (floating tile); other pages omit it.
- `@/components/account/dashboard-stat-tile` — `DashboardStatTile` (`label`, `value`, `dot?: 'success'|'muted'`).

Every dashboard page should render `<DashboardLayout>` then a `<DashboardHero …/>`
first, followed by its cards.

## Rules for all work
- VISUAL restyle only — preserve every prop, SWR/server fetch, zod schema,
  react-hook-form wiring, handler, route, ISR, structured data, auth guard.
- Code comments in ENGLISH. Keep existing product copy language (the admin
  section and the `/cgu` page are intentionally French) unless asked.
- Clean code: no raw hex, no dead code; factor repeated markup into small
  reusable components in the feature folder.
- Responsive: every page must work on mobile (≈390px). Stack columns, collapse
  tables into stacked rows, keep tap targets ≥36px.

## Per-screen intent (read the matching comp for pixel detail)

### Server detail (`servers/[serverId]/[[...serverName]]/page.tsx`) — comp `Home + Server Detail`
Breadcrumb (Servers / name) → **server header card** (relative, subtle accent
radial glow; avatar letter tile 60px; name + flag; address with copy + website
link; badge row Online/Java/version/categories; right "Players online" big number
+ success dot + change%) → ad slot → **Player Count History** chart card (keep the
AG Charts chart + range/aggregation selects) → 6 `StatCard`s → **FAQ accordion**
(keep `ServerFAQStructuredData`; render the questions visibly as a token accordion).
Keep `ServerCard` usage if convenient, but the header should match the comp.

### Auth — comp `Authentication`
Centered 420px card on the canvas. Header: `bg-accent/10` icon tile + title
("Welcome back" / "Create your account") + muted subtitle. OAuth row (Discord +
Google, 2-col). Divider "OR WITH EMAIL". Token inputs with labels + error text.
Accent full-width submit (spinner while loading). Footer switch link.
Sign-up has a "Check your inbox" confirmation state (already handled — keep logic).

### Blog public — comp `Public Blog`
List: H1 "Blog" + subtitle; featured `PostCard featured`; "Recent Stories" grid of
`PostCard`; pagination. Article: back link, H1, author/date/category meta, cover,
`prose` body in tokens. (Largely done — refine spacing/typography to the comp.)

### Account / Profile (`account/settings`) — comp `Account/Profile`
`DashboardLayout` → `DashboardHero` with `avatar` (username initial), role badge,
email + "Member since". Then: "Your information" read-only card (Username/Email/
Role/Registered grid), "Manage password" card (keep `ChangePasswordForm`), and a
"Danger zone" card (destructive border) with "Log out everywhere" (keep `logoutAll`).

### Add Server (`account/add-server`) — comp `Add Server`
`DashboardLayout` → `DashboardHero` title "Add Server" badge "New". Form card
"Server details" with `AddServerForm` (keep schema/logic). Group fields per comp
(name; address + port; edition + website; categories; languages). Accent submit.

### Blog admin — comp `Blog Admin`
Manage Articles: `DashboardHero` "Articles" + "New Article"; stat tiles
(Total/Published/Drafts/Views); articles card with `AdminFilterTabs` (All/Published/
Drafts) + search + rows (cover, title, author, status pill draft=warning-ish/
published=success, views, date, view/edit/delete). Create/Edit: title input,
slug preview, the Tiptap editor toolbar, and a settings card (status segmented
toggle, category, slug, cover, summary). Keep all `#http/post` calls + `PostForm`.

### Home (`(index)` + `components/home/*`)
Already close. Tighten to the comp: hero (live pill, 46px H1 with accent span,
sub, two CTAs), 3-up stat band, Global Insight card, ad slot, "From the blog"
grid, favorites, browse with filters + pagination. Ensure mobile stacks cleanly.
