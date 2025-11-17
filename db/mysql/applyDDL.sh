#!/usr/bin/env bash
# Apply DDL changes to local database
set -euo pipefail

SCRIPT_DIR=$(cd -- "$(dirname -- "${BASH_SOURCE[0]}")" && pwd)
ROOT_DIR=$(cd "$SCRIPT_DIR/../.." && pwd)

# Load MySQL credentials from backend/.env
if [ -f "$ROOT_DIR/backend/.env" ]; then
  set -a
  # shellcheck disable=SC1091
  source "$ROOT_DIR/backend/.env"
  set +a
fi

MYSQL_HOST="${MYSQL_HOST:-localhost}"
MYSQL_PORT="${MYSQL_PORT:-3306}"
MYSQL_USER="${MYSQL_USER:-g8}"
MYSQL_PASS="${MYSQL_PASSWORD:-hk49-Sk94K23m}"

echo "==> Applying DDL changes to local database"
echo "    Host: $MYSQL_HOST:$MYSQL_PORT"

mysql -h "$MYSQL_HOST" -P "$MYSQL_PORT" -u "$MYSQL_USER" -p"$MYSQL_PASS" < "$SCRIPT_DIR/dbDDL.sql"

echo "==> DDL applied successfully"
echo "==> User table now has userActive column (default TRUE)"
