"Rollback checklist for production cutover. Execute if rollback triggered."

# Rollback Checklist

**Date:** January 7, 2026  
**Branch:** `refactor/stack-split`  
**Purpose:** Step-by-step rollback procedure for failed cutover

---

## Overview

This checklist provides the procedure for rolling back from the new Rust/Postgres stack to the legacy system if critical issues occur during or after cutover.

**Rollback Types:**
1. **Immediate Rollback** - During cutover, before DNS changes
2. **Post-DNS Rollback** - After DNS changes, with traffic on new system
3. **Partial Rollback** - Backend only, keep frontend on new system

---

## Rollback Triggers

Initiate rollback if ANY of these occur:

| Trigger | Threshold | Severity |
|---------|-----------|----------|
| Health check failures | > 3 consecutive | Critical |
| Error rate | > 5% for 5 minutes | Critical |
| Auth failures | > 10% of login attempts | Critical |
| Data corruption | Any confirmed | Critical |
| Security incident | Any confirmed | Critical |
| Response time | > 5s p95 for 10 minutes | High |
| Database connection failures | > 1% | High |
| R2 storage failures | > 5% | Medium |

---

## Pre-Rollback Checklist

Before initiating rollback:

- [ ] Confirm rollback decision with team lead
- [ ] Notify stakeholders of rollback
- [ ] Document the issue triggering rollback
- [ ] Create database backup of current state

```bash
# Create immediate backup
pg_dump "$DATABASE_URL" > backup_pre_rollback_$(date +%Y%m%d_%H%M%S).sql
```

---

## Type 1: Immediate Rollback (During Cutover)

**Scenario:** Issues detected before DNS changes complete.

### Procedure

```bash
# 1. Stop new backend deployment
docker compose -f deploy/production/docker-compose.yml stop api

# 2. Verify legacy system is still running
curl -f https://legacy-api.example.com/health

# 3. If DNS was partially changed, revert DNS
# (Use DNS provider console or CLI)

# 4. Verify legacy system is receiving traffic
# Check access logs

# 5. Document failure and restore timeline
```

### Time Estimate

- **Duration:** 5-10 minutes
- **User Impact:** Minimal (legacy still running)

---

## Type 2: Post-DNS Rollback (Full Rollback)

**Scenario:** Issues detected after DNS changes, users on new system.

### Phase 1: Stop New System (T+0 to T+5m)

```bash
# 1. Create database backup
pg_dump "$DATABASE_URL" > backup_rollback_$(date +%Y%m%d_%H%M%S).sql

# 2. Stop new backend
docker compose -f deploy/production/docker-compose.yml stop api

# 3. Document current state
docker logs ignition-api > logs_rollback_$(date +%Y%m%d_%H%M%S).log 2>&1
```

- [ ] Backup created
- [ ] Backend stopped
- [ ] Logs captured

### Phase 2: DNS Rollback (T+5m to T+15m)

- [ ] Update DNS `api.ecent.online` → legacy backend IP
- [ ] Update DNS `ignition.ecent.online` → legacy frontend (if changed)
- [ ] Update DNS `admin.ignition.ecent.online` → legacy admin (if changed)
- [ ] Wait for propagation (TTL should be 300s from pre-cutover)

### Phase 3: Verify Legacy System (T+15m to T+25m)

```bash
# 1. Verify legacy health
curl -f https://api.ecent.online/health

# 2. Test authentication
# Open browser, attempt login

# 3. Test core functionality
# Verify basic CRUD operations work
```

- [ ] Health check passing
- [ ] Auth working
- [ ] Core features working

### Phase 4: User Communication

- [ ] Notify users of temporary disruption
- [ ] Explain that re-login may be required
- [ ] Provide support contact

### Time Estimate

- **Duration:** 20-30 minutes
- **User Impact:** 15-20 minutes of potential service degradation

---

## Type 3: Backend-Only Rollback

**Scenario:** Backend issues, but frontend can remain on new system.

### Procedure

```bash
# 1. Update frontend API_URL to point to legacy backend
# This may require frontend redeployment or config change

# 2. Stop new backend
docker compose -f deploy/production/docker-compose.yml stop api

# 3. Update DNS for api.ecent.online only
# Point to legacy backend IP

# 4. Verify frontend → legacy backend communication
curl -f https://api.ecent.online/health
```

**Note:** This is only viable if:
- Legacy backend API is compatible with new frontend
- Frontend can be configured to use legacy API

---

## Migration Rollback (Schema)

If database schema changes caused issues:

### Identify Affected Migrations

```bash
# List applied migrations
psql "$DATABASE_URL" -c "SELECT * FROM schema_migrations ORDER BY version DESC;"

# Identify migrations to rollback
# Example: Rolling back from 0007 to 0005
```

### Apply Down Migrations

```bash
# 1. Stop application first
docker compose -f deploy/production/docker-compose.yml stop api

# 2. Apply down migrations in REVERSE order
psql "$DATABASE_URL" -f app/database/migrations/0007_market_substrate.down.sql
psql "$DATABASE_URL" -f app/database/migrations/0006_planning_substrate.down.sql

# 3. Verify schema state
psql "$DATABASE_URL" -c "\dt"

# 4. Deploy compatible application version
export IMAGE_TAG=v0.9.0  # Version matching schema at 0005
docker compose -f deploy/production/docker-compose.yml up -d api
```

---

## OAuth Rollback

If OAuth issues occur:

### Verify OAuth Configuration

- [ ] Check redirect URIs in Google Cloud Console
- [ ] Check redirect URIs in Azure Portal
- [ ] Ensure legacy URIs are still present (overlap period)

### Redirect Traffic to Legacy Callbacks

If new backend OAuth callbacks are failing:

1. Update DNS to point API to legacy backend
2. Legacy backend will receive callbacks at legacy URIs
3. No OAuth app configuration changes needed (overlap period)

---

## Data Recovery

### Restore from Backup

```bash
# 1. Stop application
docker compose -f deploy/production/docker-compose.yml stop api

# 2. Drop and recreate database
psql "$DATABASE_URL" -c "DROP SCHEMA public CASCADE; CREATE SCHEMA public;"

# 3. Restore from backup
psql "$DATABASE_URL" < backup_pre_cutover_YYYYMMDD_HHMMSS.sql

# 4. Verify restoration
psql "$DATABASE_URL" -c "SELECT COUNT(*) FROM users;"

# 5. Restart application with compatible version
export IMAGE_TAG=v1.0.0
docker compose -f deploy/production/docker-compose.yml up -d api
```

---

## Post-Rollback Actions

### Immediate (T+0 to T+1h)

- [ ] Verify system stability
- [ ] Monitor error rates
- [ ] Confirm user access restored

### Short-term (T+1h to T+24h)

- [ ] Conduct post-mortem analysis
- [ ] Document root cause
- [ ] Create remediation plan
- [ ] Notify stakeholders of next steps

### Before Retry

- [ ] Root cause identified and fixed
- [ ] Fix tested in staging
- [ ] Rollback procedure validated
- [ ] Team sign-off on retry

---

## Rollback Verification Checklist

After any rollback, verify:

- [ ] `/health` returns 200
- [ ] Login (Google) works
- [ ] Login (Azure) works
- [ ] Session persists across refresh
- [ ] Admin access works (for admin users)
- [ ] Storage operations work
- [ ] Core feature CRUD works
- [ ] Error rate < 0.1%

---

## Emergency Contacts

| Role | Contact | When to Call |
|------|---------|--------------|
| On-call engineer | (configure) | Any rollback |
| Infrastructure owner | (configure) | DNS/infra issues |
| Database admin | (configure) | Data recovery |
| OAuth app owner | (configure) | OAuth issues |

---

## Rollback Decision Tree

```
Issue Detected
      │
      ▼
┌─────────────────────┐
│ Is it Critical?     │
│ (Data/Security)     │
└──────────┬──────────┘
           │
     ┌─────┴─────┐
     │ Yes       │ No
     ▼           ▼
┌─────────┐  ┌─────────────────┐
│Immediate│  │Can be fixed in  │
│Rollback │  │< 30 minutes?    │
└─────────┘  └────────┬────────┘
                      │
                ┌─────┴─────┐
                │ Yes       │ No
                ▼           ▼
          ┌─────────┐  ┌─────────┐
          │ Hotfix  │  │Rollback │
          │ Deploy  │  │Then Fix │
          └─────────┘  └─────────┘
```

---

## References

- [go_live_checklist.md](./go_live_checklist.md) - Go-live procedure
- [session_cutover_plan.md](./session_cutover_plan.md) - Session handling
- [deploy/rollback.md](../../deploy/rollback.md) - Detailed rollback procedures
- [image_tag_and_migration_strategy.md](./image_tag_and_migration_strategy.md) - Version strategy

