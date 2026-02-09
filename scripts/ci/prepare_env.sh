#!/usr/bin/env bash
set -euo pipefail

ENV_FILE_PATH="${1:-}"

if [ -z "$ENV_FILE_PATH" ]; then
  echo "[ERROR] No .env file provided."
  exit 1
fi

if [ ! -f "$ENV_FILE_PATH" ]; then
  echo "[ERROR] .env file not found at: $ENV_FILE_PATH"
  exit 1
fi

cp "$ENV_FILE_PATH" .env

echo "[INFO] .env file loaded into workspace."
