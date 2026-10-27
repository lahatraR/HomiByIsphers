#!/usr/bin/env bash
# Smoke test de Homi via l'ingress : front, health check et readiness de l'API.
# Usage : HOST=homi.localhost HTTP_PORT=80 infra/scripts/smoke-test.sh
set -euo pipefail

HOST="${HOST:-homi.localhost}"
HTTP_PORT="${HTTP_PORT:-80}"
RETRIES="${RETRIES:-30}"
BASE="http://${HOST}:${HTTP_PORT}"
# Résout l'hôte vers 127.0.0.1 sans toucher au fichier hosts
CURL=(curl -sS --max-time 10 --resolve "${HOST}:${HTTP_PORT}:127.0.0.1")

failures=0

# check <description> <chemin> <codes HTTP attendus (regex)> [motif attendu dans le corps]
check() {
  local name="$1" path="$2" expected_code="$3" pattern="${4:-}"
  local body code attempt
  for attempt in $(seq 1 "$RETRIES"); do
    body="$("${CURL[@]}" -w '\n%{http_code}' "${BASE}${path}" 2>/dev/null || true)"
    code="${body##*$'\n'}"
    body="${body%$'\n'*}"
    if [[ "$code" =~ ^(${expected_code})$ ]] && { [[ -z "$pattern" ]] || grep -q "$pattern" <<<"$body"; }; then
      echo "OK   ${name} (${path} -> ${code})"
      return 0
    fi
    sleep 2
  done
  echo "FAIL ${name} (${path} -> ${code:-aucune réponse}, attendu ${expected_code}${pattern:+ + '${pattern}'})"
  failures=$((failures + 1))
}

echo "Smoke test sur ${BASE}"
check "Redirection racine"     "/"                  302
check "Front (index.html)"     "/HomiByIsphers/"    200 "<div id=\"root\">"
check "Front (route SPA)"      "/HomiByIsphers/login" 200 "<div id=\"root\">"
check "API liveness"           "/api/health"        200 '"status":"ok"'
check "API readiness (BDD)"    "/api/health/ready"  200 '"database":"up"'
check "API route protégée"     "/api/tasks"         "401|403"

if (( failures > 0 )); then
  echo "${failures} vérification(s) en échec"
  exit 1
fi
echo "Tous les tests sont passés"
