#!/usr/bin/env bash
set -euo pipefail

# -------------------------------------------------
# Resolve project root
# -------------------------------------------------
ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)"
cd "$ROOT_DIR"

# -------------------------------------------------
# Validate required env
# -------------------------------------------------
if [ -z "${COMPOSE_PROJECT_NAME:-}" ]; then
  echo "[ERROR] COMPOSE_PROJECT_NAME is not set."
  exit 1
fi

# -------------------------------------------------
# Ensure Docker is available (macOS-safe)
# -------------------------------------------------
if ! command -v docker >/dev/null 2>&1; then
  DOCKER_DESKTOP_BIN="/Applications/Docker.app/Contents/Resources/bin"
  if [ -x "$DOCKER_DESKTOP_BIN/docker" ]; then
    export PATH="$DOCKER_DESKTOP_BIN:$PATH"
  else
    echo "[ERROR] Docker is not installed."
    exit 1
  fi
fi

if ! docker info >/dev/null 2>&1; then
  echo "[ERROR] Docker daemon is not running."
  exit 1
fi

# -------------------------------------------------
# Detect docker compose (v2 preferred)
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
COMPOSE_FILE="${COMPOSE_FILE_OVERRIDE:-docker-compose.ci.yml}"
REPORT_DIR="$ROOT_DIR/reports"

mkdir -p "$REPORT_DIR"

echo "[INFO] Using compose file: $COMPOSE_FILE"
echo "[INFO] Using compose command: $DC"
echo "[INFO] Running test container..."

# -------------------------------------------------
# Run tests
# -------------------------------------------------
$DC -f "$COMPOSE_FILE" -p "$COMPOSE_PROJECT_NAME" run --rm test_runner

echo "[INFO] Running UI test container..."
$DC -f "$COMPOSE_FILE" -p "$COMPOSE_PROJECT_NAME" run --rm ui_test_runner

echo "[SUCCESS] Tests completed."
