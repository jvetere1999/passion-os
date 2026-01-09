"Go-live checklist for production cutover. Execute in order."

# Go-Live Checklist

**Date:** January 7, 2026  
**Branch:** `refactor/stack-split`  
**Purpose:** Step-by-step checklist for production cutover

---

## Overview

This checklist covers the complete go-live sequence for cutting over from the legacy Next.js/D1 stack to the new Rust/Postgres architecture.

**Key Decision Reference:**
- DEC-001 = A: Force re-authentication (no session migration)
- DEC-002 = A: CSRF via Origin verification
- DEC-004 = B: DB-backed admin roles

---

## Pre-Cutover (T-7 days)

### Infrastructure Readiness

- [ ] PostgreSQL provisioned and accessible (LATER-001)
- [ ] Azure Key Vault configured (LATER-002)
- [ ] R2 S3 credentials generated and stored in Key Vault (LATER-003)
- [ ] Container platform ready (LATER-005)
- [ ] DNS records prepared (not yet pointed)
- [ ] TLS certificates provisioned (LATER-011)
- [ ] Backup strategy documented and tested

### OAuth Configuration

- [ ] Google OAuth redirect URI added: `https://api.ecent.online/auth/callback/google` (LATER-004)
- [ ] Azure OAuth redirect URI added: `https://api.ecent.online/auth/callback/azure` (LATER-004)
- [ ] Both providers tested in staging/preview
- [ ] See [oauth_redirect_overlap_plan.md](./oauth_redirect_overlap_plan.md) for details

### Code Readiness

- [ ] All backend tests passing (35+ tests)
- [ ] All frontend typecheck passing
- [ ] Lint warnings within baseline (≤44)
- [ ] E2E Playwright tests passing
- [ ] Feature parity verified (all 64 routes)
- [ ] Docker images built and tagged: `ignition-api:v1.0.0`

### Database Preparation

- [ ] Migrations tested in staging
- [ ] Down migrations tested and verified
- [ ] Production database empty or seeded as needed
- [ ] Schema version: 0007 (all migrations applied)

---

## Pre-Cutover (T-24 hours)

### DNS Preparation

- [ ] Reduce DNS TTL to 300 seconds (5 minutes)
- [ ] Document current DNS configuration for rollback
- [ ] Verify TTL propagation via external DNS checkers

### Final Verification

- [ ] Staging environment matches production configuration
- [ ] Full E2E flow tested on staging:
  - [ ] Google OAuth login
  - [ ] Azure OAuth login
  - [ ] Session persistence
  - [ ] Admin access (RBAC)
  - [ ] Storage operations (R2)
  - [ ] Core feature CRUD

### Communication

- [ ] Team notified of cutover window
- [ ] Support team briefed on expected behavior (force re-auth)
- [ ] Monitoring alerts configured

---

## Cutover (T-0)

### Phase 1: Backend Deployment (T-0 to T+5m)

```bash
# 1. Create final database backup
pg_dump "$DATABASE_URL" > backup_pre_cutover_$(date +%Y%m%d_%H%M%S).sql

# 2. Apply any final migrations
for f in app/database/migrations/000*.sql; do
  [[ "$f" != *".down.sql" ]] && psql "$DATABASE_URL" -f "$f"
done

# 3. Deploy backend container
export IMAGE_TAG=v1.0.0
docker compose -f deploy/production/docker-compose.yml up -d api

# 4. Verify health
curl -f https://api.ecent.online/health
```

- [ ] Backend container started
- [ ] Health check returns 200
- [ ] Version matches expected (`v1.0.0`)

### Phase 2: DNS Cutover (T+5m to T+15m)

- [ ] Update DNS for `api.ecent.online` → new backend IP
- [ ] Verify DNS propagation (check multiple resolvers)
- [ ] Test API endpoint accessibility

### Phase 3: Frontend Deployment (T+15m to T+25m)

- [ ] Deploy frontend to CDN/hosting
- [ ] Update DNS for `ignition.ecent.online` if needed
- [ ] Deploy admin console
- [ ] Update DNS for `admin.ignition.ecent.online` if needed

### Phase 4: Verification (T+25m to T+45m)

- [ ] **OAuth Login (Google):** Complete login flow
- [ ] **OAuth Login (Azure):** Complete login flow
- [ ] **Session Persistence:** Refresh page, verify session maintained
- [ ] **Admin Access:** Login as admin, verify RBAC works
- [ ] **Storage:** Upload and download a file
- [ ] **Core Feature:** Complete one full feature flow (e.g., focus session)

---

## Post-Cutover (T+1 hour)

### Monitoring

- [ ] Error rate < 0.1%
- [ ] Response times normal (< 500ms p95)
- [ ] No authentication errors beyond expected re-auth
- [ ] Database connections healthy
- [ ] R2 storage operations successful

### Legacy Cleanup

- [ ] Legacy D1 database marked as deprecated (do not delete yet)
- [ ] Legacy OAuth redirect URIs: keep for overlap period
- [ ] Legacy deployment: keep running in read-only or stopped state

---

## Post-Cutover (T+24 hours)

### Stability Confirmation

- [ ] No critical issues reported
- [ ] User feedback reviewed
- [ ] Logs reviewed for anomalies

### DNS Finalization

- [ ] Increase DNS TTL back to 3600+ seconds
- [ ] Remove any temporary routing rules

---

## Post-Cutover (T+7 days)

### OAuth Cleanup

- [ ] Remove legacy OAuth redirect URIs (see oauth_redirect_overlap_plan.md)
- [ ] Verify no traffic to legacy callbacks

### Legacy Decommission

- [ ] Legacy D1 database: final backup taken
- [ ] Legacy D1 database: deleted (per DEC-001 approval)
- [ ] Legacy code moved to `deprecated/` mirror
- [ ] Legacy deployment terminated

---

## Rollback Triggers

Initiate rollback if ANY of these occur:

| Trigger | Threshold | Action |
|---------|-----------|--------|
| Health check failures | > 3 consecutive | Rollback |
| Error rate | > 5% for 5 minutes | Rollback |
| Auth failures | > 10% of attempts | Rollback |
| Data corruption | Any indication | Immediate rollback |
| Security incident | Any | Immediate rollback |

See [rollback_checklist.md](./rollback_checklist.md) for rollback procedure.

---

## Emergency Contacts

| Role | Contact | Escalation |
|------|---------|------------|
| On-call engineer | (configure) | Primary |
| Infrastructure owner | (configure) | Infrastructure issues |
| OAuth app owner | (configure) | OAuth issues |

---

## Sign-Off

| Phase | Completed | By | Time |
|-------|-----------|-----|------|
| Pre-cutover (T-7d) | [ ] | | |
| Pre-cutover (T-24h) | [ ] | | |
| Cutover Phase 1 | [ ] | | |
| Cutover Phase 2 | [ ] | | |
| Cutover Phase 3 | [ ] | | |
| Cutover Phase 4 | [ ] | | |
| Post-cutover (T+1h) | [ ] | | |
| Post-cutover (T+24h) | [ ] | | |
| Post-cutover (T+7d) | [ ] | | |

---

## References

- [rollback_checklist.md](./rollback_checklist.md) - Rollback procedure
- [session_cutover_plan.md](./session_cutover_plan.md) - Session handling
- [oauth_redirect_overlap_plan.md](./oauth_redirect_overlap_plan.md) - OAuth transition
- [deploy/routing.md](../../deploy/routing.md) - Routing configuration
- [deploy/rollback.md](../../deploy/rollback.md) - Detailed rollback procedures

