#!/usr/bin/env bash
# Wrapper to terminate node/jest servers on given ports before builds.
# Default targets: 8081 (app) and 8082 (test). Override by passing ports:
#   scripts/kill_port.sh 3000 4000
# To just list (dry-run), set DRY_RUN=1
set -euo pipefail
SCRIPT_DIR=$(cd -- "$(dirname -- "${BASH_SOURCE[0]}")" && pwd)
ROOT_DIR=$(cd "$SCRIPT_DIR/.." && pwd)
PORTS=("$@")
if [ ${#PORTS[@]} -eq 0 ]; then
  PORTS=(8081 8082)
fi
ARGS=()
for p in "${PORTS[@]}"; do
  ARGS+=(--port "$p")
done
if [ "${DRY_RUN:-}" = "1" ]; then
  echo "[kill_port] Dry run listing processes on: ${PORTS[*]}" >&2
  python "$SCRIPT_DIR/kill.py" "${ARGS[@]}"
else
  echo "[kill_port] Terminating listeners on: ${PORTS[*]}" >&2
  python "$SCRIPT_DIR/kill.py" "${ARGS[@]}" --kill || true
fi
