#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)"
cd "$ROOT_DIR"

if [ -z "${COMPOSE_PROJECT_NAME:-}" ]; then
  echo "[ERROR] COMPOSE_PROJECT_NAME is not set."
  exit 1
fi

COMPOSE_FILE="${COMPOSE_FILE_OVERRIDE:-docker-compose.ci.yml}"

# -------------------------------------------------
# Detect docker compose
# -------------------------------------------------
if docker compose version >/dev/null 2>&1; then
  DC="docker compose"
elif command -v docker-compose >/dev/null 2>&1; then
  DC="docker-compose"
else
  echo "[ERROR] Docker Compose not available."
  exit 1
fi

echo "[INFO] Using project: $COMPOSE_PROJECT_NAME"
echo "[INFO] Using compose file: $COMPOSE_FILE"

# -------------------------------------------------
# 🔥 Always clean previous stack
# -------------------------------------------------
echo "[INFO] Stopping previous CI stack (if exists)..."
$DC -f "$COMPOSE_FILE" -p "$COMPOSE_PROJECT_NAME" down --remove-orphans || true

# Optional: remove volumes (uncomment if needed)
# $DC -f "$COMPOSE_FILE" -p "$COMPOSE_PROJECT_NAME" down -v --remove-orphans || true

# -------------------------------------------------
# 🧹 Prune stale build cache to prevent tar corruption
# -------------------------------------------------
echo "[INFO] Pruning Docker build cache..."
docker builder prune -f --filter "until=72h" || true

# -------------------------------------------------
# 🚀 Start fresh stack (no-cache to avoid corrupt layers)
# -------------------------------------------------
echo "[INFO] Building images (no cache)..."
$DC -f "$COMPOSE_FILE" -p "$COMPOSE_PROJECT_NAME" build --no-cache

echo "[INFO] Starting fresh CI stack..."
$DC -f "$COMPOSE_FILE" -p "$COMPOSE_PROJECT_NAME" up -d

echo "[SUCCESS] Deployment complete."
