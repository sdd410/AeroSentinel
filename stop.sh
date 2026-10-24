#!/usr/bin/env bash

# AeroSentinel - Single-Command Stopper
# Stops all running backend and frontend simulator processes

set -e

CYAN='\033[0;36m'
GREEN='\033[0;32m'
AMBER='\033[0;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

echo -e "${CYAN}=====================================================${NC}"
echo -e "${CYAN}     AeroSentinel - Stopping Simulator Services      ${NC}"
echo -e "${CYAN}=====================================================${NC}"

stop_service_on_port() {
  local service_name=$1
  local port=$2

  # Find PIDs listening on the specified port
  local pids=$(lsof -ti :$port 2>/dev/null || true)

  if [ -n "$pids" ]; then
    echo -e "${AMBER}Stopping $service_name on port $port (PIDs: $pids)...${NC}"
    # Try graceful SIGTERM first
    kill $pids 2>/dev/null || true
    sleep 0.5
    # Force kill if still holding port
    local remaining=$(lsof -ti :$port 2>/dev/null || true)
    if [ -n "$remaining" ]; then
      kill -9 $remaining 2>/dev/null || true
    fi
    echo -e "${GREEN}✔ $service_name stopped.${NC}"
  else
    echo -e "No active $service_name found on port $port."
  fi
}

# Stop Backend (Port 8000)
stop_service_on_port "Backend (FastAPI)" 8000

# Stop Frontend (Port 5173)
stop_service_on_port "Frontend (Vite)" 5173

echo -e "\n${GREEN}✔ All AeroSentinel services have been stopped.${NC}"
