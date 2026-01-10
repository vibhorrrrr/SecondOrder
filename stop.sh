#!/bin/bash

# Strategic Business Simulator - Stop Script
# This script stops both backend and frontend servers

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

echo -e "${BLUE}🛑 Stopping Strategic Business Simulator...${NC}"
echo ""

# Get the directory where this script is located
SCRIPT_DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )"
cd "$SCRIPT_DIR"

# Stop processes by PID if PID files exist
if [ -f "logs/backend.pid" ]; then
    BACKEND_PID=$(cat logs/backend.pid)
    if kill -0 $BACKEND_PID 2>/dev/null; then
        kill $BACKEND_PID
        echo -e "${GREEN}✅ Backend stopped (PID: $BACKEND_PID)${NC}"
    else
        echo -e "${YELLOW}⚠️  Backend process not found${NC}"
    fi
    rm logs/backend.pid
fi

if [ -f "logs/frontend.pid" ]; then
    FRONTEND_PID=$(cat logs/frontend.pid)
    if kill -0 $FRONTEND_PID 2>/dev/null; then
        kill $FRONTEND_PID
        echo -e "${GREEN}✅ Frontend stopped (PID: $FRONTEND_PID)${NC}"
    else
        echo -e "${YELLOW}⚠️  Frontend process not found${NC}"
    fi
    rm logs/frontend.pid
fi

# Fallback: kill by process name
echo -e "${BLUE}🔍 Checking for any remaining processes...${NC}"
pkill -f "python.*api.py" && echo -e "${GREEN}✅ Stopped Python backend${NC}" || true
pkill -f "vite" && echo -e "${GREEN}✅ Stopped Vite dev server${NC}" || true

echo ""
echo -e "${GREEN}✅ All services stopped${NC}"

