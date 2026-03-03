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
# Ensure Docker is available
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
# Detect docker compose (Engine plugin or standalone)
# -------------------------------------------------
# Add system plugin path in case Jenkins PATH doesn't include it
export PATH="/usr/libexec/docker/cli-plugins:/usr/lib/docker/cli-plugins:$PATH"

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

echo "[INFO] Using compose file: $COMPOSE_FILE"
echo "[INFO] Tearing down containers..."

# -------------------------------------------------
# Teardown (remove volumes + orphans)
# -------------------------------------------------
$DC -f "$COMPOSE_FILE" -p "$COMPOSE_PROJECT_NAME" down -v --remove-orphans

echo "[SUCCESS] Cleanup complete."
