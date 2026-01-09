# Image Tag and Migration Strategy

**Date:** January 7, 2026  
**Branch:** `refactor/stack-split`  
**Purpose:** Define versioning, tagging, and migration deployment strategy

---

## Overview

This document defines the strategy for:
1. Container image versioning and tagging
2. Database migration deployment
3. Version-schema compatibility
4. Rollback procedures

---

## Image Tagging Strategy

### Tag Format

```
<image-name>:<version>[-<qualifier>]

Format:
  ignition-api:v<major>.<minor>.<patch>[-<qualifier>]

Examples:
  ignition-api:v1.0.0        # Stable release
  ignition-api:v1.0.1        # Patch release
  ignition-api:v1.1.0-rc1    # Release candidate
  ignition-api:v1.1.0-beta   # Beta release
  ignition-api:latest        # Latest stable (mutable)
  ignition-api:main-abc123f  # CI build (commit SHA)
```

### Semantic Versioning

| Version Part | When to Increment | Breaking Changes |
|--------------|-------------------|------------------|
| MAJOR (v1.x.x) | Breaking API/schema changes | Yes |
| MINOR (vX.1.x) | New features, additive schema | No |
| PATCH (vX.X.1) | Bug fixes, no schema changes | No |

### Tag Mutability

| Tag Type | Mutable | Use Case |
|----------|---------|----------|
| `v1.0.0` | No | Production releases (immutable) |
| `latest` | Yes | Points to latest stable |
| `main-<sha>` | Yes | CI builds, overwritten |
| `v1.1.0-rc1` | No | Pre-release testing |

---

## Version File

Every release includes a VERSION file embedded in the image:

### Build-Time Embedding

```dockerfile
# In Dockerfile
ARG VERSION=dev
RUN echo "$VERSION" > /app/VERSION
```

### Build Command

```bash
docker build \
  --build-arg VERSION=v1.0.0 \
  -t ignition-api:v1.0.0 \
  .
```

### Runtime Verification

```bash
# Check version in running container
docker exec ignition-api cat /app/VERSION
# Output: v1.0.0

# Or via health endpoint
curl https://api.ecent.online/health
# Output: {"status":"ok","version":"v1.0.0"}
```

---

## Migration Strategy

### Principles

1. **Forward-Only in Production** - Never run down migrations in production unless rolling back
2. **Version Compatibility** - Each app version declares min/max schema versions
3. **Additive Preferred** - Prefer additive changes over destructive
4. **Down Migrations Required** - Every up migration must have a down migration
5. **Test Rollbacks** - Down migrations must be tested in staging

### Migration File Naming

```
<sequence>_<name>.sql
<sequence>_<name>.down.sql

Examples:
0001_auth_substrate.sql
0001_auth_substrate.down.sql
0002_gamification_substrate.sql
0002_gamification_substrate.down.sql
```

### Migration Execution

```bash
# Apply single migration
psql "$DATABASE_URL" -f migrations/0001_auth_substrate.sql

# Apply all migrations (in order)
for f in migrations/000*.sql; do
  [[ "$f" != *".down.sql" ]] && psql "$DATABASE_URL" -f "$f"
done

# Rollback single migration
psql "$DATABASE_URL" -f migrations/0007_market_substrate.down.sql
```

---

## Version-Schema Compatibility

### Compatibility Matrix

| App Version | Min Schema | Max Schema | Status |
|-------------|------------|------------|--------|
| v1.0.0 | 0001 | 0007 | Current |
| v1.1.0 | 0007 | 0010 | Planned |
| v0.9.0 | 0001 | 0004 | Legacy |

### Compatibility Check (Backend)

```rust
// In backend startup
const MIN_SCHEMA_VERSION: u32 = 1;
const MAX_SCHEMA_VERSION: u32 = 7;

fn check_schema_compatibility(db: &Pool) -> Result<()> {
    let version: u32 = sqlx::query_scalar("SELECT MAX(version) FROM schema_migrations")
        .fetch_one(db)
        .await?;
    
    if version < MIN_SCHEMA_VERSION || version > MAX_SCHEMA_VERSION {
        return Err(Error::IncompatibleSchema {
            current: version,
            min: MIN_SCHEMA_VERSION,
            max: MAX_SCHEMA_VERSION,
        });
    }
    Ok(())
}
```

---

## Deployment Workflow

### Standard Deployment

```
1. Build & Tag Image
   └─> docker build -t ignition-api:v1.1.0 .
   
2. Run Migrations (if needed)
   └─> psql $DATABASE_URL -f migrations/0008_new_feature.sql
   
3. Deploy New Image
   └─> export IMAGE_TAG=v1.1.0
   └─> docker compose up -d api
   
4. Verify Health
   └─> curl -f /health
   
5. Update 'latest' Tag
   └─> docker tag ignition-api:v1.1.0 ignition-api:latest
```

### Rollback Workflow

```
1. Stop Current Deployment
   └─> docker compose stop api
   
2. Rollback Migrations (if needed)
   └─> psql $DATABASE_URL -f migrations/0008_new_feature.down.sql
   
3. Deploy Previous Image
   └─> export IMAGE_TAG=v1.0.0
   └─> docker compose up -d api
   
4. Verify Health
   └─> curl -f /health
```

---

## Migration Types

### Type 1: Additive (Safe)

No rollback risk; can deploy image before or after migration.

```sql
-- Example: Adding a column
ALTER TABLE users ADD COLUMN new_field TEXT;

-- Down migration
ALTER TABLE users DROP COLUMN new_field;
```

**Deployment Order:** Migration → Image (either order works)

### Type 2: Destructive (Risky)

Data loss possible; requires careful coordination.

```sql
-- Example: Removing a column
ALTER TABLE users DROP COLUMN old_field;

-- Down migration (data lost)
ALTER TABLE users ADD COLUMN old_field TEXT;
```

**Deployment Order:**
1. Deploy new image (stops using column)
2. Wait for traffic to drain
3. Apply migration
4. Cannot easily rollback (data lost)

### Type 3: Rename/Transform (Complex)

Requires multi-step deployment.

```sql
-- Example: Renaming a column
-- Step 1: Add new column
ALTER TABLE users ADD COLUMN new_name TEXT;

-- Step 2: Copy data (in application or migration)
UPDATE users SET new_name = old_name;

-- Step 3: Deploy app using new column

-- Step 4: Drop old column (later)
ALTER TABLE users DROP COLUMN old_name;
```

---

## Blue-Green Migration Pattern

For zero-downtime deployments with migrations:

```
Current State: v1.0.0 (Schema v5)

1. Apply additive migration (v6)
   - Schema supports both v1.0.0 and v1.1.0
   
2. Deploy v1.1.0 (compatible with v5-v6)
   - Old and new versions can coexist
   
3. Drain traffic from old version
   
4. Terminate v1.0.0 instances
   
5. (Optional) Apply cleanup migration (v7)
   - Remove backward compatibility
```

---

## Backup Strategy

### Pre-Migration Backup

```bash
# Always backup before migrations
pg_dump "$DATABASE_URL" \
  --format=custom \
  --file="backup_$(date +%Y%m%d_%H%M%S).dump"
```

### Backup Retention

| Type | Retention | Storage |
|------|-----------|---------|
| Pre-migration | 7 days | Local + S3 |
| Daily | 30 days | S3 |
| Weekly | 90 days | S3 |
| Monthly | 1 year | S3 Glacier |

### Restore from Backup

```bash
# Restore full backup
pg_restore \
  --dbname="$DATABASE_URL" \
  --clean \
  --if-exists \
  backup_20260107_120000.dump
```

---

## CI/CD Integration

### Build Pipeline

```yaml
# .github/workflows/build.yml
on:
  push:
    tags:
      - 'v*'

jobs:
  build:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      
      - name: Extract version
        id: version
        run: echo "VERSION=${GITHUB_REF#refs/tags/}" >> $GITHUB_OUTPUT
      
      - name: Build image
        run: |
          docker build \
            --build-arg VERSION=${{ steps.version.outputs.VERSION }} \
            -t ignition-api:${{ steps.version.outputs.VERSION }} \
            -t ignition-api:latest \
            app/backend
      
      - name: Push to registry
        run: |
          docker push ignition-api:${{ steps.version.outputs.VERSION }}
          docker push ignition-api:latest
```

### Deploy Pipeline

```yaml
# .github/workflows/deploy.yml
on:
  workflow_dispatch:
    inputs:
      version:
        description: 'Version to deploy'
        required: true

jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
      - name: Deploy
        run: |
          ssh deploy@server "
            cd /opt/ignition
            export IMAGE_TAG=${{ inputs.version }}
            docker compose pull api
            docker compose up -d api
          "
```

---

## Monitoring

### Version Metrics

```
# Prometheus metrics
ignition_app_version{version="v1.0.0"} 1
ignition_schema_version{version="7"} 1
```

### Alerts

| Alert | Condition | Severity |
|-------|-----------|----------|
| VersionMismatch | Schema version incompatible | Critical |
| MigrationFailed | Migration script error | Critical |
| RollbackRequired | Health check failed after deploy | High |

---

## Checklist

### Pre-Deployment

- [ ] Image built and tagged with version
- [ ] VERSION file embedded in image
- [ ] Migrations tested in staging
- [ ] Down migrations tested
- [ ] Backup created
- [ ] Rollback plan documented

### Post-Deployment

- [ ] Health check passing
- [ ] Version endpoint returns correct version
- [ ] No errors in logs
- [ ] Metrics reporting correctly
- [ ] Update `latest` tag

---

## References

- [deploy/README.md](../../deploy/README.md) - Deployment guide
- [deploy/rollback.md](../../deploy/rollback.md) - Rollback procedures
- [app/database/migrations/](../../app/database/migrations/) - Schema migrations
- [local_dev_auth_bypass.md](./local_dev_auth_bypass.md) - Dev bypass guardrails

