# Cloudflare Containers Troubleshooting

## Current Issues (Jan 2025)

### Issue 1: Route Conflict

**Error:**
```
"ignition-frontend" is already assigned to routes: ignition.ecent.online/*, www.ignition.ecent.online/*
```

**Root Cause:** Old `ignition-frontend` Worker still has routes that should belong to `ignition-landing`.

**Solution Options:**

#### Option A: Cloudflare Dashboard (Recommended)
1. Go to https://dash.cloudflare.com
2. Select the account → Workers & Pages
3. Click on `ignition-frontend`
4. Go to Settings → Triggers → Routes
5. Delete routes for `ignition.ecent.online/*` and `www.ignition.ecent.online/*`
6. Re-deploy `ignition-landing`: `cd deploy/cloudflare-landing && npx wrangler deploy`

#### Option B: API Script
```bash
# Set environment
export CLOUDFLARE_API_TOKEN="your-token-with-routes-edit-permission"
export CLOUDFLARE_ZONE_ID="your-zone-id"

# Run unassign
cd deploy
./scripts/manage-routes.sh unassign
```

---

### Issue 2: Database Pool Timeout

**Error:**
```
pool timed out while waiting for an open connection
```

**Root Cause:** Container cannot reach the PostgreSQL database.

**Possible Causes:**

1. **DATABASE_URL secret not set**
   ```bash
   # Set the secret
   cd deploy/cloudflare-containers
   npx wrangler secret put DATABASE_URL
   # Enter: postgresql://user:password@host:5432/dbname?sslmode=require
   ```

2. **Database not publicly accessible**
   - Cloudflare Containers run on Cloudflare's network
   - They CANNOT access databases in your home network or private VPCs
   - You need a publicly accessible PostgreSQL instance

**Recommended Solutions:**

| Provider | Free Tier | Notes |
|----------|-----------|-------|
| [Neon](https://neon.tech) | 10 projects, 3GB storage | Best for serverless, auto-scales to zero |
| [Supabase](https://supabase.com) | 500MB, 2 projects | Full Postgres + Auth + Storage |
| [Railway](https://railway.app) | $5/month credit | Easy migration from docker-compose |
| [CockroachDB](https://cockroachlabs.cloud) | 10GB free | Distributed, PostgreSQL-compatible |

**Setting Up Neon (Example):**
1. Create account at https://neon.tech
2. Create a new project → database
3. Copy the connection string
4. Set it as the secret:
   ```bash
   npx wrangler secret put DATABASE_URL
   # Paste: postgresql://user:password@ep-xxx.neon.tech/dbname?sslmode=require
   ```

**Migration from Docker Compose:**
```bash
# Export from local Postgres
pg_dump -h localhost -U ignition ignition_db > backup.sql

# Import to Neon (get connection string from dashboard)
psql "postgresql://user:pass@ep-xxx.neon.tech/dbname?sslmode=require" < backup.sql
```

---

### Issue 3: Container Won't Start

**Error:**
```
Failed to start container: The container is not listening in the TCP address 10.0.0.1:8080
```

**Root Cause:** Container crashes during startup before binding to port 8080.

**Debug Steps:**

1. Check container logs in Cloudflare Dashboard:
   - Workers & Pages → ignition-api → Logs

2. Common startup failures:
   - Missing required environment variables
   - Database connection failure (see Issue 2)
   - Binary not found in Docker image

3. Verify the Dockerfile builds correctly:
   ```bash
   cd app/backend
   docker build -t ignition-api .
   docker run -p 8080:8080 -e DATABASE_URL="..." ignition-api
   ```

---

## Required Secrets Checklist

Set all these secrets before deploying:

```bash
cd deploy/cloudflare-containers

# Database (CRITICAL - must be publicly accessible)
npx wrangler secret put DATABASE_URL

# Session encryption
npx wrangler secret put SESSION_SECRET

# Google OAuth
npx wrangler secret put GOOGLE_CLIENT_ID
npx wrangler secret put GOOGLE_CLIENT_SECRET

# Azure OAuth
npx wrangler secret put AZURE_CLIENT_ID
npx wrangler secret put AZURE_CLIENT_SECRET
npx wrangler secret put AZURE_TENANT_ID

# R2 Storage (optional - can use R2 binding instead)
npx wrangler secret put STORAGE_ENDPOINT
npx wrangler secret put STORAGE_ACCESS_KEY_ID
npx wrangler secret put STORAGE_SECRET_ACCESS_KEY
```

---

## Deployment Order

Always deploy in this order:

1. **Fix route conflicts** (see Issue 1)
2. **API Container**: `cd deploy/cloudflare-containers && npx wrangler deploy`
3. **Frontend Container**: `cd deploy/cloudflare-frontend && npx wrangler deploy`
4. **Landing Page**: `cd deploy/cloudflare-landing && npx wrangler deploy`

Or use the script:
```bash
export CLOUDFLARE_API_TOKEN="..."
export CLOUDFLARE_ZONE_ID="..."
./deploy/scripts/manage-routes.sh deploy
```

---

## Verifying Deployment

```bash
# Check API health
curl https://api.ecent.online/health

# Check landing page
curl https://ignition.ecent.online/

# Check frontend (via landing proxy)
curl https://ignition.ecent.online/app/
```
