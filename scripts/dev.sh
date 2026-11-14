#!/usr/bin/env bash
set -euo pipefail
ASTRA_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
if [[ ! -x "$ASTRA_ROOT/.venv/bin/uvicorn" || ! -d "$ASTRA_ROOT/frontend/node_modules" ]]; then
  echo "Install dependencies using README.md before starting ASTRA."
  exit 1
fi
cd "$ASTRA_ROOT/backend"
../.venv/bin/alembic upgrade head
../.venv/bin/uvicorn app.main:app --host 127.0.0.1 --port 8000 --no-access-log &
ASTRA_API_PID=$!
trap 'kill "$ASTRA_API_PID" 2>/dev/null || true; wait "$ASTRA_API_PID" 2>/dev/null || true' EXIT INT TERM
cd "$ASTRA_ROOT/frontend"
npm run dev -- --port 5173 --strictPort
