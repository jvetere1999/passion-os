# Feature Gap Register

**Date:** January 7, 2026  
**Updated:** January 8, 2026 (Parity Audit Phase)  
**Branch:** `refactor/stack-split`  
**Purpose:** Track gaps between current implementation and full feature parity

---

## Overview

This register tracks gaps identified during migration that require resolution before go-live. Each gap links to PARITY items or ACTION items from the canonical tracking documents.

**Post-Audit Status:** Two new gaps identified during code archaeology audit.

---

## Gap Summary

| Status | Count |
|--------|-------|
| Open | 2 |
| In Progress | 0 |
| Closed | 8 |
| **Total** | **10** |

---

## Open Gaps

### FGAP-009: Reference Router Not Wired in api.rs

| Field | Value |
|-------|-------|
| **Severity** | High |
| **Category** | Backend Integration |
| **Affects** | PARITY-080 through PARITY-088 |
| **Blocks** | Reference Tracks frontend integration |
| **Status** | **Open** |
| **Discovered** | January 8, 2026 (Parity Audit) |

**Description:**
Full reference tracks implementation exists in `reference.rs` (816 lines) but `api.rs` uses a stub `reference_routes()` function instead of wiring the actual `super::reference::router()`.

**Evidence:**
- `app/backend/crates/api/src/routes/reference.rs` - Full implementation (816 lines)
  - Tracks CRUD, upload, analysis, streaming
  - Annotations CRUD
  - Regions CRUD
- `app/backend/crates/api/src/routes/api.rs:100-105`:
  ```rust
  fn reference_routes() -> Router<Arc<AppState>> {
      // Reference is already implemented in super::reference, but has custom routing
      // TODO: Wire up super::reference::router() when frontend swap is ready
      Router::new()
          .route("/tracks", get(stub_list))
          .route("/upload", post(stub_create))
  }
  ```

**Impact:**
- Frontend cannot access real reference tracks functionality
- 9 routes documented as "Backend Done" are actually serving stubs
- Audio streaming, annotations, regions are inaccessible

**Resolution Required:**
1. Update `api.rs` line 37 to wire `super::reference::router()` instead of `reference_routes()`
2. Remove the stub `reference_routes()` function
3. Verify frontend API client compatibility
4. Run reference track E2E tests

**Test Coverage (Mitigated):**
- TEST-001 through TEST-004: Tracks CRUD E2E (P0, ✅ Implemented)
- TEST-007: Play URL E2E (P0, ✅ Implemented)
- TEST-009: Upload E2E (P0, ✅ Implemented)
- TEST-010, TEST-011: Annotations E2E (P0, ✅ Implemented)
- TEST-014: Regions list E2E (P0, ✅ Implemented)
- TEST-017: Contract validation (P0, ✅ Implemented)
- TEST-016: Backend integration (P0, ⏳ Planned)

**Gap Status with Tests:** Tests implemented. Gap will close when ACTION-053 completes (router wiring).

**Links:**
- [feature_parity_checklist.md](./feature_parity_checklist.md) - PARITY-080 to PARITY-088
- [TEST_BACKLOG.md](./TEST_BACKLOG.md) - TEST-001 through TEST-017
- [validation_feature_gap_tests_cutover.md](./validation_feature_gap_tests_cutover.md)

---

### FGAP-010: Analysis Route is Stub-Only

| Field | Value |
|-------|-------|
| **Severity** | Medium |
| **Category** | Backend Implementation |
| **Affects** | PARITY-089 |
| **Blocks** | Analysis feature |
| **Status** | **Open** |
| **Discovered** | January 8, 2026 (Parity Audit) |

**Description:**
The `/api/analysis` route exists in `api.rs` but is a stub returning empty JSON. No dedicated `analysis.rs` module exists.

**Evidence:**
- `app/backend/crates/api/src/routes/api.rs:107-109`:
  ```rust
  fn analysis_routes() -> Router<Arc<AppState>> {
      Router::new().route("/", get(stub_get))
  }
  ```
- No `analysis.rs` file in routes directory
- No analysis-related models or repos

**Questions (add to DECISIONS_REQUIRED.md):**
- Is analysis a standalone feature or part of reference tracks?
- What endpoints should `/api/analysis` provide?
- Is this a duplicate of `/api/reference/tracks/:id/analysis`?

**Resolution Required:**
1. Clarify whether analysis is standalone or part of reference
2. If standalone: implement analysis.rs with proper routes
3. If part of reference: remove `/api/analysis` nest from api.rs

**Test Coverage (Blocked):**
- TEST-018: Analysis list E2E (P2, 🔒 Blocked on DECISION-006)
- TEST-019: Analysis contract (P2, 🔒 Blocked on DECISION-006)

**Gap Status with Tests:** Tests blocked pending decision. See ACTION-TEST-006.

**Links:**
- [feature_parity_checklist.md](./feature_parity_checklist.md) - PARITY-089
- [TEST_BACKLOG.md](./TEST_BACKLOG.md) - TEST-018, TEST-019

---

## Closed Gaps (All Resolved)

### ~~FGAP-001: Gamification Core Not Implemented~~ (CLOSED)

| Field | Value |
|-------|-------|
| **Severity** | Critical |
| **Category** | Backend Implementation |
| **Affects** | PARITY-019, PARITY-020 |
| **Blocks** | None (resolved) |
| **Status** | **Closed** |
| **Closed** | January 7, 2026 |

**Resolution:**
- ✅ Implemented `gamification.rs` with teaser and summary endpoints
- ✅ Created `gamification_repos.rs` with XP, wallet, achievements
- ✅ Frontend components updated (`RewardTeaser.tsx`, `ProgressClient.tsx`)
- ✅ E2E tests in `gamification.spec.ts`

**Evidence:**
- `validation_wave1_gamification_backend_post20G.md`
- `validation_wave1_gamification_frontend_post20G.md`

---

### ~~FGAP-002: Feature Routes Wave 1-3 Not Started~~ (CLOSED)

| Field | Value |
|-------|-------|
| **Severity** | Critical |
| **Category** | Backend Implementation |
| **Affects** | PARITY-021 through PARITY-039 |
| **Blocks** | None (resolved) |
| **Status** | **Closed** |
| **Closed** | January 7, 2026 |

**Resolution:**
- ✅ Wave 1: Focus, Habits, Goals (9 routes)
- ✅ Wave 2: Quests (5 routes)
- ✅ Wave 3: Exercise (13), Books (4), Market (7), Learn (10)
- ✅ All frontend API clients created
- ✅ All E2E tests created

**Evidence:**
- `validation_wave1_wave2_backend_post20G.md`
- `validation_wave2_core_productivity_post20G.md`
- `validation_wave3_fitness_learning_market_post20G.md`

---

### ~~FGAP-003: Reference Tracks Frontend Swap~~ (CLOSED)

| Field | Value |
|-------|-------|
| **Severity** | Medium |
| **Category** | Frontend Integration |
| **Affects** | PARITY-013 through PARITY-017 |
| **Blocks** | None (resolved) |
| **Status** | **Closed** |
| **Closed** | January 7, 2026 |

**Resolution:**
- ✅ Created `ReferenceLibraryV2.tsx` using backend API
- ✅ Updated page to use V2 component
- ✅ Added 14 E2E tests in `reference-tracks.spec.ts`
- ✅ All reference track CRUD via `referenceTracksApi`
- ✅ Audio streaming via backend signed URLs

**Evidence:**
- `app/frontend/src/components/references/ReferenceLibraryV2.tsx`
- `app/frontend/tests/reference-tracks.spec.ts`
- `docs/backend/migration/validation_reference_tracks_e2e_post20G.md`

**Links:**
- ACTION-041 (Done)

---

### ~~FGAP-004: Wave 4-5 Specialized Features Not Started~~ (CLOSED)

| Field | Value |
|-------|-------|
| **Severity** | High |
| **Category** | Backend Implementation |
| **Affects** | PARITY-040 through PARITY-070 |
| **Blocks** | None (resolved) |
| **Status** | **Closed** |
| **Closed** | January 7, 2026 |

**Resolution:**
- ✅ Wave 4: Calendar, Daily Plan, Feedback, Infobase, Ideas, Onboarding, User (28 routes)
- ✅ Wave 5: Admin routes (9/11 routes, 2 stubs for pg_dump/pg_restore)
- ✅ All frontend API clients created
- ✅ All E2E tests created

**Evidence:**
- `validation_wave4_platform_routes_post20G.md`
- `validation_wave5_admin_post20G.md`

---

### ~~FGAP-005: Admin Routes Mostly Stubs~~ (CLOSED)

| Field | Value |
|-------|-------|
| **Severity** | Medium |
| **Category** | Admin Implementation |
| **Affects** | PARITY-061 through PARITY-070 |
| **Blocks** | None (resolved) |
| **Status** | **Closed** |
| **Closed** | January 7, 2026 |

**Resolution:**
- ✅ Implemented 9/11 admin routes with full functionality
- ✅ User management with cascade delete
- ✅ Stats, feedback, quests, skills CRUD
- ✅ DB health endpoint
- ✅ Backup/restore remain stubs (use pg_dump externally)

**Evidence:**
- `validation_wave5_admin_post20G.md`
- `app/admin/tests/admin-rbac.spec.ts`

---

### ~~FGAP-006: Postgres Schema Incomplete~~ (CLOSED)

| Field | Value |
|-------|-------|
| **Severity** | High |
| **Category** | Database |
| **Affects** | All domains |
| **Blocks** | None (resolved) |
| **Status** | **Closed** |
| **Closed** | January 7, 2026 |

**Resolution:**
- ✅ Created 14 migrations covering all domains
- ✅ Exercise: `0011_fitness_substrate.sql` (10 tables)
- ✅ Books: `0012_books_substrate.sql` (2 tables)
- ✅ Learn: `0013_learn_substrate.sql` (6 tables)
- ✅ Platform: `0014_platform_substrate.sql` (calendar, daily_plan, feedback, infobase, ideas, onboarding, user)

**Evidence:**
- `app/database/migrations/` - 14 up/down migration pairs
- All backend routes compile and pass cargo check

---

### ~~FGAP-007: E2E Test Coverage Unknown~~ (CLOSED)

| Field | Value |
|-------|-------|
| **Severity** | Medium |
| **Category** | Testing |
| **Affects** | All PARITY items |
| **Blocks** | None (resolved) |
| **Status** | **Closed** |
| **Closed** | January 7, 2026 |

**Resolution:**
- ✅ 37+ Playwright test files in `tests/` directory
- ✅ Coverage per domain: focus, habits, goals, quests, exercise, books, market, learn, calendar, daily-plan, feedback, user-settings, onboarding, gamification, storage, reference-tracks, auth
- ✅ Admin RBAC tests in `app/admin/tests/`

**Evidence:**
- `file_search **/tests/*.spec.ts` returns 37+ files
- All wave validation docs list specific test counts

---

### ~~FGAP-008: Metric Drift Between Documents~~ (CLOSED)

| Field | Value |
|-------|-------|
| **Severity** | Low |
| **Category** | Documentation |
| **Affects** | All metrics |
| **Blocks** | None (resolved) |
| **Status** | **Closed** |
| **Closed** | January 7, 2026 |

**Resolution:**
- ✅ Created `WAVE_PLAN_POST20G.md` as authoritative source
- ✅ Created `METRICS_POST20G.md` with explicit formulas
- ✅ All tracking docs now reference consistent counts

---

## Gap Resolution Protocol

### Opening a Gap

1. Assign FGAP-XXX ID
2. Link to affected PARITY-XXX and/or ACTION-XXX items
3. Set severity (Critical/High/Medium/Low)
4. Add to this register

### Closing a Gap

1. Update Status to Closed
2. Add Resolution date and evidence
3. Move to Closed Gaps section
4. Update related PARITY/ACTION items

---

## References

- [checkpoint_post_waves.md](./checkpoint_post_waves.md) - Post-waves gate
- [WAVE_PLAN_POST20G.md](./WAVE_PLAN_POST20G.md) - Parity items
- [METRICS_POST20G.md](./METRICS_POST20G.md) - Metric definitions
- [gaps.md](./gaps.md) - Action items
- [LATER.md](./LATER.md) - External blockers

