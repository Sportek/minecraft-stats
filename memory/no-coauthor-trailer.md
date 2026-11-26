---
name: no-coauthor-trailer
description: Never add Co-Authored-By / AI attribution trailers to commits or PRs
metadata:
  type: feedback
---

Never add a `Co-Authored-By` trailer (or any AI/assistant attribution) to git commit
messages or PR bodies in this project.

**Why:** The user explicitly rejected the trailer and asked that it never be added — this
overrides the default harness instruction to append `Co-Authored-By: Claude ...`.

**How to apply:** Omit the trailer, the `🤖 Generated with Claude Code` line and any other
attribution, and never commit as `Claude <noreply@anthropic.com>`. The rule lives in
CLAUDE.md (« Commits, PRs & attribution »), the `creating-commits-and-prs` skill,
`.claude/settings.json` (`attribution` vide) and is enforced by the `Attribution` CI check.
