#!/usr/bin/env bash
# Cleanup script: Migrate Vite app from my-vue-app/ to frontend/ root, remove legacy files
# This replaces the old frontend structure with the new Vite app
set -euo pipefail

SCRIPT_DIR=$(cd -- "$(dirname -- "${BASH_SOURCE[0]}")" && pwd)
ROOT_DIR=$(cd "$SCRIPT_DIR/.." && pwd)
FRONTEND_DIR="$ROOT_DIR/frontend"
VUE_APP_DIR="$FRONTEND_DIR/my-vue-app"

echo "[cl1] Frontend cleanup: migrating Vite app to frontend/ root"

# Safety check
if [ ! -d "$VUE_APP_DIR" ]; then
  echo "ERROR: $VUE_APP_DIR does not exist. Aborting."
  exit 1
fi

# 1) Copy any assets from legacy frontend/src that might be needed
if [ -d "$FRONTEND_DIR/src" ]; then
  echo "[cl1] Copying assets from frontend/src to my-vue-app/public"
  # Copy image assets to Vite public directory
  for file in "$FRONTEND_DIR/src"/*; do
    if [ -f "$file" ]; then
      filename=$(basename "$file")
      # Don't overwrite if already exists in my-vue-app/public
      if [ ! -f "$VUE_APP_DIR/public/$filename" ]; then
        echo "  - Copying $filename"
        cp "$file" "$VUE_APP_DIR/public/"
      else
        echo "  - Skipping $filename (already exists in my-vue-app/public)"
      fi
    fi
  done
fi

# 2) Copy any other needed files from frontend/ parent (excluding my-vue-app)
# (Currently nothing needed - package.json is legacy, scripts are deprecated)
echo "[cl1] Checking for other files to preserve..."
# If we had .gitignore or other config at frontend level, we'd copy here

# 3) Create a backup of current frontend (optional safety measure)
BACKUP_DIR="$ROOT_DIR/.frontend_backup_$(date +%s)"
echo "[cl1] Creating backup at $BACKUP_DIR"
mkdir -p "$BACKUP_DIR"
for item in "$FRONTEND_DIR"/*; do
  itemname=$(basename "$item")
  if [ "$itemname" != "my-vue-app" ]; then
    cp -r "$item" "$BACKUP_DIR/" 2>/dev/null || true
  fi
done

# 4) Delete everything in frontend/ except my-vue-app/
echo "[cl1] Removing legacy frontend files (keeping my-vue-app)"
for item in "$FRONTEND_DIR"/*; do
  itemname=$(basename "$item")
  if [ "$itemname" != "my-vue-app" ]; then
    echo "  - Removing $itemname"
    rm -rf "$item"
  fi
done

# 5) Move everything from my-vue-app/ to frontend/
echo "[cl1] Moving my-vue-app/* to frontend/"
shopt -s dotglob nullglob
for item in "$VUE_APP_DIR"/*; do
  itemname=$(basename "$item")
  # Skip . and ..
  if [ "$itemname" = "." ] || [ "$itemname" = ".." ]; then
    continue
  fi
  echo "  - Moving $itemname"
  mv "$item" "$FRONTEND_DIR/"
done
shopt -u dotglob nullglob

# 6) Remove now-empty my-vue-app directory
echo "[cl1] Removing empty my-vue-app directory"
rmdir "$VUE_APP_DIR" || {
  echo "WARNING: my-vue-app is not empty. Contents:"
  ls -la "$VUE_APP_DIR"
  exit 1
}

echo "[cl1] ✓ Migration complete!"
echo "[cl1] Vite app is now at: $FRONTEND_DIR"
echo "[cl1] Backup of old files: $BACKUP_DIR"
echo ""
echo "Next steps:"
echo "  1. Update scripts/build_frontend.sh to use frontend/ instead of frontend/my-vue-app"
echo "  2. Update scripts/run_vite_dev.sh to use frontend/ instead of frontend/my-vue-app"
echo "  3. Update scripts/all.sh FRONTEND_APP_DIR path"
echo "  4. Test build with: scripts/build_frontend.sh"
echo "  5. If all works, delete backup: rm -rf $BACKUP_DIR"
