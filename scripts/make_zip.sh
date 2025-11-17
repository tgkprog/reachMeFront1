#!/usr/bin/env bash
set -euo pipefail
SCRIPT_DIR=$(cd -- "$(dirname -- "${BASH_SOURCE[0]}")" && pwd)
ROOT_DIR=$(cd "$SCRIPT_DIR/.." && pwd)
OUT_DIR="$ROOT_DIR/out"
ZIP_FILE="$OUT_DIR/rntpy1_release.zip"

rm -rf "$OUT_DIR"
mkdir -p "$OUT_DIR"

# Stage release structure
STAGE="$OUT_DIR/stage"
mkdir -p "$STAGE/both/public"
mkdir -p "$STAGE/backend"

# Build both sides
bash "$SCRIPT_DIR/build_all.sh"

# Copy staged artifacts
cp -r "$ROOT_DIR/both/public" "$STAGE/both/"
cp -r "$ROOT_DIR/backend/dist" "$STAGE/backend/"
cp "$ROOT_DIR/backend/package.json" "$STAGE/backend/"
cp "$ROOT_DIR/backend/package-lock.json" "$STAGE/backend/" 2>/dev/null || true

# Create README for release
cat > "$STAGE/README.md" <<'README'
Deployment bundle for rntpy1

Contents:
- both/public          Static frontend assets
- backend/dist         Compiled Node.js backend
- backend/package.json NPM manifest

Run on target host:
  cd backend
  npm ci --omit=dev
  PORT=${PORT:-8081} STATIC_DIR="../both/public" node dist/app.js

README

cd "$STAGE"
zip -r "$ZIP_FILE" . >/dev/null

echo "✅ Created $ZIP_FILE"