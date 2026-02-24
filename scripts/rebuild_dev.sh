#!/bin/bash
set -euo pipefail

# -------------------------------------------------
# Detect docker compose (v2 plugin preferred, v1 fallback)
# -------------------------------------------------
if docker compose version >/dev/null 2>&1; then
  DC="docker compose"
elif command -v docker-compose >/dev/null 2>&1; then
  DC="docker-compose"
else
  echo "[ERROR] Docker Compose is not available."
  exit 1
fi

# -------------------------------------------------
# Select compose file
# -------------------------------------------------
if [ -n "${COMPOSE_FILE_OVERRIDE:-}" ]; then
  COMPOSE_FILE="$COMPOSE_FILE_OVERRIDE"
else
  COMPOSE_FILE="docker-compose.yml"
  if [ "${USE_EXTERNAL_JENKINS:-}" = "1" ]; then
    COMPOSE_FILE="docker-compose.external-jenkins.yml"
  fi
fi

echo "[INFO] Using compose file: $COMPOSE_FILE"
echo "[INFO] Using compose command: $DC"

# -------------------------------------------------
# Stop containers (NO volume removal)
# -------------------------------------------------
echo "[INFO] Stopping containers (preserving volumes)..."
$DC -f "$COMPOSE_FILE" down

# -------------------------------------------------
# Build & start
# -------------------------------------------------
echo "[INFO] Rebuilding and starting containers..."
$DC -f "$COMPOSE_FILE" up --build -d

echo "[SUCCESS] Rebuild complete (database preserved)."
