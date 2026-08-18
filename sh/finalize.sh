#!/bin/bash
set -e
source ./.env.sh

# Finalize Phase
# Starts Docker Compose and displays summary

if [ -z "$FFMPEGLAB_API_KEY" ]; then
    echo -e "${RED}❌ API_KEY not set. Run server-setup.sh first.${NC}"
    exit 1
fi

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

sleep 5

echo -e "${GREEN}✅ Setup complete!${NC}"
echo "================================================"
echo -e "${GREEN}🔑 Your API Key: ${FFMPEGLAB_API_KEY}${NC}"
echo -e "${BLUE}🌐 API Server: http://localhost:3000${NC}"
echo -e "${BLUE}📝 Test with:${NC}"
echo "curl -v -H 'Authorization: Bearer ${FFMPEGLAB_API_KEY}' "http://localhost:3000/renders""
curl -v -H "Authorization: Bearer ${FFMPEGLAB_API_KEY}" "http://localhost:3000/renders"
open "http://localhost:3005/"