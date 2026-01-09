# Test Backlog

**Date:** January 8, 2026  
**Branch:** `refactor/stack-split`  
**Purpose:** Stable test identifiers for tracking implementation and execution

---

## Format

```
TEST-###: <short description>
  Gap:      FGAP-###
  Parity:   PARITY-### (or range)
  Type:     Playwright | Backend Integration | Unit | Contract
  File:     <path to test file> (or "TBD")
  Priority: P0 | P1 | P2
  Status:   ✅ Exists | ⏳ Planned | 🔒 Blocked | 🚧 In Progress
```

---

## Open Gap Tests (FGAP-009, FGAP-010)

### TEST-001: Reference tracks list endpoint E2E
- **Gap:** FGAP-009
- **Parity:** PARITY-080
- **Type:** Playwright
- **File:** `tests/reference-router-e2e.spec.ts`
- **Priority:** P0
- **Status:** ✅ Implemented (January 8, 2026)
- **Assertion:** `GET /api/reference/tracks` returns real data (not stub), response.ok, body.length > 0

### TEST-002: Reference track detail endpoint E2E
- **Gap:** FGAP-009
- **Parity:** PARITY-081
- **Type:** Playwright
- **File:** `tests/reference-router-e2e.spec.ts`
- **Priority:** P0
- **Status:** ✅ Implemented (January 8, 2026)
- **Assertion:** `GET /api/reference/tracks/:id` returns track with title, duration

### TEST-003: Reference track update endpoint E2E
- **Gap:** FGAP-009
- **Parity:** PARITY-081
- **Type:** Playwright
- **File:** `tests/reference-router-e2e.spec.ts`
- **Priority:** P0
- **Status:** ✅ Implemented (January 8, 2026)
- **Assertion:** `PATCH /api/reference/tracks/:id` updates title, returns updated track

### TEST-004: Reference track delete endpoint E2E
- **Gap:** FGAP-009
- **Parity:** PARITY-081
- **Type:** Playwright
- **File:** `tests/reference-router-e2e.spec.ts`
- **Priority:** P0
- **Status:** ✅ Implemented (January 8, 2026)
- **Assertion:** `DELETE /api/reference/tracks/:id` returns 204, subsequent GET returns 404

### TEST-005: Reference track analysis get E2E
- **Gap:** FGAP-009
- **Parity:** PARITY-082
- **Type:** Playwright
- **File:** `tests/reference-router-e2e.spec.ts` (TBD)
- **Priority:** P1
- **Status:** ⏳ Planned
- **Assertion:** `GET /api/reference/tracks/:id/analysis` returns analysis data

### TEST-006: Reference track analysis trigger E2E
- **Gap:** FGAP-009
- **Parity:** PARITY-082
- **Type:** Playwright
- **File:** `tests/reference-router-e2e.spec.ts` (TBD)
- **Priority:** P1
- **Status:** ⏳ Planned
- **Assertion:** `POST /api/reference/tracks/:id/analysis` returns 202, creates analysis job

### TEST-007: Reference track play URL E2E
- **Gap:** FGAP-009
- **Parity:** PARITY-083
- **Type:** Playwright
- **File:** `tests/reference-router-e2e.spec.ts`
- **Priority:** P0
- **Status:** ✅ Implemented (January 8, 2026)
- **Assertion:** `GET /api/reference/tracks/:id/play` returns signed URL

### TEST-008: Reference track stream E2E
- **Gap:** FGAP-009
- **Parity:** PARITY-084
- **Type:** Playwright
- **File:** `tests/reference-router-e2e.spec.ts` (TBD)
- **Priority:** P1
- **Status:** ⏳ Planned
- **Assertion:** `GET /api/reference/tracks/:id/stream` returns audio content-type

### TEST-009: Reference track upload E2E
- **Gap:** FGAP-009
- **Parity:** PARITY-085
- **Type:** Playwright
- **File:** `tests/reference-router-e2e.spec.ts`
- **Priority:** P0
- **Status:** ✅ Implemented (January 8, 2026)
- **Assertion:** `POST /api/reference/upload` with multipart/form-data returns new track ID

### TEST-010: Reference annotations list E2E
- **Gap:** FGAP-009
- **Parity:** PARITY-086
- **Type:** Playwright
- **File:** `tests/reference-router-e2e.spec.ts`
- **Priority:** P0
- **Status:** ✅ Implemented (January 8, 2026)
- **Assertion:** `GET /api/reference/tracks/:id/annotations` returns array with time, text

### TEST-011: Reference annotation create E2E
- **Gap:** FGAP-009
- **Parity:** PARITY-086
- **Type:** Playwright
- **File:** `tests/reference-router-e2e.spec.ts`
- **Priority:** P0
- **Status:** ✅ Implemented (January 8, 2026)
- **Assertion:** `POST /api/reference/tracks/:id/annotations` creates annotation, returns ID

### TEST-012: Reference annotation update E2E
- **Gap:** FGAP-009
- **Parity:** PARITY-087
- **Type:** Playwright
- **File:** `tests/reference-router-e2e.spec.ts` (TBD)
- **Priority:** P1
- **Status:** ⏳ Planned
- **Assertion:** `PUT /api/reference/tracks/:id/annotations/:annotationId` updates text

### TEST-013: Reference annotation delete E2E
- **Gap:** FGAP-009
- **Parity:** PARITY-087
- **Type:** Playwright
- **File:** `tests/reference-router-e2e.spec.ts` (TBD)
- **Priority:** P1
- **Status:** ⏳ Planned
- **Assertion:** `DELETE /api/reference/tracks/:id/annotations/:annotationId` returns 204

### TEST-014: Reference regions list E2E
- **Gap:** FGAP-009
- **Parity:** PARITY-088
- **Type:** Playwright
- **File:** `tests/reference-router-e2e.spec.ts`
- **Priority:** P0
- **Status:** ✅ Implemented (January 8, 2026)
- **Assertion:** `GET /api/reference/tracks/:id/regions` returns array with start, end

### TEST-015: Reference region create E2E
- **Gap:** FGAP-009
- **Parity:** PARITY-088
- **Type:** Playwright
- **File:** `tests/reference-router-e2e.spec.ts` (TBD)
- **Priority:** P1
- **Status:** ⏳ Planned
- **Assertion:** `POST /api/reference/tracks/:id/regions` creates region, returns ID

### TEST-016: Reference router integration (all routes)
- **Gap:** FGAP-009
- **Parity:** PARITY-080 to PARITY-088
- **Type:** Backend Integration
- **File:** `app/backend/crates/api/src/tests/reference_router_tests.rs` (TBD)
- **Priority:** P0
- **Status:** ⏳ Planned
- **Assertion:** All 9 reference route groups return non-stub, DB-backed responses

### TEST-017: Reference API contract validation
- **Gap:** FGAP-009
- **Parity:** PARITY-080 to PARITY-088
- **Type:** Contract
- **File:** `tests/reference-router-e2e.spec.ts`
- **Priority:** P0
- **Status:** ✅ Implemented (January 8, 2026)
- **Assertion:** All responses match TypeScript interface shapes

### TEST-018: Analysis list endpoint E2E
- **Gap:** FGAP-010
- **Parity:** PARITY-089
- **Type:** Playwright
- **File:** `tests/analysis.spec.ts` (TBD)
- **Priority:** P2
- **Status:** 🔒 Blocked (DECISION-006)
- **Assertion:** `GET /api/analysis` returns valid response or intentional 404

### TEST-019: Analysis contract validation
- **Gap:** FGAP-010
- **Parity:** PARITY-089
- **Type:** Contract
- **File:** `tests/analysis.spec.ts` (TBD)
- **Priority:** P2
- **Status:** 🔒 Blocked (DECISION-006)
- **Assertion:** If kept, response matches expected shape

---

## Existing Regression Tests (Closed Gaps)

### TEST-020: Gamification teaser endpoint
- **Gap:** FGAP-001 (closed)
- **Parity:** PARITY-017
- **Type:** Playwright
- **File:** `tests/gamification.spec.ts`
- **Priority:** P0
- **Status:** ✅ Exists

### TEST-021: Gamification summary endpoint
- **Gap:** FGAP-001 (closed)
- **Parity:** PARITY-018
- **Type:** Playwright
- **File:** `tests/gamification.spec.ts`
- **Priority:** P0
- **Status:** ✅ Exists

### TEST-022: Gamification repos integration
- **Gap:** FGAP-001 (closed)
- **Parity:** PARITY-017 to PARITY-018
- **Type:** Backend Integration
- **File:** `app/backend/crates/api/src/tests/gamification_tests.rs`
- **Priority:** P0
- **Status:** ✅ Exists

### TEST-023: Focus CRUD endpoints
- **Gap:** FGAP-002 (closed)
- **Parity:** PARITY-019 to PARITY-023
- **Type:** Playwright
- **File:** `tests/focus.spec.ts`
- **Priority:** P0
- **Status:** ✅ Exists

### TEST-024: Habits CRUD + completion
- **Gap:** FGAP-002 (closed)
- **Parity:** PARITY-024 to PARITY-025
- **Type:** Playwright
- **File:** `tests/habits.spec.ts`
- **Priority:** P0
- **Status:** ✅ Exists

### TEST-025: Goals + milestones CRUD
- **Gap:** FGAP-002 (closed)
- **Parity:** PARITY-026 to PARITY-029
- **Type:** Playwright
- **File:** `tests/goals.spec.ts`
- **Priority:** P0
- **Status:** ✅ Exists

### TEST-026: Quests workflow
- **Gap:** FGAP-002 (closed)
- **Parity:** PARITY-030 to PARITY-034
- **Type:** Playwright
- **File:** `tests/quests.spec.ts`
- **Priority:** P0
- **Status:** ✅ Exists

### TEST-027: Exercise full workflow
- **Gap:** FGAP-002 (closed)
- **Parity:** PARITY-045 to PARITY-057
- **Type:** Playwright
- **File:** `tests/exercise.spec.ts`
- **Priority:** P0
- **Status:** ✅ Exists

### TEST-028: Books + sessions
- **Gap:** FGAP-002 (closed)
- **Parity:** PARITY-058 to PARITY-061
- **Type:** Playwright
- **File:** `tests/books.spec.ts`
- **Priority:** P0
- **Status:** ✅ Exists

### TEST-029: Market purchase flow
- **Gap:** FGAP-002 (closed)
- **Parity:** PARITY-063 to PARITY-069
- **Type:** Playwright
- **File:** `tests/market.spec.ts`
- **Priority:** P0
- **Status:** ✅ Exists

### TEST-030: Learn topics/lessons/drills
- **Gap:** FGAP-002 (closed)
- **Parity:** PARITY-070 to PARITY-079
- **Type:** Playwright
- **File:** `tests/learn.spec.ts`
- **Priority:** P0
- **Status:** ✅ Exists

### TEST-031: Reference tracks golden sync E2E
- **Gap:** FGAP-003 (closed)
- **Parity:** PARITY-080 to PARITY-088
- **Type:** Playwright
- **File:** `tests/reference-tracks-golden.spec.ts`
- **Priority:** P0
- **Status:** ✅ Exists

### TEST-032: Reference golden determinism
- **Gap:** FGAP-003 (closed)
- **Parity:** PARITY-080 to PARITY-088
- **Type:** Backend Integration
- **File:** `app/backend/crates/api/src/tests/reference_golden_tests.rs`
- **Priority:** P0
- **Status:** ✅ Exists

### TEST-033: Calendar CRUD
- **Gap:** FGAP-004 (closed)
- **Parity:** PARITY-035 to PARITY-038
- **Type:** Playwright
- **File:** `tests/calendar.spec.ts`
- **Priority:** P0
- **Status:** ✅ Exists

### TEST-034: Daily plan generate/update
- **Gap:** FGAP-004 (closed)
- **Parity:** PARITY-039 to PARITY-042
- **Type:** Playwright
- **File:** `tests/daily-plan.spec.ts`
- **Priority:** P0
- **Status:** ✅ Exists

### TEST-035: Feedback submit
- **Gap:** FGAP-004 (closed)
- **Parity:** PARITY-043 to PARITY-044
- **Type:** Playwright
- **File:** `tests/feedback.spec.ts`
- **Priority:** P1
- **Status:** ✅ Exists

### TEST-036: Onboarding flow
- **Gap:** FGAP-004 (closed)
- **Parity:** PARITY-090 to PARITY-094
- **Type:** Playwright
- **File:** `tests/onboarding.spec.ts`
- **Priority:** P0
- **Status:** ✅ Exists

### TEST-037: Infobase CRUD
- **Gap:** FGAP-004 (closed)
- **Parity:** PARITY-095 to PARITY-099
- **Type:** Playwright
- **File:** `tests/infobase.spec.ts` (TBD)
- **Priority:** P1
- **Status:** ⏳ Planned

### TEST-038: Ideas CRUD
- **Gap:** FGAP-004 (closed)
- **Parity:** PARITY-100 to PARITY-104
- **Type:** Playwright
- **File:** `tests/ideas.spec.ts` (TBD)
- **Priority:** P1
- **Status:** ⏳ Planned

### TEST-039: User settings/delete/export
- **Gap:** FGAP-004 (closed)
- **Parity:** PARITY-105 to PARITY-108
- **Type:** Playwright
- **File:** `tests/user-settings.spec.ts`
- **Priority:** P0
- **Status:** ✅ Exists

### TEST-040: Admin RBAC + routes
- **Gap:** FGAP-004 (closed)
- **Parity:** PARITY-109 to PARITY-119
- **Type:** Playwright
- **File:** `app/admin/tests/admin-rbac.spec.ts`
- **Priority:** P0
- **Status:** ✅ Exists

### TEST-041: Admin backup/restore stubs
- **Gap:** FGAP-005 (closed)
- **Parity:** PARITY-118 to PARITY-119
- **Type:** Contract
- **File:** `app/admin/tests/admin-rbac.spec.ts`
- **Priority:** P1
- **Status:** ✅ Exists

### TEST-042: Admin repos integration
- **Gap:** FGAP-005 (closed)
- **Parity:** PARITY-109 to PARITY-117
- **Type:** Backend Integration
- **File:** `app/backend/crates/api/src/tests/admin_tests.rs`
- **Priority:** P0
- **Status:** ✅ Exists

### TEST-043: Migrations apply cleanly
- **Gap:** FGAP-006 (closed)
- **Parity:** All schemas
- **Type:** Backend Integration
- **File:** `app/backend/crates/api/src/tests/mod.rs`
- **Priority:** P0
- **Status:** ✅ Exists

### TEST-044: All repos compile
- **Gap:** FGAP-006 (closed)
- **Parity:** All schemas
- **Type:** Unit
- **File:** cargo check (CI)
- **Priority:** P0
- **Status:** ✅ Exists

### TEST-045: E2E spec file coverage
- **Gap:** FGAP-007 (closed)
- **Parity:** All
- **Type:** Playwright
- **File:** `tests/*.spec.ts`
- **Priority:** P0
- **Status:** ✅ Exists

### TEST-046: E2E specs parse without errors
- **Gap:** FGAP-007 (closed)
- **Parity:** All
- **Type:** Playwright
- **File:** CI validation
- **Priority:** P0
- **Status:** ✅ Exists

### TEST-047: Metrics doc authoritative
- **Gap:** FGAP-008 (closed)
- **Parity:** N/A
- **Type:** Manual
- **File:** `docs/backend/migration/METRICS_POST20G.md`
- **Priority:** P1
- **Status:** ✅ Verified

---

## Backlog Summary

| Status | Count |
|--------|-------|
| ✅ Exists/Implemented | 38 |
| ⏳ Planned | 7 |
| 🔒 Blocked | 2 |
| **Total** | **47** |

| Priority | Count |
|----------|-------|
| P0 | 32 (10 newly implemented) |
| P1 | 11 |
| P2 | 4 |

**Latest Update:** January 8, 2026 - 10 P0 tests implemented in `tests/reference-router-e2e.spec.ts`

---

## Next Actions

1. **ACTION-TEST-001**: ✅ PARTIAL - 10/15 tests implemented in `tests/reference-router-e2e.spec.ts`
2. **ACTION-TEST-002**: Implement TEST-016 in `app/backend/crates/api/src/tests/reference_router_tests.rs`
3. **ACTION-TEST-003**: ✅ COMPLETE - TEST-017 merged into `tests/reference-router-e2e.spec.ts`
4. **ACTION-TEST-004**: Implement TEST-037 in `tests/infobase.spec.ts`
5. **ACTION-TEST-005**: Implement TEST-038 in `tests/ideas.spec.ts`
6. **ACTION-TEST-006**: Resolve DECISION-006 to unblock TEST-018, TEST-019

---

## References

- [FEATURE_GAP_TEST_MATRIX.md](./FEATURE_GAP_TEST_MATRIX.md) - Matrix overview
- [FEATURE_GAP_REGISTER.md](./FEATURE_GAP_REGISTER.md) - Gap definitions
- [feature_parity_checklist.md](./feature_parity_checklist.md) - PARITY items
- [gaps.md](./gaps.md) - ACTION items
