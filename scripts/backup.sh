#!/bin/sh
set -eu

# -------------------------------------------------
# Configuration
# -------------------------------------------------
BACKUP_DIR="${BACKUP_DIR:-/backups}"
KEEP_COUNT="${BACKUP_KEEP_COUNT:-4}"
TIMESTAMP="$(date -u +%Y%m%d_%H%M%S)"
BACKUP_FILE="$BACKUP_DIR/jenkins_monitoring_${TIMESTAMP}.sql.gz"

log() {
  printf '[%s] %s\n' "$(date -u +%Y-%m-%dT%H:%M:%SZ)" "$*"
}

# -------------------------------------------------
# Validate environment
# -------------------------------------------------
REQUIRED_VARS="POSTGRES_HOST POSTGRES_DB POSTGRES_USER POSTGRES_PASSWORD"

for var in $REQUIRED_VARS; do
  if [ -z "$(eval "printf '%s' \"\${$var:-}\"")" ]; then
    echo "ERROR: Missing required environment variable: $var" >&2
    exit 1
  fi
done

# -------------------------------------------------
# Prepare backup directory
# -------------------------------------------------
mkdir -p "$BACKUP_DIR"

# -------------------------------------------------
# Run backup
# -------------------------------------------------
log "Starting PostgreSQL backup..."

PGPASSWORD="$POSTGRES_PASSWORD" \
pg_dump \
  -h "$POSTGRES_HOST" \
  -U "$POSTGRES_USER" \
  "$POSTGRES_DB" \
| gzip > "$BACKUP_FILE"

log "Backup created: $BACKUP_FILE"

# -------------------------------------------------
# Rotate old backups
# -------------------------------------------------
if [ "$KEEP_COUNT" -gt 0 ]; then
  log "Rotating backups (keeping last $KEEP_COUNT)..."

  # List newest first, remove anything beyond KEEP_COUNT
  ls -1t "$BACKUP_DIR"/jenkins_monitoring_*.sql.gz 2>/dev/null \
  | tail -n +"$((KEEP_COUNT + 1))" \
  | xargs -r rm -f || true
fi

log "Backup rotation completed"
