# Ignition Rollback Procedures

**Date:** January 7, 2026  
**Branch:** `refactor/stack-split`  
**Purpose:** Step-by-step rollback procedures for deployments and migrations

---

## Overview

Rollback scenarios:

1. **Image Rollback** - Revert to previous container version
2. **Migration Rollback** - Revert database schema changes
3. **Full Rollback** - Revert both image and migrations
4. **Data Rollback** - Restore from backup (disaster recovery)

---

## Pre-Rollback Checklist

Before any rollback:

- [ ] Identify the target rollback version
- [ ] Verify target version images exist
- [ ] Verify down migrations exist for affected schemas
- [ ] Create database backup (pg_dump)
- [ ] Notify stakeholders of planned downtime
- [ ] Have database credentials ready

---

## 1. Image Rollback

### Scenario

Application code has a bug; database schema is unchanged.

### Procedure

```bash
# 1. Identify current and target versions
docker inspect ignition-api | grep IMAGE_TAG
# Current: v1.1.0, Target: v1.0.0

# 2. Pull target image (if not cached)
docker pull registry.example.com/ignition-api:v1.0.0

# 3. Stop current deployment
docker compose -f deploy/production/docker-compose.yml stop api

# 4. Update image tag
export IMAGE_TAG=v1.0.0

# 5. Start with previous version
docker compose -f deploy/production/docker-compose.yml up -d api

# 6. Verify health
curl -f https://api.ecent.online/health
# Expected: {"status":"ok","version":"v1.0.0"}

# 7. Monitor logs
docker logs ignition-api --tail 100 -f
```

### Rollback Time

- **Estimated:** 1-2 minutes
- **Downtime:** ~30 seconds (container restart)

---

## 2. Migration Rollback

### Scenario

Database schema change caused issues; need to revert schema.

### Procedure

```bash
# 1. Identify migrations to rollback
ls -la app/database/migrations/*.down.sql

# 2. Create backup FIRST
pg_dump "$DATABASE_URL" > backup_$(date +%Y%m%d_%H%M%S).sql

# 3. Stop application (prevent writes during rollback)
docker compose -f deploy/production/docker-compose.yml stop api

# 4. Apply down migrations in REVERSE order
# Example: Rolling back from 0007 to 0005

psql "$DATABASE_URL" -f app/database/migrations/0007_market_substrate.down.sql
psql "$DATABASE_URL" -f app/database/migrations/0006_planning_substrate.down.sql

# 5. Verify schema state
psql "$DATABASE_URL" -c "\dt"

# 6. Deploy matching application version
export IMAGE_TAG=v1.0.0  # Version that matches schema at 0005
docker compose -f deploy/production/docker-compose.yml up -d api

# 7. Verify health
curl -f https://api.ecent.online/health
```

### Migration Rollback Matrix

| Current | Target | Down Migrations to Apply |
|---------|--------|--------------------------|
| 0007 | 0006 | 0007_market_substrate.down.sql |
| 0007 | 0005 | 0007, 0006 (in reverse order) |
| 0007 | 0004 | 0007, 0006, 0005 (in reverse order) |
| 0007 | 0001 | All 0007 → 0002 in reverse |

### Rollback Time

- **Estimated:** 5-10 minutes (depends on data volume)
- **Downtime:** Duration of migration execution

---

## 3. Full Rollback

### Scenario

Both application code and database schema need rollback.

### Procedure

```bash
# 1. Create backup
pg_dump "$DATABASE_URL" > backup_$(date +%Y%m%d_%H%M%S).sql

# 2. Stop application
docker compose -f deploy/production/docker-compose.yml stop api

# 3. Apply down migrations (in reverse order)
for version in 0007 0006 0005; do
  psql "$DATABASE_URL" -f "app/database/migrations/${version}_*.down.sql"
done

# 4. Update to target image
export IMAGE_TAG=v0.9.0  # Matching version

# 5. Start application
docker compose -f deploy/production/docker-compose.yml up -d api

# 6. Verify
curl -f https://api.ecent.online/health
```

---

## 4. Data Rollback (Disaster Recovery)

### Scenario

Data corruption or accidental deletion requires restore from backup.

### Procedure

```bash
# 1. Stop application
docker compose -f deploy/production/docker-compose.yml stop api

# 2. Connect to database
psql "$DATABASE_URL"

# 3. Drop and recreate database (DESTRUCTIVE)
DROP DATABASE ignition;
CREATE DATABASE ignition;
\q

# 4. Restore from backup
psql "$DATABASE_URL" < backup_20260107_120000.sql

# 5. Verify data
psql "$DATABASE_URL" -c "SELECT COUNT(*) FROM users;"

# 6. Start application
docker compose -f deploy/production/docker-compose.yml up -d api
```

### Rollback Time

- **Estimated:** 10-60 minutes (depends on backup size)
- **Downtime:** Full restoration duration

---

## Version Compatibility Matrix

| App Version | Min Schema | Max Schema | Notes |
|-------------|------------|------------|-------|
| v1.0.0 | 0001 | 0004 | Initial release |
| v1.1.0 | 0005 | 0007 | Added market, planning |
| v1.2.0 | 0007 | 0010 | Added learn, reference |

### Compatibility Check

Before rollback, verify version-schema compatibility:

```bash
# Check current schema version
psql "$DATABASE_URL" -c "SELECT MAX(version) FROM schema_migrations;"

# Check target version requirements
grep "min_schema" app/backend/Cargo.toml
```

---

## Rollback Scripts

### deploy/scripts/rollback.sh

```bash
#!/bin/bash
set -euo pipefail

# Usage: ./rollback.sh <target-version> [--with-migrations]

TARGET_VERSION="${1:-}"
WITH_MIGRATIONS="${2:-}"

if [ -z "$TARGET_VERSION" ]; then
  echo "Usage: ./rollback.sh <target-version> [--with-migrations]"
  exit 1
fi

echo "=== Rollback to $TARGET_VERSION ==="

# Create backup
echo "Creating backup..."
pg_dump "$DATABASE_URL" > "backup_$(date +%Y%m%d_%H%M%S).sql"

# Stop application
echo "Stopping application..."
docker compose -f deploy/production/docker-compose.yml stop api

# Apply migrations if requested
if [ "$WITH_MIGRATIONS" == "--with-migrations" ]; then
  echo "Applying down migrations..."
  # Add migration rollback logic here
fi

# Update image
echo "Updating image to $TARGET_VERSION..."
export IMAGE_TAG="$TARGET_VERSION"
docker compose -f deploy/production/docker-compose.yml up -d api

# Wait for health
echo "Waiting for health check..."
sleep 10
curl -f https://api.ecent.online/health

echo "=== Rollback complete ==="
```

---

## Emergency Contacts

| Role | Contact | Escalation |
|------|---------|------------|
| On-Call Engineer | - | First responder |
| Backend Lead | - | Technical decisions |
| DBA | - | Database issues |
| Platform Lead | - | Infrastructure issues |

---

## Post-Rollback

After successful rollback:

1. **Document** - Record incident details
2. **Root Cause** - Investigate what went wrong
3. **Fix Forward** - Prepare proper fix for next release
4. **Test** - Ensure fix is tested before re-deployment
5. **Communicate** - Update stakeholders

---

## Rollback Testing

### Monthly Drill

1. Deploy to staging environment
2. Apply latest migrations
3. Practice rollback procedure
4. Verify data integrity
5. Document any issues

### Test Matrix

| Scenario | Last Tested | Result |
|----------|-------------|--------|
| Image rollback | - | - |
| Single migration rollback | - | - |
| Multi-migration rollback | - | - |
| Full restore from backup | - | - |

---

## References

- [deploy/README.md](./README.md) - Deployment guide
- [Image Strategy](../docs/backend/migration/image_tag_and_migration_strategy.md)
- [Migrations](../app/database/migrations/) - Schema migrations

