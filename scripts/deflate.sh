#!/usr/bin/env bash
# Flatten a release zip into ./b so that package.json is at ./b and static assets at ./b/public
# Usage: scripts/deflate.sh [path-to-zip]
set -euo pipefail
SCRIPT_DIR=$(cd -- "$(dirname -- "${BASH_SOURCE[0]}")" && pwd)
ROOT_DIR=$(cd "$SCRIPT_DIR/.." && pwd)
ZIP_FILE=${1:-"$ROOT_DIR/out/rntpy1_release.zip"}
TARGET_DIR="$ROOT_DIR/b"
STAGE_DIR="$ROOT_DIR/out/deflate_stage"

if [ ! -f "$ZIP_FILE" ]; then
  echo "Release zip not found at: $ZIP_FILE" >&2
  echo "Create it with: $ROOT_DIR/scripts/make_zip.sh" >&2
  exit 1
fi

# Clean target and stage
rm -rf "$TARGET_DIR" "$STAGE_DIR"
mkdir -p "$TARGET_DIR" "$STAGE_DIR"

# Unpack
unzip -q "$ZIP_FILE" -d "$STAGE_DIR"

# Move backend files (including package.json, dist, lockfiles) to target root
if [ ! -d "$STAGE_DIR/backend" ]; then
  echo "Zip does not contain backend/ directory as expected." >&2
  exit 1
fi
shopt -s dotglob
mv "$STAGE_DIR/backend"/* "$TARGET_DIR"/
shopt -u dotglob

# Bring static assets to ./b/public
if [ -d "$STAGE_DIR/both/public" ]; then
  mkdir -p "$TARGET_DIR/public"
  cp -r "$STAGE_DIR/both/public/"* "$TARGET_DIR/public/" || true
fi

# Create a convenience run script in ./b
cat > "$TARGET_DIR/run.sh" <<'RUN'
#!/usr/bin/env bash
set -euo pipefail
THIS_DIR=$(cd -- "$(dirname -- "${BASH_SOURCE[0]}")" && pwd)
cd "$THIS_DIR"

# Install production deps if not already installed
if [ ! -d node_modules ]; then
  if [ -f package-lock.json ]; then
    npm ci --omit=dev || npm install --omit=dev
  else
    npm install --omit=dev
  fi
fi

export PORT=${PORT:-8081}
export STATIC_DIR=${STATIC_DIR:-"$THIS_DIR/public"}
# export ALLOW_START_WITHOUT_DB=1  # uncomment for smoke runs without DB

exec node dist/app.js
RUN
chmod +x "$TARGET_DIR/run.sh"

# Clean stage
rm -rf "$STAGE_DIR"

cat <<EOF
✅ Deflated bundle into: $TARGET_DIR
Contents:
  - package.json at $TARGET_DIR/package.json
  - compiled app at $TARGET_DIR/dist/
  - static assets at $TARGET_DIR/public/
  - run script at $TARGET_DIR/run.sh

To run:
  "$TARGET_DIR/run.sh"
EOF
