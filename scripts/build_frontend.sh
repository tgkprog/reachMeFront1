#!/usr/bin/env bash
set -euo pipefail
ROOT_DIR=$(cd -- "$(dirname -- "${BASH_SOURCE[0]}")/.." && pwd)
FRONT_DIR="$ROOT_DIR/frontend"
cd "$FRONT_DIR"

echo "==> Building frontend (Vite)"
# Decide which env file to load so GOOGLE_CLIENT_ID can be injected at build time
# Priority order:
#  - if env/ENV is prod|production -> .env.prod | .env.production | .env
#  - if env/ENV is local|dev|development -> .env.local | .env
#  - if env/ENV empty -> .env.local | .env
#  - if env/ENV matches a file name under backend/ -> that file
MODE="${env:-${ENV:-${1:-}}}"
ENV_FILE=""

case "${MODE}" in
	prod|production)
		for f in "$ROOT_DIR/backend/.env.prod" "$ROOT_DIR/backend/.env.production" "$ROOT_DIR/backend/.env"; do
			if [ -f "$f" ]; then ENV_FILE="$f"; break; fi
		done
		;;
	local|dev|development)
		for f in "$ROOT_DIR/backend/.env.local" "$ROOT_DIR/backend/.env"; do
			if [ -f "$f" ]; then ENV_FILE="$f"; break; fi
		done
		;;
	"")
		for f in "$ROOT_DIR/backend/.env.local" "$ROOT_DIR/backend/.env"; do
			if [ -f "$f" ]; then ENV_FILE="$f"; break; fi
		done
		;;
	*)
		if [ -f "$ROOT_DIR/backend/$MODE" ]; then
			ENV_FILE="$ROOT_DIR/backend/$MODE"
		fi
		;;
esac

if [ -n "$ENV_FILE" ]; then
	echo "==> Using env file: $ENV_FILE"
	set -a
	# shellcheck disable=SC1090
	source "$ENV_FILE"
	set +a
else
	echo "==> No env file found to source (mode: ${MODE:-default}). Continuing."
fi

# Provide a visible placeholder GOOGLE_CLIENT_ID if missing so Google button attempts to render
if [ -z "${GOOGLE_CLIENT_ID:-}" ]; then
		GOOGLE_CLIENT_ID="placeholder-google-client-id"
		export GOOGLE_CLIENT_ID
		echo "==> GOOGLE_CLIENT_ID not set; using placeholder for Vite build."
fi

# Ensure Vite deps
if [ ! -d node_modules ]; then
	echo "==> Installing Vite app dependencies"
	npm install
fi

# Generate .env.local for Vite with client id
VITE_ENV_FILE=".env.local"
echo "VITE_GOOGLE_CLIENT_ID=${VITE_GOOGLE_CLIENT_ID:-$GOOGLE_CLIENT_ID}" > "$VITE_ENV_FILE"
echo "==> Wrote $FRONT_DIR/$VITE_ENV_FILE"

# Build Vite app
npm run build

# Stage dist into both/public
mkdir -p "$ROOT_DIR/both/public"
rm -rf "$ROOT_DIR/both/public"/* 2>/dev/null || true
cp -r dist/* "$ROOT_DIR/both/public/"

echo "==> Vite build staged to both/public"