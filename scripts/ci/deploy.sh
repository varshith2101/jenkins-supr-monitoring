#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)"

COMPOSE_FILE_OVERRIDE="${COMPOSE_FILE_OVERRIDE:-docker-compose.ci.yml}"
export COMPOSE_FILE_OVERRIDE

if [ -z "${COMPOSE_PROJECT_NAME:-}" ]; then
  echo "[ERROR] COMPOSE_PROJECT_NAME is not set."
  exit 1
fi

OS_NAME="$(uname -s)"

if [ "$OS_NAME" = "Darwin" ]; then
  REBUILD_SCRIPT="$ROOT_DIR/mac_env/rebuild_dev.sh"
else
  REBUILD_SCRIPT="$ROOT_DIR/scripts/rebuild_dev.sh"
fi

if [ ! -f "$REBUILD_SCRIPT" ]; then
  echo "[ERROR] Rebuild script not found: $REBUILD_SCRIPT"
  exit 1
fi

cd "$ROOT_DIR"

bash "$REBUILD_SCRIPT"

