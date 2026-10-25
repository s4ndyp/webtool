#!/usr/bin/env bash
set -euo pipefail
ROOT="$(cd "$(dirname "$0")/.." && pwd)"
cd "$ROOT"

PB_BIN="$ROOT/pocketbase/pocketbase"
PB_DATA="$ROOT/pocketbase/pb_data"
PB_MIGRATIONS="$ROOT/pocketbase/pb_migrations"

if [[ ! -x "$PB_BIN" ]]; then
  echo "PocketBase binary ontbreekt; downloaden…"
  mkdir -p "$ROOT/pocketbase"
  curl -fsSL "https://github.com/pocketbase/pocketbase/releases/download/v0.22.34/pocketbase_0.22.34_linux_amd64.zip" -o /tmp/pb.zip
  unzip -q -o /tmp/pb.zip -d "$ROOT/pocketbase"
  chmod +x "$PB_BIN"
fi

mkdir -p "$PB_DATA"
npm install

"$PB_BIN" serve \
  --http=127.0.0.1:8090 \
  --dir="$PB_DATA" \
  --migrationsDir="$PB_MIGRATIONS" &
PB_PID=$!
trap 'kill "$PB_PID" 2>/dev/null || true' EXIT

for _ in $(seq 1 40); do
  if curl -sf http://127.0.0.1:8090/api/health >/dev/null; then
    break
  fi
  sleep 0.25
done

export POCKETBASE_URL=http://127.0.0.1:8090
exec npm start
