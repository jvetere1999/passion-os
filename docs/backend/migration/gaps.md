"This file tracks required actions. Do not restate unknowns; reference UNKNOWN-XXX IDs."

# Migration Gaps - Action Items

**Date:** January 6, 2026  
**Updated:** January 7, 2026 (Post-Waves 1-5 + Observability)  
**Branch:** `refactor/stack-split`  
**Purpose:** Track required actions to close gaps and resolve unknowns

---

## Summary

| Status             | Count  |
|--------------------|--------|
| Done               | 48     |
| External           | 5      |
| Blocked (Decision) | 3      |
| Blocked (Architecture) | 2  |
| Partial            | 1      |
| Not Started        | 9      |
| Deferred           | 2      |
| **Total**          | **70** |

**Post-Audit Status:** Two new ACTION items from cleanup engineer: ACTION-055 (fix broken imports), ACTION-056 (unblock deprecation). Deprecation blocked until root `src/` replaced.

**Test Backlog Status:** Six ACTION-TEST items track test implementation. ACTION-TEST-001 partial (10/15), ACTION-TEST-003 complete. See [TEST_BACKLOG.md](./TEST_BACKLOG.md).

---

## Phase 2.7: Test Backlog Actions (NEW)

### ACTION-TEST-001: Implement Reference Router E2E Tests

| Field        | Value                                                                                           |
|--------------|-------------------------------------------------------------------------------------------------|
| **Resolves** | TEST-001 through TEST-015 (FGAP-009)                                                            |
| **Status**   | **Partial (10/15)**                                                                             |
| **Blocks**   | Go-live cutover                                                                                 |
| **Priority** | P0                                                                                              |
| **Discovered** | January 8, 2026 (Test Planning)                                                                |
| **Updated**  | January 8, 2026 (10 tests implemented)                                                          |

**Description:**
Created `tests/reference-router-e2e.spec.ts` containing Playwright tests validating reference track endpoints.

**Implemented Tests (10/15):**
- ✅ TEST-001: Tracks list (`GET /api/reference/tracks`)
- ✅ TEST-002: Track detail (`GET /api/reference/tracks/:id`)
- ✅ TEST-003: Track update (`PATCH /api/reference/tracks/:id`)
- ✅ TEST-004: Track delete (`DELETE /api/reference/tracks/:id`)
- ⏳ TEST-005: Analysis get - P1 planned
- ⏳ TEST-006: Analysis trigger - P1 planned
- ✅ TEST-007: Play URL (`GET /api/reference/tracks/:id/play`)
- ⏳ TEST-008: Stream - P1 planned
- ✅ TEST-009: Upload (`POST /api/reference/upload`)
- ✅ TEST-010: Annotations list (`GET /api/reference/tracks/:id/annotations`)
- ✅ TEST-011: Annotation create (`POST /api/reference/tracks/:id/annotations`)
- ⏳ TEST-012: Annotation update - P1 planned
- ⏳ TEST-013: Annotation delete - P1 planned
- ✅ TEST-014: Regions list (`GET /api/reference/tracks/:id/regions`)
- ⏳ TEST-015: Region create - P1 planned

**Validation:** [validation_feature_gap_tests_cutover.md](./validation_feature_gap_tests_cutover.md)

**Dependencies:** ACTION-053 must complete first (router wiring)

---

### ACTION-TEST-002: Implement Reference Router Integration Tests

| Field        | Value                                                                                           |
|--------------|-------------------------------------------------------------------------------------------------|
| **Resolves** | TEST-016 (FGAP-009)                                                                             |
| **Status**   | **Not Started**                                                                                 |
| **Blocks**   | Go-live cutover                                                                                 |
| **Priority** | P0                                                                                              |
| **Discovered** | January 8, 2026 (Test Planning)                                                                |

**Description:**
Create `app/backend/crates/api/src/tests/reference_router_tests.rs` containing backend integration tests validating all 9 reference route groups return non-stub, DB-backed responses.

**Dependencies:** ACTION-053 must complete first (router wiring)

---

### ACTION-TEST-003: Implement Reference Contract Tests

| Field        | Value                                                                                           |
|--------------|-------------------------------------------------------------------------------------------------|
| **Resolves** | TEST-017 (FGAP-009)                                                                             |
| **Status**   | **Done** (merged into ACTION-TEST-001)                                                          |
| **Blocks**   | None (resolved)                                                                                 |
| **Priority** | P0                                                                                              |
| **Discovered** | January 8, 2026 (Test Planning)                                                                |
| **Completed** | January 8, 2026                                                                                 |

**Description:**
TEST-017 contract validation implemented in `tests/reference-router-e2e.spec.ts` (merged with E2E tests for efficiency).

**Validation:** [validation_feature_gap_tests_cutover.md](./validation_feature_gap_tests_cutover.md)

---

### ACTION-TEST-004: Implement Infobase E2E Tests

| Field        | Value                                                                                           |
|--------------|-------------------------------------------------------------------------------------------------|
| **Resolves** | TEST-037 (FGAP-004 regression)                                                                  |
| **Status**   | **Not Started**                                                                                 |
| **Blocks**   | Full E2E coverage                                                                               |
| **Priority** | P1                                                                                              |
| **Discovered** | January 8, 2026 (Test Planning)                                                                |

**Description:**
Create `tests/infobase.spec.ts` containing Playwright tests for PARITY-095 through PARITY-099 (Infobase CRUD operations).

**Dependencies:** None (routes already implemented)

---

### ACTION-TEST-005: Implement Ideas E2E Tests

| Field        | Value                                                                                           |
|--------------|-------------------------------------------------------------------------------------------------|
| **Resolves** | TEST-038 (FGAP-004 regression)                                                                  |
| **Status**   | **Not Started**                                                                                 |
| **Blocks**   | Full E2E coverage                                                                               |
| **Priority** | P1                                                                                              |
| **Discovered** | January 8, 2026 (Test Planning)                                                                |

**Description:**
Create `tests/ideas.spec.ts` containing Playwright tests for PARITY-100 through PARITY-104 (Ideas CRUD operations).

**Dependencies:** None (routes already implemented)

---

### ACTION-TEST-006: Resolve DECISION-006 to Unblock Analysis Tests

| Field        | Value                                                                                           |
|--------------|-------------------------------------------------------------------------------------------------|
| **Resolves** | TEST-018, TEST-019 (FGAP-010)                                                                   |
| **Status**   | **Blocked (Decision)**                                                                          |
| **Blocks**   | API surface finalization                                                                        |
| **Priority** | P2                                                                                              |
| **Discovered** | January 8, 2026 (Test Planning)                                                                |

**Description:**
Cannot implement analysis tests until DECISION-006 determines whether the standalone `/api/analysis` route is kept, removed, or aliased.

**Pending Decision:** See DECISIONS_REQUIRED.md

---

## Phase 2.8: Deprecation Blocking (NEW)

### ACTION-055: Fix Root `src/` Broken Imports Before Deprecation

| Field        | Value                                                                                           |
|--------------|-------------------------------------------------------------------------------------------------|
| **Resolves** | TypeScript baseline issues                                                                      |
| **Status**   | **Blocked (Architecture)**                                                                      |
| **Blocks**   | All legacy deprecation                                                                          |
| **Priority** | HIGH                                                                                            |
| **Discovered** | January 8, 2026 (Cleanup Engineer)                                                             |

**Description:**
The root `src/` codebase has **60 "Cannot find module" TypeScript errors** because previous deprecation moved DB/perf modules without updating the consuming code.

**Broken Imports (by module):**
- `@/lib/perf` (16 references)
- `@/lib/db/repositories/users` (11 references)
- `@/lib/db/repositories/dailyPlans` (7 references)
- `@/lib/db` (5 references)
- Other DB repos (21 references)

**Evidence:**
- [deprecation_map.md](./deprecation_map.md)
- [removal_checklist.md](./removal_checklist.md)

**Resolution Options:**
1. Complete replacement of root `src/` with `app/frontend/` (recommended)
2. Update root `src/` code to use backend API via `src/lib/api/*` clients

**Dependencies:**
- Depends on full frontend cutover to `app/frontend/`

---

### ACTION-056: Unblock Flags/Admin/Config Deprecation

| Field        | Value                                                                                           |
|--------------|-------------------------------------------------------------------------------------------------|
| **Resolves** | Batch 1 deprecation items                                                                       |
| **Status**   | **Blocked (ACTION-055)**                                                                        |
| **Blocks**   | Legacy code cleanup                                                                             |
| **Priority** | MEDIUM                                                                                          |
| **Discovered** | January 8, 2026 (Cleanup Engineer)                                                             |

**Description:**
Cannot deprecate `src/lib/flags/`, `src/lib/admin/`, `wrangler.toml`, `open-next.config.ts` because root `src/` code imports them.

**Files in root `src/` importing `@/lib/flags` (5 files):**
- `src/app/(app)/today/TodayGridClient.tsx`
- `src/app/(app)/today/MomentumBanner.tsx`
- `src/app/(app)/today/StarterBlock.tsx`
- `src/app/(app)/focus/FocusClient.tsx`
- `src/components/mobile/screens/MobileTodayClient.tsx`

**Files in root `src/` importing `@/lib/admin` (3 files):**
- `src/app/(app)/admin/docs/page.tsx`
- `src/app/(app)/admin/page.tsx`
- `src/components/shell/UserMenu.tsx`

**Unblock Action:**
Depends on ACTION-055 completion

---

## Phase 2.6: Parity Audit Actions (NEW)

### ACTION-053: Wire Reference Router in api.rs

| Field        | Value                                                                                           |
|--------------|-------------------------------------------------------------------------------------------------|
| **Resolves** | FGAP-009, RISK-017, PARITY-080 through PARITY-088                                                |
| **Status**   | **Not Started**                                                                                 |
| **Blocks**   | Reference Tracks frontend integration                                                           |
| **Priority** | HIGH                                                                                            |
| **Discovered** | January 8, 2026 (Parity Audit)                                                                 |

**Description:**
Full reference tracks implementation exists in `reference.rs` (816 lines) but `api.rs` uses a stub `reference_routes()` function instead of wiring the actual `super::reference::router()`.

**Changes Required:**
1. Update `api.rs:37` from `.nest("/reference", reference_routes())` to `.nest("/reference", super::reference::router())`
2. Remove the stub `reference_routes()` function (lines 100-105)
3. Verify frontend API client compatibility
4. Run reference track E2E tests

**Evidence:**
- `app/backend/crates/api/src/routes/reference.rs` (816 lines)
- `app/backend/crates/api/src/routes/api.rs:100-105` (stub function)

---

### ACTION-054: Resolve Analysis Route Ambiguity

| Field        | Value                                                                                           |
|--------------|-------------------------------------------------------------------------------------------------|
| **Resolves** | FGAP-010, RISK-019, DECISION-006                                                                 |
| **Status**   | **Blocked (Decision)**                                                                          |
| **Blocks**   | API surface finalization                                                                        |
| **Priority** | LOW                                                                                             |
| **Discovered** | January 8, 2026 (Parity Audit)                                                                 |

**Description:**
The `/api/analysis` route exists as a stub in `api.rs:107-109` but its purpose is unclear. Reference tracks already have analysis endpoints.

**Pending Decision:**
See DECISION-006 in DECISIONS_REQUIRED.md

**Options:**
- A: Remove standalone route (recommended)
- B: Implement as standalone feature
- C: Alias to reference tracks analysis

**Evidence:**
- `app/backend/crates/api/src/routes/api.rs:107-109` (stub)
- Reference tracks analysis: `GET/POST /api/reference/tracks/:id/analysis`

---

## Phase 2.5: Observability/Audit (DONE)

### ACTION-049: Observability/Audit Activation

| Field        | Value                                                                                           |
|--------------|-------------------------------------------------------------------------------------------------|
| **Resolves** | RISK-011 (Audit Log Gap), Security Model visibility requirement                                  |
| **Status**   | **Done**                                                                                        |
| **Blocks**   | None (complete)                                                                                 |
| **Completed**| January 7, 2026                                                                                 |

**Deliverables:**
- Fixed `PostgresAuditSink` table/column mappings in `shared/audit.rs`
- Added `Purchase` and `Refund` event types
- Created `write_audit()` helper for fire-and-forget logging
- Added audit to `purchase_item` (market.rs)
- Added audit to `delete_user`, `cleanup_user` (admin.rs)
- Created `AdminAuditRepo` with list_entries, get_event_types
- Added `/admin/audit` routes (list entries, event types)
- Created admin audit UI page at `app/admin/src/app/audit/page.tsx`
- Created Playwright RBAC tests in `audit-log.spec.ts`

**Validation:** `validation_observability_audit_post20G.md`

---

## Phase 2.4: Wave 5 Admin Routes (DONE)

### ACTION-048: Wave 5 Admin Routes Implementation

| Field        | Value                                                                                           |
|--------------|-------------------------------------------------------------------------------------------------|
| **Resolves** | PARITY-061 through PARITY-070, FGAP-005                                                          |
| **Status**   | **Done**                                                                                        |
| **Blocks**   | None (complete)                                                                                 |
| **Completed**| January 7, 2026                                                                                 |

**Deliverables:**
- `app/backend/crates/api/src/db/admin_models.rs` - Admin types
- `app/backend/crates/api/src/db/admin_repos.rs` - Admin repositories
- `app/backend/crates/api/src/routes/admin.rs` - 9 admin routes
- `app/admin/src/lib/api/admin.ts` - Admin API client
- `app/admin/tests/admin-rbac.spec.ts` - RBAC tests

**Routes Implemented (9/11):**
- `/admin` - Info endpoint
- `/admin/users` - User management + cascade delete
- `/admin/users/:id/cleanup` - Cleanup user data
- `/admin/stats` - Dashboard stats
- `/admin/feedback` - Feedback moderation
- `/admin/quests` - Universal quest CRUD
- `/admin/skills` - Skill definition CRUD
- `/admin/content` - Content stats
- `/admin/db-health` - DB health + table counts

**Stubs (2):**
- `/admin/backup` - Use pg_dump externally
- `/admin/restore` - Use pg_restore externally

**Validation:** `validation_wave5_admin_post20G.md`

---

## Phase 2.3: Wave 4 Platform Routes (DONE)

### ACTION-047: Wave 4 Platform Routes Implementation

| Field        | Value                                                                                           |
|--------------|-------------------------------------------------------------------------------------------------|
| **Resolves** | PARITY-029 through PARITY-056 (Calendar, Daily Plan, Feedback, Infobase, Ideas, Onboarding, User) |
| **Status**   | **Done**                                                                                        |
| **Blocks**   | None (complete)                                                                                 |
| **Completed**| January 7, 2026                                                                                 |

**Database Migration Created:**
- `app/database/0014_platform_substrate.sql` - Platform tables

**Backend Created:**
- `app/backend/crates/api/src/db/platform_models.rs` - Type definitions
- `app/backend/crates/api/src/db/platform_repos.rs` - Database operations
- `app/backend/crates/api/src/routes/calendar.rs` - 4 routes
- `app/backend/crates/api/src/routes/daily_plan.rs` - 4 routes
- `app/backend/crates/api/src/routes/feedback.rs` - 2 routes
- `app/backend/crates/api/src/routes/infobase.rs` - 5 routes
- `app/backend/crates/api/src/routes/ideas.rs` - 5 routes
- `app/backend/crates/api/src/routes/onboarding.rs` - 5 routes
- `app/backend/crates/api/src/routes/user.rs` - 4 routes

**Frontend API Clients Created:**
- `app/frontend/src/lib/api/calendar.ts`
- `app/frontend/src/lib/api/daily-plan.ts`
- `app/frontend/src/lib/api/feedback.ts`
- `app/frontend/src/lib/api/infobase.ts`
- `app/frontend/src/lib/api/ideas.ts`
- `app/frontend/src/lib/api/onboarding.ts`
- `app/frontend/src/lib/api/user.ts`

**Playwright E2E Tests:**
- `tests/calendar.spec.ts`
- `tests/daily-plan.spec.ts`
- `tests/feedback.spec.ts`
- `tests/user-settings.spec.ts`
- `tests/onboarding.spec.ts`

**Total Routes:** 29 routes

**Validation:** `validation_wave4_platform_routes_post20G.md`

---

## Phase 2.2: Wave 3 Fitness + Learning + Market (DONE)

### ACTION-046: Wave 3 Fitness + Learning + Market Implementation

| Field        | Value                                                                                           |
|--------------|-------------------------------------------------------------------------------------------------|
| **Resolves** | PARITY-032 to PARITY-039: Exercise, Books, Programs, Market, Learn                              |
| **Status**   | **Done**                                                                                        |
| **Blocks**   | None (complete)                                                                                 |
| **Completed**| January 2026                                                                                    |

**Database Migrations Created (6):**
- `app/database/0011_fitness_substrate.sql` - 10 tables (exercises, workouts, sessions, programs, etc.)
- `app/database/0011_fitness_substrate_down.sql` - Rollback
- `app/database/0012_books_substrate.sql` - 2 tables + function (books, reading_sessions)
- `app/database/0012_books_substrate_down.sql` - Rollback
- `app/database/0013_learn_substrate.sql` - 6 tables + function (topics, lessons, drills, progress)
- `app/database/0013_learn_substrate_down.sql` - Rollback

**Backend Models + Repos Created (8 files):**
- `app/backend/crates/api/src/db/exercise_models.rs`
- `app/backend/crates/api/src/db/exercise_repos.rs`
- `app/backend/crates/api/src/db/books_models.rs`
- `app/backend/crates/api/src/db/books_repos.rs`
- `app/backend/crates/api/src/db/market_models.rs`
- `app/backend/crates/api/src/db/market_repos.rs`
- `app/backend/crates/api/src/db/learn_models.rs`
- `app/backend/crates/api/src/db/learn_repos.rs`

**Backend Routes Created (4 files):**
- `app/backend/crates/api/src/routes/exercise.rs` - 13 routes
- `app/backend/crates/api/src/routes/books.rs` - 4 routes
- `app/backend/crates/api/src/routes/market.rs` - 7 routes
- `app/backend/crates/api/src/routes/learn.rs` - 10 routes

**Frontend API Clients Created (4 files):**
- `app/frontend/src/lib/api/exercise.ts`
- `app/frontend/src/lib/api/books.ts`
- `app/frontend/src/lib/api/market.ts`
- `app/frontend/src/lib/api/learn.ts`

**Playwright E2E Tests Created/Updated (4 files):**
- `tests/exercise.spec.ts` - Workout create -> session log flow
- `tests/books.spec.ts` - Book add -> reading session flow
- `tests/market.spec.ts` - Purchase -> wallet debits -> history flow (updated)
- `tests/learn.spec.ts` - Topics -> lessons -> complete flow

**Validation Document:**
- `docs/backend/migration/validation_wave3_fitness_learning_market_post20G.md`

**Total Routes:** 34 routes (Exercise: 13, Books: 4, Market: 7, Learn: 10)

---

## Phase 2.1: Wave 2 Core Productivity (DONE)

### ACTION-045: Wave 2 Core Productivity Implementation

| Field        | Value                                                                                           |
|--------------|-------------------------------------------------------------------------------------------------|
| **Resolves** | PARITY-021 to PARITY-028: Focus, Habits, Goals, Quests                                          |
| **Status**   | **Done**                                                                                        |
| **Blocks**   | None (complete)                                                                                 |
| **Completed**| January 7, 2026                                                                                 |

**Backend Already Complete (Prior Work):**
- `app/backend/crates/api/src/routes/focus.rs` - 5 route handlers (212 lines)
- `app/backend/crates/api/src/routes/habits.rs` - 3 route handlers (105 lines)
- `app/backend/crates/api/src/routes/goals.rs` - 5 route handlers (133 lines)
- `app/backend/crates/api/src/routes/quests.rs` - 6 route handlers (139 lines)
- `app/backend/crates/api/src/db/focus_repos.rs` - Focus repositories (436 lines)
- `app/backend/crates/api/src/db/habits_goals_repos.rs` - Habits/Goals repos (537 lines)
- `app/backend/crates/api/src/db/quests_repos.rs` - Quests repositories (271 lines)
- Backend unit tests: 48 total (focus: 12, habits: 10, goals: 12, quests: 14)

**Frontend API Clients Created:**
- `app/frontend/src/lib/api/focus.ts` - Focus API client (186 lines)
- `app/frontend/src/lib/api/habits.ts` - Habits API client (104 lines)
- `app/frontend/src/lib/api/goals.ts` - Goals API client (129 lines)
- `app/frontend/src/lib/api/quests.ts` - Quests API client (137 lines)

**Playwright E2E Tests Created:**
- `tests/focus.spec.ts` - 12 tests (225 lines)
- `tests/habits.spec.ts` - 10 tests (251 lines)
- `tests/goals.spec.ts` - 10 tests (256 lines)
- `tests/quests.spec.ts` - 12 tests (294 lines)

**Validation Document:**
- `docs/backend/migration/validation_wave2_core_productivity_post20G.md`

**Routes Implemented:**
- Focus: GET,POST /api/focus, GET /api/focus/active, GET,POST,DELETE /api/focus/pause, POST /api/focus/:id/complete, POST /api/focus/:id/abandon
- Habits: GET,POST /api/habits, POST /api/habits/:id/complete
- Goals: GET,POST /api/goals, GET /api/goals/:id, POST /api/goals/:id/milestones, POST /api/goals/milestones/:id/complete
- Quests: GET,POST /api/quests, GET /api/quests/:id, POST /api/quests/:id/accept, POST /api/quests/:id/complete, POST /api/quests/:id/abandon

**Total Routes:** 16 routes

---

## Phase 1.16: Wave 1 Gamification Frontend Swap (DONE)

### ACTION-044: Gamification Frontend API Swap

| Field        | Value                                                                                           |
|--------------|-------------------------------------------------------------------------------------------------|
| **Resolves** | Frontend swap for PARITY-019, PARITY-020                                                        |
| **Status**   | **Done**                                                                                        |
| **Blocks**   | None (complete)                                                                                 |
| **Completed**| January 7, 2026                                                                                 |

**Deliverables Created:**
- `src/lib/api/gamification.ts` - API client module (94 lines)
- `tests/gamification.spec.ts` - E2E tests (7 tests)
- `docs/backend/migration/validation_wave1_gamification_frontend_post20G.md` - Validation

**Components Updated:**
- `RewardTeaser.tsx` - Uses `getAchievementTeaser()` from API client
- `ProgressClient.tsx` - Uses `getGamificationSummary()` from API client
- `MobileProgress.tsx` - Uses `getGamificationSummary()` from API client

**Features:**
- All progress/gamification data fetched from backend
- No localStorage usage for gamification data
- E2E tests verify API integration
- data-testid attributes for testing

---

## Phase 1.15: Wave 1 Gamification Backend (DONE)

### ACTION-043: Implement Gamification Backend (EXTRACT-001)

| Field        | Value                                                                                           |
|--------------|-------------------------------------------------------------------------------------------------|
| **Resolves** | EXTRACT-001 - Gamification core for XP, coins, wallet, achievements, streaks                    |
| **Status**   | **Done**                                                                                        |
| **Blocks**   | None (unblocks EXTRACT-002, EXTRACT-003, EXTRACT-004, EXTRACT-005, etc.)                        |
| **Completed**| January 7, 2026                                                                                 |

**Deliverables Created:**
- `app/backend/crates/api/src/db/gamification_models.rs` - Models (210 lines)
- `app/backend/crates/api/src/db/gamification_repos.rs` - Repositories with idempotency (550 lines)
- `app/backend/crates/api/src/routes/gamification.rs` - HTTP routes (65 lines)
- `app/backend/crates/api/src/tests/gamification_tests.rs` - 18 unit tests (350 lines)
- `docs/backend/migration/validation_wave1_gamification_backend_post20G.md` - Validation report

**Routes Implemented:**
- `GET /gamification/summary` - Complete gamification summary (PARITY-020)
- `GET /gamification/teaser` - Next achievement teaser (PARITY-019)

**Backend Tests:** 128 total, all passing (18 new gamification tests)

**Features:**
- XP award with level-up detection
- Coin award and spend with balance check
- Idempotency via idempotency_key (prevents double awards)
- Streak tracking (daily_activity)
- Achievement unlock (idempotent)
- Event logging to points_ledger (audit trail)

---

## Phase 1.14: Admin Listening Templates (DONE)

### ACTION-042: Implement Admin Listening Prompt Templates

| Field        | Value                                                                                           |
|--------------|-------------------------------------------------------------------------------------------------|
| **Resolves** | Admin-curated listening prompts for critical listening exercises                                 |
| **Status**   | **Done**                                                                                        |
| **Blocks**   | None (complete)                                                                                 |
| **Completed**| January 7, 2026                                                                                 |

**Deliverables Created:**
- `app/database/migrations/0010_listening_prompt_templates.sql` - Schema migration
- `app/backend/crates/api/src/db/template_models.rs` - Rust models
- `app/backend/crates/api/src/db/template_repos.rs` - Repositories
- `app/backend/crates/api/src/routes/admin_templates.rs` - Admin routes
- `app/backend/crates/api/src/tests/template_tests.rs` - 13 tests
- `app/admin/src/app/templates/` - Admin UI
- `docs/backend/migration/reference_tracks_admin.md` - Documentation
- `docs/backend/migration/validation_reference_tracks_admin.md` - Validation report

**Backend Tests:** 110 total, all passing (13 new template tests)

---

## Phase 1.13: Cutover Preparation (DONE)

### ACTION-039: Create Cutover Plan Document

| Field        | Value                                                                                           |
|--------------|-------------------------------------------------------------------------------------------------|
| **Resolves** | ISSUE-003 from gaps_checkpoint_after_infra.md                                                    |
| **Status**   | **Done**                                                                                        |
| **Blocks**   | None (complete)                                                                                 |
| **Completed**| January 7, 2026                                                                                 |

**Deliverables Created:**
- `deploy/routing.md` - Production routing configuration
- `docs/backend/migration/go_live_checklist.md` - Cutover procedure
- `docs/backend/migration/rollback_checklist.md` - Rollback procedure
- `docs/backend/migration/oauth_redirect_overlap_plan.md` - OAuth transition
- `docs/backend/migration/session_cutover_plan.md` - Session handling (DEC-001=A)

---

### ACTION-041: Reference Tracks Frontend API Swap

| Field        | Value                                                                                           |
|--------------|-------------------------------------------------------------------------------------------------|
| **Resolves** | ISSUE-NEW-001 from gaps_checkpoint_pre_go_live.md                                                |
| **Status**   | **Done**                                                                                        |
| **Completed**| January 7, 2026                                                                                 |
| **Evidence** | `ReferenceLibraryV2.tsx`, E2E tests in `reference-tracks.spec.ts`                               |

**Deliverables Created:**
- `app/frontend/src/components/references/ReferenceLibraryV2.tsx` - Backend-integrated component
- `app/frontend/tests/reference-tracks.spec.ts` - 14 E2E tests
- `docs/backend/migration/reference_tracks_swap_plan_post20G.md` - Swap plan
- `docs/backend/migration/validation_reference_tracks_e2e_post20G.md` - Validation

**Changes:**
- Replaced IndexedDB/localStorage with backend API calls
- Audio streaming via signed URLs (no R2 credentials in frontend)
- Annotations/regions CRUD via backend API
- Updated page to use ReferenceLibraryV2

---

### ACTION-040: Complete Feature Route Implementation

| Field        | Value                                                                                           |
|--------------|-------------------------------------------------------------------------------------------------|
| **Resolves** | ISSUE-001 from gaps_checkpoint_after_infra.md                                                    |
| **Status**   | **Done**                                                                                        |
| **Blocks**   | None (complete)                                                                                 |
| **Completed**| January 7, 2026                                                                                 |

**Routes Implemented:** 82/86 (4 deferred: ToS, age verification, backup, restore)

**Waves Completed:**
- Wave 1: Gamification (2), Focus (5), Habits (2), Goals (4) = 13 routes
- Wave 2: Quests (5) = 5 routes
- Wave 3: Exercise (13), Books (4), Market (7), Learn (10) = 34 routes
- Wave 4: Calendar (4), Daily Plan (4), Feedback (2), Infobase (5), Ideas (5), Onboarding (5), User (4) = 29 routes
- Wave 5: Admin (9) = 9 routes (2 stubs for external tooling)

**Evidence:** 9 validation documents in `docs/backend/migration/`

---

## Phase 1.12: D1 Removal Preparation (NOT STARTED)

### ACTION-038: Remove D1 Scripts from package.json

| Field        | Value                                                                                           |
|--------------|-------------------------------------------------------------------------------------------------|
| **Resolves** | D1-specific npm scripts that will break after cutover                                            |
| **Status**   | **Not Started** (blocked until feature parity)                                                  |
| **Blocks**   | Phase 26 (Cutover)                                                                              |
| **Evidence** | [gaps_checkpoint_after_d1_removal.md](./gaps_checkpoint_after_d1_removal.md#issue-001)          |

**Scripts to Remove (11):**
- db:generate, db:migrate:local, db:migrate:prod
- db:migrate:file:local, db:migrate:file:prod
- db:studio:local
- db:seed:local, db:seed:remote
- db:reset:master:local, db:reset:master:remote

**Shell Scripts to Deprecate:**
- scripts/reset-local-db.sh → deprecated/
- scripts/reset-remote-db.sh → deprecated/
- scripts/seed-exercises.mjs → deprecated/

---

## Phase 1.11: D1 Deprecation Planning (DONE)

### ACTION-037: Create D1 Deprecation Report

| Field        | Value                                                                                           |
|--------------|-------------------------------------------------------------------------------------------------|
| **Resolves** | D1 removal planning and documentation                                                            |
| **Status**   | **Done**                                                                                        |
| **Evidence** | [d1_deprecation_report.md](./d1_deprecation_report.md)                                           |
| **Result**   | Inventory of 24 D1 files, 51 API routes, deprecation plan documented                            |

---

## Phase 1.10: Feature Table Migrations (DONE)

### ACTION-036: Create Feature Table Migrations

| Field        | Value                                                                                           |
|--------------|-------------------------------------------------------------------------------------------------|
| **Resolves** | D1 → Postgres schema translation for Waves 1-3                                                   |
| **Status**   | **Done**                                                                                        |
| **Evidence** | `app/database/migrations/0002-0007*.sql`, migration notes, reconciliation plan                   |
| **Result**   | 6 migrations covering 10/24 table groups; 26 new tables created                                 |

**Migrations Created:**
- 0002: Gamification (8 tables, 4 functions, 1 view)
- 0003: Focus (2 tables, 2 functions, 2 views)
- 0004: Habits/Goals (4 tables, 2 functions, 2 views)
- 0005: Quests (3 tables, 3 functions, 2 views)
- 0006: Planning (3 tables, 2 views)
- 0007: Market (2 tables, 2 functions, 3 views)

---

## Phase 1.9: Frontend API Client (DONE)

### ACTION-035: Create Shared API Client

| Field        | Value                                                                                           |
|--------------|-------------------------------------------------------------------------------------------------|
| **Resolves** | Single API client wrapper for frontend/admin                                                     |
| **Status**   | **Done**                                                                                        |
| **Evidence** | `shared/api-client/`, `docs/frontend/migration/api_swap_progress.md`, `tests/storage.spec.ts`    |
| **Result**   | API client with hooks, server client, Playwright tests; 12/64 routes done                       |

---

## Phase 1.8: Feature Porting Playbook (DONE)

### ACTION-034: Create Feature Porting Playbook

| Field        | Value                                                                                                                      |
|--------------|----------------------------------------------------------------------------------------------------------------------------|
| **Resolves** | Systematic feature porting process                                                                                         |
| **Status**   | **Done**                                                                                                                   |
| **Evidence** | [feature_porting_playbook.md](./feature_porting_playbook.md), [feature_parity_checklist.md](./feature_parity_checklist.md) |
| **Result**   | Playbook with templates; checklist tracking 56 routes (6 done, 50 pending)                                                 |

---

## Phase 1.7: API Contracts (DONE)

### ACTION-033: Create Shared API Types Package

| Field        | Value                                                                                           |
|--------------|-------------------------------------------------------------------------------------------------|
| **Resolves** | Minimize hand-coding during frontend/backend integration                                         |
| **Status**   | **Done**                                                                                        |
| **Evidence** | `shared/api-types/` typechecks, [api_contract_strategy.md](./api_contract_strategy.md)           |
| **Result**   | Shared types package with auth, storage, focus, gamification types; frontend guide; test plan   |

---

## Phase 1.6: R2 Integration (DONE)

### ACTION-032: Implement R2 Storage Backend

| Field        | Value                                                                                           |
|--------------|-------------------------------------------------------------------------------------------------|
| **Resolves** | R2 backend-only access requirement                                                               |
| **Status**   | **Done**                                                                                        |
| **Evidence** | [r2_api_spec.md](./r2_api_spec.md), 15 storage tests passing                                     |
| **Result**   | Storage client, blob routes, signed URLs, IDOR prevention; 35 total tests passing               |

---

## Phase 1.5: Auth Implementation (DONE)

### ACTION-031: Implement Auth/Sessions/RBAC

| Field        | Value                                                                                                        |
|--------------|--------------------------------------------------------------------------------------------------------------|
| **Resolves** | DEC-001, DEC-002, DEC-004 requirements                                                                       |
| **Status**   | **Done**                                                                                                     |
| **Evidence** | [auth_impl_notes.md](./auth_impl_notes.md), [gaps_checkpoint_after_auth.md](./gaps_checkpoint_after_auth.md) |
| **Result**   | OAuth, sessions, CSRF, RBAC implemented; 20 tests passing                                                    |

---

## Phase 1: Unblock Backend Development

### ACTION-001: Provision PostgreSQL Database

| Field        | Value                                               |
|--------------|-----------------------------------------------------|
| **Resolves** | UNKNOWN-007                                         |
| **Status**   | **External** → See [LATER.md](./LATER.md#later-001) |
| **Evidence** | Requires cloud provider console access              |

---

### ACTION-002: Set Up Azure Key Vault

| Field        | Value                                               |
|--------------|-----------------------------------------------------|
| **Resolves** | UNKNOWN-006                                         |
| **Status**   | **External** → See [LATER.md](./LATER.md#later-002) |
| **Evidence** | Requires Azure subscription access                  |

---

### ACTION-003: Generate R2 S3 API Credentials

| Field | Value |
|-------|-------|
| **Resolves** | UNKNOWN-005 |
| **Status** | **External** → See [LATER.md](./LATER.md#later-003) |
| **Evidence** | Requires Cloudflare dashboard access |

---

### ACTION-004: Complete D1 Schema Audit

| Field | Value |
|-------|-------|
| **Resolves** | UNKNOWN-012, UNKNOWN-013 |
| **Status** | **Done** |
| **Evidence** | `.tmp/quests_usage.log`, `.tmp/user_progress_usage.log` |
| **Result** | Both quests tables active; user_progress actively used |

See: [NOW.md](./NOW.md)

---

## Phase 2: Unblock Auth Implementation

### ACTION-005: Document OAuth Redirect URIs

| Field | Value |
|-------|-------|
| **Resolves** | UNKNOWN-002 |
| **Status** | **External** → See [LATER.md](./LATER.md#later-004) |
| **Evidence** | Requires Google/Azure console access |

---

### ACTION-006: Design CSRF Protection

| Field | Value |
|-------|-------|
| **Resolves** | Security requirement |
| **Status** | **Done** (DEC-002 = A) |
| **Evidence** | Origin/Referer verification chosen. See [DECISIONS.md](./DECISIONS.md) |
| **Result** | CSRF = strict Origin/Referer allowlist for POST/PUT/PATCH/DELETE |

---

### ACTION-007: Decide Session Migration Strategy

| Field | Value |
|-------|-------|
| **Resolves** | UNKNOWN-001 |
| **Status** | **Done** (DEC-001 = A) |
| **Evidence** | Force re-auth chosen. See [DECISIONS.md](./DECISIONS.md) |
| **Result** | D1 unseeded data may be deleted at cutover |

---

## Phase 3: Unblock Deployment

### ACTION-008: Decide Container Platform

| Field | Value |
|-------|-------|
| **Resolves** | UNKNOWN-008 |
| **Status** | **External** → See [LATER.md](./LATER.md#later-005) |
| **Evidence** | Requires infrastructure decision |

---

### ACTION-009: Configure api.ecent.online Domain

| Field | Value |
|-------|-------|
| **Resolves** | Infrastructure requirement |
| **Status** | **Not Started** |
| **Evidence** | DNS/TLS provisioning needed |

---

### ACTION-010: Configure admin.ignition.ecent.online Domain

| Field | Value |
|-------|-------|
| **Resolves** | Infrastructure requirement |
| **Status** | **Not Started** |
| **Evidence** | DNS/TLS provisioning needed |

---

## Phase 4: Implementation (Resolved via Repo Inspection)

### ACTION-011: Audit Auth Handler Implementation

| Field | Value |
|-------|-------|
| **Resolves** | Gap in api_endpoint_inventory.md |
| **Status** | **Not Started** |
| **When** | Before implementing auth routes in Rust |

---

### ACTION-012: Audit Habits Route

| Field | Value |
|-------|-------|
| **Resolves** | Gap in api_endpoint_inventory.md |
| **Status** | **Not Started** |
| **When** | Before implementing habits routes in Rust |

---

### ACTION-013: Audit Learn Routes

| Field | Value |
|-------|-------|
| **Resolves** | Gap in api_endpoint_inventory.md |
| **Status** | **Not Started** |
| **When** | Before implementing learn routes in Rust |

---

### ACTION-014: Audit Focus Routes

| Field | Value |
|-------|-------|
| **Resolves** | Gap in api_endpoint_inventory.md |
| **Status** | **Not Started** |
| **When** | Before implementing focus routes in Rust |

---

### ACTION-015: Audit Quests Route

| Field | Value |
|-------|-------|
| **Resolves** | Gap in api_endpoint_inventory.md |
| **Status** | **Not Started** |
| **When** | Before implementing quests routes in Rust |

---

### ACTION-016: Audit Feature Flag Usage

| Field | Value |
|-------|-------|
| **Resolves** | UNKNOWN-003 |
| **Status** | **Done** |
| **Evidence** | `.tmp/flag_today_usage.log`, `src/lib/flags/index.ts` |
| **Result** | All flags are deprecated stubs returning true |

See: [NOW.md](./NOW.md)

---

### ACTION-017: Audit Audit Log Usage

| Field | Value |
|-------|-------|
| **Resolves** | UNKNOWN-004 |
| **Status** | **Done** |
| **Evidence** | `.tmp/audit_log_usage.log` (empty) |
| **Result** | admin_audit_log table not used in code |

See: [NOW.md](./NOW.md)

---

### ACTION-018: Clarify quests vs universal_quests

| Field | Value |
|-------|-------|
| **Resolves** | UNKNOWN-012 |
| **Status** | **Done** |
| **Evidence** | `.tmp/quests_usage.log` |
| **Result** | Both tables active, serve different purposes |

See: [NOW.md](./NOW.md)

---

### ACTION-019: Clarify user_progress Table

| Field | Value |
|-------|-------|
| **Resolves** | UNKNOWN-013 |
| **Status** | **Done** |
| **Evidence** | `.tmp/user_progress_usage.log` |
| **Result** | Actively used for XP/level tracking |

See: [NOW.md](./NOW.md)

---

### ACTION-020: Clarify learn_exercises/learn_modules Tables

| Field | Value |
|-------|-------|
| **Resolves** | Gap in d1_usage_inventory.md |
| **Status** | **Deferred** |
| **When** | During schema migration |

---

### ACTION-021: Document R2 File Size Limits

| Field | Value |
|-------|-------|
| **Resolves** | Gap in r2_usage_inventory.md |
| **Status** | **Done** |
| **Evidence** | `src/lib/storage/types.ts:99-107` |
| **Result** | MAX_FILE=100MB, MAX_AUDIO=50MB, MAX_IMAGE=10MB |

See: [NOW.md](./NOW.md)

---

### ACTION-022: Check Storage Quota Implementation

| Field        | Value                                                |
|--------------|------------------------------------------------------|
| **Resolves** | UNKNOWN-014                                          |
| **Status**   | **Done**                                             |
| **Evidence** | `.tmp/storage_quota.log`, `src/lib/storage/types.ts` |
| **Result**   | Per-file limits exist; no per-user quotas            |

See: [NOW.md](./NOW.md)

---

### ACTION-023: Check Orphan Blob Cleanup

| Field        | Value                       |
|--------------|-----------------------------|
| **Resolves** | UNKNOWN-015                 |
| **Status**   | **Done**                    |
| **Evidence** | `.tmp/orphan_cleanup.log`   |
| **Result**   | No cleanup mechanism exists |

See: [NOW.md](./NOW.md)

---

### ACTION-024: Audit Mobile Routes

| Field        | Value                                                   |
|--------------|---------------------------------------------------------|
| **Resolves** | UNKNOWN-009                                             |
| **Status**   | **Done**                                                |
| **Evidence** | `.tmp/mobile_files.log`, `.tmp/mobile_dependencies.log` |
| **Result**   | Standard patterns, no special dependencies              |

See: [NOW.md](./NOW.md)

---

### ACTION-025: Research Session Token Rotation

| Field        | Value                      |
|--------------|----------------------------|
| **Resolves** | Gap in auth_inventory.md   |
| **Status**   | **Deferred**               |
| **When**     | During auth implementation |

---

### ACTION-026: Test Account Linking Edge Cases

| Field        | Value                    |
|--------------|--------------------------|
| **Resolves** | Gap in auth_inventory.md |
| **Status**   | **Deferred**             |
| **When**     | During auth testing      |

---

### ACTION-027: Document TOS Enforcement Flow

| Field        | Value                              |
|--------------|------------------------------------|
| **Resolves** | Gap in auth_inventory.md           |
| **Status**   | **Deferred**                       |
| **When**     | Before implementing TOS in backend |

---

### ACTION-028: Decide Lint Warning Resolution Timing

| Field        | Value                                                         |
|--------------|---------------------------------------------------------------|
| **Resolves** | UNKNOWN-016                                                   |
| **Status**   | **Done** (DEC-003 = C)                                        |
| **Evidence** | Fix post-migration chosen. See [DECISIONS.md](./DECISIONS.md) |
| **Result**   | Temporary baseline waiver in [exceptions.md](./exceptions.md) |

---

### ACTION-029: Assess E2E Test Coverage

| Field        | Value                          |
|--------------|--------------------------------|
| **Resolves** | UNKNOWN-011                    |
| **Status**   | **Deferred**                   |
| **When**     | Before migration testing phase |

---

### ACTION-030: Decide Admin Authorization Strategy

| Field        | Value                                                               |
|--------------|---------------------------------------------------------------------|
| **Resolves** | UNKNOWN-017, RISK-008                                               |
| **Status**   | **Done** (DEC-004 = B)                                              |
| **Evidence** | DB-backed roles chosen. See [DECISIONS.md](./DECISIONS.md)          |
| **Result**   | Admin authorization = DB-backed roles (user-borne gating persisted) |

---

## Phase 24: Legacy Deprecation Actions

### ACTION-050: Fix Frontend New Warnings

| Field        | Value                                                               |
|--------------|---------------------------------------------------------------------|
| **Resolves** | PRE_DEPRECATED_GATE warnings delta (+3)                             |
| **Status**   | **Not Started**                                                     |
| **Blocks**   | ACTION-052 (Legacy deprecation)                                     |
| **Priority** | HIGH                                                                |

**Warnings to Fix (3):**
- `app/frontend/src/components/references/TrackVisualizer.tsx:60` - `_ANNOTATION_HEIGHT` unused
- `app/frontend/src/components/references/TrackVisualizer.tsx:80` - `_streamUrl` unused
- `app/frontend/src/components/references/TrackVisualizer.tsx:85` - `_manifest` unused
- `app/frontend/src/lib/api/exercise.ts:11` - `apiPut` unused

**Alternative:** Add to existing_warnings.md with DEC-005=B

---

### ACTION-051: Establish Backend Warnings Baseline

| Field        | Value                                                               |
|--------------|---------------------------------------------------------------------|
| **Resolves** | UNKNOWN-009 (Backend warnings baseline)                             |
| **Status**   | **Blocked** (needs owner decision)                                  |
| **Blocks**   | ACTION-052 (Legacy deprecation)                                     |
| **Priority** | HIGH                                                                |

**Current State:**
- 206 Rust warnings from `cargo check`
- Mostly unused imports from route scaffolding (~150)
- Dead code warnings (~30)
- Unused variables (~20)

**Awaiting:** DEC-005 decision on warning policy

---

### ACTION-052: Move Legacy Files to deprecated/

| Field        | Value                                                               |
|--------------|---------------------------------------------------------------------|
| **Resolves** | Phase 24 (Legacy Deprecation)                                       |
| **Status**   | **Not Started**                                                     |
| **Blocks**   | Phase 26 (Cutover)                                                  |
| **Priority** | MEDIUM                                                              |
| **Depends**  | ACTION-050, ACTION-051                                              |

**Move Plan:**
```
src/lib/db/              → deprecated/src/lib/db/
src/lib/auth/index.ts    → deprecated/src/lib/auth/
src/lib/perf/            → deprecated/src/lib/perf/
src/lib/edge/            → deprecated/src/lib/edge/
src/app/api/* (82 routes) → deprecated/src/app/api/
```

**Exclude (blocked on LATER items):**
- `src/app/api/auth/accept-tos/`
- `src/app/api/auth/verify-age/`
- `src/app/api/admin/backup/`
- `src/app/api/admin/restore/`

---

## Status Summary by Phase

| Phase                    | Done   | External | Blocked | Not Started | Deferred |
|--------------------------|--------|----------|---------|-------------|----------|
| Phase 1 (Infrastructure) | 1      | 3        | 0       | 0           | 0        |
| Phase 2 (Auth)           | 2      | 1        | 0       | 0           | 0        |
| Phase 3 (Deployment)     | 0      | 1        | 0       | 2           | 0        |
| Phase 4 (Implementation) | 9      | 0        | 0       | 6           | 5        |
| **Total**                | **12** | **5**    | **0**   | **8**       | **5**    |

---

## References

- [PHASE_GATE.md](./PHASE_GATE.md) - Phase gating status
- [NOW.md](./NOW.md) - Items resolved via repo inspection
- [LATER.md](./LATER.md) - Items requiring external access
- [DECISIONS.md](./DECISIONS.md) - Owner decision record (DEC-XXX)
- [DECISIONS_REGISTER.md](./DECISIONS_REGISTER.md) - Full decision context
- [UNKNOWN.md](./UNKNOWN.md) - Unknown facts (reference by UNKNOWN-XXX ID)

