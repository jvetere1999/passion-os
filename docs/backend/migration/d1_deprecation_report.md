"D1 deprecation report documenting all D1 references and deprecation plan."

# D1 Deprecation Report

**Date:** January 7, 2026  
**Branch:** `refactor/stack-split`  
**Purpose:** Document D1 usage and deprecation plan for migration to Postgres

---

## Executive Summary

The Ignition platform is migrating from Cloudflare D1 (SQLite-based edge database) to PostgreSQL. This report inventories all D1 references in the codebase and outlines the deprecation strategy.

**Current State:**
- D1 is actively used in 50+ API routes
- 15 repository files depend on D1
- Auth uses D1Adapter for NextAuth.js
- Production deployment uses wrangler.toml D1 binding

**Target State:**
- All database operations go through Rust backend
- Frontend/Admin make zero direct database calls
- D1 configuration removed from wrangler.toml
- All D1-related code moved to `deprecated/`

---

## D1 Usage Inventory

### Configuration Files

| File | D1 Reference | Status |
|------|--------------|--------|
| `wrangler.toml` | D1 binding configuration | ⏳ Active |
| `tsconfig.json` | `@cloudflare/workers-types` | ⏳ Active |
| `package.json` | `@auth/d1-adapter` | ⏳ Active |

### Core Database Infrastructure

| File | Location | Purpose | Deprecation Target |
|------|----------|---------|-------------------|
| `src/lib/db/client.ts` | Core | `getDB()` function | `deprecated/src/lib/db/client.ts` |
| `src/lib/db/index.ts` | Core | DB module barrel | `deprecated/src/lib/db/index.ts` |
| `src/lib/db/utils.ts` | Core | D1 utilities | `deprecated/src/lib/db/utils.ts` |
| `src/lib/db/types.ts` | Core | D1 type definitions | `deprecated/src/lib/db/types.ts` |

### Repository Layer (15 files)

| Repository | File | Tables Used | Backend Equivalent |
|------------|------|-------------|-------------------|
| activity-events | `src/lib/db/repositories/activity-events.ts` | activity_events, user_progress, user_wallet | `app/backend/.../db/repos/activity.rs` |
| calendarEvents | `src/lib/db/repositories/calendarEvents.ts` | calendar_events | `app/backend/.../db/repos/calendar.rs` |
| dailyPlans | `src/lib/db/repositories/dailyPlans.ts` | daily_plans | `app/backend/.../db/repos/planning.rs` |
| focusSessions | `src/lib/db/repositories/focusSessions.ts` | focus_sessions, focus_pause_state | `app/backend/.../db/repos/focus.rs` |
| gamification | `src/lib/db/repositories/gamification.ts` | user_wallet, user_progress, points_ledger | `app/backend/.../db/repos/gamification.rs` |
| infobase | `src/lib/db/repositories/infobase.ts` | infobase_entries | `app/backend/.../db/repos/infobase.rs` |
| market | `src/lib/db/repositories/market.ts` | market_items, user_purchases | `app/backend/.../db/repos/market.rs` |
| onboarding | `src/lib/db/repositories/onboarding.ts` | onboarding_*, user_onboarding_state | `app/backend/.../db/repos/onboarding.rs` |
| projects | `src/lib/db/repositories/projects.ts` | training_programs, program_* | `app/backend/.../db/repos/programs.rs` |
| quests | `src/lib/db/repositories/quests.ts` | quests, universal_quests, user_quest_progress | `app/backend/.../db/repos/quests.rs` |
| referenceTracks | `src/lib/db/repositories/referenceTracks.ts` | reference_tracks | `app/backend/.../db/repos/reference.rs` |
| track-analysis | `src/lib/db/repositories/track-analysis.ts` | track_analysis_cache | `app/backend/.../db/repos/analysis.rs` |
| userSettings | `src/lib/db/repositories/userSettings.ts` | user_settings, user_interests | `app/backend/.../db/repos/settings.rs` |
| users | `src/lib/db/repositories/users.ts` | users | `app/backend/.../db/repos/users.rs` |
| index | `src/lib/db/repositories/index.ts` | Barrel export | N/A |

### API Routes Using D1 Directly (50+ files)

#### Admin Routes (10)

| Route | File | D1 Usage |
|-------|------|----------|
| `/api/admin/backup` | `src/app/api/admin/backup/route.ts` | Export all tables |
| `/api/admin/restore` | `src/app/api/admin/restore/route.ts` | Import all tables |
| `/api/admin/cleanup-users` | `src/app/api/admin/cleanup-users/route.ts` | Delete orphan data |
| `/api/admin/content` | `src/app/api/admin/content/route.ts` | CRUD ignition_packs |
| `/api/admin/db-health` | `src/app/api/admin/db-health/route.ts` | Database health check |
| `/api/admin/feedback` | `src/app/api/admin/feedback/route.ts` | CRUD feedback |
| `/api/admin/quests` | `src/app/api/admin/quests/route.ts` | CRUD universal_quests |
| `/api/admin/skills` | `src/app/api/admin/skills/route.ts` | CRUD skill_definitions |
| `/api/admin/stats` | `src/app/api/admin/stats/route.ts` | Aggregate statistics |
| `/api/admin/users` | `src/app/api/admin/users/route.ts` | User management |

#### Feature Routes (40+)

| Domain | Routes | Files |
|--------|--------|-------|
| Auth | 3 | `[...nextauth]`, `accept-tos`, `verify-age` |
| Focus | 5 | `route`, `active`, `pause`, `[id]/complete`, `[id]/abandon` |
| Gamification | 1 | `teaser` |
| Habits | 1 | `route` |
| Goals | 1 | `route` |
| Quests | 1 | `route` |
| Calendar | 1 | `route` |
| Daily Plan | 1 | `route` |
| Exercise | 2 | `route`, `seed` |
| Books | 1 | `route` |
| Programs | 1 | `route` |
| Learn | 3 | `route`, `progress`, `review` |
| Market | 4 | `route`, `items`, `purchase`, `redeem` |
| Reference | 6 | `tracks`, `tracks/[id]`, `analysis`, `stream`, `play`, `upload` |
| Infobase | 1 | `route` |
| Ideas | 1 | `route` |
| Feedback | 1 | `route` |
| User | 2 | `delete`, `export` |
| Analysis | 1 | `route` |
| Blobs | 2 | `[id]`, `upload` |
| Onboarding | 1 | `step` |

### Auth Infrastructure

| File | D1 Usage | Deprecation Target |
|------|----------|-------------------|
| `src/lib/auth/index.ts` | `D1Adapter` from `@auth/d1-adapter` | Remove entirely |
| `app/frontend/src/lib/auth/index.ts` | `D1Adapter` duplicate | Remove entirely |

### Performance/Utility Infrastructure

| File | D1 Usage |
|------|----------|
| `src/lib/perf/api-handler.ts` | D1Database type, `getDB()` pattern |
| `src/lib/perf/request-context.ts` | D1Database type |

### Test Files

| File | D1 Usage |
|------|----------|
| `src/lib/db/__tests__/dailyPlans.test.ts` | Mock D1Database |

---

## Deprecation Strategy

### Phase 1: Backend Routes Complete (Current)

**Status:** ✅ Partially Complete

Backend routes implemented:
- Auth (4/6 routes)
- Storage (7/7 routes)

Backend routes pending:
- All feature routes (gamification, focus, habits, etc.)
- All admin routes

### Phase 2: Frontend Migration

For each domain:

1. ✅ Create Postgres schema migration
2. ⏳ Implement backend routes
3. ⏳ Update frontend to use `@ignition/api-client`
4. ⏳ Verify with tests
5. ⏳ Move old API route to `deprecated/`

### Phase 3: D1 Removal

Once all routes migrated:

1. Remove D1 binding from `wrangler.toml`
2. Remove `@auth/d1-adapter` from `package.json`
3. Remove `@cloudflare/workers-types` D1 types
4. Move all `src/lib/db/` to `deprecated/src/lib/db/`
5. Move all legacy API routes to `deprecated/src/app/api/`

---

## Files to Deprecate (Complete List)

### Configuration (Modify)

| File | Action |
|------|--------|
| `wrangler.toml` | Remove `[[d1_databases]]` section |
| `package.json` | Remove `@auth/d1-adapter` dependency |

### Move to deprecated/

#### Core DB Layer

```
src/lib/db/ → deprecated/src/lib/db/
├── __tests__/
├── client.ts
├── index.ts
├── learn-types.ts
├── repositories/
│   ├── activity-events.ts
│   ├── calendarEvents.ts
│   ├── dailyPlans.ts
│   ├── focusSessions.ts
│   ├── gamification.ts
│   ├── index.ts
│   ├── infobase.ts
│   ├── market.ts
│   ├── onboarding.ts
│   ├── projects.ts
│   ├── quests.ts
│   ├── referenceTracks.ts
│   ├── track-analysis.ts
│   ├── userSettings.ts
│   └── users.ts
├── types.ts
└── utils.ts
```

#### Auth Layer

```
src/lib/auth/index.ts → deprecated/src/lib/auth/index.ts
app/frontend/src/lib/auth/index.ts → deprecated/app/frontend/src/lib/auth/index.ts
```

#### API Routes (All)

```
src/app/api/ → deprecated/src/app/api/
├── admin/
│   ├── backup/
│   ├── cleanup-users/
│   ├── content/
│   ├── db-health/
│   ├── feedback/
│   ├── quests/
│   ├── restore/
│   ├── skills/
│   ├── stats/
│   └── users/
├── analysis/
├── auth/
├── blobs/
├── books/
├── calendar/
├── daily-plan/
├── exercise/
├── feedback/
├── focus/
├── gamification/
├── goals/
├── habits/
├── ideas/
├── infobase/
├── learn/
├── market/
├── onboarding/
├── programs/
├── quests/
├── reference/
└── user/
```

#### Performance Layer

```
src/lib/perf/api-handler.ts → deprecated/src/lib/perf/api-handler.ts
src/lib/perf/request-context.ts → deprecated/src/lib/perf/request-context.ts
```

---

## Blocking Conditions for Deprecation

Before D1 can be fully deprecated:

| Condition | Status | Notes |
|-----------|--------|-------|
| All Postgres schemas created | 🔄 10/24 | Waves 0-3 done |
| All backend routes implemented | 🔄 12/64 | 19% complete |
| Frontend using API client | 🔄 10/62 | 16% swapped |
| All tests passing | ✅ | 35/35 backend tests |
| External provisioning complete | ⏳ | LATER-001 through LATER-005 |

---

## Metrics

### Current D1 Footprint

| Metric | Count |
|--------|-------|
| Files with D1Database import | 24 |
| Repository files | 15 |
| API route files | 51 |
| Direct D1 queries | ~200+ |
| Tables in D1 | 45+ |

### Target After Deprecation

| Metric | Count |
|--------|-------|
| Files with D1Database import | 0 |
| Repository files | 0 (all in `deprecated/`) |
| API route files | 0 (all in `deprecated/`) |
| Direct D1 queries | 0 |
| Tables in Postgres | 33+ (and growing) |

---

## Timeline Estimate

| Phase | Duration | Dependencies |
|-------|----------|--------------|
| Complete schema migrations | 1-2 days | None |
| Implement remaining backend routes | 3-5 days | Schema |
| Swap frontend to API client | 2-3 days | Backend routes |
| E2E testing and validation | 1-2 days | Swaps complete |
| Move to deprecated/ | 1 day | All tests pass |
| **Total** | **8-13 days** | |

---

## Verification Checklist

Before marking D1 as fully deprecated:

- [ ] No imports of `@cloudflare/workers-types` D1Database in `src/`
- [ ] No imports of `@auth/d1-adapter` in `src/`
- [ ] No `getDB()` calls in `src/`
- [ ] No D1 binding in `wrangler.toml`
- [ ] All API routes use backend via `@ignition/api-client`
- [ ] All tests passing
- [ ] Production deployment uses Postgres only
- [ ] `deprecated/` contains all legacy D1 code

---

## References

- [feature_parity_checklist.md](./feature_parity_checklist.md) - Route migration status
- [feature_table_migration_notes.md](./feature_table_migration_notes.md) - Schema changes
- [data_migration_reconciliation_plan.md](./data_migration_reconciliation_plan.md) - Data migration
- [deprecated_mirror_policy.md](./deprecated_mirror_policy.md) - Deprecation policy

