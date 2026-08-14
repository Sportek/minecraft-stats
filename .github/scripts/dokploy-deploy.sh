#!/usr/bin/env bash
#
# Déclenche un déploiement Dokploy et attend son issue réelle.
#
#   dokploy-deploy.sh compose     <composeId>
#   dokploy-deploy.sh application <applicationId>
#
# Variables requises : DOKPLOY_URL, DOKPLOY_API_TOKEN
# Optionnelles       : DOKPLOY_TIMEOUT (secondes, défaut 1800)
#                      DOKPLOY_POLL_INTERVAL (secondes, défaut 10)
#
# Pourquoi ce script existe : `compose.deploy` et `application.deploy` répondent
# 200 dès la *mise en file*, pas à la fin du build. Un `curl --fail` seul rend
# donc le job vert même quand rien n'est parti en production. C'est exactement
# ce qui a masqué 3 jours de panne en août 2026, quand un job mort d'un autre
# projet a bloqué la file partagée de Dokploy : GitHub affichait vert, les
# déploiements attendaient derrière un build figé.
#
# Identifier « son » déploiement n'est pas trivial : l'API ne renvoie pas
# l'identifiant créé, et Dokploy écrase le `title`/`description` qu'on lui passe
# par les informations réelles du commit — un marqueur unique ne survit pas au
# POST. On relève donc les identifiants existants avant de déclencher, puis on
# guette l'apparition d'un identifiant nouveau.

set -euo pipefail

KIND="${1:?usage: dokploy-deploy.sh <compose|application> <id>}"
ID="${2:?usage: dokploy-deploy.sh <compose|application> <id>}"

: "${DOKPLOY_URL:?DOKPLOY_URL manquant}"
: "${DOKPLOY_API_TOKEN:?DOKPLOY_API_TOKEN manquant}"
TIMEOUT="${DOKPLOY_TIMEOUT:-1800}"
INTERVAL="${DOKPLOY_POLL_INTERVAL:-10}"

case "$KIND" in
  compose)
    LIST_URL="${DOKPLOY_URL}/api/deployment.allByCompose?composeId=${ID}"
    DEPLOY_URL="${DOKPLOY_URL}/api/compose.deploy"
    PAYLOAD=$(jq -n --arg id "$ID" '{composeId: $id}')
    ;;
  application)
    LIST_URL="${DOKPLOY_URL}/api/deployment.all?applicationId=${ID}"
    DEPLOY_URL="${DOKPLOY_URL}/api/application.deploy"
    PAYLOAD=$(jq -n --arg id "$ID" '{applicationId: $id}')
    ;;
  *)
    echo "::error::type inconnu '${KIND}' (attendu: compose|application)"
    exit 1
    ;;
esac

api_get() {
  curl -sS --fail-with-body --max-time 30 \
    -H "Accept: application/json" \
    -H "x-api-key: ${DOKPLOY_API_TOKEN}" \
    "$1"
}

# L'API renvoie soit le tableau nu, soit une enveloppe {data: [...]}. On accepte
# les deux plutôt que de parier sur l'une : une mauvaise hypothèse ici ferait
# échouer tous les déploiements.
unwrap='if type == "object" and has("data") then .data else . end'

list_deployments() {
  local raw
  if ! raw=$(api_get "$LIST_URL"); then
    echo "::error::appel à ${LIST_URL%%\?*} en échec" >&2
    printf '%s\n' "$raw" >&2
    return 1
  fi
  if ! printf '%s' "$raw" | jq -e "${unwrap} | type == \"array\"" >/dev/null 2>&1; then
    echo "::error::réponse inattendue de ${LIST_URL%%\?*} — tableau de déploiements attendu." >&2
    echo "Réponse brute (500 premiers caractères) :" >&2
    printf '%s\n' "${raw:0:500}" >&2
    return 1
  fi
  printf '%s' "$raw" | jq -c "${unwrap}"
}

echo "Relevé des déploiements existants pour ${KIND} ${ID}…"
BEFORE=$(list_deployments | jq -c '[.[].deploymentId]')
echo "  $(printf '%s' "$BEFORE" | jq 'length') déploiement(s) déjà connu(s)"

echo "Déclenchement du déploiement…"
curl -sS --fail-with-body --max-time 30 \
  -X POST "$DEPLOY_URL" \
  -H "Accept: application/json" \
  -H "Content-Type: application/json" \
  -H "x-api-key: ${DOKPLOY_API_TOKEN}" \
  -d "$PAYLOAD"
echo

DEADLINE=$(( SECONDS + TIMEOUT ))
FOUND_ID=""
LAST_STATUS=""

while (( SECONDS < DEADLINE )); do
  sleep "$INTERVAL"

  CURRENT=$(list_deployments)

  if [[ -z "$FOUND_ID" ]]; then
    # Le plus récent des déploiements absents du relevé initial.
    FOUND_ID=$(printf '%s' "$CURRENT" | jq -r --argjson before "$BEFORE" '
      [ .[] | select(.deploymentId as $id | ($before | index($id)) | not) ]
      | sort_by(.createdAt)
      | last
      | .deploymentId // empty
    ')
    [[ -n "$FOUND_ID" ]] && echo "Déploiement identifié : ${FOUND_ID}"
    continue
  fi

  ENTRY=$(printf '%s' "$CURRENT" | jq -c --arg id "$FOUND_ID" '.[] | select(.deploymentId == $id)')
  STATUS=$(printf '%s' "$ENTRY" | jq -r '.status')

  if [[ "$STATUS" != "$LAST_STATUS" ]]; then
    echo "  statut : ${STATUS}"
    LAST_STATUS="$STATUS"
  fi

  case "$STATUS" in
    done)
      echo "::notice::Déploiement ${FOUND_ID} terminé avec succès."
      exit 0
      ;;
    error)
      echo "::error::Déploiement ${FOUND_ID} en échec."
      printf '%s' "$ENTRY" | jq -r '"  message : \(.errorMessage // "aucun")\n  logs    : \(.logPath // "aucun")"'
      exit 1
      ;;
  esac
done

echo "::error::Délai de ${TIMEOUT}s dépassé sans issue pour ${KIND} ${ID}."
if [[ -n "$FOUND_ID" ]]; then
  echo "Le déploiement ${FOUND_ID} est resté en '${LAST_STATUS}'. La file Dokploy est"
  echo "peut-être bloquée par un job figé : vérifier /api/deployment.queueList."
else
  echo "Aucun nouveau déploiement n'est apparu — la demande a été acceptée mais"
  echo "n'a jamais été prise en charge. Même piste : file d'attente bloquée."
fi
exit 1
