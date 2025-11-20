#!/usr/bin/env bash
set -euo pipefail

# Wrapper to run adapter helper tests (sqlite + maria) and the full integration runner
ROOT_DIR="$(cd "$(dirname "$0")" && pwd)"
cd "$ROOT_DIR"

LOG_DIR="$ROOT_DIR/logs/integrationTests"
mkdir -p "$LOG_DIR"

DATE_TAG=$(date -u +"%Y%m%dT%H%M%SZ")
LOGFILE="$LOG_DIR/$DATE_TAG-all.log"

echo "Integration combined test run: $DATE_TAG" | tee -a "$LOGFILE"

STATUS=0

run_adapter() {
  local DB="$1"
  echo "\n=== Adapter tests for RUNTIME_DB=$DB ===" | tee -a "$LOGFILE"
  export RUNTIME_DB="$DB"
  export env=local
  export NODE_ENV=development

  if [ "$DB" = "sqlite" ]; then
    echo "Initializing SQLite DB for adapter tests..." | tee -a "$LOGFILE"
    mkdir -p "$ROOT_DIR/db"
    if command -v sqlite3 >/dev/null 2>&1; then
      sqlite3 "$ROOT_DIR/db/reachme.sqlite" < "$ROOT_DIR/db/sqlite_schema.sql" >>"$LOGFILE" 2>&1 || true
      echo "SQLite DB initialized at $ROOT_DIR/db/reachme.sqlite" | tee -a "$LOGFILE"
    else
      echo "sqlite3 CLI not found; skipping direct sqlite init" | tee -a "$LOGFILE"
    fi
  fi

  echo "Running adapter helper tests (RUNTIME_DB=$DB)..." | tee -a "$LOGFILE"
  if ! node src/test/adapter_helpers_tests.js >>"$LOGFILE" 2>&1; then
    echo "Adapter helper tests FAILED for RUNTIME_DB=$DB" | tee -a "$LOGFILE"
    STATUS=1
  else
    echo "Adapter helper tests passed for RUNTIME_DB=$DB" | tee -a "$LOGFILE"
  fi
}

# Run adapter tests for both DB backends
run_adapter sqlite
run_adapter maria

echo "\n=== Running full integration test runner ===" | tee -a "$LOGFILE"
if ! scripts/run_integration_tests.sh >>"$LOGFILE" 2>&1; then
  echo "Full integration runner FAILED" | tee -a "$LOGFILE"
  STATUS=1
else
  echo "Full integration runner succeeded" | tee -a "$LOGFILE"
fi

echo "\nIntegration combined run finished. Status=$STATUS" | tee -a "$LOGFILE"
exit $STATUS
