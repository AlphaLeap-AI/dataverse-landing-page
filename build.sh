#!/usr/bin/env bash
# Start the Dataverse landing page (Next.js dev server).
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
cd "$SCRIPT_DIR"

PID_FILE="$SCRIPT_DIR/.landing.pid"
LOG_FILE="$SCRIPT_DIR/.landing.log"
PORT="${PORT:-3000}"

if ! command -v npm >/dev/null 2>&1; then
  echo "Error: npm is not installed or not on PATH." >&2
  exit 1
fi

if [[ -f "$PID_FILE" ]]; then
  old_pid="$(cat "$PID_FILE" 2>/dev/null || true)"
  if [[ -n "${old_pid}" ]] && kill -0 "$old_pid" 2>/dev/null; then
    echo "Landing page already running (pid $old_pid)."
    echo "  URL:  http://localhost:${PORT}"
    echo "  Logs: $LOG_FILE"
    echo "Stop it with: ./stop.sh"
    exit 0
  fi
  rm -f "$PID_FILE"
fi

if [[ ! -f .env.local && -f .env.example ]]; then
  cp .env.example .env.local
  echo "Created .env.local from .env.example (edit DEMO_EMAIL / SITE_URL as needed)."
fi

if [[ ! -d node_modules ]]; then
  echo "Installing dependencies..."
  npm install
fi

echo "Starting landing page on port ${PORT}..."
# Run from local node_modules so PATH does not need a global next binary.
nohup npx --no-install next dev -p "$PORT" >"$LOG_FILE" 2>&1 &
echo $! >"$PID_FILE"

# Wait briefly for bind / crash
sleep 1
if ! kill -0 "$(cat "$PID_FILE")" 2>/dev/null; then
  echo "Failed to start. Last log lines:" >&2
  tail -n 40 "$LOG_FILE" >&2 || true
  rm -f "$PID_FILE"
  exit 1
fi

echo "Landing page started (pid $(cat "$PID_FILE"))."
echo "  URL:  http://localhost:${PORT}"
echo "  Logs: $LOG_FILE"
echo "Stop with: ./stop.sh"
