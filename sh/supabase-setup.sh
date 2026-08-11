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
        # Get the code
        set -a 
        git clone --depth 1 https://github.com/supabase/supabase
        set +a
    fi

    if [ ! -d "supabase-project" ]; then
        # Make your new supabase project directory
        mkdir supabase-project
        # Tree should look like this
        # .
        # ├── supabase
        # └── supabase-project
        # Copy the configuration to your project
        cp -rf supabase/docker/. supabase-project
        # Switch to the project directory and create a .env from the example
        cd supabase-project && cp .env.example .env
        sh utils/generate-keys.sh --update-env
        sh utils/add-new-auth-keys.sh
        docker compose pull
    else 
        cd supabase-project
    fi

    docker compose up -d
    cd ..

    ENV_VARS="$(cat supabase-project/.env | awk '!/^\s*#/' | awk '!/^\s*$/')"

    eval "$(
    printf '%s\n' "$ENV_VARS" | while IFS='' read -r line; do
        key=$(printf '%s\n' "$line"| sed 's/"/\\"/g' | cut -d '=' -f 1)
        value=$(printf '%s\n' "$line" | cut -d '=' -f 2- | sed 's/"/\\\"/g')
        printf '%s\n' "export $key=\"$value\""
    done
    )"
    # set -o allexport
    # source supabase-project/.env.sh
    # set +o allexport
    SUPABASE_FQDN=$(ipconfig getifaddr en0)
    SUPABASE_URL="http://${SUPABASE_FQDN}:8000"
    SUPABASE_ANON_KEY="$ANON_KEY"
    SUPABASE_SERVICE_ROLE_KEY="$SERVICE_ROLE_KEY"
    DB_PASSWORD="$POSTGRES_PASSWORD"
    DB_NAME=postgres
    DB_USER=postgres.your-tenant-id
    # Storage bucket name
    read -p "Storage Bucket Name [ffmpeglab-assets]: " S3_BUCKET
    S3_BUCKET=${S3_BUCKET:-ffmpeglab-assets}
    # Build DATABASE_URL
    echo $S3_BUCKET
    DATABASE_URL="postgresql://${DB_USER}:${DB_PASSWORD}@${SUPABASE_FQDN}/postgres"
    export DATABASE_URL S3_BUCKET SUPABASE_URL SUPABASE_ANON_KEY SUPABASE_SERVICE_ROLE_KEY DB_PASSWORD;
else
    # Supabase Cloud
    read -p "Supabase Project URL (e.g., https://your-project.supabase.co): " SUPABASE_URL
    read -p "Supabase Database Password: " DB_PASSWORD
    read -p "Supabase Anon Key: " SUPABASE_ANON_KEY
    read -p "Supabase Service Role Key: " SUPABASE_SERVICE_ROLE_KEY
    export SUPABASE_URL SUPABASE_ANON_KEY SUPABASE_SERVICE_ROLE_KEY DB_PASSWORD;
fi

echo "export DATABASE_URL=${DATABASE_URL}" >> .env.sh;
echo "export DB_MIGRATION_ENABLED=true" >> .env.sh;
echo "export S3_BUCKET_ID=${S3_BUCKET}" >> .env.sh;
echo "export S3_ACCESS_KEY=${S3_PROTOCOL_ACCESS_KEY_ID}" >> .env.sh;
echo "export S3_ACCESS_KEY=${S3_PROTOCOL_ACCESS_KEY_SECRET}" >> .env.sh;
echo "export SUPABASE_URL=${SUPABASE_URL}" >>  .env.sh;
echo "export SUPABASE_ANON_KEY=${SUPABASE_ANON_KEY}" >>  .env.sh;
echo "export DB_PASSWORD=${DB_PASSWORD}" >>  .env.sh;
echo "export DB_USER=${DB_USER}" >>  .env.sh;
echo "export DB_NAME=${DB_NAME}" >>  .env.sh;
echo "export DB_HOST=${SUPABASE_FQDN}" >>  .env.sh;
echo "export DB_PORT=6543" >>  .env.sh;

#SERVER .env
echo "DATABASE_URL=${DATABASE_URL}" >> $SERVER_DIR/.env;
echo "DB_MIGRATION_ENABLED=true" >> $SERVER_DIR/.env;
echo "S3_BUCKET_ID=${S3_BUCKET}" >> $SERVER_DIR/.env;
echo "S3_ACCESS_KEY=${S3_PROTOCOL_ACCESS_KEY_ID}" >> $SERVER_DIR/.env;
echo "S3_SECRET_KEY=${S3_PROTOCOL_ACCESS_KEY_SECRET}" >> $SERVER_DIR/.env;
echo "S3_ENDPOINT=${SUPABASE_URL}/storage/v1/s3" >>  $SERVER_DIR/.env;
echo "DB_PASSWORD=${DB_PASSWORD}" >>  $SERVER_DIR/.env;
echo "DB_USER=${DB_USER}" >>  $SERVER_DIR/.env;
echo "DB_NAME=${DB_NAME}" >>  $SERVER_DIR/.env;
echo "DB_HOST=${SUPABASE_FQDN}" >>  $SERVER_DIR/.env;
echo "DB_PORT=6543" >>  $SERVER_DIR/.env;
echo "SUPABASE_URL=${SUPABASE_URL}" >>  $SUPABASE_URL/.env;
echo "SUPABASE_ANON_KEY=${SUPABASE_ANON_KEY}" >>  $SUPABASE_URL/.env;

#WEBAPP .env
echo "SUPABASE_URL=${SUPABASE_URL}" >>  $WEBAPP_DIR/.env;
echo "SUPABASE_ANON_KEY=${SUPABASE_ANON_KEY}" >>  $WEBAPP_DIR/.env;
sleep 10


echo -e "${BLUE}🗄️  Enabling pgmq extension...${NC}"
PGPASSWORD="$DB_PASSWORD" psql "$DATABASE_URL" <<EOF
CREATE EXTENSION IF NOT EXISTS pgmq;
EOF
echo -e "${GREEN}✅ pgmq enabled, queue 'renders' created.${NC}"

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