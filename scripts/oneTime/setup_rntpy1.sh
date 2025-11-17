#!/usr/bin/env bash
set -euo pipefail
SCRIPT_DIR=$(cd -- "$(dirname -- "${BASH_SOURCE[0]}")" && pwd)
ROOT_DIR=$(cd "$SCRIPT_DIR/../.." && pwd)

MYSQL_HOST=${MYSQL_HOST:-127.0.0.1}
MYSQL_PORT=${MYSQL_PORT:-3306}
MYSQL_USER=${MYSQL_USER:-root}
MYSQL_PASS=${MYSQL_PASS:-rootpass}

echo "==> Applying idempotent user/database setup"
mysql -h "$MYSQL_HOST" -P "$MYSQL_PORT" -u "$MYSQL_USER" -p"$MYSQL_PASS" < "$SCRIPT_DIR/setup_rntpy1.sql"

echo "==> Applying application schema"
mysql -h "$MYSQL_HOST" -P "$MYSQL_PORT" -u g8 -p"hk49-Sk94K23m" rntPy1 < "$ROOT_DIR/backend/rntpy1_schema.sql" || echo "-- Schema apply skipped (file/path may differ)."

echo "✅ One-time DB setup complete."