#!/bin/sh
set -e

PB_DATA_DIR="${PB_DATA_DIR:-/data/pb}"
PB_BIN="${POCKETBASE_BIN:-/usr/local/bin/pocketbase}"
PB_HTTP="${POCKETBASE_HTTP:-127.0.0.1:8090}"

mkdir -p "$PB_DATA_DIR"

cd /app
"$PB_BIN" serve --http="$PB_HTTP" --dir="$PB_DATA_DIR" &
PB_PID=$!

i=0
while [ "$i" -lt 60 ]; do
  if wget -q -O /dev/null "http://${PB_HTTP}/api/health" 2>/dev/null; then
    break
  fi
  i=$((i + 1))
  sleep 0.5
done

if ! wget -q -O /dev/null "http://${PB_HTTP}/api/health" 2>/dev/null; then
  echo "PocketBase startte niet binnen timeout." >&2
  kill "$PB_PID" 2>/dev/null || true
  exit 1
fi

trap 'kill "$PB_PID" 2>/dev/null' INT TERM

exec node server/index.js
