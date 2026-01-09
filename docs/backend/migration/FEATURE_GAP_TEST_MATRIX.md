# Feature Gap Test Matrix

**Date:** January 8, 2026  
**Branch:** `refactor/stack-split`  
**Purpose:** Map feature gaps to required tests for go-live validation

---

## Overview

This matrix defines the testing strategy for each feature gap. All tests must pass before cutover.

**Test Type Legend:**
- **Playwright** - E2E browser-based tests (`tests/*.spec.ts`)
- **Backend Integration** - Rust tests with DB (`app/backend/crates/api/src/tests/`)
- **Unit** - Isolated Rust unit tests (in-module `#[cfg(test)]`)
- **Contract** - API response shape validation

**Priority Legend:**
- **P0** - Blocker for go-live; must pass in CI
- **P1** - Required for cutover; may run manually
- **P2** - Post-cutover; nice-to-have

---

## Test Data Strategy (Per DEC-001 = Force Re-auth)

| Strategy | Description | When to Use |
|----------|-------------|-------------|
| **Seed/Reset** | Migrate `0001-0014.sql` fresh before test suite | All integration tests |
| **Per-Test Isolation** | Each test creates/cleans own data via API | Playwright E2E |
| **Golden Fixtures** | Static known-good data files | Determinism tests |
| **Mock Auth** | Test user session via bypass | Local dev only (guarded) |

**Important:** Per DEC-001, no session migration. Tests must create fresh auth state.

---

## Open Gaps Test Matrix

### FGAP-009: Reference Router Not Wired

| Test ID | PARITY | Test Type | Assertion | Test Data | Priority | Status |
|---------|--------|-----------|-----------|-----------|----------|--------|
| TEST-001 | PARITY-080 | Playwright | `GET /api/reference/tracks` returns real data, not stub | Create track via API | P0 | ✅ Implemented |
| TEST-002 | PARITY-081 | Playwright | `GET /api/reference/tracks/:id` returns track details | Seed 1 track | P0 | ✅ Implemented |
| TEST-003 | PARITY-081 | Playwright | `PATCH /api/reference/tracks/:id` updates title | Seed 1 track | P0 | ✅ Implemented |
| TEST-004 | PARITY-081 | Playwright | `DELETE /api/reference/tracks/:id` removes track | Seed 1 track | P0 | ✅ Implemented |
| TEST-005 | PARITY-082 | Playwright | `GET /api/reference/tracks/:id/analysis` returns analysis | Seed track with analysis | P1 | ⏳ Planned |
| TEST-006 | PARITY-082 | Playwright | `POST /api/reference/tracks/:id/analysis` triggers processing | Seed ready track | P1 | ⏳ Planned |
| TEST-007 | PARITY-083 | Playwright | `GET /api/reference/tracks/:id/play` returns playable URL | Seed ready track | P0 | ✅ Implemented |
| TEST-008 | PARITY-084 | Playwright | `GET /api/reference/tracks/:id/stream` returns audio stream | Seed ready track | P1 | ⏳ Planned |
| TEST-009 | PARITY-085 | Playwright | `POST /api/reference/upload` creates new track | Form data upload | P0 | ✅ Implemented |
| TEST-010 | PARITY-086 | Playwright | `GET /api/reference/tracks/:id/annotations` returns list | Seed track + 3 annotations | P0 | ✅ Implemented |
| TEST-011 | PARITY-086 | Playwright | `POST /api/reference/tracks/:id/annotations` creates annotation | Seed 1 track | P0 | ✅ Implemented |
| TEST-012 | PARITY-087 | Playwright | `PUT /api/reference/tracks/:id/annotations/:id` updates | Seed annotation | P1 | ⏳ Planned |
| TEST-013 | PARITY-087 | Playwright | `DELETE /api/reference/tracks/:id/annotations/:id` deletes | Seed annotation | P1 | ⏳ Planned |
| TEST-014 | PARITY-088 | Playwright | `GET /api/reference/tracks/:id/regions` returns list | Seed track + 2 regions | P0 | ✅ Implemented |
| TEST-015 | PARITY-088 | Playwright | `POST /api/reference/tracks/:id/regions` creates region | Seed 1 track | P1 | ⏳ Planned |
| TEST-016 | PARITY-080-088 | Backend Integration | All 9 reference routes return non-stub responses | Test DB | P0 | ⏳ Planned |
| TEST-017 | PARITY-080-088 | Contract | Response shapes match TypeScript types | JSON schema | P0 | ✅ Implemented |

**Total Tests for FGAP-009:** 17 (10 implemented, 7 planned)

---

### FGAP-010: Analysis Route Stub-Only

| Test ID | PARITY | Test Type | Assertion | Test Data | Priority | Status |
|---------|--------|-----------|-----------|-----------|----------|--------|
| TEST-018 | PARITY-089 | Playwright | `GET /api/analysis` returns valid response or 404 | None | P2 | 🔒 Blocked |
| TEST-019 | PARITY-089 | Contract | If kept: analysis response matches expected shape | JSON schema | P2 | 🔒 Blocked |

**Note:** Tests blocked on DECISION-006. If analysis route is removed (Option A), these tests are not needed.

**Total Tests for FGAP-010:** 2 (conditional)

---

## Closed Gaps Regression Matrix

Tests for closed gaps ensure no regression during cutover.

### FGAP-001: Gamification (CLOSED)

| Test ID | PARITY | Test Type | Assertion | Status |
|---------|--------|-----------|-----------|--------|
| TEST-020 | PARITY-017 | Playwright | Teaser endpoint returns XP/coins | ✅ Exists |
| TEST-021 | PARITY-018 | Playwright | Summary returns full progress | ✅ Exists |
| TEST-022 | PARITY-017-018 | Backend Integration | Repos calculate correctly | ✅ Exists |

**Location:** `tests/gamification.spec.ts`, `app/backend/crates/api/src/tests/gamification_tests.rs`

---

### FGAP-002: Feature Routes Wave 1-3 (CLOSED)

| Test ID | PARITY | Test Type | Assertion | Status |
|---------|--------|-----------|-----------|--------|
| TEST-023 | PARITY-019-023 | Playwright | Focus CRUD works | ✅ Exists |
| TEST-024 | PARITY-024-025 | Playwright | Habits CRUD + completion | ✅ Exists |
| TEST-025 | PARITY-026-029 | Playwright | Goals + milestones CRUD | ✅ Exists |
| TEST-026 | PARITY-030-034 | Playwright | Quests accept/complete/abandon | ✅ Exists |
| TEST-027 | PARITY-045-057 | Playwright | Exercise full workflow | ✅ Exists |
| TEST-028 | PARITY-058-061 | Playwright | Books + sessions | ✅ Exists |
| TEST-029 | PARITY-063-069 | Playwright | Market purchase flow | ✅ Exists |
| TEST-030 | PARITY-070-079 | Playwright | Learn topics/lessons/drills | ✅ Exists |

**Location:** `tests/focus.spec.ts`, `tests/habits.spec.ts`, `tests/goals.spec.ts`, `tests/quests.spec.ts`, `tests/exercise.spec.ts`, `tests/books.spec.ts`, `tests/market.spec.ts`, `tests/learn.spec.ts`

---

### FGAP-003: Reference Tracks Frontend Swap (CLOSED)

| Test ID | PARITY | Test Type | Assertion | Status |
|---------|--------|-----------|-----------|--------|
| TEST-031 | PARITY-080-088 | Playwright | Golden sync tests pass | ✅ Exists |
| TEST-032 | PARITY-080-088 | Backend Integration | Reference golden determinism | ✅ Exists |

**Location:** `tests/reference-tracks-golden.spec.ts`, `app/backend/crates/api/src/tests/reference_golden_tests.rs`

**Note:** These tests currently hit stubs. After ACTION-053, they will validate real implementation.

---

### FGAP-004: Wave 4-5 Platform + Admin (CLOSED)

| Test ID | PARITY | Test Type | Assertion | Status |
|---------|--------|-----------|-----------|--------|
| TEST-033 | PARITY-035-038 | Playwright | Calendar CRUD | ✅ Exists |
| TEST-034 | PARITY-039-042 | Playwright | Daily plan generate/update | ✅ Exists |
| TEST-035 | PARITY-043-044 | Playwright | Feedback submit | ✅ Exists |
| TEST-036 | PARITY-090-094 | Playwright | Onboarding flow | ✅ Exists |
| TEST-037 | PARITY-095-099 | Playwright | Infobase CRUD | ⏳ Planned |
| TEST-038 | PARITY-100-104 | Playwright | Ideas CRUD | ⏳ Planned |
| TEST-039 | PARITY-105-108 | Playwright | User settings/delete/export | ✅ Exists |
| TEST-040 | PARITY-109-119 | Playwright | Admin RBAC + routes | ✅ Exists |

**Location:** `tests/calendar.spec.ts`, `tests/daily-plan.spec.ts`, `tests/feedback.spec.ts`, `tests/onboarding.spec.ts`, `tests/user-settings.spec.ts`, `app/admin/tests/admin-rbac.spec.ts`

---

### FGAP-005: Admin Routes (CLOSED)

| Test ID | PARITY | Test Type | Assertion | Status |
|---------|--------|-----------|-----------|--------|
| TEST-041 | PARITY-118-119 | Contract | Backup/restore return stub message | ✅ Exists |
| TEST-042 | PARITY-109-117 | Backend Integration | Admin repos work with test DB | ✅ Exists |

**Location:** `app/admin/tests/admin-rbac.spec.ts`

---

### FGAP-006: Postgres Schema (CLOSED)

| Test ID | PARITY | Test Type | Assertion | Status |
|---------|--------|-----------|-----------|--------|
| TEST-043 | All | Backend Integration | Migrations apply cleanly | ✅ Exists |
| TEST-044 | All | Backend Integration | All repos compile against schema | ✅ Exists |

**Location:** `app/backend/crates/api/src/tests/mod.rs`, cargo check

---

### FGAP-007: E2E Coverage (CLOSED)

| Test ID | PARITY | Test Type | Assertion | Status |
|---------|--------|-----------|-----------|--------|
| TEST-045 | All | Playwright | 25+ spec files exist | ✅ Verified |
| TEST-046 | All | Playwright | All specs parse without errors | ✅ CI |

**Location:** `tests/*.spec.ts`

---

### FGAP-008: Metric Drift (CLOSED)

| Test ID | PARITY | Test Type | Assertion | Status |
|---------|--------|-----------|-----------|--------|
| TEST-047 | N/A | Manual | METRICS_POST20G.md is authoritative | ✅ Verified |

---

## Summary by Priority

| Priority | Open Gap Tests | Closed Gap Regression | Total |
|----------|----------------|----------------------|-------|
| P0 | 12 | 20 | 32 |
| P1 | 5 | 5 | 10 |
| P2 | 2 (blocked) | 2 | 4 |
| **Total** | **19** | **27** | **46** |

---

## Test Execution Order

1. **Pre-Cutover (P0)**
   - Run full Playwright suite
   - Run backend integration tests
   - Validate contract tests

2. **Cutover Gate (P1)**
   - Manual verification of streaming/analysis
   - Admin RBAC spot checks

3. **Post-Cutover (P2)**
   - Analysis route tests (if kept)
   - Performance baselines

---

## References

- [TEST_BACKLOG.md](./TEST_BACKLOG.md) - Detailed test backlog with file paths
- [FEATURE_GAP_REGISTER.md](./FEATURE_GAP_REGISTER.md) - Gap definitions
- [feature_parity_checklist.md](./feature_parity_checklist.md) - PARITY items
- [gaps.md](./gaps.md) - ACTION items
