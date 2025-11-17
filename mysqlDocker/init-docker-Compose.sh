#!/usr/bin/env bash
set -euo pipefail
SCRIPT_DIR=$(cd -- "$(dirname -- "${BASH_SOURCE[0]}")" && pwd)
cd "$SCRIPT_DIR"

echo "==> Starting local MariaDB + Adminer"
docker compose up -d

echo "==> Containers starting. MariaDB on 3306, Adminer on http://localhost:9402"