#!/usr/bin/env bash
set -euo pipefail
SCRIPT_DIR=$(cd -- "$(dirname -- "${BASH_SOURCE[0]}")" && pwd)
ROOT_DIR=$(cd "$SCRIPT_DIR/.." && pwd)

export STATIC_DIR="$ROOT_DIR/both/public"
export PORT=${PORT:-8081}
export ALLOW_START_WITHOUT_DB=1

bash "$SCRIPT_DIR/build_all.sh"

cd "$ROOT_DIR/backend"

# Ensure deps exist
if [ ! -d node_modules ]; then
  echo "==> Installing backend dependencies"
  npm install --no-fund --no-audit
fi

# Load backend env so GOOGLE_CLIENT_ID and others are available at runtime
if [ -f "$ROOT_DIR/backend/.env" ]; then
  set -a
  # shellcheck disable=SC1091
  source "$ROOT_DIR/backend/.env"
  set +a
  echo "==> Loaded $ROOT_DIR/backend/.env"
fi

echo "==> Starting backend on port $PORT (serving static from $STATIC_DIR)"
node dist/app.js