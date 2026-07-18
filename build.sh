#!/usr/bin/env bash
# Start the Dataverse landing page (Next.js dev server).
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
cd "$SCRIPT_DIR"

PID_FILE="$SCRIPT_DIR/.landing.pid"
LOG_FILE="$SCRIPT_DIR/.landing.log"
PORT="${PORT:-3000}"
NEXT_BIN="$SCRIPT_DIR/node_modules/.bin/next"

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

if command -v lsof >/dev/null 2>&1; then
  if lsof -tiTCP:"$PORT" -sTCP:LISTEN >/dev/null 2>&1; then
    echo "Error: port ${PORT} is already in use." >&2
    echo "Stop the other process, or use: PORT=3001 ./build.sh" >&2
    exit 1
  fi
fi

if [[ ! -f .env.local && -f .env.example ]]; then
  cp .env.example .env.local
  echo "Created .env.local from .env.example (edit DEMO_EMAIL / SITE_URL as needed)."
fi

if [[ ! -d node_modules || ! -x "$NEXT_BIN" ]]; then
  echo "Installing dependencies..."
  npm install
fi

if [[ ! -x "$NEXT_BIN" ]]; then
  echo "Error: next binary missing after npm install ($NEXT_BIN)." >&2
  exit 1
fi

: >"$LOG_FILE"
echo "Starting landing page on port ${PORT}..."
# Direct binary — avoids npx exiting early and losing the real pid.
nohup "$NEXT_BIN" dev -p "$PORT" >"$LOG_FILE" 2>&1 &
echo $! >"$PID_FILE"
pid="$(cat "$PID_FILE")"

# Wait until Ready, bind failure, or process death.
ready=0
for _ in $(seq 1 50); do
  if ! kill -0 "$pid" 2>/dev/null; then
    echo "Failed to start. Last log lines:" >&2
    tail -n 40 "$LOG_FILE" >&2 || true
    rm -f "$PID_FILE"
    exit 1
  fi
  if grep -qE "Ready in|Local:" "$LOG_FILE" 2>/dev/null; then
    ready=1
    break
  fi
  if grep -qE "EADDRINUSE|Error:" "$LOG_FILE" 2>/dev/null; then
    # Give the process a moment to exit; still report failure.
    sleep 0.3
    if ! kill -0 "$pid" 2>/dev/null; then
      echo "Failed to start. Last log lines:" >&2
      tail -n 40 "$LOG_FILE" >&2 || true
      rm -f "$PID_FILE"
      exit 1
    fi
  fi
  sleep 0.2
done

if [[ "$ready" -ne 1 ]]; then
  if ! kill -0 "$pid" 2>/dev/null; then
    echo "Failed to start. Last log lines:" >&2
    tail -n 40 "$LOG_FILE" >&2 || true
    rm -f "$PID_FILE"
    exit 1
  fi
  echo "Server process is up (pid $pid) but Ready banner not seen yet — check logs."
fi

# Resolve actual port if Next fell over to another (should not after pre-check).
actual_port="$PORT"
if grep -q "Local:" "$LOG_FILE" 2>/dev/null; then
  actual_port="$(grep -oE 'localhost:[0-9]+' "$LOG_FILE" | head -1 | cut -d: -f2 || echo "$PORT")"
fi

echo "Landing page started (pid $pid)."
echo "  URL:  http://localhost:${actual_port}"
echo "  Logs: $LOG_FILE"
echo "Stop with: ./stop.sh"
