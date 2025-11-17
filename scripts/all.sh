#!/usr/bin/env bash
set -euo pipefail
SCRIPT_DIR=$(cd -- "$(dirname -- "${BASH_SOURCE[0]}")" && pwd)
ROOT_DIR=$(cd "$SCRIPT_DIR/.." && pwd)

# Pre-emptively free default dev/test ports (8081,8082) before build/run
"$SCRIPT_DIR/kill_port.sh" || true

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

# Ensure local installs so everything runs in local
install_deps "$ROOT_DIR/backend"
# Vite app deps
if [ -d "$ROOT_DIR/frontend" ]; then install_deps "$ROOT_DIR/frontend"; fi

rm -rf "$ROOT_DIR/both/public" || true
rm -rf "$ROOT_DIR/backend/dist" || true

"$SCRIPT_DIR/build_all.sh" "$@"

# Assemble runnable folder in rntpy1/both (copy backend runtime there)
echo "==> Assembling runnable app in both/"
rm -rf "$ROOT_DIR/both/dist" || true
cp -r "$ROOT_DIR/backend/dist" "$ROOT_DIR/both/dist"
cp "$ROOT_DIR/backend/package.json" "$ROOT_DIR/both/package.json"
cp "$ROOT_DIR/backend/package-lock.json" "$ROOT_DIR/both/package-lock.json" 2>/dev/null || true
# Copy local dev certificates if present so HTTPS can run when starting from both/
if [ -d "$ROOT_DIR/backend/cert" ]; then
  rm -rf "$ROOT_DIR/both/cert" || true
  cp -r "$ROOT_DIR/backend/cert" "$ROOT_DIR/both/cert"
fi

# Install production deps in both/
pushd "$ROOT_DIR/both" >/dev/null
if [ -f package-lock.json ]; then
  npm ci --omit=dev || npm install --omit=dev
else
  npm install --omit=dev
fi
popd >/dev/null

# Create or update release zip for upload
"$SCRIPT_DIR/make_zip.sh"
cp -f "$ROOT_DIR/out/rntpy1_release.zip" "$ROOT_DIR/rntpy1_release.zip" 2>/dev/null || true
echo "==> Release zip available at: $ROOT_DIR/out/rntpy1_release.zip and $ROOT_DIR/rntpy1_release.zip"

# Run locally from within rntpy1/both
echo "==> Starting app from rntpy1/both"
pushd "$ROOT_DIR/both" >/dev/null
# Load backend env so GOOGLE_CLIENT_ID and others are available at runtime
if [ -f "../backend/.env" ]; then
  set -a
  # shellcheck disable=SC1091
  source "../backend/.env"
  set +a
  echo "==> Loaded ../backend/.env"
fi
PORT=${PORT:-8081} STATIC_DIR="./public" ALLOW_START_WITHOUT_DB=1 \
  node dist/app.js
popd >/dev/null
