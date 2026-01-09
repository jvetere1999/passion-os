# Ignition Deployment Guide

**Date:** January 7, 2026  
**Branch:** `refactor/stack-split`  
**Target:** Self-hosted, two-container deployment (Backend + Postgres)

---

## Overview

Ignition is deployed as a two-container system:
1. **ignition-api** - Rust backend (Axum + Tower)
2. **ignition-postgres** - PostgreSQL 17 database

Frontend and Admin are static builds served separately (e.g., CDN, nginx, or Cloudflare Pages).

---

## Architecture

```
                    ┌─────────────────┐
                    │   Load Balancer │
                    │  (nginx/traefik)│
                    └────────┬────────┘
                             │
           ┌─────────────────┼─────────────────┐
           │                 │                 │
           ▼                 ▼                 ▼
    ┌─────────────┐   ┌─────────────┐   ┌─────────────┐
    │  Frontend   │   │  Admin UI   │   │   Backend   │
    │  (Static)   │   │  (Static)   │   │   (Rust)    │
    │ CDN/nginx   │   │ CDN/nginx   │   │  Container  │
    └─────────────┘   └─────────────┘   └──────┬──────┘
                                               │
                                               ▼
                                        ┌─────────────┐
                                        │  PostgreSQL │
                                        │  Container  │
                                        └─────────────┘
```

---

## Prerequisites

- Docker and Docker Compose v2+
- PostgreSQL 17 (or use container)
- R2 bucket configured (Cloudflare)
- OAuth app credentials (Google, Azure)
- Azure Key Vault (for production secrets)

---

## Directory Structure

```
deploy/
├── README.md              # This file
├── rollback.md           # Rollback procedures
├── production/
│   ├── docker-compose.yml
│   └── .env.example
└── scripts/
    ├── deploy.sh
    ├── rollback.sh
    └── health-check.sh

infra/
├── docker-compose.yml    # Local development
└── .env.example          # Local env template
```

---

## Local Development

### Quick Start

```bash
# 1. Navigate to infra directory
cd infra

# 2. Copy environment template
cp .env.example .env

# 3. Start dependencies only
docker compose up -d

# 4. Run migrations
docker exec ignition-postgres psql -U ignition -d ignition \
  -f /docker-entrypoint-initdb.d/0001_auth_substrate.sql

# 5. Start backend (optional, for full-stack testing)
docker compose --profile full up -d

# 6. Start everything including frontend/admin
docker compose --profile dev up -d
```

### Development Profiles

| Profile | Services | Use Case |
|---------|----------|----------|
| (default) | postgres, minio | Backend development with local cargo run |
| full | + api | Full backend testing in container |
| dev | + frontend, admin | Complete stack testing |

### Ports

| Service | Port | Description |
|---------|------|-------------|
| PostgreSQL | 5432 | Database |
| MinIO API | 9000 | S3-compatible storage |
| MinIO Console | 9001 | Storage admin UI |
| Backend API | 8080 | Rust backend |
| Frontend | 3000 | Next.js frontend |
| Admin | 3001 | Admin console |

---

## Production Deployment

### 1. Build Images

```bash
# Build backend with version tag
cd app/backend
docker build -t ignition-api:v1.0.0 .
docker tag ignition-api:v1.0.0 ignition-api:latest

# Push to registry (if using remote registry)
docker push registry.example.com/ignition-api:v1.0.0
docker push registry.example.com/ignition-api:latest
```

### 2. Database Setup

```bash
# Apply migrations in order
for f in app/database/migrations/000*.sql; do
  [[ "$f" != *".down.sql" ]] && \
    psql "$DATABASE_URL" -f "$f"
done
```

### 3. Deploy with Compose

```bash
# Pull latest images
docker compose -f deploy/production/docker-compose.yml pull

# Deploy with zero-downtime
docker compose -f deploy/production/docker-compose.yml up -d --remove-orphans
```

### 4. Health Check

```bash
# Verify deployment
curl -f https://api.ecent.online/health

# Check logs
docker logs ignition-api --tail 100
```

---

## Environment Variables

### Required (Production)

| Variable | Description | Example |
|----------|-------------|---------|
| `DATABASE_URL` | Postgres connection string | `postgres://user:pass@host:5432/db` |
| `SESSION_SECRET` | Session signing key (32+ chars) | `<random-string>` |
| `AUTH_COOKIE_DOMAIN` | Cookie domain | `ecent.online` |
| `GOOGLE_CLIENT_ID` | Google OAuth client | `xxx.apps.googleusercontent.com` |
| `GOOGLE_CLIENT_SECRET` | Google OAuth secret | `<secret>` |
| `AZURE_CLIENT_ID` | Azure OAuth client | `<guid>` |
| `AZURE_CLIENT_SECRET` | Azure OAuth secret | `<secret>` |
| `AZURE_TENANT_ID` | Azure tenant | `<guid>` |
| `STORAGE_ENDPOINT` | R2/S3 endpoint | `https://xxx.r2.cloudflarestorage.com` |
| `STORAGE_ACCESS_KEY_ID` | R2 access key | `<key>` |
| `STORAGE_SECRET_ACCESS_KEY` | R2 secret | `<secret>` |
| `STORAGE_BUCKET` | R2 bucket name | `ignition` |

### Optional

| Variable | Default | Description |
|----------|---------|-------------|
| `SERVER_PORT` | `8080` | Backend port |
| `SERVER_ENVIRONMENT` | `production` | Environment name |
| `CORS_ALLOWED_ORIGINS` | (required) | Comma-separated origins |
| `AUTH_DEV_BYPASS` | `false` | **Never enable in production** |

---

## Image Tagging Strategy

### Tag Format

```
ignition-api:<version>[-<suffix>]

Examples:
  ignition-api:v1.0.0          # Release version
  ignition-api:v1.0.0-rc1      # Release candidate
  ignition-api:latest          # Latest stable
  ignition-api:main-abc123f    # Branch + commit SHA
```

### Tagging Policy

| Tag | When | Mutable |
|-----|------|---------|
| `v1.0.0` | Release | No (immutable) |
| `latest` | After release validation | Yes |
| `main-<sha>` | CI builds | Yes (overwritten) |

### Version File

Track deployed version:

```bash
# In container or deployment
cat /app/VERSION
# Output: v1.0.0

# Or via API
curl https://api.ecent.online/health
# Output: {"status":"ok","version":"v1.0.0"}
```

---

## Migration Strategy

See [../docs/backend/migration/image_tag_and_migration_strategy.md](../docs/backend/migration/image_tag_and_migration_strategy.md)

### Key Points

1. **Always migrate forward** - No destructive migrations in production
2. **Version lock** - Tag migrations with app version
3. **Rollback plan** - Keep down migrations, tested
4. **Backup first** - pg_dump before any migration

---

## Rollback

See [rollback.md](./rollback.md) for detailed procedures.

### Quick Rollback

```bash
# 1. Stop current deployment
docker compose down

# 2. Rollback to previous image
export IMAGE_TAG=v0.9.0
docker compose up -d

# 3. Rollback migrations if needed
psql "$DATABASE_URL" -f app/database/migrations/0007_market_substrate.down.sql
# ... continue in reverse order as needed
```

---

## Monitoring

### Health Endpoints

| Endpoint | Description |
|----------|-------------|
| `GET /health` | Basic liveness check |
| `GET /health/ready` | Readiness (includes DB check) |
| `GET /health/live` | Kubernetes liveness probe |

### Logs

```bash
# Backend logs
docker logs ignition-api -f

# Database logs
docker logs ignition-postgres -f

# All services
docker compose logs -f
```

### Metrics

Backend exposes Prometheus metrics at `/metrics` (when enabled).

---

## Security Checklist

- [ ] `AUTH_DEV_BYPASS=false` in production
- [ ] `SESSION_SECRET` is cryptographically random (32+ chars)
- [ ] OAuth credentials stored in Azure Key Vault
- [ ] Database password is strong and rotated
- [ ] TLS termination at load balancer
- [ ] CORS origins explicitly listed
- [ ] Container runs as non-root user
- [ ] Network is private (backend ↔ database)

---

## Troubleshooting

### Container Won't Start

```bash
# Check logs
docker logs ignition-api

# Common issues:
# - DATABASE_URL incorrect
# - Port already in use
# - Missing environment variables
```

### Database Connection Failed

```bash
# Test connectivity
docker exec ignition-api nc -zv postgres 5432

# Check credentials
psql "$DATABASE_URL" -c "SELECT 1"
```

### OAuth Not Working

```bash
# Verify redirect URIs in OAuth provider console
# Must match: https://api.ecent.online/auth/callback/{provider}

# Check environment variables
docker exec ignition-api env | grep -E "(GOOGLE|AZURE)"
```

---

## References

- [infra/docker-compose.yml](../infra/docker-compose.yml) - Local dev compose
- [rollback.md](./rollback.md) - Rollback procedures
- [Image Strategy](../docs/backend/migration/image_tag_and_migration_strategy.md)
- [Auth Bypass Guardrails](../docs/backend/migration/local_dev_auth_bypass.md)

