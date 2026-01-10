#!/bin/bash

# Strategic Business Simulator - Startup Script
# This script starts both the backend (FastAPI) and frontend (Vite) servers

set -e  # Exit on error

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

echo -e "${BLUE}╔═══════════════════════════════════════════════════════════╗${NC}"
echo -e "${BLUE}║   Strategic Business Simulator - F1 Intelligence Suite   ║${NC}"
echo -e "${BLUE}║          Powered by Google Gemini 2.0 Flash              ║${NC}"
echo -e "${BLUE}╚═══════════════════════════════════════════════════════════╝${NC}"
echo ""

# Get the directory where this script is located
SCRIPT_DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )"
cd "$SCRIPT_DIR"

# Check if .env exists
if [ ! -f ".env" ]; then
    echo -e "${YELLOW}⚠️  Warning: .env file not found!${NC}"
    echo -e "${YELLOW}Creating .env file template...${NC}"
    echo "GOOGLE_API_KEY=your-api-key-here" > .env
    echo -e "${RED}❌ Please edit .env and add your Google API key, then run this script again.${NC}"
    exit 1
fi

# Check if GOOGLE_API_KEY is set in .env
if grep -q "your-api-key-here" .env || ! grep -q "GOOGLE_API_KEY=" .env; then
    echo -e "${RED}❌ Please set your GOOGLE_API_KEY in the .env file${NC}"
    exit 1
fi

echo -e "${GREEN}✅ Environment configuration found${NC}"
echo ""

# Check Python
echo -e "${BLUE}🔍 Checking Python dependencies...${NC}"
if ! command -v python3 &> /dev/null; then
    echo -e "${RED}❌ Python 3 is not installed${NC}"
    exit 1
fi
echo -e "${GREEN}✅ Python 3 found${NC}"

# Check Node.js
echo -e "${BLUE}🔍 Checking Node.js...${NC}"
if ! command -v node &> /dev/null; then
    echo -e "${RED}❌ Node.js is not installed${NC}"
    exit 1
fi
if ! command -v npm &> /dev/null; then
    echo -e "${RED}❌ npm is not installed${NC}"
    exit 1
fi
echo -e "${GREEN}✅ Node.js and npm found${NC}"
echo ""

# Install Python dependencies if needed
echo -e "${BLUE}📦 Installing Python dependencies...${NC}"
pip install -q -r requirements.txt
echo -e "${GREEN}✅ Python dependencies installed${NC}"
echo ""

# Install Node.js dependencies if needed
echo -e "${BLUE}📦 Installing frontend dependencies...${NC}"
cd ui
if [ ! -d "node_modules" ]; then
    npm install
else
    echo -e "${YELLOW}ℹ️  node_modules found, skipping install${NC}"
fi
echo -e "${GREEN}✅ Frontend dependencies ready${NC}"
cd ..
echo ""

# Check if ports are already in use
check_port() {
    local port=$1
    if lsof -Pi :$port -sTCP:LISTEN -t >/dev/null 2>&1 ; then
        return 0
    else
        return 1
    fi
}

# Check backend port
if check_port 8000; then
    echo -e "${YELLOW}⚠️  Port 8000 is already in use. Stopping existing process...${NC}"
    pkill -f "python.*api.py" || true
    sleep 2
fi

# Check frontend port
if check_port 5173; then
    echo -e "${YELLOW}⚠️  Port 5173 is already in use. Stopping existing process...${NC}"
    pkill -f "vite" || true
    sleep 2
fi

echo -e "${BLUE}🚀 Starting Backend Server (FastAPI on port 8000)...${NC}"
# Start backend in background
python api.py > logs/backend.log 2>&1 &
BACKEND_PID=$!
echo -e "${GREEN}✅ Backend started (PID: $BACKEND_PID)${NC}"
echo ""

# Wait a moment for backend to start
sleep 3

# Check if backend is running
if ! kill -0 $BACKEND_PID 2>/dev/null; then
    echo -e "${RED}❌ Backend failed to start. Check logs/backend.log for details${NC}"
    cat logs/backend.log
    exit 1
fi

echo -e "${BLUE}🚀 Starting Frontend Server (Vite on port 5173)...${NC}"
# Start frontend in background
cd ui
npm run dev > ../logs/frontend.log 2>&1 &
FRONTEND_PID=$!
echo -e "${GREEN}✅ Frontend started (PID: $FRONTEND_PID)${NC}"
cd ..
echo ""

# Wait for frontend to be ready
sleep 3

echo -e "${GREEN}╔═══════════════════════════════════════════════════════════╗${NC}"
echo -e "${GREEN}║                   🎉 ALL SYSTEMS READY! 🎉                ║${NC}"
echo -e "${GREEN}╚═══════════════════════════════════════════════════════════╝${NC}"
echo ""
echo -e "${BLUE}📊 Access the application:${NC}"
echo -e "   ${GREEN}Frontend:${NC} http://localhost:5173"
echo -e "   ${GREEN}Backend API:${NC} http://localhost:8000"
echo ""
echo -e "${BLUE}📝 Process Information:${NC}"
echo -e "   Backend PID: $BACKEND_PID"
echo -e "   Frontend PID: $FRONTEND_PID"
echo ""
echo -e "${BLUE}📋 Logs:${NC}"
echo -e "   Backend:  logs/backend.log"
echo -e "   Frontend: logs/frontend.log"
echo ""
echo -e "${YELLOW}💡 To stop the servers, run:${NC}"
echo -e "   ${GREEN}./stop.sh${NC}"
echo -e "   or press Ctrl+C if running in the same terminal"
echo ""

# Save PIDs to file for stop script
echo $BACKEND_PID > logs/backend.pid
echo $FRONTEND_PID > logs/frontend.pid

# Keep script running and show logs
echo -e "${BLUE}🔍 Showing live logs (Ctrl+C to stop):${NC}"
echo ""
tail -f logs/backend.log logs/frontend.log

