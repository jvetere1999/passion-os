# Runbook: Database Operations

Database maintenance and recovery procedures for Ignition.

---

## Database Details

| Property | Value |
|----------|-------|
| Engine | PostgreSQL 17 |
| Host | (see secrets) |
| Port | 5432 |
| Database | ignition |
| Migrations | `app/database/migrations/` |

---

## Daily Operations

### Health Check

```bash
# Quick health check
psql $DATABASE_URL -c "SELECT 1"

# Connection count
psql $DATABASE_URL -c "
  SELECT count(*) as active_connections
  FROM pg_stat_activity
  WHERE state = 'active'
"

# Database size
psql $DATABASE_URL -c "
  SELECT pg_size_pretty(pg_database_size('ignition')) as db_size
"
```

### Table Statistics

```bash
psql $DATABASE_URL -c "
  SELECT 
    schemaname,
    relname as table_name,
    n_live_tup as row_count,
    pg_size_pretty(pg_total_relation_size(relid)) as total_size
  FROM pg_stat_user_tables
  ORDER BY n_live_tup DESC
  LIMIT 20
"
```

---

## Migration Operations

### Apply New Migration

```bash
# List pending migrations
ls -la app/database/migrations/

# Apply migration
psql $DATABASE_URL -f app/database/migrations/0015_new_feature.sql

# Verify
psql $DATABASE_URL -c "SELECT * FROM schema_migrations ORDER BY version DESC LIMIT 5"
```

### Create Migration

```bash
# Naming convention: NNNN_description.sql
# Example: 0015_add_user_preferences.sql

cat > app/database/migrations/0015_add_user_preferences.sql << 'EOF'
-- Migration: 0015_add_user_preferences
-- Date: 2026-01-08
-- Description: Add user preferences table

BEGIN;

CREATE TABLE IF NOT EXISTS user_preferences (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    key TEXT NOT NULL,
    value JSONB NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(user_id, key)
);

CREATE INDEX idx_user_preferences_user_id ON user_preferences(user_id);

INSERT INTO schema_migrations (version) VALUES ('0015');

COMMIT;
EOF
```

### Rollback Migration

```bash
# Apply rollback script (must be pre-prepared)
psql $DATABASE_URL -f app/database/rollback/0015_rollback.sql

# Example rollback script:
cat > app/database/rollback/0015_rollback.sql << 'EOF'
-- Rollback: 0015_add_user_preferences

BEGIN;

DROP TABLE IF EXISTS user_preferences;
DELETE FROM schema_migrations WHERE version = '0015';

COMMIT;
EOF
```

---

## Backup Operations

### Create Backup

```bash
# Full database dump
pg_dump $DATABASE_URL \
  --format=custom \
  --file="backup-$(date +%Y%m%d-%H%M%S).dump"

# With compression
pg_dump $DATABASE_URL \
  --format=custom \
  --compress=9 \
  --file="backup-$(date +%Y%m%d-%H%M%S).dump.gz"
```

### Restore from Backup

```bash
# Warning: This will overwrite existing data!

# Drop and recreate database (if needed)
psql postgres -c "DROP DATABASE IF EXISTS ignition_restore"
psql postgres -c "CREATE DATABASE ignition_restore"

# Restore
pg_restore \
  --dbname="postgres://ignition:password@host:5432/ignition_restore" \
  --clean \
  --if-exists \
  backup-20260108-120000.dump
```

### Verify Backup

```bash
# List contents of backup
pg_restore --list backup-20260108-120000.dump | head -50

# Restore to temp database for verification
pg_restore \
  --dbname="postgres://ignition:password@host:5432/ignition_verify" \
  backup-20260108-120000.dump

# Run verification queries
psql ignition_verify -c "SELECT count(*) FROM users"
psql ignition_verify -c "SELECT count(*) FROM activity_events"
```

---

## Performance Tuning

### Analyze Tables

```bash
# Update table statistics
psql $DATABASE_URL -c "ANALYZE VERBOSE"

# Analyze specific table
psql $DATABASE_URL -c "ANALYZE VERBOSE activity_events"
```

### Identify Slow Queries

```bash
psql $DATABASE_URL -c "
  SELECT 
    query,
    calls,
    mean_exec_time::int as avg_ms,
    total_exec_time::int as total_ms
  FROM pg_stat_statements
  ORDER BY mean_exec_time DESC
  LIMIT 10
"
```

### Check Index Usage

```bash
psql $DATABASE_URL -c "
  SELECT 
    schemaname,
    tablename,
    indexname,
    idx_scan,
    idx_tup_read,
    idx_tup_fetch
  FROM pg_stat_user_indexes
  ORDER BY idx_scan DESC
  LIMIT 20
"
```

### Vacuum Operations

```bash
# Regular vacuum (non-blocking)
psql $DATABASE_URL -c "VACUUM ANALYZE"

# Full vacuum (blocking, reclaims disk space)
# Warning: Locks tables!
psql $DATABASE_URL -c "VACUUM FULL ANALYZE activity_events"
```

---

## Data Cleanup

### Purge Old Activity Events

```bash
psql $DATABASE_URL -c "
  DELETE FROM activity_events
  WHERE created_at < NOW() - INTERVAL '2 years'
"
```

### Purge Old Sessions

```bash
psql $DATABASE_URL -c "
  DELETE FROM sessions
  WHERE expires_at < NOW() - INTERVAL '90 days'
"
```

### Hard Delete Expired Accounts

```bash
psql $DATABASE_URL -c "
  DELETE FROM users
  WHERE deleted_at IS NOT NULL
  AND deleted_at < NOW() - INTERVAL '30 days'
"
```

---

## Emergency Procedures

### Connection Leak

```bash
# Identify connections
psql $DATABASE_URL -c "
  SELECT pid, usename, application_name, client_addr, state, query
  FROM pg_stat_activity
  WHERE state != 'idle'
  ORDER BY backend_start
"

# Terminate specific connection
psql $DATABASE_URL -c "SELECT pg_terminate_backend(PID_HERE)"

# Terminate all idle connections
psql $DATABASE_URL -c "
  SELECT pg_terminate_backend(pid)
  FROM pg_stat_activity
  WHERE state = 'idle'
  AND query_start < NOW() - INTERVAL '1 hour'
"
```

### Lock Contention

```bash
# Find blocked queries
psql $DATABASE_URL -c "
  SELECT 
    blocked.pid AS blocked_pid,
    blocking.pid AS blocking_pid,
    blocked.query AS blocked_query,
    blocking.query AS blocking_query
  FROM pg_locks AS blocked
  JOIN pg_stat_activity ON blocked.pid = pg_stat_activity.pid
  JOIN pg_locks AS blocking ON blocking.locktype = blocked.locktype
  JOIN pg_stat_activity AS blocking_activity ON blocking.pid = blocking_activity.pid
  WHERE blocked.granted = false
"

# Force terminate blocking query (use with caution)
psql $DATABASE_URL -c "SELECT pg_terminate_backend(BLOCKING_PID)"
```

### Recovery Mode

```bash
# If database needs recovery
# 1. Stop application
docker compose stop api

# 2. Check PostgreSQL logs
docker logs ignition-postgres --tail 200

# 3. If corruption detected, restore from backup
pg_restore --dbname=$DATABASE_URL backup-latest.dump

# 4. Verify data
psql $DATABASE_URL -c "SELECT count(*) FROM users"

# 5. Restart application
docker compose start api
```

---

## Monitoring Queries

### Dashboard Queries

```sql
-- Active users (7 days)
SELECT count(DISTINCT user_id)
FROM activity_events
WHERE created_at > NOW() - INTERVAL '7 days';

-- Focus sessions completed today
SELECT count(*)
FROM focus_sessions
WHERE completed = true
AND completed_at > CURRENT_DATE;

-- Error rate (requires log table)
SELECT 
  count(*) FILTER (WHERE level = 'error') as errors,
  count(*) as total,
  round(100.0 * count(*) FILTER (WHERE level = 'error') / count(*), 2) as error_pct
FROM application_logs
WHERE created_at > NOW() - INTERVAL '1 hour';
```

---

## Related Docs

- [Migration Guide](../../migration/README.md)
- [Data Retention Policy](../../buisness/data-retention-policy.md)
- [Backup Runbook](./runbook-backup.md)
