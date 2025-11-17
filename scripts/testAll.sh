#!/usr/bin/env bash
set -euo pipefail
SCRIPT_DIR=$(cd -- "$(dirname -- "${BASH_SOURCE[0]}")" && pwd)
ROOT_DIR=$(cd "$SCRIPT_DIR/.." && pwd)

# Ensure local installs so tests/builds work locally
install_deps() {
  local dir=$1
  echo "==> Installing dependencies in $dir"
  pushd "$dir" >/dev/null
  if [ -f package-lock.json ]; then
    npm ci || npm install
  else
    npm install
  fi
  popd >/dev/null
}

install_deps "$ROOT_DIR/backend"
install_deps "$ROOT_DIR/frontend"

# Clean previous artifacts
rm -rf "$ROOT_DIR/both/public" || true
rm -rf "$ROOT_DIR/backend/dist" || true

# Run backend tests with coverage (Jest)
cd "$ROOT_DIR/backend"
npx jest --coverage --config jest.config.ts || true

# Build backend and frontend
cd "$ROOT_DIR"
"$SCRIPT_DIR/build_all.sh"

# Stage both/public already done by frontend build script

# Quick smoke: run from both via backend
if [ -f "$ROOT_DIR/backend/.env" ]; then
  set -a
  # shellcheck disable=SC1091
  source "$ROOT_DIR/backend/.env"
  set +a
  echo "==> Loaded $ROOT_DIR/backend/.env for test run"
fi
PORT=${PORT:-8081} STATIC_DIR="$ROOT_DIR/both/public" ALLOW_START_WITHOUT_DB=1 \
  node "$ROOT_DIR/backend/dist/app.js" &
SERVER_PID=$!
sleep 3
if lsof -nP -iTCP:$PORT | grep -q LISTEN; then
  echo "✅ Server listening on $PORT"
else
  echo "❌ Server did not start"
  kill $SERVER_PID 2>/dev/null || true
  exit 1
fi
kill $SERVER_PID 2>/dev/null || true

echo "✅ testAll completed"
