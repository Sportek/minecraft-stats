#!/usr/bin/env bash
# Refuse toute attribution à un assistant IA dans une PR : trailer Co-Authored-By,
# mention « Generated with … », emoji 🤖, ou commit dont l'auteur est l'assistant.
# Mentionner un outil dans le contenu (ex. « mettre à jour CLAUDE.md ») reste permis.
#
# Variables attendues : BASE_SHA, HEAD_SHA, PR_TITLE, PR_BODY.
set -euo pipefail

tools='claude|anthropic|copilot|cursor|chatgpt|openai|codex|gemini'
patterns=(
  "co-authored-by:.*(${tools})"
  "generated (with|by) .*(${tools})"
  '🤖'
  '@anthropic\.com'
)

failures=0

check_text() {
  local where="$1" text="$2" pattern
  for pattern in "${patterns[@]}"; do
    if grep -qiE -- "$pattern" <<<"$text"; then
      echo "::error::${where} : attribution IA détectée (motif « ${pattern} »)"
      failures=$((failures + 1))
    fi
  done
}

check_text "Titre de la PR" "${PR_TITLE:-}"
check_text "Description de la PR" "${PR_BODY:-}"

while read -r sha; do
  short="${sha:0:7}"
  check_text "Commit ${short} (message)" "$(git log -1 --format=%B "$sha")"

  identity="$(git log -1 --format='%an <%ae>%n%cn <%ce>' "$sha")"
  if grep -qiE -- "^(${tools})( agent)? <|@anthropic\.com" <<<"$identity"; then
    echo "::error::Commit ${short} : auteur ou committer IA (${identity//$'\n'/ / }). Recommite sous ton identité git."
    failures=$((failures + 1))
  fi
done < <(git rev-list "${BASE_SHA}..${HEAD_SHA}")

if ((failures > 0)); then
  echo "${failures} problème(s). Voir la section « Commits, PRs et attribution » de CLAUDE.md."
  exit 1
fi
echo "Aucune attribution IA détectée."
