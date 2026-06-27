#!/bin/bash
REPO_DIR="$(cd "$(dirname "$0")/.." && pwd)"
echo "Auto-activity started. Running every 3 minutes. Press Ctrl+C to stop."
while true; do
  echo "[$(date '+%Y-%m-%d %H:%M:%S')] Running generate-activity..."
  cd "$REPO_DIR" && npx tsx scripts/generate-activity.ts
  echo "[$(date '+%Y-%m-%d %H:%M:%S')] Done. Sleeping 3 minutes..."
  sleep 180
done
