#!/bin/bash
set -e

# FFmpegLab Server Setup Phase
# Clones repo, installs, runs migrations, generates API keys

if [ -z "$DATABASE_URL" ] || [ -z "$S3_BUCKET" ]; then
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

# Clone repo
REPO_DIR="server"
if [ ! -d "$REPO_DIR" ]; then
    git clone https://github.com/ffmpeglab/server.git "$REPO_DIR"
fi
cd "$REPO_DIR"

# Generate JWT secret
JWT_SECRET=$(openssl rand -base64 32 2>/dev/null || echo "CHANGE_ME_TO_A_LONG_SECRET_STRING")

# Write .env
cat > .env <<EOF
DATABASE_URL=${DATABASE_URL}
DB_MIGRATION_ENABLED=true
SUPABASE_URL=${SUPABASE_URL}
SUPABASE_ANON_KEY=${SUPABASE_ANON_KEY}
SUPABASE_SERVICE_ROLE_KEY=${SUPABASE_SERVICE_ROLE_KEY}
S3_ACCESS_KEY=${SUPABASE_ANON_KEY}
S3_SECRET_KEY=${SUPABASE_SERVICE_ROLE_KEY}
S3_REGION=us-east-1
S3_ENDPOINT=${SUPABASE_URL}/storage/v1/s3
S3_BUCKET=${S3_BUCKET}
JWT_SECRET=${JWT_SECRET}
PORT=3000
EOF

echo -e "${GREEN}✅ .env created.${NC}"

echo -e "${BLUE}📦 Installing dependencies...${NC}"
npm install

echo -e "${BLUE}🗄️  Running migrations...${NC}"
npm run migration:run || {
    echo -e "${RED}❌ Migrations failed. Check DATABASE_URL and pgmq.${NC}"
    echo -e "${YELLOW}💡 Manual: npx typeorm migration:run -d src/data-source.ts${NC}"
    exit 1
}
echo -e "${GREEN}✅ Migrations complete.${NC}"

# Generate API key
read -p "API Key Prefix [ffmpeglab_sk_]: " API_KEY_PREFIX
API_KEY_PREFIX=${API_KEY_PREFIX:-ffmpeglab_sk_}
API_KEY_SECRET=$(openssl rand -hex 32 2>/dev/null || echo "a1b2c3d4e5f6g7h8i9j0k1l2m3n4o5p6")
API_KEY="${API_KEY_PREFIX}${API_KEY_SECRET}"
export API_KEY

echo -e "${BLUE}💾 Inserting user and API key...${NC}"
PGPASSWORD="$DB_PASSWORD" psql "$DATABASE_URL" <<EOF
INSERT INTO "user" (id, email, password_hash, data)
VALUES (
  '550e8400-e29b-41d4-a716-446655440000',
  'agent@ffmpeglab.com',
  '',
  '{"roles": ["admin"]}'
) ON CONFLICT DO NOTHING;

INSERT INTO apikey (id, title, apikey, user_id, data)
VALUES (
  '550e8400-e29b-41d4-a716-446655440001',
  'Admin API Key',
  '${API_KEY}',
  '550e8400-e29b-41d4-a716-446655440000',
  '{"permissions": ["render:*", "project:*", "user:read"]}'
) ON CONFLICT DO NOTHING;
EOF
echo -e "${GREEN}✅ User and API key inserted.${NC}"