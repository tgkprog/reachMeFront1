#!/usr/bin/env bash
# Start the Vite dev server for the Vue app on port 5173 and inject VITE_GOOGLE_CLIENT_ID from backend/.env
set -euo pipefail
SCRIPT_DIR=$(cd -- "$(dirname -- "${BASH_SOURCE[0]}")" && pwd)
ROOT_DIR=$(cd "$SCRIPT_DIR/.." && pwd)
APP_DIR="$ROOT_DIR/frontend"

pushd "$APP_DIR" >/dev/null
if [ -f "$ROOT_DIR/backend/.env" ]; then
  set -a
  # shellcheck disable=SC1091
  source "$ROOT_DIR/backend/.env"
  set +a
  echo "==> Loaded $ROOT_DIR/backend/.env into Vite dev env"
fi

# Create/overwrite .env.local for Vite with Google Client ID
echo "VITE_GOOGLE_CLIENT_ID=${VITE_GOOGLE_CLIENT_ID:-${GOOGLE_CLIENT_ID:-}}" > .env.local

if [ ! -d node_modules ]; then
  echo "==> Installing Vite app dependencies"
  npm install
fi

# Run Vite dev server
npm run dev
popd >/dev/null
