# E2E Test Backlog (Post-20G)

**Date:** January 7, 2026  
**Branch:** `refactor/stack-split`  
**Purpose:** Prioritized list of missing E2E tests aligned to WAVE_PLAN_POST20G

---

## Executive Summary

| Priority | Category | Test Count | Blocked By |
|----------|----------|------------|------------|
| **P0 (Critical)** | Security/Auth | 6 | None |
| **P1 (High)** | Wave 0 Gaps | 4 | None |
| **P1 (High)** | Wave 0.5 Gaps | 2 | None |
| **P2 (Medium)** | Wave 1 Features | 9 | EXTRACT-001-004 |
| **P2 (Medium)** | Wave 2 Features | 4 | EXTRACT-005-008 |
| **P3 (Low)** | Wave 3-4 Features | 12 | EXTRACT-009-019 |
| **P4 (Deferred)** | Admin Console | 10 | EXTRACT-022 |
| **P4 (Deferred)** | Wave 5 User | 4 | EXTRACT-020-021 |
| **Total** | - | **51** | - |

---

## P0: Critical Security Tests (Unblocked)

These tests can be added immediately and are required before production.

### TEST-001: Session Persistence Across Refresh

| Field | Value |
|-------|-------|
| **Parity IDs** | PARITY-001, PARITY-002, PARITY-003, PARITY-004 |
| **Wave** | 0 |
| **File** | `tests/auth.spec.ts` |
| **Priority** | P0 |
| **Acceptance Criteria** | |
| - | User logs in with OAuth mock |
| - | Session cookie is set with HttpOnly, Secure, SameSite=None |
| - | Page refresh preserves authenticated state |
| - | Protected route access succeeds after refresh |
| **Blocked By** | None (requires auth test fixture) |
| **Notes** | Copilot instruction: "session persistence across refresh" |

---

### TEST-002: Session Rotation on Privilege Change

| Field | Value |
|-------|-------|
| **Parity IDs** | PARITY-001-004 |
| **Wave** | 0 |
| **File** | `tests/auth.spec.ts` |
| **Priority** | P0 |
| **Acceptance Criteria** | |
| - | Session ID changes after login (not reused) |
| - | Old session ID is invalidated |
| - | Session ID changes on role elevation (if applicable) |
| **Blocked By** | None |
| **Notes** | Security requirement: "session fixation prevention" |

---

### TEST-003: CSRF Protection for State-Changing Requests

| Field | Value |
|-------|-------|
| **Parity IDs** | PARITY-006-012 (Storage), PARITY-015-016 (Reference) |
| **Wave** | 0, 0.5 |
| **File** | `tests/security.spec.ts` (new) |
| **Priority** | P0 |
| **Acceptance Criteria** | |
| - | POST/PUT/DELETE without Origin header returns 403 |
| - | POST/PUT/DELETE with mismatched Origin returns 403 |
| - | POST/PUT/DELETE with valid Origin succeeds |
| - | GET requests do not require Origin |
| **Blocked By** | None |
| **Notes** | Copilot instruction: "CSRF protection for browser state-changing requests" |

---

### TEST-004: Strict Origin Verification

| Field | Value |
|-------|-------|
| **Parity IDs** | All mutation routes |
| **Wave** | 0 |
| **File** | `tests/security.spec.ts` (new) |
| **Priority** | P0 |
| **Acceptance Criteria** | |
| - | Only `ecent.online` and subdomains accepted |
| - | `localhost` accepted only in development |
| - | Foreign origins rejected with 403 |
| **Blocked By** | None |
| **Notes** | Copilot instruction: "strict Origin verification rules" |

---

### TEST-005: Dev Auth Bypass Guardrails

| Field | Value |
|-------|-------|
| **Parity IDs** | All auth routes |
| **Wave** | 0 |
| **File** | `tests/security.spec.ts` (new) |
| **Priority** | P0 |
| **Acceptance Criteria** | |
| - | Bypass rejected when ENV=production |
| - | Bypass rejected when host is not localhost |
| - | Bypass allowed only with NODE_ENV=development AND localhost |
| **Blocked By** | None |
| **Notes** | Per `docs/backend/migration/local_dev_auth_bypass.md` |

---

### TEST-006: R2 Credential Non-Exposure (Extended)

| Field | Value |
|-------|-------|
| **Parity IDs** | PARITY-006-012, PARITY-013-017 |
| **Wave** | 0, 0.5 |
| **File** | `tests/security.spec.ts` (new) |
| **Priority** | P0 |
| **Acceptance Criteria** | |
| - | No R2 credentials in any API response body |
| - | No R2 credentials in network headers |
| - | Signed URLs expire after configured TTL |
| - | Signed URLs scoped to user authorization |
| **Blocked By** | None |
| **Notes** | Extends existing partial test in reference-tracks.spec.ts |

---

## P1: Wave 0/0.5 Gaps (Unblocked)

### TEST-007: Logout Flow

| Field | Value |
|-------|-------|
| **Parity IDs** | PARITY-004 |
| **Wave** | 0 |
| **File** | `tests/auth.spec.ts` |
| **Priority** | P1 |
| **Acceptance Criteria** | |
| - | POST /auth/logout clears session cookie |
| - | Protected routes redirect after logout |
| - | Session is invalidated server-side |
| **Blocked By** | None |
| **Notes** | Currently 0 tests for PARITY-004 |

---

### TEST-008: Download URL Generation

| Field | Value |
|-------|-------|
| **Parity IDs** | PARITY-011 |
| **Wave** | 0 |
| **File** | `tests/storage.spec.ts` |
| **Priority** | P1 |
| **Acceptance Criteria** | |
| - | GET /api/blobs/:id/download-url returns signed URL |
| - | URL contains X-Amz-Signature or equivalent |
| - | URL is time-limited |
| **Blocked By** | None |
| **Notes** | No explicit test for download-url endpoint |

---

### TEST-009: Storage Usage Endpoint

| Field | Value |
|-------|-------|
| **Parity IDs** | (PARITY-012 extension) |
| **Wave** | 0 |
| **File** | `tests/storage.spec.ts` |
| **Priority** | P1 |
| **Acceptance Criteria** | |
| - | GET /api/blobs/usage returns total_bytes |
| - | Reflects actual storage used by user |
| **Blocked By** | None |
| **Notes** | Test exists but may need assertion strengthening |

---

### TEST-010: Admin Templates CRUD

| Field | Value |
|-------|-------|
| **Parity IDs** | PARITY-018 |
| **Wave** | 0.5 |
| **File** | `app/frontend/tests/admin-templates.spec.ts` (new) |
| **Priority** | P1 |
| **Acceptance Criteria** | |
| - | Admin can list templates |
| - | Admin can create template |
| - | Admin can update template |
| - | Admin can delete template |
| - | Non-admin receives 403 |
| **Blocked By** | None (backend done) |
| **Notes** | Backend has 13 tests; no E2E coverage |

---

## P2: Wave 1-2 Features (Blocked on Backend)

### TEST-011: Gamification Teaser

| Field | Value |
|-------|-------|
| **Parity IDs** | PARITY-019 |
| **Wave** | 1 |
| **File** | `tests/gamification.spec.ts` (new) |
| **Priority** | P2 |
| **Acceptance Criteria** | |
| - | GET /gamification/teaser returns achievement data |
| - | Displays on dashboard correctly |
| **Blocked By** | EXTRACT-001 |

---

### TEST-012: Gamification Summary

| Field | Value |
|-------|-------|
| **Parity IDs** | PARITY-020 |
| **Wave** | 1 |
| **File** | `tests/gamification.spec.ts` (new) |
| **Priority** | P2 |
| **Acceptance Criteria** | |
| - | GET /gamification/summary returns XP, level, wallet |
| - | Progress page displays correctly |
| **Blocked By** | EXTRACT-001 |

---

### TEST-013: Focus Session Lifecycle

| Field | Value |
|-------|-------|
| **Parity IDs** | PARITY-021-025 |
| **Wave** | 1 |
| **File** | `tests/focus.spec.ts` (new) |
| **Priority** | P2 |
| **Acceptance Criteria** | |
| - | User creates focus session |
| - | Session appears in active session |
| - | User can pause/resume session |
| - | Completing session awards XP |
| - | Abandoning session does not award XP |
| **Blocked By** | EXTRACT-002 |
| **Notes** | Critical journey per copilot instructions |

---

### TEST-014: Habits CRUD + Streaks

| Field | Value |
|-------|-------|
| **Parity IDs** | PARITY-026 |
| **Wave** | 1 |
| **File** | `tests/habits.spec.ts` (new) |
| **Priority** | P2 |
| **Acceptance Criteria** | |
| - | User creates habit |
| - | User logs habit completion |
| - | Streak counter increments |
| - | Missing day resets streak |
| **Blocked By** | EXTRACT-003 |

---

### TEST-015: Goals CRUD + Milestones

| Field | Value |
|-------|-------|
| **Parity IDs** | PARITY-027 |
| **Wave** | 1 |
| **File** | `tests/goals.spec.ts` (new) |
| **Priority** | P2 |
| **Acceptance Criteria** | |
| - | User creates goal with milestones |
| - | Completing milestone updates progress |
| - | Completing all milestones marks goal done |
| **Blocked By** | EXTRACT-004 |

---

### TEST-016: Quest Progress

| Field | Value |
|-------|-------|
| **Parity IDs** | PARITY-028 |
| **Wave** | 2 |
| **File** | `tests/quests.spec.ts` (new) |
| **Priority** | P2 |
| **Acceptance Criteria** | |
| - | Quests page displays user quests |
| - | Progress updates on activity |
| - | Completing quest awards reward |
| **Blocked By** | EXTRACT-005 |

---

### TEST-017: Calendar CRUD

| Field | Value |
|-------|-------|
| **Parity IDs** | PARITY-029 |
| **Wave** | 2 |
| **File** | `tests/calendar.spec.ts` (new) |
| **Priority** | P2 |
| **Acceptance Criteria** | |
| - | User creates calendar event |
| - | Events display on calendar view |
| - | User can edit/delete event |
| **Blocked By** | EXTRACT-006 |

---

### TEST-018: Daily Plan

| Field | Value |
|-------|-------|
| **Parity IDs** | PARITY-030 |
| **Wave** | 2 |
| **File** | `tests/daily-plan.spec.ts` (new) |
| **Priority** | P2 |
| **Acceptance Criteria** | |
| - | Today page shows daily plan |
| - | Tasks can be checked off |
| - | Plan persists across sessions |
| **Blocked By** | EXTRACT-007 |

---

### TEST-019: Feedback Submission

| Field | Value |
|-------|-------|
| **Parity IDs** | PARITY-031 |
| **Wave** | 2 |
| **File** | `tests/feedback.spec.ts` (new) |
| **Priority** | P2 |
| **Acceptance Criteria** | |
| - | User can submit feedback |
| - | Confirmation displayed |
| - | Feedback visible in admin (separate test) |
| **Blocked By** | EXTRACT-008 |

---

## P3: Wave 3-4 Features (Blocked on Backend)

### TEST-020: Exercise CRUD

| Field | Value |
|-------|-------|
| **Parity IDs** | PARITY-032 |
| **Wave** | 3 |
| **Blocked By** | EXTRACT-009 |
| **Priority** | P3 |

---

### TEST-021: Exercise Seed (Admin)

| Field | Value |
|-------|-------|
| **Parity IDs** | PARITY-033 |
| **Wave** | 3 |
| **Blocked By** | EXTRACT-009 |
| **Priority** | P3 |

---

### TEST-022: Books CRUD

| Field | Value |
|-------|-------|
| **Parity IDs** | PARITY-034 |
| **Wave** | 3 |
| **Blocked By** | EXTRACT-011 |
| **Priority** | P3 |

---

### TEST-023: Programs CRUD

| Field | Value |
|-------|-------|
| **Parity IDs** | PARITY-035 |
| **Wave** | 3 |
| **Blocked By** | EXTRACT-010 |
| **Priority** | P3 |

---

### TEST-024: Market Purchase Flow

| Field | Value |
|-------|-------|
| **Parity IDs** | PARITY-036-039 |
| **Wave** | 3 |
| **File** | `tests/market.spec.ts` |
| **Priority** | P3 |
| **Acceptance Criteria** | |
| - | User views market items |
| - | User purchases item (wallet deducted) |
| - | User redeems purchase |
| - | Purchase history visible |
| **Blocked By** | EXTRACT-012 |
| **Notes** | Partial coverage exists; needs full flow |

---

### TEST-025: Learn Module Progress

| Field | Value |
|-------|-------|
| **Parity IDs** | PARITY-040-042 |
| **Wave** | 4 |
| **Blocked By** | EXTRACT-013 |
| **Priority** | P3 |

---

### TEST-026: Onboarding Reset

| Field | Value |
|-------|-------|
| **Parity IDs** | PARITY-052 |
| **Wave** | 4 |
| **File** | `tests/onboarding.spec.ts` |
| **Priority** | P3 |
| **Acceptance Criteria** | |
| - | POST /onboarding/reset clears progress |
| - | Onboarding flow restarts |
| **Blocked By** | EXTRACT-016 |

---

### TEST-027: Infobase CRUD

| Field | Value |
|-------|-------|
| **Parity IDs** | PARITY-054 |
| **Wave** | 4 |
| **Blocked By** | EXTRACT-017 |
| **Priority** | P3 |

---

### TEST-028: Ideas CRUD

| Field | Value |
|-------|-------|
| **Parity IDs** | PARITY-055 |
| **Wave** | 4 |
| **Blocked By** | EXTRACT-018 |
| **Priority** | P3 |

---

### TEST-029: Analysis Engine

| Field | Value |
|-------|-------|
| **Parity IDs** | PARITY-056 |
| **Wave** | 4 |
| **Blocked By** | EXTRACT-019 |
| **Priority** | P3 |

---

## P4: Deferred (Admin + User GDPR)

### TEST-030: ToS Acceptance

| Field | Value |
|-------|-------|
| **Parity IDs** | PARITY-057 |
| **Wave** | 5 |
| **Blocked By** | EXTRACT-021 |
| **Priority** | P4 |

---

### TEST-031: Age Verification

| Field | Value |
|-------|-------|
| **Parity IDs** | PARITY-058 |
| **Wave** | 5 |
| **Blocked By** | EXTRACT-021 |
| **Priority** | P4 |

---

### TEST-032: User Delete (GDPR)

| Field | Value |
|-------|-------|
| **Parity IDs** | PARITY-059 |
| **Wave** | 5 |
| **Blocked By** | EXTRACT-020 |
| **Priority** | P4 |
| **Acceptance Criteria** | |
| - | DELETE /user/delete removes all user data |
| - | User is logged out |
| - | Data not recoverable |

---

### TEST-033: User Data Export (GDPR)

| Field | Value |
|-------|-------|
| **Parity IDs** | PARITY-060 |
| **Wave** | 5 |
| **Blocked By** | EXTRACT-020 |
| **Priority** | P4 |
| **Acceptance Criteria** | |
| - | GET /user/export returns downloadable archive |
| - | Archive contains all user data |

---

### TEST-034 to TEST-044: Admin Routes

All admin routes (PARITY-061-071) blocked by EXTRACT-022:

| TEST-ID | Route | Priority |
|---------|-------|----------|
| TEST-034 | Admin Users | P4 |
| TEST-035 | Admin Cleanup Users | P4 |
| TEST-036 | Admin Stats | P4 |
| TEST-037 | Admin Feedback | P4 |
| TEST-038 | Admin Quests | P4 |
| TEST-039 | Admin Skills | P4 |
| TEST-040 | Admin Content | P4 |
| TEST-041 | Admin DB Health | P4 |
| TEST-042 | Admin Backup | P4 |
| TEST-043 | Admin Restore | P4 |
| TEST-044 | RBAC Gating to Admin Console | P4 |

**Note:** All admin tests require admin test user fixture and RBAC enforcement.

---

## Test Infrastructure Needs

### Required Test Fixtures

| Fixture | Purpose | Priority |
|---------|---------|----------|
| **Auth User** | Authenticated user for protected routes | P0 |
| **Auth Admin** | Admin user for admin routes | P1 |
| **OAuth Mock** | Mock OAuth provider responses | P0 |
| **DB Reset** | Clean database between test runs | P0 |

### Required Test Files (New)

| File | Tests | Priority |
|------|-------|----------|
| `tests/security.spec.ts` | TEST-003, TEST-004, TEST-005, TEST-006 | P0 |
| `tests/gamification.spec.ts` | TEST-011, TEST-012 | P2 |
| `tests/focus.spec.ts` | TEST-013 | P2 |
| `tests/habits.spec.ts` | TEST-014 | P2 |
| `tests/goals.spec.ts` | TEST-015 | P2 |
| `tests/quests.spec.ts` | TEST-016 | P2 |
| `tests/calendar.spec.ts` | TEST-017 | P2 |
| `tests/daily-plan.spec.ts` | TEST-018 | P2 |
| `tests/feedback.spec.ts` | TEST-019 | P2 |
| `app/frontend/tests/admin-templates.spec.ts` | TEST-010 | P1 |

---

## Backlog Execution Order

### Immediate (Before Production)

1. TEST-001 to TEST-006 (P0 Security) - Create `tests/security.spec.ts`
2. TEST-007 to TEST-010 (P1 Wave 0/0.5 Gaps)

### After Wave 1 Backend Complete

3. TEST-011 to TEST-015 (P2 Wave 1)

### After Wave 2 Backend Complete

4. TEST-016 to TEST-019 (P2 Wave 2)

### After Wave 3-4 Backend Complete

5. TEST-020 to TEST-029 (P3 Wave 3-4)

### After Wave 5 Backend Complete

6. TEST-030 to TEST-044 (P4 Admin + GDPR)

---

## References

- [E2E_COVERAGE_MAP_POST20G.md](./E2E_COVERAGE_MAP_POST20G.md) - Current coverage
- [WAVE_PLAN_POST20G.md](./WAVE_PLAN_POST20G.md) - Wave plan
- [feature_parity_checklist.md](./feature_parity_checklist.md) - Feature status
- [FEATURE_EXTRACTION_BACKLOG.md](./FEATURE_EXTRACTION_BACKLOG.md) - EXTRACT-XXX blockers

---

**Updated:** January 7, 2026 - Initial backlog creation for UNKNOWN-011 resolution

