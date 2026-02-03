#!/bin/sh
set -eu

BACKUP_DIR="/backups"
TIMESTAMP=$(date +%Y%m%d_%H%M%S)
BACKUP_FILE="$BACKUP_DIR/jenkins_monitoring_${TIMESTAMP}.sql.gz"
KEEP_COUNT="${BACKUP_KEEP_COUNT:-4}"

if [ -z "${POSTGRES_HOST:-}" ] || [ -z "${POSTGRES_DB:-}" ] || [ -z "${POSTGRES_USER:-}" ] || [ -z "${POSTGRES_PASSWORD:-}" ]; then
  echo "Missing required POSTGRES_* environment variables"
  exit 1
fi

mkdir -p "$BACKUP_DIR"

echo "[$(date -u +%Y-%m-%dT%H:%M:%SZ)] Starting backup..."
PGPASSWORD="$POSTGRES_PASSWORD" pg_dump -h "$POSTGRES_HOST" -U "$POSTGRES_USER" "$POSTGRES_DB" | gzip > "$BACKUP_FILE"
echo "[$(date -u +%Y-%m-%dT%H:%M:%SZ)] Backup created: $BACKUP_FILE"

if [ "$KEEP_COUNT" -gt 0 ]; then
  ls -t "$BACKUP_DIR"/jenkins_monitoring_*.sql.gz 2>/dev/null | tail -n +$((KEEP_COUNT + 1)) | xargs -r rm -f
fi

echo "[$(date -u +%Y-%m-%dT%H:%M:%SZ)] Backup rotation completed (keep: $KEEP_COUNT)"
