#!/usr/bin/env bash
# Quick redeploy: rebuild backend (tsc) and frontend (HTML) without cleaning, stage to both, and restart if needed.
# Usage: scripts/fast.sh [env_mode]
# Examples:
#   scripts/fast.sh            # default env.local/.env, no restart
#   RESTART=1 scripts/fast.sh  # also restart the server on 8081
#   scripts/fast.sh prod       # use .env.prod for frontend build
set -euo pipefail
SCRIPT_DIR=$(cd -- "$(dirname -- "${BASH_SOURCE[0]}")" && pwd)
ROOT_DIR=$(cd "$SCRIPT_DIR/.." && pwd)
MODE="${1:-}"

# 1) Build backend quickly (no clean)
pushd "$ROOT_DIR/backend" >/dev/null
npm run build
popd >/dev/null

# 2) Build frontend + copy to both/public (reuse fastFront)
"$SCRIPT_DIR/fastFront.sh" "${MODE}"

# 3) Stage backend dist into both (no clean, just overwrite)
mkdir -p "$ROOT_DIR/both/dist"
cp -r "$ROOT_DIR/backend/dist"/* "$ROOT_DIR/both/dist/" 2>/dev/null || true

# Check if package.json changed to force reinstall
FORCE_INSTALL=""
if [ -f "$ROOT_DIR/both/package.json" ]; then
  if ! cmp -s "$ROOT_DIR/backend/package.json" "$ROOT_DIR/both/package.json"; then
    echo "[fast] package.json changed; will reinstall deps in both/"
    FORCE_INSTALL="1"
  fi
fi
cp -f "$ROOT_DIR/backend/package.json" "$ROOT_DIR/both/package.json"
# Keep lockfile in sync for prod deps if needed
cp -f "$ROOT_DIR/backend/package-lock.json" "$ROOT_DIR/both/package-lock.json" 2>/dev/null || true

# Install/reinstall prod deps if missing OR if package.json changed
if [ ! -d "$ROOT_DIR/both/node_modules" ] || [ "${FORCE_INSTALL}" = "1" ]; then
  if [ ! -d "$ROOT_DIR/both/node_modules" ]; then
    echo "[fast] Installing production deps in both/ (first run)"
  else
    echo "[fast] Reinstalling production deps in both/ (package.json changed)"
  fi
  pushd "$ROOT_DIR/both" >/dev/null
  if [ -f package-lock.json ]; then
    npm ci --omit=dev || npm install --omit=dev
  else
    npm install --omit=dev
  fi
  popd >/dev/null
fi
# Keep local dev certificates in both/cert for HTTPS when running from both/
if [ -d "$ROOT_DIR/backend/cert" ]; then
  mkdir -p "$ROOT_DIR/both/cert"
  cp -r "$ROOT_DIR/backend/cert"/* "$ROOT_DIR/both/cert/" 2>/dev/null || true
fi
# Keep existing node_modules in both/ (installed previously by all.sh)

# 4) Optionally restart
PORT=${PORT:-8081}
if [ "${RESTART:-}" = "1" ]; then
  echo "[fast] Restart requested. Killing port ${PORT}..."
  "$SCRIPT_DIR/kill_port.sh" "${PORT}" || true
  echo "[fast] Starting server from both/ (explicit restart)"
  (
    cd "$ROOT_DIR/both" && \
    if [ -f ../backend/.env ]; then set -a; source ../backend/.env; set +a; echo "[fast] Loaded ../backend/.env"; fi; \
    env="${env:-${ENV:-${MODE:-}}}" \
    PORT="${PORT}" STATIC_DIR=./public ALLOW_START_WITHOUT_DB=${ALLOW_START_WITHOUT_DB:-1} \
      node dist/app.js &
  )
else
  # Auto start if nothing is listening on PORT
  if ss -ltnp 2>/dev/null | grep -q ":${PORT} "; then
    echo "[fast] Server already running on port ${PORT}; no restart requested."
  else
    echo "[fast] No server detected on port ${PORT}; starting automatically."
    (
      cd "$ROOT_DIR/both" && \
      if [ -f ../backend/.env ]; then set -a; source ../backend/.env; set +a; echo "[fast] Loaded ../backend/.env"; fi; \
      env="${env:-${ENV:-${MODE:-}}}" \
      PORT="${PORT}" STATIC_DIR=./public ALLOW_START_WITHOUT_DB=${ALLOW_START_WITHOUT_DB:-1} \
        node dist/app.js &
    )
  fi
fi
