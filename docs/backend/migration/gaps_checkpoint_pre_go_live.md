# Gap Checkpoint: Pre-Go-Live

**Date:** January 7, 2026  
**Branch:** `refactor/stack-split`  
**Phase:** Pre-Go-Live Readiness Check  
**Purpose:** Confirm go-live checklist completeness and identify blockers

---

## Summary

| Category | Count | Status |
|----------|-------|--------|
| Go-Live Checklist Items | 47 | Documented ✅ |
| External Blockers | 8 | All Pending ⏳ |
| Implementation Blockers | 3 | Blocking Go-Live 🔒 |
| Decision Blockers | 0 | All Resolved ✅ |
| Repo-Auditable Blockers | 0 | None |
| New Issues Discovered | 2 | See below |

---

## Go-Live Checklist Completeness Audit

### Checklist Document Review

**Location:** `docs/backend/migration/go_live_checklist.md` (234 lines)

| Section | Items | Status |
|---------|-------|--------|
| Pre-Cutover (T-7 days) | 17 | Documented ✅ |
| Pre-Cutover (T-24 hours) | 10 | Documented ✅ |
| Cutover (T-0) | 12 | Documented ✅ |
| Post-Cutover (T+1 hour) | 5 | Documented ✅ |
| Post-Cutover (T+24 hours) | 3 | Documented ✅ |
| Post-Cutover (T+7 days) | 4 | Documented ✅ |
| Rollback Triggers | 5 | Documented ✅ |
| Sign-Off | 9 phases | Documented ✅ |

**Checklist Verdict:** ✅ Complete and comprehensive

### Supporting Documents Review

| Document | Purpose | Status | Evidence |
|----------|---------|--------|----------|
| `rollback_checklist.md` | Rollback procedure | ✅ Complete | 333 lines, 3 rollback types |
| `session_cutover_plan.md` | Session handling | ✅ Complete | 357 lines, DEC-001=A |
| `oauth_redirect_overlap_plan.md` | OAuth transition | ✅ Complete | 267 lines, overlap strategy |
| `deploy/routing.md` | Production routing | ✅ Complete | Referenced in go_live_checklist |
| `deploy/README.md` | Deployment docs | ✅ Complete | 356 lines |
| `deploy/rollback.md` | Rollback procedures | ✅ Complete | 314 lines |

**Supporting Docs Verdict:** ✅ All required documents exist

---

## Blockers by Category

### Category 1: External Console/Provisioning

**Status:** 5 items pending, blocking Phase 26

| LATER-ID | Item | Owner | Blocks |
|----------|------|-------|--------|
| LATER-001 | PostgreSQL provisioning | Infrastructure | Production DB |
| LATER-002 | Azure Key Vault | Infrastructure | Secrets |
| LATER-003 | R2 S3 credentials | Infrastructure | R2 access |
| LATER-004 | OAuth redirect URIs | OAuth Admin | Auth flows |
| LATER-005 | Container platform | Infrastructure | Deployment |

**Required Action:** Owner must provision these before go-live.

### Category 2: Deployment/DNS/TLS

**Status:** 3 items pending, blocking Phase 26

| LATER-ID | Item | Owner | Blocks |
|----------|------|-------|--------|
| LATER-009 | api.ecent.online domain | Infrastructure | API access |
| LATER-010 | admin.ignition.ecent.online domain | Infrastructure | Admin access |
| LATER-011 | TLS certificates | Infrastructure | HTTPS |

**Required Action:** Owner must configure DNS and TLS before go-live.

### Category 3: Implementation

**Status:** 3 items blocking go-live

| ACTION-ID | Item | Status | Blocks |
|-----------|------|--------|--------|
| ACTION-040 | Feature routes (52/64 pending) | Not Started | Feature parity |
| ACTION-038 | D1 script removal | Not Started | Clean cutover |
| ISSUE-NEW-001 | Reference tracks frontend swap | Not Started | Reference feature |

**Required Action:** Complete feature routes before cutover.

### Category 4: Decision Required

**Status:** ✅ All resolved

| DEC-ID | Decision | Status | Chosen |
|--------|----------|--------|--------|
| DEC-001 | Session migration | ✅ Resolved | A (Force re-auth) |
| DEC-002 | CSRF protection | ✅ Resolved | A (Origin verification) |
| DEC-003 | Lint timing | ✅ Resolved | C (Post-migration) |
| DEC-004 | Admin auth | ✅ Resolved | B (DB-backed roles) |

### Category 5: Repo-Auditable

**Status:** ✅ None blocking

All repo-auditable items have been resolved. See `NOW.md` for evidence.

---

## New Issues Discovered

### ISSUE-NEW-001: Reference Tracks Frontend API Swap

| Field | Value |
|-------|-------|
| **Category** | Implementation |
| **Description** | Reference tracks frontend components created but not yet swapped to use new backend API client |
| **Impact** | Reference feature not usable end-to-end |
| **Evidence** | `checkpoint_20F.md` - "Backend done, frontend uses old API" |
| **Blocks** | Feature parity for reference tracks |
| **Resolution** | Swap frontend components to use `referenceTracksApi` from `@/lib/api/reference-tracks.ts` |
| **Add to** | ACTION-040 scope (Feature Routes) |

### ISSUE-NEW-002: Emergency Contact Placeholders

| Field | Value |
|-------|-------|
| **Category** | Repo-Auditable |
| **Description** | Emergency contacts in go_live_checklist.md have placeholder values "(configure)" |
| **Impact** | Rollback communication could be delayed |
| **Evidence** | `go_live_checklist.md` line 226-230 |
| **Blocks** | Nothing (informational) |
| **Resolution** | Owner to fill in actual contact information before cutover |
| **Priority** | Low (before T-7 days) |

---

## Phase Gate Impact

### Phase 26 (Cutover) Status

| Aspect | Status |
|--------|--------|
| **Gate Status** | 🔴 **Blocked** |
| **Prerequisites Met** | No |
| **Decisions Required** | All ✅ |
| **External Blockers** | 8 pending |
| **Implementation Blockers** | 3 pending |

**Phase 26 remains blocked until:**
1. All LATER items (LATER-001 through LATER-011) are resolved
2. ACTION-040 (Feature routes) is complete
3. ACTION-038 (D1 script removal) is complete

### No Phase Gate Updates Required

PHASE_GATE.md accurately reflects current state:
- Phase 26 is correctly marked as 🔴 Blocked
- All blocking items are documented
- No changes needed

---

## Go-Live Readiness Score

| Area | Weight | Score | Weighted |
|------|--------|-------|----------|
| Documentation | 15% | 100% | 15.0% |
| Decisions | 10% | 100% | 10.0% |
| Infrastructure (local) | 15% | 100% | 15.0% |
| Infrastructure (prod) | 15% | 0% | 0.0% |
| Feature Routes | 25% | 19% | 4.8% |
| External Provisioning | 20% | 0% | 0.0% |
| **Total** | 100% | - | **44.8%** |

**Readiness:** 44.8% - Not ready for go-live

---

## Critical Path to Go-Live

```
Current State
     │
     ▼
┌────────────────────────────────────┐
│ ACTION-040: Feature Routes (52)    │ ← CRITICAL PATH
│ Status: Not Started                │
│ Est: 18-28 days                    │
└────────────────────────────────────┘
     │
     ▼
┌────────────────────────────────────┐
│ ACTION-038: D1 Script Removal      │
│ Status: Blocked on ACTION-040      │
│ Est: 1 day                         │
└────────────────────────────────────┘
     │
     ▼
┌────────────────────────────────────┐
│ LATER-001-011: External Items      │ ← PARALLEL PATH
│ Status: All Pending                │
│ Owner: Infrastructure              │
└────────────────────────────────────┘
     │
     ▼
┌────────────────────────────────────┐
│ Phase 26: Cutover                  │
│ Status: Blocked                    │
│ Prerequisites: Above complete      │
└────────────────────────────────────┘
```

---

## Recommendations

### Immediate (This Week)

1. **Start ACTION-040**: Begin EXTRACT-001 (Gamification) - critical path
2. **Request External Provisioning**: Initiate LATER-001 through LATER-005
3. **Fill Emergency Contacts**: Update go_live_checklist.md with actual contacts

### Before T-7 Days

1. **Complete Feature Routes**: All 52 pending routes
2. **Complete D1 Removal**: ACTION-038
3. **Verify External Items**: LATER-001 through LATER-011

### Pre-Go-Live

1. **Full E2E Test Pass**: All Playwright tests on staging
2. **OAuth Testing**: Both providers with new URIs
3. **Load Testing**: Performance validation

---

## Checklist Gaps (Minor)

| Gap | Severity | Resolution |
|-----|----------|------------|
| Emergency contacts placeholder | Low | Fill before T-7 |
| Load testing not in checklist | Low | Consider adding |
| Database seeding strategy | Low | Document if needed |

---

## Approval

This gap checkpoint confirms:

- [x] Go-live checklist document is complete
- [x] All supporting documents exist
- [x] All blockers identified and categorized
- [x] No decision blockers remaining
- [x] Phase 26 correctly gated
- [x] Critical path documented

**Go-Live Status:** 🔴 NOT READY

**Blocking Items:**
- 8 external provisioning items (LATER-001 through LATER-011)
- 52 feature routes (ACTION-040)
- 1 cleanup task (ACTION-038)

**Next Step:** Start EXTRACT-001 (Gamification) to unblock feature route implementation.

---

## References

- [go_live_checklist.md](./go_live_checklist.md) - Full checklist
- [rollback_checklist.md](./rollback_checklist.md) - Rollback procedure
- [session_cutover_plan.md](./session_cutover_plan.md) - Session handling
- [oauth_redirect_overlap_plan.md](./oauth_redirect_overlap_plan.md) - OAuth transition
- [checkpoint_20F.md](./checkpoint_20F.md) - Latest progress checkpoint
- [PHASE_GATE.md](./PHASE_GATE.md) - Phase status
- [LATER.md](./LATER.md) - External blockers
- [gaps.md](./gaps.md) - Action items

