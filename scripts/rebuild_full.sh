#!/bin/bash
set -euo pipefail

if [ -n "${COMPOSE_FILE_OVERRIDE:-}" ]; then
  COMPOSE_FILE="$COMPOSE_FILE_OVERRIDE"
else
  COMPOSE_FILE="docker-compose.yml"
  if [ "${USE_EXTERNAL_JENKINS:-}" = "1" ]; then
    COMPOSE_FILE="docker-compose.external-jenkins.yml"
  fi
fi

echo "[INFO] Using compose file: $COMPOSE_FILE"

echo "[WARNING] This will remove volumes (database + Jenkins home)."
read -r -p "Type 'YES' to continue: " confirm
if [ "$confirm" != "YES" ]; then
  echo "[INFO] Aborted."
  exit 0
fi

echo "[INFO] Stopping containers and removing volumes..."
docker compose -f "$COMPOSE_FILE" down -v

echo "[INFO] Rebuilding and starting containers..."
docker compose -f "$COMPOSE_FILE" up --build -d

echo "[SUCCESS] Full rebuild complete (database reset)."
