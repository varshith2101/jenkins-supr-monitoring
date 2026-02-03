#!/bin/bash
set -euo pipefail

COMPOSE_FILE="docker-compose.yml"
if [ "${USE_EXTERNAL_JENKINS:-}" = "1" ]; then
  COMPOSE_FILE="docker-compose.external-jenkins.yml"
fi

echo "[INFO] Using compose file: $COMPOSE_FILE"

echo "[INFO] Stopping containers (preserving volumes)..."
docker-compose -f "$COMPOSE_FILE" down

echo "[INFO] Rebuilding and starting containers..."
docker-compose -f "$COMPOSE_FILE" up --build -d

echo "[SUCCESS] Rebuild complete (database preserved)."
