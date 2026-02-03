#!/bin/bash
set -euo pipefail

BASE_URL=${BASE_URL:-"http://localhost:5111"}
ENDPOINT=${ENDPOINT:-"/api/jobs"}
TOTAL_REQUESTS=${TOTAL_REQUESTS:-200}

declare -a IP_POOL=(
  "10.0.0.10"
  "10.0.0.11"
  "10.0.0.12"
  "10.0.0.13"
  "10.0.0.14"
  "10.0.0.15"
  "10.0.0.16"
  "10.0.0.17"
)

if [ -f ".env" ]; then
  set -a
  # shellcheck disable=SC1091
  . ./.env
  set +a
fi

if [ -z "${ADMIN_USERNAME:-}" ] || [ -z "${ADMIN_PASSWORD:-}" ]; then
  echo "[ERROR] ADMIN_USERNAME or ADMIN_PASSWORD not set in .env"
  exit 1
fi

login_payload=$(printf '{"username":"%s","password":"%s"}' "$ADMIN_USERNAME" "$ADMIN_PASSWORD")

token=$(curl -s "$BASE_URL/api/login" \
  -H "Content-Type: application/json" \
  -d "$login_payload" | \
  sed -n 's/.*"token":"\([^"]*\)".*/\1/p')

if [ -z "$token" ]; then
  echo "[ERROR] Failed to obtain auth token. Check credentials or BASE_URL."
  exit 1
fi

echo "[INFO] Testing rate limiter against $BASE_URL$ENDPOINT"

echo "[INFO] Sending $TOTAL_REQUESTS requests across ${#IP_POOL[@]} simulated IPs..."

accepted=0
rejected=0

for ((i=1; i<=TOTAL_REQUESTS; i++)); do
  ip=${IP_POOL[$(( (i-1) % ${#IP_POOL[@]} ))]}
  status=$(curl -s -o /dev/null -w "%{http_code}" \
    -H "Authorization: Bearer $token" \
    -H "X-Forwarded-For: $ip" \
    "$BASE_URL$ENDPOINT")

  if [ "$status" = "429" ]; then
    echo "[$i] $ip -> REJECTED (429)"
    ((rejected++))
  else
    echo "[$i] $ip -> ACCEPTED ($status)"
    ((accepted++))
  fi

done

echo ""
echo "[RESULTS] Accepted: $accepted | Rejected: $rejected"
