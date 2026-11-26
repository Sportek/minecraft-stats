---
name: writing-clean-code
description: Code-quality guardrails for writing or editing application code (React, TypeScript, AdonisJS). Avoids common AI/LLM anti-patterns — nested ternaries, redundant comments, over-defensive null checks, try-catch abuse, single-use helpers, and over-engineering. Use whenever generating or refactoring code, not just when the user explicitly asks for "clean code".
---

# Writing clean code

LLMs (this one included) drift toward recognizable bad habits: code that is
syntactically valid but harder to read and maintain than what a careful human
would write. This skill names those habits and the rule for each.

**The overriding rule: match the surrounding code.** Before writing anything, read
the nearby files and mirror their naming, structure, error handling, and comment
density. A "best practice" that clashes with the codebase's conventions is the
wrong practice here. Everything below is the default *when the codebase has no
stronger opinion*.

## Quick checklist

Before finishing any code change, scan for these:

```
- [ ] No nested ternaries (max one level, and only when it reads cleanly)
- [ ] Comments explain WHY, not WHAT — no narrating the obvious
- [ ] No redundant null/undefined guards for values that can't be null
- [ ] try/catch only around code that can actually throw, and errors aren't swallowed
- [ ] No helper/abstraction introduced for a single caller
- [ ] No duplicated logic that an existing function already covers
- [ ] Solved the actual problem — no speculative "future-proofing"
- [ ] Matches the file's existing style and conventions
```

## 1. Never nest ternary operators

Nested ternaries are the single most common AI readability offense. One level is
fine when it stays short. Beyond that, use `if`/`else`, an early return, or a lookup map.

```ts
// ❌ Bad — unreadable, hard to trace the branches
const label = status === 'active' ? 'Active' : status === 'pending' ? 'Pending' : status === 'archived' ? 'Archived' : 'Unknown'

// ✅ Good — lookup map
const STATUS_LABELS: Record<Status, string> = {
  active: 'Active',
  pending: 'Pending',
  archived: 'Archived',
}
const label = STATUS_LABELS[status] ?? 'Unknown'
```

For conditional JSX, prefer early returns or extracting a small component over
deeply nested `cond ? <A/> : cond2 ? <B/> : <C/>`.

## 2. Comments explain WHY, not WHAT

Do not narrate code that already says what it does. Comment the non-obvious: a
reason, a trade-off, a workaround, a link to an issue, a subtle invariant.

```ts
// ❌ Bad — restates the code
// increment the counter by one
counter += 1
// loop over the users
for (const user of users) { ... }

// ✅ Good — explains the why
// Stripe rounds half-up; we round half-even to match the ledger totals.
const amount = roundHalfEven(raw)
```

Delete commented-out code — version control already keeps it.

## 3. Don't over-guard against impossible states

Defensive checks for values that can't be null/undefined add noise and signal
uncertainty. Trust the types. Validate at the boundary (input/API/DB), not at
every internal call site.

```ts
// ❌ Bad — user is a required, typed argument; these checks can't fire
function getName(user: User) {
  if (!user) return ''
  if (!user.profile) return ''
  return user.profile.name
}

// ✅ Good — trust the type; guard only genuinely optional fields
function getName(user: User) {
  return user.profile?.name ?? ''
}
```

If a value truly can be absent, handle it once, clearly — don't sprinkle the same
guard down the call chain.

## 4. Don't abuse try/catch

Wrap only code that can actually throw, and only when you can do something
meaningful with the error. Never swallow errors silently.

```ts
// ❌ Bad — swallows the error, hides bugs, catches things that can't throw
try {
  const total = a + b
  return total
} catch (e) {
  console.log(e)
  return 0
}

// ✅ Good — let it throw, or catch where you can act and rethrow/handle
const total = a + b
return total
```

In AdonisJS controllers, prefer letting exceptions bubble to the global handler
over per-action try/catch, unless a specific failure needs custom handling.

## 5. Don't over-engineer

Solve the problem in front of you. Avoid abstractions, config options, generic
parameters, and "extensibility" that nothing currently uses (YAGNI).

- **No single-use helpers.** Don't extract a function that has exactly one caller
  and no clear name-gives-meaning benefit. Inline it.
- **No premature generalization.** Two similar lines aren't duplication worth a
  helper; three is when you reconsider.
- **No speculative parameters/flags** for hypothetical future needs.

```ts
// ❌ Bad — wrapper used once, adds indirection for nothing
function buildUserPayload(u: User) { return { id: u.id, name: u.name } }
const payload = buildUserPayload(user)

// ✅ Good — inline it
const payload = { id: user.id, name: user.name }
```

## 6. Reuse before you write

Before adding a function, util, or component, check whether one already exists in
the codebase. Duplicated logic that drifts out of sync is a top AI failure mode.
Search the project; extend or import the existing thing.

## 7. Match the codebase

- Use the same naming, file layout, and patterns as neighboring files.
- Use the libraries already in `package.json` — don't introduce a new dependency
  for something the stack already does.
- Follow the project's existing error-handling, validation (VineJS), and data-access
  (Lucid) patterns rather than inventing your own.

## What "done" looks like

Code that a reviewer would read once and understand, that touches only what the
task requires, and that looks like the rest of the repo wrote it. When in doubt,
prefer the smaller, plainer version.
