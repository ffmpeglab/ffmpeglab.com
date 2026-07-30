#!/bin/bash
set -e

# FFmpegLab Server - Agent-First Setup
# Main installer that orchestrates all phases

BASE_URL="https://ffmpeglab.com/sh"
LOG_FILE="$HOME/ffmpeglab-setup.log"

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

echo -e "${BLUE}🚀 FFmpegLab Server - Agent-First Setup${NC}"
echo "================================================"
echo "Logs written to: $LOG_FILE"

# Function to run a phase script
run_phase() {
    local script=$1
    echo -e "${BLUE}▶ Running phase: $script${NC}"
    curl -sSL "$BASE_URL/$script" | bash -s 2>&1 | tee -a "$LOG_FILE"
    if [ ${PIPESTATUS[0]} -ne 0 ]; then
        echo -e "${RED}❌ Phase $script failed. Check $LOG_FILE${NC}"
        exit 1
    fi
    echo -e "${GREEN}✅ Phase $script completed${NC}"
}

# Check prerequisites
echo -e "${YELLOW}🔍 Checking prerequisites...${NC}"
command -v curl >/dev/null 2>&1 || { echo -e "${RED}❌ curl is required.${NC}"; exit 1; }
command -v git >/dev/null 2>&1 || { echo -e "${RED}❌ git is required.${NC}"; exit 1; }
command -v docker >/dev/null 2>&1 || { echo -e "${RED}❌ docker is required.${NC}"; exit 1; }
command -v docker compose >/dev/null 2>&1 || command -v docker-compose >/dev/null 2>&1 || { echo -e "${RED}❌ docker compose is required.${NC}"; exit 1; }
command -v npm >/dev/null 2>&1 || { echo -e "${RED}❌ npm is required.${NC}"; exit 1; }
command -v psql >/dev/null 2>&1 || { echo -e "${RED}❌ psql is required.${NC}"; exit 1; }
command -v openssl >/dev/null 2>&1 || { echo -e "${RED}❌ openssl is required.${NC}"; exit 1; }

echo -e "${GREEN}✅ All prerequisites satisfied.${NC}"

# Ask which Supabase deployment type
echo -e "${YELLOW}📌 Choose Supabase deployment:${NC}"
echo "  1) Supabase Cloud (already created)"
echo "  2) Self-hosted Supabase (run locally)"
read -p "Enter choice [1-2]: " SUPABASE_CHOICE
export SUPABASE_CHOICE

# Run phases
run_phase "supabase-setup.sh"
run_phase "server-setup.sh"
run_phase "finalize.sh"

echo -e "${GREEN}🎉 Setup complete!${NC}"
echo "================================================"
echo -e "${GREEN}🔑 Your API Key: ${API_KEY}${NC}"
echo -e "${BLUE}🌐 API Server: http://localhost:3000${NC}"
echo -e "${YELLOW}💡 To view logs: docker compose logs -f${NC}"
echo -e "${YELLOW}💡 To stop: docker compose down${NC}"