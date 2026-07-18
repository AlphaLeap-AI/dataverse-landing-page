#!/usr/bin/env bash
# Stop the Dataverse landing page started by ./build.sh.
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
cd "$SCRIPT_DIR"

PID_FILE="$SCRIPT_DIR/.landing.pid"
PORT="${PORT:-3000}"

kill_tree() {
  local root="$1"
  local children
  children="$(pgrep -P "$root" 2>/dev/null || true)"
  for child in $children; do
    kill_tree "$child"
  done
  kill "$root" 2>/dev/null || true
}

force_kill_tree() {
  local root="$1"
  local children
  children="$(pgrep -P "$root" 2>/dev/null || true)"
  for child in $children; do
    force_kill_tree "$child"
  done
  kill -9 "$root" 2>/dev/null || true
}

stopped=0

if [[ -f "$PID_FILE" ]]; then
  pid="$(cat "$PID_FILE" 2>/dev/null || true)"
  if [[ -n "${pid}" ]] && kill -0 "$pid" 2>/dev/null; then
    kill_tree "$pid"
    for _ in 1 2 3 4 5 6 7 8 9 10; do
      if ! kill -0 "$pid" 2>/dev/null; then
        break
      fi
      sleep 0.2
    done
    if kill -0 "$pid" 2>/dev/null; then
      force_kill_tree "$pid"
    fi
    echo "Stopped landing page (pid $pid)."
    stopped=1
  else
    echo "Stale pid file (process not running)."
  fi
  rm -f "$PID_FILE"
fi

# Fallback: free PORT only if a next process we own is still listening.
if command -v lsof >/dev/null 2>&1; then
  pids="$(lsof -tiTCP:"$PORT" -sTCP:LISTEN 2>/dev/null || true)"
  if [[ -n "${pids}" ]]; then
    for p in $pids; do
      cmd="$(ps -p "$p" -o args= 2>/dev/null || true)"
      # Match Next for this app; avoid killing unrelated servers on the port.
      if [[ "$cmd" == *"$SCRIPT_DIR"* ]] || [[ "$cmd" == *next*dev* ]] || [[ "$cmd" == *next-server* ]]; then
        # Prefer only if cwd of process is this project (when available).
        cwd="$(lsof -a -p "$p" -d cwd -Fn 2>/dev/null | sed -n 's/^n//p' | head -1 || true)"
        if [[ -z "$cwd" || "$cwd" == "$SCRIPT_DIR"* ]]; then
          kill "$p" 2>/dev/null || true
          sleep 0.2
          kill -9 "$p" 2>/dev/null || true
          echo "Freed port ${PORT} (pid $p)."
          stopped=1
        fi
      fi
    done
  fi
fi

if [[ "$stopped" -eq 0 ]]; then
  echo "Landing page was not running."
else
  echo "Done."
fi
