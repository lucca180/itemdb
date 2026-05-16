#!/bin/bash
set -euo pipefail

# Load environment variables safely
if [ -f .env ]; then
  set -a
  . .env
  set +a
else
  echo ".env file not found!"
  exit 1
fi

# Required in .env:
# DATABASE_URL=mysql://user:password@host:3306/
# DATABASES="db1 db2 db3"
# BACKUP_DIR=/path/to/backups
# R2_BUCKET=your-r2-bucket

if [ -z "${DATABASE_URL:-}" ]; then
  echo "DATABASE_URL not set in .env"
  exit 1
fi

if [ -z "${DATABASES:-}" ]; then
  echo "DATABASES not set in .env"
  exit 1
fi

# Extract connection details from DATABASE_URL
DB_USER=$(echo "$DATABASE_URL" | sed -E 's#^mysql://([^:]+):.*@\S+#\1#')
DB_PASSWORD=$(echo "$DATABASE_URL" | sed -E 's#^mysql://[^:]+:([^@]+)@\S+#\1#')
DB_HOST=$(echo "$DATABASE_URL" | sed -E 's#^mysql://[^:]+:[^@]+@([^:/]+).*#\1#')
DB_PORT=$(echo "$DATABASE_URL" | sed -E 's#^mysql://[^:]+:[^@]+@[^:/]+:([0-9]+).*#\1#')

TODAY=$(date +"%Y-%m-%d")
FULL_BACKUP_DIR="$BACKUP_DIR/full"
INCR_BACKUP_DIR="$BACKUP_DIR/incremental"
LATEST_FILE="$BACKUP_DIR/latest_all"

mkdir -p "$FULL_BACKUP_DIR" "$INCR_BACKUP_DIR"

require_checkpoint() {
  local backup_path="$1"

  if [ -f "$backup_path/xtrabackup_checkpoints" ]; then
    return 0
  fi

  local backup_tar="$backup_path.tar.gz"
  if [ -f "$backup_tar" ]; then
    echo "Backup metadata missing at $backup_path; restoring local copy from $backup_tar..."
    tar -xzf "$backup_tar" -C "$(dirname "$backup_path")"
  fi

  if [ ! -f "$backup_path/xtrabackup_checkpoints" ]; then
    echo "Cannot use $backup_path as an incremental base."
    echo "Expected metadata file: $backup_path/xtrabackup_checkpoints"
    echo "Create a new full backup with: $0 rotate && $0"
    exit 1
  fi
}

delete_old_backup_dir() {
  local backup_path="$1"
  local current_path="$2"

  if [ "$backup_path" = "$current_path" ]; then
    return 0
  fi

  case "$backup_path" in
    "$FULL_BACKUP_DIR"/*|"$INCR_BACKUP_DIR"/*)
      if [ -d "$backup_path" ]; then
        echo "Deleting old local backup folder: $backup_path"
        rm -rf "$backup_path"
      fi
      ;;
  esac
}

# Function to upload to R2
upload_to_s3() {
  local file="$1"
  rclone copy "$file" "r2:$R2_BUCKET/$(basename "$file")" --progress
}

# Function to rotate all backups
rotate_backups() {
  echo "Rotating backups..."
  rm -rf "${FULL_BACKUP_DIR:?}"/* "${INCR_BACKUP_DIR:?}"/* "${LATEST_FILE:?}"
  echo "All backups rotated."
}

# Function to clean R2 bucket
clean_r2_bucket() {
  echo "Cleaning R2 bucket $R2_BUCKET..."
  rclone delete "r2:$R2_BUCKET"
  echo "R2 bucket cleaned."
}

# Check if user wants to rotate
if [[ "${1:-}" == "rotate" ]]; then
  rotate_backups
  exit 0
fi

# Run full backup if none exists
if [ ! -f "$LATEST_FILE" ]; then
  echo "No full backup found. Creating full backup..."
  FULL_PATH="$FULL_BACKUP_DIR/full-$TODAY"
  mariadb-backup \
    --backup \
    --target-dir="$FULL_PATH" \
    --user="$DB_USER" \
    --password="$DB_PASSWORD" \
    --host="$DB_HOST" \
    --port="$DB_PORT" \
    --databases="$DATABASES"

  echo "$FULL_PATH" > "$LATEST_FILE"
  
  echo "Backup ended, compacting..."
  tar -vczf "$FULL_PATH.tar.gz" -C "$FULL_BACKUP_DIR" "full-$TODAY"
  
  clean_r2_bucket
  upload_to_s3 "$FULL_PATH.tar.gz"
  echo "Full backup completed and uploaded."
  exit 0
fi

# Otherwise run incremental backup
LATEST_PATH=$(cat "$LATEST_FILE")
require_checkpoint "$LATEST_PATH"
echo "Running incremental backup based on $LATEST_PATH..."
INCR_PATH="$INCR_BACKUP_DIR/incr-$TODAY"

mariadb-backup \
  --backup \
  --target-dir="$INCR_PATH" \
  --incremental-basedir="$LATEST_PATH" \
  --user="$DB_USER" \
  --password="$DB_PASSWORD" \
  --host="$DB_HOST" \
  --port="$DB_PORT" \
  --databases="$DATABASES"
echo $?
echo $INCR_PATH
echo "$INCR_PATH" > "$LATEST_FILE"
echo "Backup ended, compacting..."
tar -vczf "$INCR_PATH.tar.gz" -C "$INCR_BACKUP_DIR" "incr-$TODAY"
upload_to_s3 "$INCR_PATH.tar.gz"
delete_old_backup_dir "$LATEST_PATH" "$INCR_PATH"
echo "Incremental backup completed and uploaded."
