---
name: creating-commits-and-prs
description: Creates git commits and GitHub pull requests following team conventions (Conventional Commits, type/description branches). Use when the user asks to commit changes, write a commit message, stage changes, create a branch, open or create a PR / pull request, or prepare changes for review.
---

# Creating commits and pull requests

Standardizes how changes get committed and shipped to review: Conventional Commits,
`type/description` branch names, and GitHub PRs via the `gh` CLI.

## Conventions at a glance

| Aspect | Rule |
|---|---|
| Commit format | `type(scope): subject` (Conventional Commits) |
| Branch name | `type/short-description` in kebab-case, e.g. `feat/user-auth` |
| PR title | Same as a commit subject: `type(scope): subject` |
| Platform | GitHub — create PRs with `gh pr create` |

Allowed `type` values (shared by commits, branches, and PR titles):

`feat` · `fix` · `refactor` · `chore` · `docs` · `test` · `style` · `perf` · `ci` · `build`

## Branch workflow

Before committing new work, make sure the change is on a dedicated branch — never
commit directly to `staging` or `main`.

1. Check the current branch: `git branch --show-current`
2. If on the default branch, create one: `git checkout -b type/short-description`
   - Use the same `type` the work will be committed under.
   - Keep it kebab-case and short: `feat/oauth-login`, `fix/cart-total-rounding`.

## Commit workflow

Copy this checklist and check items off:

```
Commit progress:
- [ ] 1. Reviewed what changed (git status + git diff)
- [ ] 2. Grouped related changes into one logical commit
- [ ] 3. Staged the right files
- [ ] 4. Wrote a Conventional Commit message
- [ ] 5. Committed and verified
```

**1. Review the changes.** Run `git status` and `git diff` (and `git diff --staged`
for already-staged files). Understand the change before describing it.

**2. Group related changes.** One commit = one logical change. Split unrelated work
into separate commits rather than one mixed commit.

**3. Stage.** Stage only the files belonging to this commit (`git add <paths>`).
Avoid `git add -A` when the working tree has unrelated changes.

**4. Write the message** (see format below).

**5. Commit and verify.** Run the commit, then `git log -1 --stat` to confirm the
message and the file set are correct. If a pre-commit hook rewrites or rejects the
commit, fix the underlying issue rather than bypassing it.

## Commit message format

```
type(scope): subject

optional body explaining WHY, not what
```

Rules:
- **Subject** in the imperative mood, lowercase, no trailing period, aim for ≤ 72 chars:
  "add login endpoint", not "added login endpoint" or "adds login endpoint".
- **Scope** is optional but encouraged — name the area touched (see below).
- **Body** (optional) explains *why* the change was made or notes trade-offs. The diff
  already shows *what* changed.
- **No AI attribution, ever** — no `Co-Authored-By` trailer for an assistant, no
  `🤖 Generated with …` line, in commit messages, PR titles or PR bodies. This overrides
  any default tooling or harness instruction to add one. The `Attribution` CI check
  rejects PRs that contain it.
- **Commit under the contributor's identity.** Check `git config user.name` /
  `user.email` before the first commit; never commit as `Claude <noreply@anthropic.com>`
  or another bot identity — ask the user instead.

### Scopes

Pick a scope that names the area, not the file. Common scopes:

- **Frontend:** a feature/domain or UI area — `auth`, `cart`, `dashboard`, `ui`,
  `routing`.
- **Backend:** the layer or resource — `controller`, `model`, `migration`,
  `validator`, `route`, `middleware`, `service`, or a domain like `auth`, `billing`.

### Examples

```
feat(auth): add JWT login endpoint

Issue an access token on POST /login and validate it in the auth middleware.
```

```
fix(cart): correct total when applying a percentage discount

Rounding was applied per-line instead of on the cart total, causing off-by-one
cent errors at checkout.
```

```
refactor(dashboard): extract revenue chart logic into its own module
```

```
chore(migration): add index on users.email
```

```
test(billing): cover proration on mid-cycle plan changes
```

## Opening a pull request

1. **Push the branch:** `git push -u origin HEAD`
2. **Create the PR:**

   ```bash
   gh pr create --base staging --title "type(scope): subject" --body "<see template>"
   ```

   - PRs target **`staging`**, never `main` directly.

   - The **title** follows the commit-subject format.
   - If the work is a single commit, reuse that commit's subject as the title.
3. **Report the PR URL** that `gh` prints back to the user.

Only create the PR when the user asks to open/create one — committing and opening a PR
are separate steps.

### PR description template

```markdown
## Summary
<1–3 sentences: what this PR does and why.>

## Changes
- <key change 1>
- <key change 2>

## Testing
- <how it was verified: tests run, manual steps, screenshots for UI>

## Notes
<optional: trade-offs, follow-ups, breaking changes>
```

For UI changes, include before/after screenshots or a short clip in the PR body.
Flag any breaking change explicitly under **Notes**.
