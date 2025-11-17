#!/usr/bin/env bash
set -euo pipefail
SCRIPT_DIR=$(cd -- "$(dirname -- "${BASH_SOURCE[0]}")" && pwd)
ROOT_DIR=$(cd "$SCRIPT_DIR/.." && pwd)

bash "$SCRIPT_DIR/build_backend.sh"
# Pass through env/ENV flag to frontend build if provided
bash "$SCRIPT_DIR/build_frontend.sh" "${env:-${ENV:-}}"

echo "✅ Combined build complete. Static files in both/public and backend dist ready."