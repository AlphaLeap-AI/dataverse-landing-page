#!/usr/bin/env bash
# Stop the Dataverse landing page started by ./build.sh.
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
cd "$SCRIPT_DIR"

PID_FILE="$SCRIPT_DIR/.landing.pid"
PORT="${PORT:-3000}"

stopped=0

if [[ -f "$PID_FILE" ]]; then
  pid="$(cat "$PID_FILE" 2>/dev/null || true)"
  if [[ -n "${pid}" ]] && kill -0 "$pid" 2>/dev/null; then
    # Kill process group if possible so child next workers die too.
    kill "$pid" 2>/dev/null || true
    # Grace period, then force.
    for _ in 1 2 3 4 5; do
      if ! kill -0 "$pid" 2>/dev/null; then
        break
      fi
      sleep 0.2
    done
    if kill -0 "$pid" 2>/dev/null; then
      kill -9 "$pid" 2>/dev/null || true
    fi
    echo "Stopped landing page (pid $pid)."
    stopped=1
  else
    echo "Stale pid file (process not running)."
  fi
  rm -f "$PID_FILE"
fi

# Fallback: free the port if something Next-related is still bound.
if command -v lsof >/dev/null 2>&1; then
  pids="$(lsof -tiTCP:"$PORT" -sTCP:LISTEN 2>/dev/null || true)"
  if [[ -n "${pids}" ]]; then
    # Only kill processes whose command line looks like next/node for this app.
    for p in $pids; do
      cmd="$(ps -p "$p" -o args= 2>/dev/null || true)"
      if [[ "$cmd" == *next* ]] || [[ "$cmd" == *node* ]]; then
        kill "$p" 2>/dev/null || true
        sleep 0.2
        kill -9 "$p" 2>/dev/null || true
        echo "Freed port ${PORT} (pid $p)."
        stopped=1
      fi
    done
  fi
fi

if [[ "$stopped" -eq 0 ]]; then
  echo "Landing page was not running."
else
  echo "Done."
fi
