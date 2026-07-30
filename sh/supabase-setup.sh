#!/bin/bash
set -e

# Supabase Setup Phase
# Configures PostgreSQL, pgmq, storage buckets, and RLS policies

if [ -z "$SUPABASE_CHOICE" ]; then
    echo -e "${RED}❌ SUPABASE_CHOICE not set. Run install.sh first.${NC}"
    exit 1
fi

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

echo -e "${BLUE}🔧 Configuring Supabase...${NC}"

# Get credentials
if [ "$SUPABASE_CHOICE" = "2" ]; then
    # Self-hosted
    echo -e "${BLUE}📦 Setting up self-hosted Supabase...${NC}"
    if [ ! -d "supabase" ]; then
        git clone --depth 1 https://github.com/supabase/supabase.git
        cd supabase/docker
        cp .env.example .env
        echo -e "${YELLOW}⚠️  Please edit supabase/docker/.env to set your secrets.${NC}"
        echo -e "${YELLOW}   Then run: docker compose up -d${NC}"
        read -p "Press Enter after Supabase is running..."
        cd ../..
    else
        cd supabase/docker
        docker compose up -d
        cd ../..
    fi

    if [ -f "supabase/docker/.env" ]; then
        source supabase/docker/.env
        SUPABASE_URL="http://localhost:8000"
        SUPABASE_ANON_KEY="$ANON_KEY"
        SUPABASE_SERVICE_ROLE_KEY="$SERVICE_ROLE_KEY"
        DB_PASSWORD="$POSTGRES_PASSWORD"
        export SUPABASE_URL SUPABASE_ANON_KEY SUPABASE_SERVICE_ROLE_KEY DB_PASSWORD
    else
        echo -e "${YELLOW}⚠️  Could not find .env. Enter credentials manually.${NC}"
        read -p "Supabase URL [http://localhost:8000]: " SUPABASE_URL
        SUPABASE_URL=${SUPABASE_URL:-http://localhost:8000}
        read -p "Supabase Anon Key: " SUPABASE_ANON_KEY
        read -p "Supabase Service Role Key: " SUPABASE_SERVICE_ROLE_KEY
        read -p "PostgreSQL Password: " DB_PASSWORD
        export SUPABASE_URL SUPABASE_ANON_KEY SUPABASE_SERVICE_ROLE_KEY DB_PASSWORD
    fi
else
    # Supabase Cloud
    read -p "Supabase Project URL (e.g., https://your-project.supabase.co): " SUPABASE_URL
    read -p "Supabase Database Password: " DB_PASSWORD
    read -p "Supabase Anon Key: " SUPABASE_ANON_KEY
    read -p "Supabase Service Role Key: " SUPABASE_SERVICE_ROLE_KEY
    export SUPABASE_URL SUPABASE_ANON_KEY SUPABASE_SERVICE_ROLE_KEY DB_PASSWORD
fi

# Build DATABASE_URL
DATABASE_URL="postgresql://postgres:${DB_PASSWORD}@${SUPABASE_URL#https://}/postgres"
export DATABASE_URL

# Storage bucket name
read -p "Storage Bucket Name [ffmpeglab-assets]: " S3_BUCKET
S3_BUCKET=${S3_BUCKET:-ffmpeglab-assets}
export S3_BUCKET

echo -e "${BLUE}🗄️  Enabling pgmq extension...${NC}"
PGPASSWORD="$DB_PASSWORD" psql "$DATABASE_URL" <<EOF
CREATE EXTENSION IF NOT EXISTS pgmq;
SELECT pgmq.create('rendering_queue');
EOF
echo -e "${GREEN}✅ pgmq enabled, queue 'rendering_queue' created.${NC}"

echo -e "${BLUE}📦 Creating storage bucket...${NC}"
curl -s -X POST "${SUPABASE_URL}/storage/v1/bucket" \
  -H "Authorization: Bearer ${SUPABASE_SERVICE_ROLE_KEY}" \
  -H "Content-Type: application/json" \
  -d "{\"name\":\"${S3_BUCKET}\",\"public\":false}" > /dev/null || {
    echo -e "${YELLOW}⚠️  Bucket may already exist. Continuing...${NC}"
}
echo -e "${GREEN}✅ Bucket '${S3_BUCKET}' ready.${NC}"

echo -e "${BLUE}🔒 Setting RLS policies...${NC}"
PGPASSWORD="$DB_PASSWORD" psql "$DATABASE_URL" <<EOF
CREATE POLICY "Allow authenticated uploads" ON storage.objects FOR INSERT TO authenticated WITH CHECK (bucket_id = '${S3_BUCKET}');
CREATE POLICY "Allow authenticated downloads" ON storage.objects FOR SELECT TO authenticated USING (bucket_id = '${S3_BUCKET}');
CREATE POLICY "Allow authenticated updates" ON storage.objects FOR UPDATE TO authenticated USING (bucket_id = '${S3_BUCKET}');
CREATE POLICY "Allow authenticated deletes" ON storage.objects FOR DELETE TO authenticated USING (bucket_id = '${S3_BUCKET}');
EOF
echo -e "${GREEN}✅ RLS policies set.${NC}"