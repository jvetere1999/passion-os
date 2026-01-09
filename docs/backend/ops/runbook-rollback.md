# Runbook: Emergency Rollback

Emergency procedure to rollback the Ignition backend to a previous version.

---

## When to Rollback

Immediate rollback triggers:
- **Health checks failing** > 5 minutes
- **Auth flow broken** (users cannot login)
- **Data corruption** detected
- **Error rate** > 5% sustained
- **P0 security vulnerability** discovered

---

## Rollback Steps

### 1. Confirm Decision

```bash
# Verify current health
curl https://api.ecent.online/health

# Check error rate in logs
docker logs ignition-api --tail 100 2>&1 | grep -c "ERROR"

# Confirm with on-call lead
```

### 2. Identify Target Version

```bash
# List recent deployments
docker images ignition-api --format "{{.Tag}} {{.CreatedAt}}" | head -10

# Identify last known good version
# Example: v1.2.2 (before v1.2.3)
```

### 3. Execute Rollback

```bash
cd deploy/production

# Stop current containers
docker compose stop api

# Update image tag in .env or compose file
echo "IMAGE_TAG=v1.2.2" >> .env

# Start with previous version
docker compose up -d api

# Verify container started
docker compose ps
```

### 4. Verify Rollback

```bash
# Health check
curl -f https://api.ecent.online/health

# Version check (should show old version)
curl https://api.ecent.online/api/ | jq '.version'

# Auth flow test
curl -I https://api.ecent.online/auth/login
```

### 5. Database Rollback (If Needed)

⚠️ **Only if migration caused data issues**

```bash
# Connect to database
psql $PROD_DATABASE_URL

# View migration history
SELECT * FROM schema_migrations ORDER BY version DESC LIMIT 10;

# Apply rollback script (must be pre-prepared)
\i /path/to/rollback/0015_rollback.sql

# Verify schema state
\d important_table
```

---

## Post-Rollback

### Immediate (0-30 min)
- [ ] Verify health checks passing
- [ ] Monitor error rates
- [ ] Confirm auth flow works
- [ ] Notify stakeholders

### Short-term (1-4 hours)
- [ ] Root cause analysis started
- [ ] Incident ticket created
- [ ] On-call log updated

### Long-term (24-48 hours)
- [ ] Postmortem scheduled
- [ ] Fix developed and tested
- [ ] Re-deployment plan created

---

## Rollback Contacts

| Role | Escalation Path |
|------|-----------------|
| On-call Engineer | First responder |
| Tech Lead | Decision authority |
| Database Admin | If DB rollback needed |

---

## Common Rollback Scenarios

### Scenario: Bad Migration

```bash
# If migration breaks queries
# 1. Rollback container
docker compose stop api
docker compose up -d api  # previous version

# 2. Rollback migration
psql $PROD_DATABASE_URL -c "DELETE FROM schema_migrations WHERE version = '0015'"
psql $PROD_DATABASE_URL -f rollback/0015_rollback.sql
```

### Scenario: Configuration Error

```bash
# If env var caused issue
# 1. Fix configuration
vim deploy/production/.env

# 2. Restart with corrected config
docker compose up -d --force-recreate api
```

### Scenario: Resource Exhaustion

```bash
# If container OOM or CPU spike
# 1. Scale down features
docker compose up -d api  # restart

# 2. If persists, rollback to previous version
docker compose stop api
echo "IMAGE_TAG=v1.2.2" >> .env
docker compose up -d api
```

---

## Rollback Log

| Date | From | To | Reason | Duration |
|------|------|-----|--------|----------|
| (none yet) | | | | |
