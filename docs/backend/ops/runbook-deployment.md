# Runbook: Backend Deployment

Standard deployment procedure for the Ignition backend.

---

## Pre-Deployment Checklist

- [ ] All tests passing on `main` / target branch
- [ ] No critical issues in staging
- [ ] Database migrations tested in staging
- [ ] Rollback plan reviewed
- [ ] On-call aware of deployment

---

## Deployment Steps

### 1. Prepare Release

```bash
# Tag release
git tag -a v1.2.3 -m "Release v1.2.3"
git push origin v1.2.3

# Or for branch deployment
git checkout refactor/stack-split
git pull origin refactor/stack-split
```

### 2. Build Docker Image

```bash
# Build production image
cd app/backend
docker build -t ignition-api:v1.2.3 .

# Push to registry
docker tag ignition-api:v1.2.3 registry.example.com/ignition-api:v1.2.3
docker push registry.example.com/ignition-api:v1.2.3
```

### 3. Run Database Migrations

```bash
# Connect to production database
psql $PROD_DATABASE_URL

# Apply new migrations (in order)
\i /path/to/migrations/0015_new_migration.sql

# Verify migration
SELECT * FROM schema_migrations ORDER BY version DESC LIMIT 5;
```

### 4. Deploy to Production

```bash
# Update container orchestration (example: Docker Compose)
cd deploy/production

# Pull new image
docker compose pull api

# Rolling restart
docker compose up -d --no-deps api

# Verify container started
docker compose ps
docker compose logs api --tail 50
```

### 5. Verify Deployment

```bash
# Health check
curl -f https://api.ecent.online/health || echo "HEALTH CHECK FAILED"

# Version check
curl https://api.ecent.online/api/ | jq '.version'

# Smoke tests
npm run test:smoke --prefix tests/
```

---

## Post-Deployment

- [ ] Monitor error rates (10 min)
- [ ] Check response times
- [ ] Verify auth flow works
- [ ] Update deployment log
- [ ] Close deployment ticket

---

## Rollback Trigger Conditions

Initiate rollback if:
- Health check fails for > 5 minutes
- Error rate > 5% for > 5 minutes
- P0 bug discovered
- Auth flow broken

See [Rollback Runbook](./runbook-rollback.md) for procedure.

---

## Deployment Log

| Date | Version | Deployer | Notes |
|------|---------|----------|-------|
| 2026-01-08 | v1.0.0 | Initial | Migration to Postgres |
