#!/bin/bash
set -euo pipefail

# -------------------------------------------------
# Ensure Docker is available and running
# -------------------------------------------------
if ! command -v docker >/dev/null 2>&1; then
  echo "[ERROR] Docker is not installed."
  exit 1
fi

if ! docker info >/dev/null 2>&1; then
  echo "[ERROR] Docker daemon is not running."
  exit 1
fi

# -------------------------------------------------
# Detect docker compose (v2 preferred, v1 fallback)
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
