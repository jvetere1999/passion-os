# Wave Plan Post-20G: Complete Parity Roadmap

**Date:** January 7, 2026  
**Branch:** `refactor/stack-split`  
**Purpose:** Authoritative wave plan enumerating all remaining work to full parity

---

## Executive Summary

| Metric | Current | Target | Gap |
|--------|---------|--------|-----|
| Backend Routes | 30/64 | 64/64 | 34 routes |
| Frontend UI-Only | 30/54 | 54/54 | 24 routes |
| Admin Routes | 1/11 | 11/11 | 10 routes |
| Postgres Tables | 35/45 | 45/45 | 10 tables |
| Backend Tests | 176 | 200+ | ~24 tests |

**Wave 0 (Infrastructure):** ✅ Complete  
**Wave 0.5 (Reference Tracks):** ✅ Complete  
**Wave 1 (Foundation):** ✅ Complete (9/9 routes)  
**Wave 2 Core Productivity (Focus, Habits, Goals, Quests):** ✅ Complete  
**Waves 2-5:** ⏳ 34 routes pending

---

## Parity Item Master Table

### Legend

| Status | Meaning |
|--------|---------|
| ✅ Done | Backend + Frontend swap + Tests complete |
| 🔧 Backend Done | Backend complete, frontend swap pending |
| ⏳ Pending | Not started |
| 🔒 Blocked | Waiting on dependency |
| 🚫 N/A | Not applicable |

---

## Wave 0: Infrastructure (COMPLETE)

| PARITY-ID | Route/Feature | Wave | Backend | FE Swap | Admin | Tests | Evidence |
|-----------|---------------|------|---------|---------|-------|-------|----------|
| PARITY-001 | POST /auth/google | W0 | ✅ Done | ✅ Done | 🚫 N/A | ✅ Done | `auth.rs`, 20 tests |
| PARITY-002 | POST /auth/azure | W0 | ✅ Done | ✅ Done | 🚫 N/A | ✅ Done | `auth.rs`, 20 tests |
| PARITY-003 | GET /auth/callback/:provider | W0 | ✅ Done | ✅ Done | 🚫 N/A | ✅ Done | `auth.rs` |
| PARITY-004 | POST /auth/logout | W0 | ✅ Done | ✅ Done | 🚫 N/A | ✅ Done | `auth.rs` |
| PARITY-005 | GET /health | W0 | ✅ Done | 🚫 N/A | 🚫 N/A | ✅ Done | `health.rs` |
| PARITY-006 | POST /api/blobs/upload | W0 | ✅ Done | ✅ Done | 🚫 N/A | ✅ Done | `blobs.rs`, Playwright |
| PARITY-007 | POST /api/blobs/upload-url | W0 | ✅ Done | ✅ Done | 🚫 N/A | ✅ Done | `blobs.rs`, Playwright |
| PARITY-008 | GET /api/blobs/:id | W0 | ✅ Done | ✅ Done | 🚫 N/A | ✅ Done | `blobs.rs`, Playwright |
| PARITY-009 | DELETE /api/blobs/:id | W0 | ✅ Done | ✅ Done | 🚫 N/A | ✅ Done | `blobs.rs`, Playwright |
| PARITY-010 | GET /api/blobs/:id/info | W0 | ✅ Done | ✅ Done | 🚫 N/A | ✅ Done | `blobs.rs`, Playwright |
| PARITY-011 | GET /api/blobs/:id/download-url | W0 | ✅ Done | ✅ Done | 🚫 N/A | ✅ Done | `blobs.rs`, Playwright |
| PARITY-012 | GET /api/blobs | W0 | ✅ Done | ✅ Done | 🚫 N/A | ✅ Done | `blobs.rs`, Playwright |

**Wave 0 Total:** 12/12 complete (100%)

---

## Wave 0.5: Reference Tracks Domain (COMPLETE)

| PARITY-ID | Route/Feature | Wave | Backend | FE Swap | Admin | Tests | Evidence |
|-----------|---------------|------|---------|---------|-------|-------|----------|
| PARITY-013 | Reference track CRUD | W0.5 | ✅ Done | ✅ Done | 🚫 N/A | ✅ Done | `reference.rs`, `ReferenceLibraryV2.tsx`, 31+14 tests |
| PARITY-014 | Track analysis | W0.5 | ✅ Done | ✅ Done | 🚫 N/A | ✅ Done | `reference.rs`, V2 component |
| PARITY-015 | Annotations CRUD | W0.5 | ✅ Done | ✅ Done | 🚫 N/A | ✅ Done | `reference.rs`, V2 component, E2E tests |
| PARITY-016 | Regions CRUD | W0.5 | ✅ Done | ✅ Done | 🚫 N/A | ✅ Done | `reference.rs`, V2 component, E2E tests |
| PARITY-017 | Frames transport | W0.5 | ✅ Done | ✅ Done | 🚫 N/A | ✅ Done | `frames.rs`, `framesApi`, 27 tests |
| PARITY-018 | Admin templates | W0.5 | ✅ Done | 🚫 N/A | ✅ Done | ✅ Done | `admin_templates.rs`, 13 tests |

**Wave 0.5 Total:** 6/6 complete (100%)

**ACTION-041:** ✅ Reference Tracks Frontend API Swap (COMPLETE)

**E2E Tests:** 14 Playwright tests in `app/frontend/tests/reference-tracks.spec.ts`

---

## Wave 1: Foundation

| PARITY-ID | Route/Feature | Wave | Backend | FE Swap | Admin | Tests | Evidence | Blocks |
|-----------|---------------|------|---------|---------|-------|-------|----------|--------|
| PARITY-019 | GET /gamification/teaser | W1 | ✅ Done | ✅ Done | 🚫 N/A | ✅ Done | `gamification.rs`, `RewardTeaser.tsx`, E2E | - |
| PARITY-020 | GET /gamification/summary | W1 | ✅ Done | ✅ Done | 🚫 N/A | ✅ Done | `gamification.rs`, `ProgressClient.tsx`, E2E | - |
| PARITY-021 | GET,POST /focus | W1 | ✅ Done | ✅ Done | 🚫 N/A | ✅ Done | `focus.rs`, `focus.ts`, E2E | - |
| PARITY-022 | GET /focus/active | W1 | ✅ Done | ✅ Done | 🚫 N/A | ✅ Done | `focus.rs`, `focus.spec.ts` | - |
| PARITY-023 | GET,POST,DELETE /focus/pause | W1 | ✅ Done | ✅ Done | 🚫 N/A | ✅ Done | `focus.rs`, `focus.spec.ts` | - |
| PARITY-024 | POST /focus/:id/complete | W1 | ✅ Done | ✅ Done | 🚫 N/A | ✅ Done | `focus.rs`, `focus.spec.ts` | - |
| PARITY-025 | POST /focus/:id/abandon | W1 | ✅ Done | ✅ Done | 🚫 N/A | ✅ Done | `focus.rs`, `focus.spec.ts` | - |
| PARITY-026 | GET,POST /habits | W1 | ✅ Done | ✅ Done | 🚫 N/A | ✅ Done | `habits.rs`, `habits.ts`, E2E | - |
| PARITY-027 | GET,POST /goals | W1 | ✅ Done | ✅ Done | 🚫 N/A | ✅ Done | `goals.rs`, `goals.ts`, E2E | - |

**Wave 1 Total:** 9/9 backend complete (100%), 9/9 frontend swap (100%) ✅

**Dependencies:**
- EXTRACT-001 (Gamification) ✅ Complete - unblocks all downstream features
- Postgres schema: ✅ `0002_gamification_substrate.sql`, `0003_focus_substrate.sql`, `0004_habits_goals_substrate.sql`

**New Tests Added (January 7, 2026):**
- `focus_tests.rs`: 12 tests (start, abandon, complete, pause, stats)
- `habits_tests.rs`: 10 tests (create, list, complete, streak, idempotency)
- `goals_tests.rs`: 12 tests (create, list, milestones, complete, idempotency)
- `focus.spec.ts`: 12 Playwright tests
- `habits.spec.ts`: 10 Playwright tests
- `goals.spec.ts`: 10 Playwright tests

---

## Wave 2: Core Features

| PARITY-ID | Route/Feature | Wave | Backend | FE Swap | Admin | Tests | Evidence | Blocks |
|-----------|---------------|------|---------|---------|-------|-------|----------|--------|
| PARITY-028 | GET,POST /quests | W2 | ✅ Done | ✅ Done | 🚫 N/A | ✅ Done | `quests.rs`, `quests.ts`, E2E | - |
| PARITY-029 | GET,POST,PUT,DELETE /calendar | W2 | ⏳ Pending | ⏳ Pending | 🚫 N/A | ⏳ Pending | - | EXTRACT-006 |
| PARITY-030 | GET,POST /daily-plan | W2 | ⏳ Pending | ⏳ Pending | 🚫 N/A | ⏳ Pending | - | EXTRACT-007 |
| PARITY-031 | GET,POST /feedback | W2 | ⏳ Pending | ⏳ Pending | 🚫 N/A | ⏳ Pending | - | EXTRACT-008 |

**Wave 2 Total:** 1/4 backend complete (25%), 1/4 frontend swap (25%)

**Wave 2 Core Productivity (Focus, Habits, Goals, Quests):** ✅ **COMPLETE**
- See `validation_wave2_core_productivity_post20G.md`

**Dependencies:**
- EXTRACT-005 (Quests) ✅ Complete
- Postgres schema: ✅ `0005_quests_substrate.sql`, `0006_planning_substrate.sql`

**New Tests Added (January 7, 2026):**
- `quests_tests.rs`: 14 tests (create, list, accept, complete, abandon, idempotency)

---

## Wave 3: Complex Features

| PARITY-ID | Route/Feature | Wave | Backend | FE Swap | Admin | Tests | Evidence | Blocks |
|-----------|---------------|------|---------|---------|-------|-------|----------|--------|
| PARITY-032 | GET,POST,PUT,DELETE /exercise | W3 | ⏳ Pending | ⏳ Pending | 🚫 N/A | ⏳ Pending | - | EXTRACT-009 |
| PARITY-033 | POST /exercise/seed | W3 | ⏳ Pending | 🚫 N/A | ⏳ Pending | ⏳ Pending | - | EXTRACT-009 |
| PARITY-034 | GET,POST,DELETE /books | W3 | ⏳ Pending | ⏳ Pending | 🚫 N/A | ⏳ Pending | - | EXTRACT-011 |
| PARITY-035 | GET,POST /programs | W3 | ⏳ Pending | ⏳ Pending | 🚫 N/A | ⏳ Pending | - | EXTRACT-010 |
| PARITY-036 | GET /market | W3 | ⏳ Pending | ⏳ Pending | 🚫 N/A | ⏳ Pending | - | EXTRACT-012 |
| PARITY-037 | GET,POST,PUT,DELETE /market/items | W3 | ⏳ Pending | ⏳ Pending | 🚫 N/A | ⏳ Pending | - | EXTRACT-012 |
| PARITY-038 | POST /market/purchase | W3 | ⏳ Pending | ⏳ Pending | 🚫 N/A | ⏳ Pending | - | EXTRACT-012 |
| PARITY-039 | POST /market/redeem | W3 | ⏳ Pending | ⏳ Pending | 🚫 N/A | ⏳ Pending | - | EXTRACT-012 |

**Wave 3 Total:** 0/8 complete (0%)

**Dependencies:**
- EXTRACT-009/010/011/012 all depend on EXTRACT-001
- Postgres schema: ✅ `0007_market_substrate.sql`

---

## Wave 4: Specialized Features

| PARITY-ID | Route/Feature | Wave | Backend | FE Swap | Admin | Tests | Evidence | Blocks |
|-----------|---------------|------|---------|---------|-------|-------|----------|--------|
| PARITY-040 | GET /learn | W4 | ⏳ Pending | ⏳ Pending | 🚫 N/A | ⏳ Pending | - | EXTRACT-013 |
| PARITY-041 | GET,POST /learn/progress | W4 | ⏳ Pending | ⏳ Pending | 🚫 N/A | ⏳ Pending | - | EXTRACT-013 |
| PARITY-042 | GET,POST /learn/review | W4 | ⏳ Pending | ⏳ Pending | 🚫 N/A | ⏳ Pending | - | EXTRACT-013 |
| PARITY-043 | GET,POST /reference/tracks | W4 | 🔧 Backend Done | ⏳ Pending | 🚫 N/A | ✅ Done | `reference.rs` | ACTION-041 |
| PARITY-044 | GET,PATCH,DELETE /reference/tracks/:id | W4 | 🔧 Backend Done | ⏳ Pending | 🚫 N/A | ✅ Done | `reference.rs` | ACTION-041 |
| PARITY-045 | GET,POST /reference/tracks/:id/analysis | W4 | 🔧 Backend Done | ⏳ Pending | 🚫 N/A | ✅ Done | `reference.rs` | ACTION-041 |
| PARITY-046 | GET /reference/tracks/:id/play | W4 | 🔧 Backend Done | ⏳ Pending | 🚫 N/A | ✅ Done | `reference.rs` | ACTION-041 |
| PARITY-047 | GET /reference/tracks/:id/stream | W4 | 🔧 Backend Done | ⏳ Pending | 🚫 N/A | ✅ Done | `reference.rs` | ACTION-041 |
| PARITY-048 | POST /reference/upload | W4 | 🔧 Backend Done | ⏳ Pending | 🚫 N/A | ✅ Done | `reference.rs` | ACTION-041 |
| PARITY-049 | GET /onboarding | W4 | ⏳ Pending | ⏳ Pending | 🚫 N/A | ⏳ Pending | - | EXTRACT-016 |
| PARITY-050 | POST /onboarding/start | W4 | ⏳ Pending | ⏳ Pending | 🚫 N/A | ⏳ Pending | - | EXTRACT-016 |
| PARITY-051 | POST /onboarding/skip | W4 | ⏳ Pending | ⏳ Pending | 🚫 N/A | ⏳ Pending | - | EXTRACT-016 |
| PARITY-052 | POST /onboarding/reset | W4 | ⏳ Pending | ⏳ Pending | 🚫 N/A | ⏳ Pending | - | EXTRACT-016 |
| PARITY-053 | POST /onboarding/step | W4 | ⏳ Pending | ⏳ Pending | 🚫 N/A | ⏳ Pending | - | EXTRACT-016 |
| PARITY-054 | GET,POST,PUT,DELETE /infobase | W4 | ⏳ Pending | ⏳ Pending | 🚫 N/A | ⏳ Pending | - | EXTRACT-017 |
| PARITY-055 | GET,POST,PUT,DELETE /ideas | W4 | ⏳ Pending | ⏳ Pending | 🚫 N/A | ⏳ Pending | - | EXTRACT-018 |
| PARITY-056 | GET,POST /analysis | W4 | ⏳ Pending | ⏳ Pending | 🚫 N/A | ⏳ Pending | - | EXTRACT-019 |

**Wave 4 Total:** 6/17 backend done (35%), 0/17 frontend swap (0%)

---

## Wave 5: User & Admin

| PARITY-ID | Route/Feature | Wave | Backend | FE Swap | Admin | Tests | Evidence | Blocks |
|-----------|---------------|------|---------|---------|-------|-------|----------|--------|
| PARITY-057 | POST /auth/accept-tos | W5 | ⏳ Pending | ⏳ Pending | 🚫 N/A | ⏳ Pending | - | EXTRACT-021 |
| PARITY-058 | POST /auth/verify-age | W5 | ⏳ Pending | ⏳ Pending | 🚫 N/A | ⏳ Pending | - | EXTRACT-021 |
| PARITY-059 | DELETE /user/delete | W5 | ⏳ Pending | ⏳ Pending | 🚫 N/A | ⏳ Pending | - | EXTRACT-020 |
| PARITY-060 | GET /user/export | W5 | ⏳ Pending | ⏳ Pending | 🚫 N/A | ⏳ Pending | - | EXTRACT-020 |
| PARITY-061 | GET,DELETE /admin/users | W5 | ⏳ Pending | 🚫 N/A | ⏳ Pending | ⏳ Pending | - | EXTRACT-022 |
| PARITY-062 | GET,DELETE /admin/cleanup-users | W5 | ⏳ Pending | 🚫 N/A | ⏳ Pending | ⏳ Pending | - | EXTRACT-022 |
| PARITY-063 | GET /admin/stats | W5 | ⏳ Pending | 🚫 N/A | ⏳ Pending | ⏳ Pending | - | EXTRACT-022 |
| PARITY-064 | GET,PATCH /admin/feedback | W5 | ⏳ Pending | 🚫 N/A | ⏳ Pending | ⏳ Pending | - | EXTRACT-022 |
| PARITY-065 | GET,PATCH /admin/quests | W5 | ⏳ Pending | 🚫 N/A | ⏳ Pending | ⏳ Pending | - | EXTRACT-022 |
| PARITY-066 | GET,PATCH,DELETE /admin/skills | W5 | ⏳ Pending | 🚫 N/A | ⏳ Pending | ⏳ Pending | - | EXTRACT-022 |
| PARITY-067 | GET,POST,DELETE /admin/content | W5 | ⏳ Pending | 🚫 N/A | ⏳ Pending | ⏳ Pending | - | EXTRACT-022 |
| PARITY-068 | GET,DELETE /admin/db-health | W5 | ⏳ Pending | 🚫 N/A | ⏳ Pending | ⏳ Pending | - | EXTRACT-022 |
| PARITY-069 | GET /admin/backup | W5 | ⏳ Pending | 🚫 N/A | ⏳ Pending | ⏳ Pending | - | EXTRACT-022 |
| PARITY-070 | POST /admin/restore | W5 | ⏳ Pending | 🚫 N/A | ⏳ Pending | ⏳ Pending | - | EXTRACT-022 |
| PARITY-071 | Admin Templates | W5 | ✅ Done | 🚫 N/A | ✅ Done | ✅ Done | `admin_templates.rs` | - |

**Wave 5 Total:** 1/15 complete (7%)

---

## Summary by Wave

| Wave | Description | Routes | Backend Done | FE Swap Done | Overall % |
|------|-------------|--------|--------------|--------------|-----------|
| W0 | Infrastructure | 12 | 12 | 12 | 100% |
| W0.5 | Reference Tracks | 6 | 6 | 6 | 100% |
| W1 | Foundation | 9 | 9 | 2 | 61% |
| W2 | Core Features | 4 | 1 | 0 | 13% |
| W3 | Complex Features | 8 | 0 | 0 | 0% |
| W4 | Specialized | 17 | 6 | 0 | 18% |
| W5 | User & Admin | 15 | 1 | 0 | 3% |
| **Total** | - | **71** | **35** | **20** | **39%** |

**Updated:** January 7, 2026 - Wave 1 backend complete (Focus, Habits, Goals), Wave 2 Quests backend complete

---

## Critical Path

```
EXTRACT-001 (Gamification)
    ├── EXTRACT-002 (Focus)
    ├── EXTRACT-003 (Habits)
    ├── EXTRACT-005 (Quests)
    ├── EXTRACT-009 (Exercise)
    │       └── EXTRACT-010 (Programs)
    ├── EXTRACT-011 (Books)
    ├── EXTRACT-012 (Market)
    └── EXTRACT-013 (Learn)

EXTRACT-014 (Reference) ← Backend Done
    └── ACTION-041 (Frontend Swap)
        └── EXTRACT-015 (Critical Listening)
            └── EXTRACT-019 (Analysis)

Independent:
    ├── EXTRACT-004 (Goals)
    ├── EXTRACT-006 (Calendar)
    ├── EXTRACT-007 (Daily Plan)
    ├── EXTRACT-008 (Feedback)
    ├── EXTRACT-016 (Onboarding)
    ├── EXTRACT-017 (Infobase)
    └── EXTRACT-018 (Ideas)

After All Features:
    ├── EXTRACT-020 (User Export/Delete)
    ├── EXTRACT-021 (Auth Extensions)
    └── EXTRACT-022 (Admin Routes)
```

---

## Immediate Actions

1. **EXTRACT-001 (Gamification)** - P1.1, unblocks 8 features
2. **ACTION-041 (Reference FE Swap)** - Backend done, FE swap needed
3. **EXTRACT-002-004 (Focus/Habits/Goals)** - After gamification

---

## External Blockers (Not in Scope)

| LATER-ID | Item | Blocks |
|----------|------|--------|
| LATER-001 | PostgreSQL | Production deploy |
| LATER-002-005 | Key Vault, R2, OAuth, Container | Production deploy |
| LATER-009-011 | Domains, TLS | Production deploy |

---

## References

- [feature_parity_checklist.md](./feature_parity_checklist.md) - Original checklist
- [FEATURE_EXTRACTION_BACKLOG.md](./FEATURE_EXTRACTION_BACKLOG.md) - Extraction tasks
- [METRICS_POST20G.md](./METRICS_POST20G.md) - Metric definitions
- [checkpoint_20F.md](./checkpoint_20F.md) - Status checkpoint
- [gaps_checkpoint_post_wave_plan.md](./gaps_checkpoint_post_wave_plan.md) - Post-20G gap checkpoint
- [gaps.md](./gaps.md) - Action items

