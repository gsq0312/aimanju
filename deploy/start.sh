#!/usr/bin/env bash
set -euo pipefail

cd /root/aimanju/backend
export AIMANJU_DATA_DIR="${AIMANJU_DATA_DIR:-/root/aimanju_data}"
export AIMANJU_FRONTEND_DIST="${AIMANJU_FRONTEND_DIST:-/root/aimanju/frontend/dist}"
exec /root/aimanju/backend/.venv/bin/uvicorn main:app --host 127.0.0.1 --port "${AIMANJU_PORT:-18110}"
