#!/bin/bash

# Kill server running on port 8052

PORT=8052

echo "Checking for processes on port $PORT..."

PID=$(lsof -ti:$PORT 2>/dev/null)

if [ -z "$PID" ]; then
  echo "✅ No server running on port $PORT"
  exit 0
else
  echo "🔴 Found process(es) running on port $PORT: $PID"
  echo "Killing process(es)..."
  kill -9 $PID 2>/dev/null
  
  # Verify it's killed
  sleep 1
  STILL_RUNNING=$(lsof -ti:$PORT 2>/dev/null)
  
  if [ -z "$STILL_RUNNING" ]; then
    echo "✅ Server successfully stopped"
    exit 0
  else
    echo "❌ Failed to stop server"
    exit 1
  fi
fi
