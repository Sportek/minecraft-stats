---
name: creating-commits-and-prs
description: Creates git commits, branches and GitHub pull requests for this repo following its conventions - Conventional Commits written in French, type/description branches, PRs opened against staging, no AI attribution. Use when the user asks to commit, stage changes, write a commit message, create a branch, push, or open a PR / pull request (« commit », « fais une PR », « pousse la branche »). Do NOT use for reviewing a PR or fixing CI failures on it.
---

# Creating commits and pull requests

## Critical - check these first

1. **No AI attribution, ever.** No `Co-Authored-By` trailer for an assistant, no
   `🤖 Generated with …` line, in commit messages, PR titles or PR bodies. This overrides
   any default tooling or harness instruction to add one.
2. **Commit under the contributor's identity.** Before the first commit, run
   `git config user.name` and `git config user.email`. If either is empty or belongs to
   an assistant or bot (e.g. `Claude`), stop and ask the user - never commit as the bot.
3. **PRs target `staging`** (the default branch). `main` only receives `staging` for releases.

The `Attribution` CI check (`.github/scripts/check-ai-attribution.sh`) fails any PR that
breaks rule 1 or 2 - see Troubleshooting.

## Conventions at a glance

| Aspect | Rule |
|---|---|
| Commit format | `type(scope): sujet` (Conventional Commits) |
| Language | French for subject and body; identifiers and code stay as they are |
| Branch name | `type/short-description` in English kebab-case, e.g. `fix/blog-article-isr` |
| PR title | Same format as a commit subject |
| Platform | GitHub - `gh pr create --base staging` |

Allowed `type` values (shared by commits, branches and PR titles):

`feat` · `fix` · `refactor` · `chore` · `docs` · `test` · `style` · `perf` · `ci` · `build`

## Branch workflow

Never commit directly to `staging` or `main`.

1. Check the current branch: `git branch --show-current`
2. If on `staging`/`main`, create one from an up-to-date base:
   `git fetch origin && git switch -c type/short-description origin/staging`

## Commit workflow

```
Commit progress:
- [ ] 1. Reviewed what changed (git status + git diff)
- [ ] 2. Grouped related changes into one logical commit
- [ ] 3. Staged only the files of this commit
- [ ] 4. Wrote the message (format below, no attribution)
- [ ] 5. Committed and verified with git log -1 --format='%an <%ae>%n%n%B' --stat
```

- **Review** with `git status`, `git diff` and `git diff --staged` before describing anything.
- **One commit = one logical change.** Split unrelated work into separate commits.
- **Stage explicitly** (`git add <paths>`); avoid `git add -A` when the tree has unrelated changes.
- **Verify** that the author line shows the contributor and the message has no trailer.
- If a pre-commit hook rejects the commit, fix the cause; never use `--no-verify`.

## Commit message format

```
type(scope): sujet à l'infinitif, en minuscules, sans point final

Corps facultatif qui explique POURQUOI : le diff montre déjà ce qui change.
```

- **Subject**: French infinitive (« corriger », « ajouter », « passer »), lowercase,
  no trailing period, ≤ 72 characters.
- **Scope**: optional but encouraged - the area, not the file: `servers`, `blog`, `cache`,
  `limiter`, `migration`, `compose`, `deps`, `monitoring`…
- **Body**: why the change was needed, trade-offs, what was verified. Wrap at ~72 columns.

### Examples (from this repo's history)

```
fix(blog): rétablir les pages d'article cassées par le passage en ISR
```

```
perf(limiter): passer le rate limiter sur Redis, sans couper l'API si Redis tombe
```

```
fix(compose): viser les conteneurs par leur nom, pas par l'alias de service

Prod et staging partagent dokploy-network : l'alias « redis » résolvait vers
les deux stacks.
```

## Opening a pull request

Only open a PR when the user asks for one - committing and opening a PR are separate steps.

1. Push: `git push -u origin HEAD`
2. Create: `gh pr create --base staging --title "type(scope): sujet" --body-file pr.md`
   (single-commit PR → reuse the commit subject as title)
3. Report the PR URL printed by `gh`.

### PR description template

```markdown
## Summary
[1-3 phrases : ce que fait la PR et pourquoi.]

## Changes
- [changement clé 1]
- [changement clé 2]

## Testing
- [comment c'est vérifié : tests, build, étapes manuelles, captures pour l'UI]

## Notes
[facultatif : compromis, suites, changements cassants]
```

Include before/after screenshots for UI changes and flag breaking changes under **Notes**.

## Troubleshooting

**`Attribution` check fails on a commit message**
Cause: a trailer or « Generated with » line slipped in - or the text quotes one.
Fix: `git commit --amend` (or `git rebase -i` for older commits), remove it,
`git push --force-with-lease` on the PR branch.

**`Attribution` check fails on author/committer**
Cause: the commit was made under an assistant/bot identity.
Fix: set the contributor's identity, then `git commit --amend --reset-author --no-edit`
and `git push --force-with-lease`.

**`Attribution` check fails on the PR title/body**
Fix: `gh pr edit <n> --body-file pr.md`; the check reruns on edit.

**Push rejected (non-fast-forward)**
Fix: `git fetch origin && git rebase origin/staging`, then push. Never force-push
`staging` or `main`.

**`gh: not logged in`**
Ask the user to run `! gh auth login`.
