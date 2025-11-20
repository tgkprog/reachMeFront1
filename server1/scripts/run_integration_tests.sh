#!/usr/bin/env bash
set -euo pipefail

# Runs integration tests twice: RUNTIME_DB=sqlite and RUNTIME_DB=maria
# Logs all output to server1/logs/integrationTests/<datetime>.log

ROOT_DIR=$(dirname "$(dirname "$0")")
cd "$ROOT_DIR"

LOG_DIR="$ROOT_DIR/logs/integrationTests"
mkdir -p "$LOG_DIR"

DATE_TAG=$(date -u +"%Y%m%dT%H%M%SZ")
LOGFILE="$LOG_DIR/$DATE_TAG.log"

echo "Integration test run: $DATE_TAG" | tee -a "$LOGFILE"

STATUS=0

# Function to wait for server health
wait_for_health() {
  local url="$1"
  local tries=0
  local max=30
  until curl -s --insecure "$url/health" >/dev/null || curl -s --insecure --resolve reachme2.com:8052:127.0.0.1 https://reachme2.com:8052/health >/dev/null; do
    tries=$((tries + 1))
    if [ "$tries" -ge "$max" ]; then
      echo "Server did not become healthy after $max seconds" | tee -a "$LOGFILE"
      return 1
    fi
    sleep 1
  done
  return 0
}

for DB in sqlite maria; do
  echo "\n=== Running tests with RUNTIME_DB=$DB ===" | tee -a "$LOGFILE"

  export RUNTIME_DB="$DB"
  export env=local
  export NODE_ENV=development
  export TEST_BASE_URL="https://localhost:8052"

  # If using sqlite, initialize sqlite DB from schema so tables exist
  if [ "$DB" = "sqlite" ]; then
    echo "Initializing SQLite DB..." | tee -a "$LOGFILE"
    mkdir -p "$ROOT_DIR/db"
    if command -v sqlite3 >/dev/null 2>&1; then
      sqlite3 "$ROOT_DIR/db/reachme.sqlite" < "$ROOT_DIR/db/sqlite_schema.sql" >>"$LOGFILE" 2>&1 || true
      echo "SQLite DB initialized at $ROOT_DIR/db/reachme.sqlite" | tee -a "$LOGFILE"
    else
      echo "sqlite3 CLI not found, trying Node fallback to initialize SQLite" | tee -a "$LOGFILE"
      node -e "const fs=require('fs'); const sqlite3=require('sqlite3').verbose(); const sql=fs.readFileSync('db/sqlite_schema.sql','utf8'); const db=new sqlite3.Database('db/reachme.sqlite'); db.exec(sql, (e)=>{ if(e){ console.error('sqlite init failed',e); process.exit(1);} else { console.log('sqlite initialized'); process.exit(0);} });" >>"$LOGFILE" 2>&1 || true
    fi
  fi

  # Start server in background and append logs
  echo "Starting server (RUNTIME_DB=$DB)..." | tee -a "$LOGFILE"
  node server.js >>"$LOGFILE" 2>&1 &
  SERVER_PID=$!
  echo "Server PID: $SERVER_PID" | tee -a "$LOGFILE"

  # Wait for health (use TEST_BASE_URL)
  if ! wait_for_health "$TEST_BASE_URL"; then
    echo "Aborting tests for RUNTIME_DB=$DB due to failed health check" | tee -a "$LOGFILE"
    kill $SERVER_PID || true
    wait $SERVER_PID 2>/dev/null || true
    continue
  fi

  # Run test script
  echo "Running test script..." | tee -a "$LOGFILE"
  if ! node src/test/user1_withDb_tests.js >>"$LOGFILE" 2>&1; then
    echo "Tests failed for RUNTIME_DB=$DB (see $LOGFILE)" | tee -a "$LOGFILE"
    STATUS=1
  else
    echo "Tests succeeded for RUNTIME_DB=$DB" | tee -a "$LOGFILE"
  fi

  # Ensure test cleanup by invoking cleanup (test script already attempts cleanup)
  echo "Stopping server PID $SERVER_PID" | tee -a "$LOGFILE"
  kill $SERVER_PID || true
  wait $SERVER_PID 2>/dev/null || true
  echo "Server stopped" | tee -a "$LOGFILE"

done

echo "Integration test run complete. Logs: $LOGFILE" | tee -a "$LOGFILE"
if [ "$STATUS" -ne 0 ]; then
  echo "One or more test runs failed. Exiting with status $STATUS" | tee -a "$LOGFILE"
  exit $STATUS
fi
