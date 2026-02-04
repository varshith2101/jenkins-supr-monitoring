#!/usr/bin/env bash
set -euo pipefail

# -------------------------------------------------
# Configuration (defaults)
# -------------------------------------------------
BASE_URL="${BASE_URL:-http://localhost:5111}"
ENDPOINT="${ENDPOINT:-/api/jobs}"
TOTAL_REQUESTS="${TOTAL_REQUESTS:-200}"

IP_POOL=(
  10.0.0.10
  10.0.0.11
  10.0.0.12
  10.0.0.13
  10.0.0.14
  10.0.0.15
  10.0.0.16
  10.0.0.17
)

log() {
  printf '[%s] %s\n' "$(date -u +%Y-%m-%dT%H:%M:%SZ)" "$*"
}

err() {
  printf '[ERROR] %s\n' "$*" >&2
}

# -------------------------------------------------
# Load .env if present
# -------------------------------------------------
if [ -f ".env" ]; then
  log "Loading environment from .env"
  set -a
  # shellcheck disable=SC1091
  . ./.env
  set +a
fi

# -------------------------------------------------
# Validate credentials
# -------------------------------------------------
: "${ADMIN_USERNAME:?ADMIN_USERNAME not set}"
: "${ADMIN_PASSWORD:?ADMIN_PASSWORD not set}"

# -------------------------------------------------
# Authenticate
# -------------------------------------------------
log "Authenticating to $BASE_URL"

login_payload=$(printf \
  '{"username":"%s","password":"%s"}' \
  "$ADMIN_USERNAME" "$ADMIN_PASSWORD"
)

token="$(
  curl -fsS "$BASE_URL/api/login" \
    -H "Content-Type: application/json" \
    -d "$login_payload" \
  | sed -n 's/.*"token"[[:space:]]*:[[:space:]]*"\([^"]*\)".*/\1/p'
)"

if [ -z "$token" ]; then
  err "Failed to obtain auth token (check credentials or BASE_URL)"
  exit 1
fi

log "Authentication successful"

# -------------------------------------------------
# Rate limiter test
# -------------------------------------------------
log "Testing rate limiter: $BASE_URL$ENDPOINT"
log "Total requests: $TOTAL_REQUESTS"
log "Simulated IPs: ${#IP_POOL[@]}"

accepted=0
rejected=0

for ((i=1; i<=TOTAL_REQUESTS; i++)); do
  ip="${IP_POOL[$(( (i - 1) % ${#IP_POOL[@]} ))]}"

  status="$(
    curl -s -o /dev/null -w "%{http_code}" \
      -H "Authorization: Bearer $token" \
      -H "X-Forwarded-For: $ip" \
      "$BASE_URL$ENDPOINT" || echo "000"
  )"

  if [ "$status" = "429" ]; then
    printf '[%03d] %-12s -> REJECTED (429)\n' "$i" "$ip"
    ((rejected++))
  else
    printf '[%03d] %-12s -> ACCEPTED (%s)\n' "$i" "$ip" "$status"
    ((accepted++))
  fi
done

# -------------------------------------------------
# Results
# -------------------------------------------------
echo
log "RESULTS → Accepted: $accepted | Rejected: $rejected"
