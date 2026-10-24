#!/usr/bin/env bash

# AeroSentinel - Single-Command Launcher
# Starts both the FastAPI backend and React frontend

set -e

PROJECT_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
BACKEND_DIR="$PROJECT_ROOT/backend"
FRONTEND_DIR="$PROJECT_ROOT/frontend"

# Colors for terminal output
CYAN='\033[0;36m'
GREEN='\033[0;32m'
AMBER='\033[0;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

echo -e "${CYAN}=====================================================${NC}"
echo -e "${CYAN}    AeroSentinel - Drone Swarm Simulator Launcher    ${NC}"
echo -e "${CYAN}=====================================================${NC}"

# 1. Kill any existing processes holding port 8000 or 5173
cleanup_port() {
  local port=$1
  local pids=$(lsof -ti :$port 2>/dev/null || true)
  if [ -n "$pids" ]; then
    echo -e "${AMBER}[LAUNCHER] Freeing port $port (PIDs: $pids)...${NC}"
    kill -9 $pids 2>/dev/null || true
  fi
}

cleanup_port 8000
cleanup_port 5173

# 2. Check and prepare Python environment
cd "$BACKEND_DIR"
if [ ! -d "venv" ]; then
  echo -e "${AMBER}[BACKEND] Creating virtualenv...${NC}"
  if command -v python3.12 &>/dev/null; then
    python3.12 -m venv venv
  elif [ -x "/opt/homebrew/bin/python3.12" ]; then
    /opt/homebrew/bin/python3.12 -m venv venv
  else
    python3 -m venv venv
  fi
  ./venv/bin/pip install --upgrade pip
  ./venv/bin/pip install -r requirements.txt
fi

# 3. Check frontend dependencies
cd "$FRONTEND_DIR"
if [ ! -d "node_modules" ]; then
  echo -e "${AMBER}[FRONTEND] Installing node modules...${NC}"
  npm install
fi

# 4. Process cleanup trap on Exit / Ctrl+C
cleanup() {
  echo -e "\n${AMBER}[LAUNCHER] Shutting down AeroSentinel services...${NC}"
  if [ -n "$BACKEND_PID" ]; then
    kill $BACKEND_PID 2>/dev/null || true
  fi
  if [ -n "$FRONTEND_PID" ]; then
    kill $FRONTEND_PID 2>/dev/null || true
  fi
  wait 2>/dev/null || true
  echo -e "${GREEN}[LAUNCHER] All services stopped cleanly.${NC}"
  exit 0
}

trap cleanup SIGINT SIGTERM EXIT

# 5. Start Backend
echo -e "${GREEN}[BACKEND] Starting FastAPI server on http://localhost:8000...${NC}"
cd "$BACKEND_DIR"
./venv/bin/uvicorn app.main:app --host 0.0.0.0 --port 8000 &
BACKEND_PID=$!

# 6. Start Frontend
echo -e "${GREEN}[FRONTEND] Starting Vite dev server on http://localhost:5173...${NC}"
cd "$FRONTEND_DIR"
npm run dev &
FRONTEND_PID=$!

sleep 1
echo -e "\n${CYAN}-----------------------------------------------------${NC}"
echo -e "${GREEN}✔ AeroSentinel is live!${NC}"
echo -e "  • Dashboard:  ${CYAN}http://localhost:5173${NC}"
echo -e "  • API & Docs: ${CYAN}http://localhost:8000/docs${NC}"
echo -e "${CYAN}-----------------------------------------------------${NC}"
echo -e "Press ${AMBER}Ctrl+C${NC} anytime to stop both services.\n"

# Keep script running and wait for background jobs
wait $BACKEND_PID $FRONTEND_PID
