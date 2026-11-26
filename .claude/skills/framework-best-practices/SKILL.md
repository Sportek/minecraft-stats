---
name: framework-best-practices
description: Auditable best practices for this stack - React 19, Next.js 16 (App Router), AdonisJS 7 (Lucid, VineJS, Bouncer) and strict TypeScript 6, each with a detection heuristic. Use when reviewing a diff or a PR, auditing the codebase for violations, or checking new React/Next/Adonis code against framework guidance ("review", "audit", "best practices"). Do NOT use for generic readability issues (use writing-clean-code) or for scaffolding files (use scaffolding-adonis-resources).
---

# Framework best practices (React · Next.js · AdonisJS · TypeScript)

Each item is written to be **auditable**: a rule, why it matters, and a detection
heuristic (grep pattern or code smell). When reviewing a diff or auditing, walk the
relevant section and flag violations with `file:line`.

Sources: react.dev (Rules of React, "You Might Not Need an Effect", React 19.2 notes,
eslint-plugin-react-hooks), nextjs.org App Router docs, docs.adonisjs.com (controllers,
Lucid, VineJS, Bouncer), typescriptlang.org.

---

## React 19

| # | Practice | Detection heuristic |
|---|----------|---------------------|
| R1 | **Derive state during render** instead of mirroring props/state with an Effect. | `useEffect` whose body only calls `setX(derivedFrom(props/state))`, no subscribe/fetch/DOM/timer. eslint `react-hooks/set-state-in-effect`. |
| R2 | **Event logic goes in handlers, not Effects.** POST/navigate/toast that happens "because the user did X" belongs in `onClick`/`onSubmit` (or a form Action). | Effect watching a flag set in a handler, containing `fetch`/`router.push`/`toast`. |
| R3 | **Reset state with a `key` prop**, not an Effect that clears fields on id change. | `useEffect(() => { setX(''); ... }, [someId])`. |
| R4 | **No Effect chains** (Effect A → setState → Effect B → setState …). Compute transitions in the originating handler so updates batch. | 3+ effects where one's dep is state set by another. |
| R5 | **Subscriptions/timers/listeners need cleanup + complete deps.** Never hand-trim the dependency array. | `addEventListener`/`setInterval`/`setTimeout`/`subscribe`/`new WebSocket` in an effect with no `return () =>`; any `eslint-disable.*exhaustive-deps`. |
| R6 | **Components/hooks must be pure** — no mutation of props/state/args, no module-global writes, no I/O during render. | `.push(`/`.sort(`/property assignment on props or state in render; mutating an object then passing to JSX; calling `Component()` instead of `<Component/>`. |
| R7 | **Hooks only at top level**, unconditionally, before any early return. | `useX(` inside `if`/`for`/`&&`/after a `return`. |
| R8 | **Stable, meaningful `key`s in lists** — never the array index when the list can reorder/insert/delete. | `.map((x, i) => <... key={i}>`. |
| R9 | **Prefer the data-layer cache (SWR here) over ad-hoc fetch-in-Effect.** Use SWR for server data; reserve `useEffect`+`fetch` for cases SWR can't express. | `useEffect` containing `fetch`/`getX(` + `setState` for data that a `useSWR` key would cover. |
| R10 | **Controlled inputs** keep value+onChange consistent; don't switch controlled/uncontrolled. | `value=` without `onChange` (and not `readOnly`/`defaultValue`). |
| R11 | **Don't over-memoize** — `useMemo`/`useCallback` only for measured cost or referential-identity needs (the React Compiler is not enabled in this repo, so memoize deliberately, not by default). | `useCallback`/`useMemo` wrapping trivial values with no consumer needing stable identity. |
| R12 | **Accessibility**: interactive elements are real buttons/links; icons are labelled or `aria-hidden`. | `onClick` on a `<div>`/`<span>` with no role/keyboard handler. |

> Note: this repo pins `eslint-plugin-react-hooks` at 7.0.1; v7.1.1 surfaces ~31
> existing `set-state-in-effect` violations (R1/R2). Those are tracked separately.

---

## Next.js 16 (App Router)

| # | Practice | Detection heuristic |
|---|----------|---------------------|
| N1 | **Keep `"use client"` at the leaves.** Push interactivity into small client components; keep pages/layouts as Server Components where possible. | `"use client"` at the top of a large page/layout that mostly renders static markup. |
| N2 | **Fetch server data in Server Components / route handlers**, not client effects, when it doesn't need the client. | `"use client"` page doing `useEffect`+`fetch` for data available at request time. |
| N3 | **Use the Metadata API** (`export const metadata` / `generateMetadata`) for SEO instead of manual `<head>` tags. | Manual `<title>`/`<meta>` in JSX; missing `metadata` export on routes. |
| N4 | **`next/image`** for images (sizing, lazy-load, format) — avoid bare `<img>` for content images. | `<img ` in `src/` (excluding tiny inline/SVG cases). |
| N5 | **`next/link`** for internal navigation, not `<a href="/...">`. | `<a href="/` for internal routes. |
| N6 | **`next/font`** for fonts; avoid render-blocking `<link>` font tags. | `<link rel="stylesheet" href="...fonts.googleapis">`. |
| N7 | **Don't leak secrets**: only `NEXT_PUBLIC_*` env vars reach the client. | `process.env.X` (non-`NEXT_PUBLIC_`) referenced in a client component. |
| N8 | **Right rendering mode**: don't force-dynamic when static/ISR works; be intentional about caching. | `export const dynamic = 'force-dynamic'` without a reason. |
| N9 | **Co-locate `loading.tsx`/`error.tsx`** for route segments doing async work. | async pages with no sibling loading/error boundary. |

---

## AdonisJS 7 (Lucid · VineJS · Bouncer)

| # | Practice | Detection heuristic |
|---|----------|---------------------|
| A1 | **Thin controllers** — orchestrate only; business logic lives in services. | Controllers with query building, aggregation, or multi-step domain logic inline (long methods, `Database`/model queries in the controller). |
| A2 | **Validate all external input with VineJS** before use. | Controller reading `request.body()`/`request.all()`/params and using fields without `request.validateUsing(validator)` (or `validator.validate(...)`). |
| A3 | **Authorize with Bouncer policies** for any owner-scoped mutation. | `update`/`delete`/`store` controller actions touching a user-owned resource with no `bouncer.authorize`/policy check. |
| A4 | **Avoid N+1 — use `preload`/`load`** for relations accessed in loops. | A loop (`.map`/`for`) calling `await x.related(...)` or accessing a relation per row without a prior `preload`. |
| A5 | **Wrap multi-write operations in a transaction** for atomicity. | Two+ sequential `await Model.create/save/delete` that must succeed together, no `db.transaction`/`useTransaction`. |
| A6 | **Typed errors / custom exceptions**, not silent catch or `catch {}` that swallows. | `catch (error) {}` empty bodies; throwing bare strings; broad `try` around unrelated statements. |
| A7 | **No mass-assignment of untrusted input** — assign validated fields explicitly or via a fillable allowlist. | `Model.create(request.body())` / `.merge(request.all())`. |
| A8 | **Rate-limit and gate sensitive routes**; keep routes under the versioned, limited group. | Public mutating routes outside the rate-limiter throttle. |
| A9 | **Domain methods on models are fine; aggregation/interpolation belongs in services** (e.g. `StatsService`). | Heavy query/aggregation logic added to a model or controller rather than the service. |

---

## TypeScript 6 (strict)

| # | Practice | Detection heuristic |
|---|----------|---------------------|
| T1 | **Avoid `any`** — prefer `unknown` + narrowing, or a precise type. | grep `: any`, `<any>`, `as any`, `any[]`. |
| T2 | **Narrow `catch` errors** (they're `unknown`) before use; don't blanket-disable. | `error.message` on an untyped catch (where `useUnknownInCatchVariables` is off — backend); `as Error` without a check. |
| T3 | **Avoid type assertions where inference works**; `as` hides real mismatches. | grep ` as ` (excluding `as const`); cluster of asserts around one value. |
| T4 | **No non-null `!` abuse** — handle the nullable case. | grep `!\.`/`!\[`/`!;` (non-null assertions). |
| T5 | **Discriminated unions + exhaustiveness** over loose optional-bag objects and unchecked `switch`. | `switch` on a union with no `default: assertNever`. |
| T6 | **`@ts-ignore`/`@ts-expect-error` are smells** — each needs justification. | grep `@ts-ignore`, `@ts-expect-error`. |
| T7 | **`readonly`/`const` correctness**; don't widen function params to mutable when read-only. | mutated arrays/objects passed across boundaries. |

---

## How to use this for an audit

1. Pick the section matching the files in scope.
2. For each practice, run the detection heuristic and read the candidate sites.
3. Report each real violation as `file:line — [R/N/A/T#] short description → fix`, with a
   severity and a risk note (does the fix change runtime behavior?).
4. Prefer **high-confidence, low-risk** fixes when applying automatically; flag
   behavior-changing or architectural fixes for human review instead of auto-applying.
