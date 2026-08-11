#!/bin/bash
set -e

# FFmpegLab Server - Agent-First Setup
# Main installer that orchestrates all phases

BASE_URL="http://localhost:8080/sh"
LOG_FILE="ffmpeglab-setup.log"

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

# ROOT DIRECTORY
export APP_ROOT_DIR="ffmpeglab"

if [ ! -d "$APP_ROOT_DIR" ]; then
    mkdir $APP_ROOT_DIR
fi

cd $APP_ROOT_DIR


# Clone repo
export SERVER_DIR="server"
if [ ! -d "$SERVER_DIR" ]; then
    git clone https://github.com/ffmpeglab/server.git $WEBAPP_DIR
fi


# Clone repo
export WEBAPP_DIR="webapp"
if [ ! -d "$WEBAPP_DIR" ]; then
    git clone https://github.com/ffmpeglab/webapp.git $WEBAPP_DIR
    cp $WEBAPP_DIR/.env.example $WEBAPP_DIR/.env
fi


export SUPABASE_CHOICE=2

# Run phases
run_phase "supabase-setup.sh"
run_phase "server-setup.sh"
run_phase "webapp-setup.sh"
run_phase "finalize.sh"