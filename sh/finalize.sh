#!/bin/bash
set -e

# Finalize Phase
# Starts Docker Compose and displays summary

if [ -z "$API_KEY" ]; then
    echo -e "${RED}❌ API_KEY not set. Run server-setup.sh first.${NC}"
    exit 1
fi

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

echo -e "${BLUE}🐳 Starting FFmpegLab Server with Docker Compose...${NC}"
docker compose up -d

echo -e "${BLUE}📊 Service status:${NC}"
docker compose ps

echo -e "${GREEN}✅ Setup complete!${NC}"
echo "================================================"
echo -e "${GREEN}🔑 Your API Key: ${API_KEY}${NC}"
echo -e "${BLUE}🌐 API Server: http://localhost:3000${NC}"
echo -e "${BLUE}📝 Test with:${NC}"
echo "  curl http://localhost:3000/"
echo "  curl -H 'Authorization: Bearer ${API_KEY}' http://localhost:3000/renders"
echo "================================================"
echo -e "${YELLOW}💡 To view logs: docker compose logs -f${NC}"
echo -e "${YELLOW}💡 To stop: docker compose down${NC}"