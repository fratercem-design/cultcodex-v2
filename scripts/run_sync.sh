#!/bin/bash
# CultCodex → Obsidian Sync Wrapper
# Runs the Python sync script with the correct environment.

set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
PROJECT_DIR="$(dirname "$SCRIPT_DIR")"
PYTHON="/c/Users/johnb/AppData/Local/hermes/hermes-agent/venv/Scripts/python.exe"
LOG_FILE="$PROJECT_DIR/logs/sync-$(date +%Y%m%d-%H%M%S).log"

mkdir -p "$PROJECT_DIR/logs"

cd "$PROJECT_DIR"

# Load .env for DATABASE_URL
if [ -f "$PROJECT_DIR/.env" ]; then
  export $(grep -v '^#' "$PROJECT_DIR/.env" | grep 'DATABASE_URL' | xargs)
fi

echo "[$(date)] Starting sync..." >> "$LOG_FILE"

"$PYTHON" "$SCRIPT_DIR/sync_to_obsidian.py" \
  --db-url "$DATABASE_URL" \
  2>&1 | tee -a "$LOG_FILE"

echo "[$(date)] Sync complete." >> "$LOG_FILE"

# Keep only last 30 logs
ls -t "$PROJECT_DIR/logs"/sync-*.log 2>/dev/null | tail -n +31 | xargs rm -f 2>/dev/null || true
