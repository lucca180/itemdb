#!/bin/bash
set -euo pipefail

# ---------------------------------------------------------------------------
# Cleanup script for RestockAuctionHistory
#
# Deletes ONE batch of old rows per invocation. Designed to be called by a
# cron job periodically so the deletion happens gradually, with zero impact
# on production traffic.
#
# Usage:
#   bash scripts/cleanup-restock-history.sh [--dry-run] [--days 365] [--batch 10000]
#
# Options:
#   --dry-run      Only show the row count that would be deleted, then exit.
#   --days N       Cutoff in days (default: 365). Must be >= 180 (code maximum).
#   --batch N      Rows to delete per run (default: 10000).
#
# ---------------------------------------------------------------------------

BATCH_SIZE=10000
CUTOFF_DAYS=365
DRY_RUN=false

# Parse arguments
while [[ $# -gt 0 ]]; do
  case "$1" in
    --dry-run) DRY_RUN=true; shift ;;
    --days)    CUTOFF_DAYS="$2"; shift 2 ;;
    --batch)   BATCH_SIZE="$2"; shift 2 ;;
    *) echo "Unknown option: $1"; exit 1 ;;
  esac
done

if [[ "$CUTOFF_DAYS" -lt 180 ]]; then
  echo "ERROR: --days must be >= 180 (production code queries up to 180 days back)."
  exit 1
fi

# ---------------------------------------------------------------------------
# Load .env
# ---------------------------------------------------------------------------
SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
ENV_FILE="$SCRIPT_DIR/../.env"

if [ ! -f "$ENV_FILE" ]; then
  echo ".env file not found at $ENV_FILE"
  exit 1
fi

# Extract DATABASE_URL safely without sourcing the whole .env
# Strips surrounding quotes and Windows CRLF line endings
DATABASE_URL=$(grep -E '^DATABASE_URL=' "$ENV_FILE" \
  | head -1 \
  | sed -E 's/^DATABASE_URL=//' \
  | tr -d '\r' \
  | sed -E 's/^["'"'"']|["'"'"']$//g')

if [ -z "${DATABASE_URL:-}" ]; then
  echo "DATABASE_URL not set in .env"
  exit 1
fi

# ---------------------------------------------------------------------------
# Parse DATABASE_URL  → mysql://user:password@host:3306/dbname
# ---------------------------------------------------------------------------
DB_USER=$(echo "$DATABASE_URL"     | sed -E 's#^mysql://([^:]+):.*#\1#')
DB_PASSWORD=$(echo "$DATABASE_URL" | sed -E 's#^mysql://[^:]+:([^@]+)@.*#\1#')
DB_HOST=$(echo "$DATABASE_URL"     | sed -E 's#^mysql://[^@]+@([^:/]+).*#\1#')
DB_PORT=$(echo "$DATABASE_URL"     | sed -E 's#^mysql://[^@]+@[^:/]+:([0-9]+)/.*#\1#')
DB_NAME=$(echo "$DATABASE_URL"     | sed -E 's#^mysql://[^@]+@[^/]+/([^?]+).*#\1#')

MYSQL_CMD="mysql --batch --skip-column-names -h$DB_HOST -P$DB_PORT -u$DB_USER -p$DB_PASSWORD $DB_NAME"

run_sql() {
  $MYSQL_CMD -e "$1" 2>/dev/null
}

# ---------------------------------------------------------------------------
# Compute cutoff date
# ---------------------------------------------------------------------------
CUTOFF_DATE=$(date -d "-${CUTOFF_DAYS} days" '+%Y-%m-%d %H:%M:%S' 2>/dev/null \
  || date -v-${CUTOFF_DAYS}d '+%Y-%m-%d %H:%M:%S')  # macOS fallback

TIMESTAMP=$(date '+%Y-%m-%d %H:%M:%S')

# ---------------------------------------------------------------------------
# Count remaining rows (informational)
# ---------------------------------------------------------------------------
REMAINING=$(run_sql "SELECT COUNT(*) FROM RestockAuctionHistory WHERE addedAt < '${CUTOFF_DATE}';")

echo "[${TIMESTAMP}] cutoff=${CUTOFF_DATE} | remaining=${REMAINING} | batch=${BATCH_SIZE}"

if [[ "$DRY_RUN" == "true" ]]; then
  echo "[${TIMESTAMP}] Dry-run mode — exiting without deleting."
  exit 0
fi

if [[ "$REMAINING" -eq 0 ]]; then
  echo "[${TIMESTAMP}] Nothing to delete."
  exit 0
fi

# ---------------------------------------------------------------------------
# Single batch DELETE
# ---------------------------------------------------------------------------
DELETED=$(run_sql "DELETE FROM RestockAuctionHistory WHERE addedAt < '${CUTOFF_DATE}' LIMIT ${BATCH_SIZE}; SELECT ROW_COUNT();" | tail -1)
DELETED=${DELETED:-0}

echo "[${TIMESTAMP}] deleted=${DELETED} | remaining_after=$((REMAINING - DELETED))"
