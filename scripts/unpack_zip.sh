#!/usr/bin/env bash
set -euo pipefail
ZIP_FILE=${1:-rntpy1_release.zip}
TARGET_DIR=${2:-deploy_rntpy1}

if [ ! -f "$ZIP_FILE" ]; then
  echo "Zip file $ZIP_FILE not found in current directory." >&2
  exit 1
fi

mkdir -p "$TARGET_DIR"
unzip -q "$ZIP_FILE" -d "$TARGET_DIR"

echo "✅ Unpacked to $TARGET_DIR"
echo "Next steps:"
echo "  cd $TARGET_DIR/backend && npm ci --omit=dev" 
echo "  PORT=8081 STATIC_DIR=../both/public node dist/app.js"