#!/bin/bash
set -euo pipefail

# -------------------------------------------------
# macOS: ensure Docker is available and running
# -------------------------------------------------
if ! command -v docker >/dev/null 2>&1; then
  echo "[ERROR] Docker is not installed. Install Docker Desktop for Mac and try again."
  exit 1
fi

if ! docker info >/dev/null 2>&1; then
  echo "[ERROR] Docker daemon is not running. Start Docker Desktop and try again."
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

echo "[WARNING] This will remove volumes (database + Jenkins home)."
read -r -p "Type 'YES' to continue: " confirm
if [ "$confirm" != "YES" ]; then
  echo "[INFO] Aborted."
  exit 0
fi

echo "[INFO] Stopping containers and removing volumes..."
$DC -f "$COMPOSE_FILE" down -v

echo "[INFO] Rebuilding and starting containers..."
$DC -f "$COMPOSE_FILE" up --build -d

echo "[SUCCESS] Full rebuild complete (database reset)."
