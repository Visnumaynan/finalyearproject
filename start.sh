#!/usr/bin/env bash
# Start all LiverCare services with one command.
# Run from the project root: bash start.sh
#
# Services started:
#   server  — Laravel PHP dev server     http://127.0.0.1:8000
#   queue   — Laravel queue worker
#   vite    — Vite asset dev server      http://127.0.0.1:5173
#   ai      — FastAPI AI service         http://127.0.0.1:8001

set -e

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
CONCURRENTLY="$ROOT/backend-app/node_modules/.bin/concurrently"

if [ ! -f "$CONCURRENTLY" ]; then
    echo "concurrently not found. Run 'npm install' inside backend-app/ first."
    exit 1
fi

if [ ! -f "$ROOT/ai-service/venv/Scripts/python" ] && [ ! -f "$ROOT/ai-service/venv/bin/python" ]; then
    echo "Python venv not found. Create it first:"
    echo "  cd ai-service && python -m venv venv && ./venv/Scripts/pip install -r requirements.txt"
    exit 1
fi

# Resolve the correct python binary (Windows venv vs Unix venv)
if [ -f "$ROOT/ai-service/venv/Scripts/python" ]; then
    PYTHON="$ROOT/ai-service/venv/Scripts/python"
else
    PYTHON="$ROOT/ai-service/venv/bin/python"
fi

exec "$CONCURRENTLY" \
    --color \
    -c "#93c5fd,#c4b5fd,#fdba74,#86efac" \
    --names "server,queue,vite,ai" \
    --kill-others-on-fail \
    "bash -c 'cd \"$ROOT/backend-app\" && php artisan serve'" \
    "bash -c 'cd \"$ROOT/backend-app\" && php artisan queue:listen --tries=1'" \
    "bash -c 'cd \"$ROOT/backend-app\" && npm run dev'" \
    "bash -c 'cd \"$ROOT/ai-service\" && \"$PYTHON\" -m uvicorn main:app --host 127.0.0.1 --port 8001 --reload'"
