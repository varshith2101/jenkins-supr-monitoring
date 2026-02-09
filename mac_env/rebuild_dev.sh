#!/bin/bash
set -euo pipefail

# -------------------------------------------------
# macOS: ensure Docker is available and running
# -------------------------------------------------
if ! command -v docker >/dev/null 2>&1; then
  DOCKER_DESKTOP_BIN="/Applications/Docker.app/Contents/Resources/bin"
  if [ -x "$DOCKER_DESKTOP_BIN/docker" ]; then
    export PATH="$DOCKER_DESKTOP_BIN:$PATH"
  else
    echo "[ERROR] Docker is not installed. Install Docker Desktop for Mac and try again."
    exit 1
  fi
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
