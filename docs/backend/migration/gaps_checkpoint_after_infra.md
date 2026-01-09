"Gap checkpoint after compose/infrastructure phase. Only new issues discovered."

# Gap Checkpoint: After Infrastructure Phase (Cutover Readiness)

**Date:** January 7, 2026  
**Branch:** `refactor/stack-split`  
**Phase:** 23 → 26 Transition Assessment

---

## Overview

This checkpoint assesses readiness for cutover plan (Phase 26) after completing local infrastructure artifacts. The checkpoint evaluates:
1. Completion status of all prerequisite phases
2. External blockers that remain
3. Implementation gaps still to address
4. Cutover plan requirements

---

## New Issues Discovered

### ISSUE-001: Feature Route Implementation Incomplete

| Field | Value |
|-------|-------|
| **Category** | Implementation |
| **Discovery** | Feature parity checklist shows 12/64 routes done (19%) |
| **Impact** | Cannot proceed to cutover until feature parity achieved |
| **Blocks** | Phase 26 (Cutover) |
| **Resolution** | Complete Phase 18 (Feature Routes) |
| **Priority** | High - next immediate work |

**Route Status Breakdown:**
- Auth/Session: 4/6 done (2 remaining: accept-tos, verify-age)
- Storage: 7/7 done ✅
- Gamification: 0/2 (not started)
- Focus: 0/5 (not started)
- Habits: 0/1 (not started)
- Goals: 0/1 (not started)
- Quests: 0/1 (not started)
- Calendar: 0/1 (not started)
- Daily Plan: 0/1 (not started)
- Market: 0/4 (not started)
- Reference: 0/6 (not started)
- Onboarding: 0/5 (not started)
- User: 0/2 (not started)
- Other: 0/16 (not started)

---

### ISSUE-002: D1 Script Removal Pending

| Field | Value |
|-------|-------|
| **Category** | Implementation |
| **Discovery** | ACTION-038 in gaps.md - D1 scripts not yet removed |
| **Impact** | D1 references remain in package.json and scripts/ |
| **Blocks** | Phase 26 (Cutover) - final cleanup |
| **Resolution** | Remove scripts after feature parity |
| **Priority** | Medium - blocked until feature parity |
| **Reference** | ACTION-038 |

---

### ISSUE-003: Cutover Plan Documentation Missing

| Field | Value |
|-------|-------|
| **Category** | Repo-auditable |
| **Discovery** | No formal cutover plan document exists |
| **Impact** | Need documented cutover sequence, rollback triggers, DNS plan |
| **Blocks** | Phase 26 (Cutover) |
| **Resolution** | Create docs/backend/migration/cutover_plan.md |
| **Priority** | Medium - can be created in parallel with feature work |

---

## Existing Blockers (Unchanged)

### External Console/Provisioning (8 items)

All external items remain unchanged. Production deployment requires:

| LATER-ID | Item | Blocks | Status |
|----------|------|--------|--------|
| LATER-001 | PostgreSQL provisioning | Phase 26 | External |
| LATER-002 | Azure Key Vault | Phase 26 | External |
| LATER-003 | R2 S3 credentials | Phase 26 | External |
| LATER-004 | OAuth redirect URIs | Phase 26 | External |
| LATER-005 | Container platform | Phase 26 | External |
| LATER-009 | api.ecent.online domain | Phase 26 | External |
| LATER-010 | admin.ignition.ecent.online domain | Phase 26 | External |
| LATER-011 | TLS certificates | Phase 26 | External |

### Deployment/DNS/TLS

Covered by LATER-009, LATER-010, LATER-011.

---

## Blocker Categorization Summary

| Category | Count | Items |
|----------|-------|-------|
| **Decision Required** | 0 | All decisions made (DEC-001 through DEC-004) |
| **External Console/Provisioning** | 8 | LATER-001 through LATER-005, LATER-009-011 |
| **Deployment/DNS/TLS** | 3 | LATER-009, LATER-010, LATER-011 |
| **Repo-Auditable** | 1 | ISSUE-003 (cutover plan doc) |
| **Implementation** | 2 | ISSUE-001 (feature routes), ISSUE-002 (D1 cleanup) |

---

## Phase Status Update

| Phase | Status | Change |
|-------|--------|--------|
| 06 Skeleton | ✅ Complete | No change |
| 07 Structure Plan | ✅ Complete | No change |
| 08 Backend Scaffold | ✅ Complete | No change |
| 11 Database Migration | ✅ Complete (local) | No change |
| 11a Auth Implementation | ✅ Complete | No change |
| 11c Feature Table Migrations | ✅ Complete | No change |
| 11d D1 Deprecation Planning | ✅ Complete | No change |
| 14 R2 Integration | ✅ Complete (local) | No change |
| 17 Frontend API Client | ✅ Complete | No change |
| **18 Feature Routes** | ✅ Ready | **Next phase** |
| **20 Admin Console** | ✅ Ready | Can proceed in parallel |
| **23 Infrastructure** | ✅ Complete (local) | **Verified** |
| 26 Cutover | 🔴 Blocked | External + Implementation blockers |

---

## Cutover Readiness Checklist

### Prerequisites for Phase 26

| Requirement | Status | Blocker |
|-------------|--------|---------|
| All decisions made | ✅ Complete | None |
| Backend scaffold complete | ✅ Complete | None |
| Database schema migrated | ✅ Complete (local) | LATER-001 (prod) |
| Auth/Sessions implemented | ✅ Complete | None |
| R2 integration complete | ✅ Complete (local) | LATER-003 (prod) |
| Feature routes complete | 🔴 19% | ISSUE-001 |
| Admin console split | 🔴 Not started | Phase 20 pending |
| D1 scripts removed | 🔴 Pending | ISSUE-002 / ACTION-038 |
| Infrastructure artifacts | ✅ Complete | None |
| External provisioning | 🔴 Pending | LATER-001 through LATER-011 |
| E2E tests passing | 🔴 Partial | Feature routes needed |
| Cutover plan documented | 🔴 Missing | ISSUE-003 |

---

## Critical Path to Cutover

```
Current State
     │
     ▼
┌─────────────────────────────────────┐
│ Phase 18: Feature Routes (52 routes)│ ◄── NEXT
│ - Gamification, Focus, Habits, etc. │
└─────────────────────────────────────┘
     │
     ▼
┌─────────────────────────────────────┐
│ Phase 20: Admin Console Split       │ (can parallel)
│ - 10 admin routes                   │
└─────────────────────────────────────┘
     │
     ▼
┌─────────────────────────────────────┐
│ ACTION-038: D1 Script Removal       │
│ - 11 npm scripts, 2 shell scripts   │
└─────────────────────────────────────┘
     │
     ▼
┌─────────────────────────────────────┐
│ ISSUE-003: Cutover Plan Document    │
│ - DNS sequence, rollback triggers   │
└─────────────────────────────────────┘
     │
     ▼
┌─────────────────────────────────────┐
│ External Provisioning (8 items)     │ ◄── OWNER ACTION
│ - LATER-001 through LATER-011       │
└─────────────────────────────────────┘
     │
     ▼
┌─────────────────────────────────────┐
│ Phase 26: Cutover                   │
│ - E2E validation, DNS, go-live      │
└─────────────────────────────────────┘
```

---

## Actions Required

### Immediate (Repo-Auditable)

1. **Phase 18**: Implement remaining 52 feature routes
   - Priority order: Gamification → Focus → Habits → Goals → Quests → Market
   - Reference: feature_porting_playbook.md

2. **Phase 20**: Split admin console (can parallel with Phase 18)
   - 10 admin routes
   - Reference: move_admin_report.md

### After Feature Parity

3. **ACTION-038**: Remove D1 scripts from package.json
   - 11 npm scripts
   - 2 shell scripts to deprecated/

4. **ISSUE-003**: Create cutover plan document
   - DNS cutover sequence
   - Rollback triggers and procedures
   - Smoke test checklist

### Owner Action Required

5. Request external provisioning for LATER items:
   - LATER-001: PostgreSQL
   - LATER-002: Azure Key Vault
   - LATER-003: R2 credentials
   - LATER-004: OAuth URIs
   - LATER-005: Container platform
   - LATER-009/010/011: Domains and TLS

---

## PHASE_GATE.md Update Required

No status changes needed - Phase 23 already marked as "Complete (local)" and Phase 26 remains blocked.

Phase 18 and Phase 20 are correctly marked as "Ready" and should be next focus.

---

## References

- [PHASE_GATE.md](./PHASE_GATE.md) - Phase gate status
- [LATER.md](./LATER.md) - External blockers
- [gaps.md](./gaps.md) - Action items (ACTION-038)
- [feature_parity_checklist.md](./feature_parity_checklist.md) - Route status
- [validation_infrastructure.md](./validation_infrastructure.md) - Infra validation
- [feature_porting_playbook.md](./feature_porting_playbook.md) - Porting process

