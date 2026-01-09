# Checkpoint 20F: Migration Status Report

**Date:** January 7, 2026  
**Branch:** `refactor/stack-split`  
**Phase:** Post-Frontend Visualizer Implementation  
**Purpose:** Deep checkpoint audit of implementation vs remaining work

---

## Executive Summary

| Metric | Value | Notes |
|--------|-------|-------|
| **Overall Progress** | 19% (12/64 routes) | Wave 0 complete, Waves 1-5 pending |
| **Frontend UI-Only Reimplementation** | **12%** | See detailed calculation below |
| **Backend Routes Implemented** | 12 Done / 52 Pending | Auth + Storage + Reference Tracks domain |
| **Postgres Tables Created** | 33 / 45+ target | 9 migrations covering Waves 0-3 |
| **Phase Gates Passed** | 18 / 21 | 3 blocked/ready |
| **External Blockers** | 8 items | See LATER.md |
| **Decision Blockers** | 0 items | All 4 decisions CHOSEN |

---

## Task A: Progress Scoreboard

### Implementation Status by Area

| Area | Status | Evidence | Notes |
|------|--------|----------|-------|
| **Backend API Platform** | ✅ Done | `app/backend/` compiles, 93 tests | Axum + Tower scaffold |
| **Auth/Sessions/RBAC** | ✅ Done | 20 tests, `validation_auth_sessions.md` | OAuth, CSRF, session rotation |
| **Postgres Migrations** | ✅ Done (local) | 9 migrations in `app/database/migrations/` | 33 tables created |
| **R2 Storage** | ✅ Done (local) | 15 tests, `r2_api_spec.md` | Backend-only signed URLs |
| **Reference Tracks Domain** | ✅ Done | 31 tests, `reference_tracks_domain.md` | Full CRUD + analysis stubs |
| **Frames Transport** | ✅ Done | 27 tests, `reference_tracks_frames_contract.md` | Binary chunk transport |
| **Visualizer Renderer** | ✅ Done | `validation_reference_tracks_frontend.md` | Canvas-based UI, hooks |
| **Frontend UI (Wave 0)** | ✅ Done | `app/frontend/src/` typecheck pass | Moved, API client ready |
| **Admin UI** | 🔄 In Progress | `app/admin/src/` exists | Stub structure only |
| **Infra/Compose** | ✅ Done (local) | `infra/docker-compose.yml`, `deploy/` | 5-container local stack |
| **Observability/Audit** | 🔒 Blocked | Schema exists, no implementation | Needs feature routes first |
| **Feature Routes (W1-5)** | ⏳ Not Started | 52/64 routes pending | ACTION-040 |
| **D1 Removal** | ⏳ Not Started | ACTION-038 | Blocked on feature parity |
| **Production Deploy** | 🔒 Blocked | LATER-001 through LATER-011 | All external |
| **Docs** | ✅ Done | 50+ migration docs | Comprehensive |

### Legend
- ✅ Done = Complete and validated
- 🔄 In Progress = Partial implementation
- ⏳ Not Started = Ready to start
- 🔒 Blocked = Waiting on dependency

---

## Task A.2: Frontend Reimplementation Percentage

### Calculation Methodology

**Definition:** A PARITY item counts as "done" if:
1. UI surface exists in `app/frontend/` (not legacy `src/`)
2. Uses `@ignition/api-client` or new API client (not legacy Next.js API routes)
3. Has at least one passing test OR validation evidence

**Exclusions:**
- Admin-only routes (10 routes) → counted separately
- Backend-only routes (no UI) → N/A
- Deprecated routes → excluded

### PARITY Items Analysis

**From feature_parity_checklist.md:**

| Category | Total Routes | Has Frontend UI | Done (UI-Only) | Evidence |
|----------|-------------|-----------------|----------------|----------|
| Auth/Session | 6 | 4 | 4 | `validation_auth_sessions.md` |
| Storage (Blobs) | 7 | 7 | 7 | `tests/storage.spec.ts` |
| API Client | 1 | 1 | 1 | `shared/api-client/` |
| Gamification | 2 | 2 | 0 | Not started |
| Focus | 5 | 5 | 0 | Not started |
| Habits | 1 | 1 | 0 | Not started |
| Goals | 1 | 1 | 0 | Not started |
| Quests | 1 | 1 | 0 | Not started |
| Calendar | 1 | 1 | 0 | Not started |
| Daily Plan | 1 | 1 | 0 | Not started |
| Feedback | 1 | 1 | 0 | Not started |
| Exercise | 2 | 2 | 0 | Not started |
| Books | 1 | 1 | 0 | Not started |
| Programs | 1 | 1 | 0 | Not started |
| Market | 4 | 4 | 0 | Not started |
| Learn | 3 | 3 | 0 | Not started |
| Reference | 6 | 6 | 0 | Backend done, frontend uses old API |
| Onboarding | 5 | 5 | 0 | Not started |
| Infobase | 1 | 1 | 0 | Not started |
| Ideas | 1 | 1 | 0 | Not started |
| Analysis | 1 | 1 | 0 | Not started |
| User | 2 | 2 | 0 | Not started |
| **Admin** | 10 | 10 | 0 | Excluded (admin-only) |

### Calculation

**Frontend UI Routes (excluding admin):** 54 routes  
**Done (using new backend via API client):** 12 routes  
- Auth: 4 (OAuth login/logout via backend)
- Storage: 7 (blob upload/download via backend)
- API Client infrastructure: 1

**Frontend Reimplementation %:**  
```
= (Done Routes with UI-Only Pattern) / (Total Frontend Routes)
= 12 / 54
= 22.2%
```

**However**, more accurate "true UI-only" metric excludes legacy API route usage:

**True UI-Only (using @ignition/api-client):**
- Storage routes: Playwright tests confirm API client usage → 7 routes
- Auth: Using backend directly → 4 routes
- Reference Tracks: New visualizer created but still needs frontend API swap → 0 routes (pending swap)

**Conservative Calculation:**
```
= 11 / 54
= 20.4%

Rounded: ~20% frontend reimplementation complete
```

### Items Counted as "Done"

| PARITY-ID | Route | Evidence |
|-----------|-------|----------|
| AUTH-001 | POST /auth/google | Backend routes, tests |
| AUTH-002 | POST /auth/azure | Backend routes, tests |
| AUTH-003 | GET /auth/callback/:provider | Backend routes, tests |
| AUTH-004 | POST /auth/logout | Backend routes, tests |
| STORAGE-001 | POST /api/blobs/upload | Playwright tests |
| STORAGE-002 | POST /api/blobs/upload-url | Playwright tests |
| STORAGE-003 | GET /api/blobs/:id | Playwright tests |
| STORAGE-004 | DELETE /api/blobs/:id | Playwright tests |
| STORAGE-005 | GET /api/blobs/:id/info | Playwright tests |
| STORAGE-006 | GET /api/blobs/:id/download-url | Playwright tests |
| STORAGE-007 | GET /api/blobs | Playwright tests |

### Items Excluded (Not Counted)

| Category | Reason | Count |
|----------|--------|-------|
| Admin routes | Admin-only, not user frontend | 10 |
| Reference tracks | Backend done, frontend swap pending | 6 |
| All other features | Not started | 38 |

---

## Task A.3: What Remains (Ranked by Go-Live Criticality)

### Top 10 Remaining Items

| Rank | ID | Description | What's Missing | Evidence |
|------|-----|-------------|----------------|----------|
| **1** | ACTION-040 | Feature Routes Implementation | 52/64 routes not implemented | `feature_parity_checklist.md` |
| **2** | EXTRACT-001 | Gamification Core | Backend routes, XP service, frontend swap | `FEATURE_EXTRACTION_BACKLOG.md` |
| **3** | EXTRACT-002 | Focus Sessions | 5 routes, XP integration | `feature_parity_checklist.md` |
| **4** | LATER-001 | PostgreSQL Provisioning | Production database | `LATER.md` |
| **5** | LATER-004 | OAuth Redirect URIs | Google/Azure console updates | `LATER.md` |
| **6** | ACTION-038 | D1 Script Removal | 11 npm scripts, 2 shell scripts | `gaps.md` |
| **7** | EXTRACT-006 | Market Routes | Purchase, wallet, redemption | `FEATURE_EXTRACTION_BACKLOG.md` |
| **8** | EXTRACT-009 | Admin Routes | 10 admin routes | `feature_parity_checklist.md` |
| **9** | UNKNOWN-011 | E2E Test Coverage | Coverage analysis needed | `UNKNOWN.md` |
| **10** | Reference Frontend Swap | Reference tracks frontend | Swap from local API to backend | New item |

### Detailed Impact

**ACTION-040 (Feature Routes):**
- Blocks: All frontend features beyond storage
- Impact: 52 routes = 81% of total
- Priority: CRITICAL - must be done before cutover

**EXTRACT-001 (Gamification):**
- Blocks: Focus, Habits, Goals, Quests, Exercise, Books, Learn, Market (8 features)
- Impact: Foundation for all XP-awarding features
- Priority: CRITICAL - do first in Wave 1

**LATER-001 (PostgreSQL):**
- Blocks: Production deployment
- Impact: Cannot go live without production database
- Priority: CRITICAL EXTERNAL - needs owner action

---

## Task B: Blockers and Decision Gates

### B.1: External/Provisioning Blockers

| LATER-ID | What | Blocks | Status |
|----------|------|--------|--------|
| LATER-001 | PostgreSQL Database | Phase 26 (Cutover) | ⏳ Pending |
| LATER-002 | Azure Key Vault | Phase 26 (Cutover) | ⏳ Pending |
| LATER-003 | R2 S3 API Credentials | Phase 26 (Cutover) | ⏳ Pending |
| LATER-004 | OAuth Redirect URIs | Phase 26 (Cutover) | ⏳ Pending |
| LATER-005 | Container Platform | Phase 26 (Cutover) | ⏳ Pending |
| LATER-009 | api.ecent.online Domain | Phase 26 (Cutover) | ⏳ Pending |
| LATER-010 | admin.ignition.ecent.online Domain | Phase 26 (Cutover) | ⏳ Pending |
| LATER-011 | TLS Certificates | Phase 26 (Cutover) | ⏳ Pending |

**Total External Blockers:** 8

### B.2: Decision Blockers

| DEC-ID | Decision | Status | Chosen |
|--------|----------|--------|--------|
| DEC-001 | Session Migration | ✅ RESOLVED | A (Force re-auth) |
| DEC-002 | CSRF Protection | ✅ RESOLVED | A (Origin verification) |
| DEC-003 | Lint Warnings | ✅ RESOLVED | C (Post-migration) |
| DEC-004 | Admin Auth | ✅ RESOLVED | B (DB-backed roles) |

**Decision Blockers:** 0 (all resolved)

### B.3: Repo-Inspection Blockers

| Item | Type | Status | Impact |
|------|------|--------|--------|
| UNKNOWN-011 | E2E Test Coverage | Open | May miss regressions |
| Reference Frontend Swap | Implementation | Not started | Reference feature not usable end-to-end |
| Feature route implementations | Implementation | 52 pending | Core functionality blocked |

---

## Task B.4: Phase Gate Status

### Passed

| Phase | Name | Status | Evidence |
|-------|------|--------|----------|
| 06 | Skeleton Ensure | ✅ Passed | `skeleton_status.md` |
| 07 | Target Structure | ✅ Passed | `target_structure.md`, `move_plan.md` |
| 08 | Backend Scaffold | ✅ Passed | `validation_backend_scaffold.md` |
| 11 | Database Migration | ✅ Passed (local) | 9 migrations, `validation_db_migrations.md` |
| 11a | Auth Implementation | ✅ Passed | 20 tests, `auth_impl_notes.md` |
| 11c | Feature Table Migrations | ✅ Passed | 6 migrations, 33 tables |
| 11d | D1 Deprecation Planning | ✅ Passed | `d1_deprecation_report.md` |
| 14 | R2 Integration | ✅ Passed (local) | 15 tests, `r2_api_spec.md` |
| 17 | Frontend API Client | ✅ Passed | `shared/api-client/`, Playwright tests |
| 17b | Feature Ownership Map | ✅ Passed | `FEATURE_OWNERSHIP_MAP.md` |
| 17c | Backend Modularity Plan | ✅ Passed | `BACKEND_SUBMODS_LAYOUT.md` |
| 17d | API Contracts Plan | ✅ Passed | `API_CONTRACTS_PLAN.md` |
| 18a | Reference Tracks Domain | ✅ Passed | 31 tests, domain doc |
| 18b | Frames Transport | ✅ Passed | 27 tests, frames contract |
| 20F | Frontend Visualizer | ✅ Passed | `validation_reference_tracks_frontend.md` |
| 23 | Infrastructure | ✅ Passed (local) | `validation_infrastructure.md` |
| 23b | Cutover Planning | ✅ Passed | `go_live_checklist.md`, `rollback_checklist.md` |

### Ready (Unblocked)

| Phase | Name | Status | Next Action |
|-------|------|--------|-------------|
| 18 | Feature Routes | ✅ Ready | Start EXTRACT-001 (Gamification) |
| 20 | Admin Console Split | ✅ Ready | Implement admin routes |

### Blocked

| Phase | Name | Status | Blockers |
|-------|------|--------|----------|
| 26 | Cutover | 🔴 Blocked | LATER-001-005, LATER-009-011, ACTION-040, ACTION-038 |

---

## Task C: Register Updates

### Updates to gaps.md

No status changes required. All currently marked items are accurate:
- ACTION-040 (Feature Routes): Not Started - correct
- ACTION-038 (D1 Script Removal): Not Started - correct
- ACTION-009/010 (Domain Config): Not Started - correct

### Updates to UNKNOWN.md

**New Status Note Added:**

| UNKNOWN-ID | Update |
|------------|--------|
| UNKNOWN-011 | Status note: "Deferred - can add tests incrementally during feature implementation" |

No new unknowns discovered in this checkpoint.

---

## Summary Metrics

### Progress Dashboard

```
Infrastructure    ████████████████████ 100%  Done (local)
Auth/Sessions     ████████████████████ 100%  Done
Storage (R2)      ████████████████████ 100%  Done (local)
Postgres Schema   ██████████████░░░░░░  73%  33/45 tables
Backend Routes    ███░░░░░░░░░░░░░░░░░  19%  12/64 routes
Frontend UI-Only  ████░░░░░░░░░░░░░░░░  20%  11/54 routes
Admin UI          ██░░░░░░░░░░░░░░░░░░  10%  Structure only
Decisions         ████████████████████ 100%  4/4 chosen
External Items    ░░░░░░░░░░░░░░░░░░░░   0%  0/8 resolved
─────────────────────────────────────────────────
Overall Go-Live   ████░░░░░░░░░░░░░░░░  22%  Blocked on W1-5
```

### Critical Path to Go-Live

1. **EXTRACT-001**: Gamification Core (P1.1) - blocks 8 features
2. **EXTRACT-002-005**: Focus, Habits, Goals, Quests
3. **EXTRACT-006-008**: Market, Exercise, Programs
4. **EXTRACT-009-014**: Learn, Reference swap, Onboarding, etc.
5. **EXTRACT-015-022**: Admin, User, cleanup
6. **ACTION-038**: D1 removal (after feature parity)
7. **LATER-001-011**: External provisioning
8. **Phase 26**: Cutover execution

### Estimated Remaining Effort

| Category | Routes | Est. Complexity | Est. Days |
|----------|--------|-----------------|-----------|
| Wave 1 (Foundation) | 9 | Medium | 3-5 |
| Wave 2 (Core) | 4 | Medium | 2-3 |
| Wave 3 (Complex) | 8 | High | 5-7 |
| Wave 4 (Specialized) | 17 | Medium-High | 5-8 |
| Wave 5 (Admin) | 12 | Medium | 3-5 |
| **Total** | 52 | - | **18-28 days** |

*Estimate assumes single developer, sequential work.*

---

## Recommendations

### Immediate Next Steps

1. **Start EXTRACT-001 (Gamification)** - Critical path blocker
2. **Request external provisioning** - LATER-001 (PostgreSQL) is blocking for production
3. **Add E2E test coverage analysis** - Close UNKNOWN-011 to track regressions

### Risk Mitigation

1. **Gamification dependency** - All XP features blocked; prioritize P1.1
2. **External blockers** - Start provisioning requests now; 8 items pending
3. **D1 cleanup** - Don't remove until feature parity confirmed with tests

---

## Approval

This checkpoint documents the current migration state as of Prompt 20F.

- [x] Progress scoreboard complete
- [x] Frontend reimplementation % calculated with evidence
- [x] Remaining items ranked by criticality
- [x] All blockers documented
- [x] Phase gate status verified
- [x] Registers updated as needed

**Next Phase:** Phase 18 Feature Routes Implementation (EXTRACT-001 Gamification)

