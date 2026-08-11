#!/bin/bash

cd $APP_ROOT_DIR
source ./.env.sh

cd $SERVER_DIR

set -e
# FFmpegLab Server Setup Phase
# Clones repo, installs, runs migrations, generates API keys

if [ -z "$DATABASE_URL" ] || [ -z "$S3_BUCKET_ID" ]; then
    echo -e "${RED}❌ DATABASE_URL or S3_BUCKET not set. Run supabase-setup.sh first.${NC}"
    exit 1
fi

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

echo -e "${BLUE}📦 Setting up FFmpegLab Server...${NC}"


docker compose pull
docker compose up -d

sleep 10
# Generate API key
API_KEY_SECRET=$(openssl rand -hex 32 2>/dev/null || echo "a1b2c3d4e5f6g7h8i9j0k1l2m3n4o5p6")
API_KEY="${API_KEY_SECRET}"

echo -e "${BLUE}💾 Inserting user and API key...${NC}"
PGPASSWORD="$DB_PASSWORD" psql "$DATABASE_URL" <<EOF
INSERT INTO public.api_key (id, title, apikey, user_id, data)
VALUES (
  gen_random_uuid(),
  'Admin API Key',
  '${API_KEY}',
  gen_random_uuid(),
  '{"permissions": ["render:*", "project:*", "user:read"]}'
) ON CONFLICT DO NOTHING;
EOF
echo "export FFMPEGLAB_API_KEY=${API_KEY}" >> ../.env.sh
echo -e "${GREEN}✅ User and API key inserted.${NC}"