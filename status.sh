#!/bin/bash

# Strategic Business Simulator - Status Check Script

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

echo -e "${BLUE}╔═══════════════════════════════════════════╗${NC}"
echo -e "${BLUE}║  Business Simulator - Status Check       ║${NC}"
echo -e "${BLUE}╚═══════════════════════════════════════════╝${NC}"
echo ""

# Check if services are running
check_process() {
    if pgrep -f "$1" > /dev/null; then
        echo -e "${GREEN}✅ Running${NC}"
        return 0
    else
        echo -e "${RED}❌ Not running${NC}"
        return 1
    fi
}

check_port() {
    local port=$1
    if lsof -Pi :$port -sTCP:LISTEN -t >/dev/null 2>&1 ; then
        echo -e "${GREEN}✅ Port $port is open${NC}"
        return 0
    else
        echo -e "${RED}❌ Port $port is not listening${NC}"
        return 1
    fi
}

# Check Backend
echo -e "${BLUE}Backend (FastAPI):${NC}"
echo -n "  Process: "
check_process "python.*api.py"
echo -n "  Port 8000: "
check_port 8000

echo ""

# Check Frontend
echo -e "${BLUE}Frontend (Vite):${NC}"
echo -n "  Process: "
check_process "vite"
echo -n "  Port 5173: "
check_port 5173

echo ""

# Check .env
echo -e "${BLUE}Configuration:${NC}"
if [ -f ".env" ]; then
    if grep -q "GOOGLE_API_KEY=" .env && ! grep -q "your-api-key-here" .env; then
        echo -e "  ${GREEN}✅ .env file configured${NC}"
    else
        echo -e "  ${YELLOW}⚠️  .env file exists but API key not set${NC}"
    fi
else
    echo -e "  ${RED}❌ .env file not found${NC}"
fi

echo ""

# Check logs
echo -e "${BLUE}Log Files:${NC}"
if [ -f "logs/backend.log" ]; then
    BACKEND_LINES=$(wc -l < logs/backend.log)
    echo -e "  Backend: ${GREEN}$BACKEND_LINES lines${NC}"
else
    echo -e "  Backend: ${YELLOW}No log file${NC}"
fi

if [ -f "logs/frontend.log" ]; then
    FRONTEND_LINES=$(wc -l < logs/frontend.log)
    echo -e "  Frontend: ${GREEN}$FRONTEND_LINES lines${NC}"
else
    echo -e "  Frontend: ${YELLOW}No log file${NC}"
fi

echo ""

# Quick health check
echo -e "${BLUE}Health Check:${NC}"
if curl -s http://localhost:8000/generate_nodes -X POST -H "Content-Type: application/json" -d '{"state":{"cac":100,"ltv":1200,"arpu":40,"customers":500,"burn":50000,"ad_spend":10000,"revenue":20000,"cash":1000000,"runway":20,"traffic":10000,"new_customers":200,"month":0}}' > /dev/null 2>&1; then
    echo -e "  Backend API: ${GREEN}✅ Responding${NC}"
else
    echo -e "  Backend API: ${RED}❌ Not responding${NC}"
fi

if curl -s http://localhost:5173 > /dev/null 2>&1; then
    echo -e "  Frontend: ${GREEN}✅ Responding${NC}"
else
    echo -e "  Frontend: ${RED}❌ Not responding${NC}"
fi

echo ""
echo -e "${BLUE}Quick Commands:${NC}"
echo -e "  Start:  ${GREEN}./start.sh${NC}"
echo -e "  Stop:   ${GREEN}./stop.sh${NC}"
echo -e "  Status: ${GREEN}./status.sh${NC}"
echo ""

