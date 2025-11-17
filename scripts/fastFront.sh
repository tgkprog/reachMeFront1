#!/usr/bin/env bash
# Quick frontend refresh. With Vite this supports two modes:
#  - Dev server: scripts/fastFront.sh dev  (or set DEV=1 / FRONT_DEV=1)
#  - Build + stage: scripts/fastFront.sh [prod|local|...] (default if not dev)
# Does NOT clean node_modules or backend dist. Faster iteration.
# Example: scripts/fastFront.sh prod
set -euo pipefail
SCRIPT_DIR=$(cd -- "$(dirname -- "${BASH_SOURCE[0]}")" && pwd)
ROOT_DIR=$(cd "$SCRIPT_DIR/.." && pwd)
MODE="${1:-}"
DEV_REQUESTED="${DEV:-${FRONT_DEV:-}}"

# Source env (reuse logic from build_frontend.sh lightweight)
ENV_FILE=""
case "$MODE" in
  prod|production)
    for f in "$ROOT_DIR/backend/.env.prod" "$ROOT_DIR/backend/.env.production" "$ROOT_DIR/backend/.env"; do
      [ -f "$f" ] && ENV_FILE="$f" && break
    done
    ;;
  local|dev|development|"")
    for f in "$ROOT_DIR/backend/.env.local" "$ROOT_DIR/backend/.env"; do
      [ -f "$f" ] && ENV_FILE="$f" && break
    done
    ;;
  *)
    [ -f "$ROOT_DIR/backend/$MODE" ] && ENV_FILE="$ROOT_DIR/backend/$MODE"
    ;;
 esac
if [ -n "$ENV_FILE" ]; then
  echo "[fastFront] Using env file: $ENV_FILE"
  set -a; # shellcheck disable=SC1090
  source "$ENV_FILE"; set +a
fi

# If dev requested (by arg or env), run the Vite dev server and exit
if [ "$MODE" = "dev" ] || [ "$MODE" = "local" ] || [ "$MODE" = "development" ] || [ "${DEV_REQUESTED:-}" = "1" ]; then
  echo "[fastFront] Starting Vite dev server..."
  bash "$SCRIPT_DIR/run_vite_dev.sh"
  exit 0
fi

# Else perform a production build via the Vite build script which stages into both/public
echo "[fastFront] Building Vite app and staging to both/public..."
bash "$SCRIPT_DIR/build_frontend.sh" "${MODE}"

# Optionally restart or auto-start server
PORT=${PORT:-8081}
if [ "${RESTART:-}" = "1" ]; then
  echo "[fastFront] Restart requested. Killing port ${PORT}..."
  "$SCRIPT_DIR/kill_port.sh" "${PORT}" || true
  echo "[fastFront] Starting server (explicit restart)"
  (cd "$ROOT_DIR/both" && env="${env:-${ENV:-${MODE:-}}}" PORT=${PORT} STATIC_DIR=./public ALLOW_START_WITHOUT_DB=${ALLOW_START_WITHOUT_DB:-1} node dist/app.js &)
else
  if ss -ltnp 2>/dev/null | grep -q ":${PORT} "; then
    echo "[fastFront] Server already running on port ${PORT}; no restart requested."
  else
    if [ -f "$ROOT_DIR/both/dist/app.js" ]; then
      echo "[fastFront] No server on ${PORT}; starting automatically."
      (cd "$ROOT_DIR/both" && env="${env:-${ENV:-${MODE:-}}}" PORT=${PORT} STATIC_DIR=./public ALLOW_START_WITHOUT_DB=${ALLOW_START_WITHOUT_DB:-1} node dist/app.js &)
    else
      echo "[fastFront] Skipping auto-start: both/dist/app.js not found (build backend first)."
    fi
  fi
fi
