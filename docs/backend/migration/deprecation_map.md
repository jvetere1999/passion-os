# Deprecation Map

**Date:** January 8, 2026  
**Branch:** `refactor/stack-split`  
**Purpose:** Map legacy code locations to deprecated mirror status

---

## Overview

This document tracks the deprecation status of all legacy code as part of the backend-first stack split migration.

| Category | Total Files | Deprecated | Still Active | Status |
|----------|-------------|------------|--------------|--------|
| API Routes | 22 directories | 22 | 0 | ✅ Complete |
| DB Repositories | 15 files | 15 | 0 | ⚠️ Moved but broken imports |
| DB Client | 6 files | 6 | 0 | ⚠️ Moved but broken imports |
| Perf Module | 4 files | 4 | 0 | ⚠️ Moved but broken imports |
| Auth Module | 5 files | 1 | 4 | 🔄 Partial |
| Storage Module | 5 files | 0 | 5 | ❌ Blocked |
| Feature Flags | 2 files | 0 | 2 | ❌ Blocked |
| Admin Module | 1 file | 0 | 1 | ❌ Blocked |
| Cloudflare Config | 2 files | 0 | 2 | ❌ Blocked |
| Middleware | 1 file | 0 | 1 | ❌ Blocked |

**Overall Progress:** ~65% deprecated, **60 broken imports in root src/**

---

## ⚠️ CRITICAL: TypeScript Baseline

The root `src/` directory has **60 "Cannot find module" errors** because:
1. DB repositories were moved to `deprecated/` but root `src/` code still imports them
2. Perf module was moved to `deprecated/` but root `src/` code still imports it
3. These are **pre-existing baseline issues** from incomplete deprecation

### Broken Import Summary

| Module | Import Count | Files Affected |
|--------|-------------|----------------|
| `@/lib/perf` | 16 | Various API routes, today pages |
| `@/lib/db/repositories/users` | 11 | Today pages, API routes |
| `@/lib/db/repositories/dailyPlans` | 7 | Today pages, mobile pages |
| `@/lib/db` | 5 | Mobile pages, API routes |
| `@/lib/db/repositories/referenceTracks` | 4 | Reference API |
| `@/lib/db/repositories/onboarding` | 4 | Onboarding flows |
| `@/lib/db/repositories/market` | 4 | Market API |
| `@/lib/db/repositories/gamification` | 3 | Gamification features |
| `@/lib/db/repositories/activity-events` | 3 | Activity tracking |
| Other DB repos | 3 | Various features |

### Blocking Condition

Further deprecation is **blocked** until:
1. Root `src/` is replaced by `app/frontend/` completely, OR
2. Root `src/` code is updated to use backend API instead of direct DB imports

---

---

## Deprecated Code (Already Moved)

### API Routes (100% Complete)

All 22 legacy API route directories have been moved to `deprecated/src/app/api/`:

| Legacy Path | Deprecated Path | Status |
|-------------|-----------------|--------|
| `src/app/api/admin/` | `deprecated/src/app/api/admin/` | ✅ Deprecated |
| `src/app/api/analysis/` | `deprecated/src/app/api/analysis/` | ✅ Deprecated |
| `src/app/api/auth/` | `deprecated/src/app/api/auth/` | ✅ Deprecated |
| `src/app/api/blobs/` | `deprecated/src/app/api/blobs/` | ✅ Deprecated |
| `src/app/api/books/` | `deprecated/src/app/api/books/` | ✅ Deprecated |
| `src/app/api/calendar/` | `deprecated/src/app/api/calendar/` | ✅ Deprecated |
| `src/app/api/daily-plan/` | `deprecated/src/app/api/daily-plan/` | ✅ Deprecated |
| `src/app/api/exercise/` | `deprecated/src/app/api/exercise/` | ✅ Deprecated |
| `src/app/api/feedback/` | `deprecated/src/app/api/feedback/` | ✅ Deprecated |
| `src/app/api/focus/` | `deprecated/src/app/api/focus/` | ✅ Deprecated |
| `src/app/api/gamification/` | `deprecated/src/app/api/gamification/` | ✅ Deprecated |
| `src/app/api/goals/` | `deprecated/src/app/api/goals/` | ✅ Deprecated |
| `src/app/api/habits/` | `deprecated/src/app/api/habits/` | ✅ Deprecated |
| `src/app/api/ideas/` | `deprecated/src/app/api/ideas/` | ✅ Deprecated |
| `src/app/api/infobase/` | `deprecated/src/app/api/infobase/` | ✅ Deprecated |
| `src/app/api/learn/` | `deprecated/src/app/api/learn/` | ✅ Deprecated |
| `src/app/api/market/` | `deprecated/src/app/api/market/` | ✅ Deprecated |
| `src/app/api/onboarding/` | `deprecated/src/app/api/onboarding/` | ✅ Deprecated |
| `src/app/api/programs/` | `deprecated/src/app/api/programs/` | ✅ Deprecated |
| `src/app/api/quests/` | `deprecated/src/app/api/quests/` | ✅ Deprecated |
| `src/app/api/reference/` | `deprecated/src/app/api/reference/` | ✅ Deprecated |
| `src/app/api/user/` | `deprecated/src/app/api/user/` | ✅ Deprecated |

**Backend Replacement:** `app/backend/crates/api/src/routes/`

---

### Database Module (100% Complete)

All D1 database files have been moved to `deprecated/src/lib/db/`:

| Legacy Path | Deprecated Path | Status |
|-------------|-----------------|--------|
| `src/lib/db/client.ts` | `deprecated/src/lib/db/client.ts` | ✅ Deprecated |
| `src/lib/db/index.ts` | `deprecated/src/lib/db/index.ts` | ✅ Deprecated |
| `src/lib/db/types.ts` | `deprecated/src/lib/db/types.ts` | ✅ Deprecated |
| `src/lib/db/utils.ts` | `deprecated/src/lib/db/utils.ts` | ✅ Deprecated |
| `src/lib/db/learn-types.ts` | `deprecated/src/lib/db/learn-types.ts` | ✅ Deprecated |
| `src/lib/db/__tests__/` | `deprecated/src/lib/db/__tests__/` | ✅ Deprecated |

**DB Repositories (15 files):**

| Legacy Path | Deprecated Path | Status |
|-------------|-----------------|--------|
| `src/lib/db/repositories/activity-events.ts` | `deprecated/src/lib/db/repositories/activity-events.ts` | ✅ Deprecated |
| `src/lib/db/repositories/calendarEvents.ts` | `deprecated/src/lib/db/repositories/calendarEvents.ts` | ✅ Deprecated |
| `src/lib/db/repositories/dailyPlans.ts` | `deprecated/src/lib/db/repositories/dailyPlans.ts` | ✅ Deprecated |
| `src/lib/db/repositories/focusSessions.ts` | `deprecated/src/lib/db/repositories/focusSessions.ts` | ✅ Deprecated |
| `src/lib/db/repositories/gamification.ts` | `deprecated/src/lib/db/repositories/gamification.ts` | ✅ Deprecated |
| `src/lib/db/repositories/index.ts` | `deprecated/src/lib/db/repositories/index.ts` | ✅ Deprecated |
| `src/lib/db/repositories/infobase.ts` | `deprecated/src/lib/db/repositories/infobase.ts` | ✅ Deprecated |
| `src/lib/db/repositories/market.ts` | `deprecated/src/lib/db/repositories/market.ts` | ✅ Deprecated |
| `src/lib/db/repositories/onboarding.ts` | `deprecated/src/lib/db/repositories/onboarding.ts` | ✅ Deprecated |
| `src/lib/db/repositories/projects.ts` | `deprecated/src/lib/db/repositories/projects.ts` | ✅ Deprecated |
| `src/lib/db/repositories/quests.ts` | `deprecated/src/lib/db/repositories/quests.ts` | ✅ Deprecated |
| `src/lib/db/repositories/referenceTracks.ts` | `deprecated/src/lib/db/repositories/referenceTracks.ts` | ✅ Deprecated |
| `src/lib/db/repositories/track-analysis.ts` | `deprecated/src/lib/db/repositories/track-analysis.ts` | ✅ Deprecated |
| `src/lib/db/repositories/userSettings.ts` | `deprecated/src/lib/db/repositories/userSettings.ts` | ✅ Deprecated |
| `src/lib/db/repositories/users.ts` | `deprecated/src/lib/db/repositories/users.ts` | ✅ Deprecated |

**Backend Replacement:** `app/backend/crates/api/src/db/`

---

### Auth Module (Partial - 20% Complete)

| Legacy Path | Deprecated Path | Status | Notes |
|-------------|-----------------|--------|-------|
| `src/lib/auth/index.ts` | `deprecated/src/lib/auth/index.ts` | ✅ Deprecated | Core auth logic |
| `src/lib/auth/providers.ts` | Still in `src/lib/auth/` | ⏳ Pending | OAuth provider config |
| `src/lib/auth/useAuth.ts` | Still in `src/lib/auth/` | ❌ Keep | React hook - frontend-only |
| `src/lib/auth/SessionProvider.tsx` | Still in `src/lib/auth/` | ❌ Keep | React context - frontend-only |
| `src/lib/auth/__tests__/` | Still in `src/lib/auth/` | ⏳ Pending | Tests for deprecated code |

**Notes:**
- `useAuth.ts` and `SessionProvider.tsx` are frontend-only React code - should move to `app/frontend/`, not deprecate
- `providers.ts` can be deprecated after OAuth validated in backend

---

### Perf/Today Module (Partial)

| Legacy Path | Deprecated Path | Status | Notes |
|-------------|-----------------|--------|-------|
| `src/lib/perf/` | `deprecated/src/lib/perf/` | ✅ Deprecated | API handler helpers |
| `src/lib/today/` | `deprecated/src/lib/today/` | ✅ Deprecated | Today engine logic |

---

## Pending Deprecation (Still Active)

### Storage Module (0% Complete)

| Legacy Path | Backend Replacement | Action |
|-------------|---------------------|--------|
| `src/lib/storage/index.ts` | `app/backend/crates/api/src/storage/` | Deprecate |
| `src/lib/storage/r2.ts` | `app/backend/crates/api/src/storage/r2.rs` | Deprecate |
| `src/lib/storage/keys.ts` | `app/backend/crates/api/src/storage/` | Deprecate |
| `src/lib/storage/types.ts` | Keep types in frontend | Move to frontend |
| `src/lib/storage/deprecation.ts` | N/A | Deprecate |
| `src/lib/storage/__tests__/` | Backend tests exist | Deprecate |

---

### Feature Flags (0% Complete)

| Legacy Path | Action | Notes |
|-------------|--------|-------|
| `src/lib/flags/index.ts` | Deprecate | Per copilot instructions - no flag expansion |
| `src/lib/flags/README.md` | Deprecate | Documentation only |

---

### Admin Module (0% Complete)

| Legacy Path | Backend Replacement | Action |
|-------------|---------------------|--------|
| `src/lib/admin/index.ts` | `app/backend/crates/api/src/routes/admin.rs` | Deprecate |

---

### Auth Remaining (2 files)

| Legacy Path | Action | Notes |
|-------------|--------|-------|
| `src/lib/auth/providers.ts` | Deprecate | OAuth config moved to backend |
| `src/lib/auth/__tests__/` | Deprecate | Tests for deprecated auth |

---

### Middleware (0% Complete)

| Legacy Path | Backend Replacement | Action |
|-------------|---------------------|--------|
| `src/middleware.ts` | `app/backend/crates/api/src/middleware/` | Deprecate |

---

### Cloudflare Config (0% Complete)

| Legacy Path | Action | Notes |
|-------------|--------|-------|
| `wrangler.toml` | Deprecate | Cloudflare Workers config |
| `open-next.config.ts` | Deprecate | OpenNext adapter |

---

## Files to Keep (Do NOT Deprecate)

These files stay active or move to new frontend location:

| Current Location | Target | Reason |
|------------------|--------|--------|
| `src/lib/auth/useAuth.ts` | `app/frontend/src/lib/auth/` | React hook |
| `src/lib/auth/SessionProvider.tsx` | `app/frontend/src/lib/auth/` | React context |
| `src/lib/storage/types.ts` | `app/frontend/src/lib/storage/` | TypeScript types |
| `src/lib/hooks/` | `app/frontend/src/lib/hooks/` | React hooks |
| `src/lib/theme/` | `app/frontend/src/lib/theme/` | Theme config |
| `src/lib/themes/` | `app/frontend/src/lib/themes/` | Theme definitions |
| `src/lib/ui/` | `app/frontend/src/lib/ui/` | UI utilities |
| `src/lib/focus/` | `app/frontend/src/lib/focus/` | Focus timer UI |
| `src/lib/player/` | `app/frontend/src/lib/player/` | Audio player UI |
| `src/lib/arrange/` | `app/frontend/src/lib/arrange/` | Arrange UI |
| `src/lib/data/` | Evaluate | Static data |
| `src/components/` | `app/frontend/src/components/` | React components |
| `src/assets/` | `app/frontend/src/assets/` | Static assets |
| `src/styles/` | `app/frontend/src/styles/` | CSS styles |

---

## Summary by Priority

### Immediate (No Dependencies)

1. `src/lib/flags/` → `deprecated/src/lib/flags/`
2. `src/lib/admin/` → `deprecated/src/lib/admin/`
3. `wrangler.toml` → `deprecated/wrangler.toml`
4. `open-next.config.ts` → `deprecated/open-next.config.ts`

### After Storage Validation

5. `src/lib/storage/` (except types.ts) → `deprecated/src/lib/storage/`

### After Auth Validation

6. `src/lib/auth/providers.ts` → `deprecated/src/lib/auth/`
7. `src/lib/auth/__tests__/` → `deprecated/src/lib/auth/`

### After Middleware Validation

8. `src/middleware.ts` → `deprecated/src/middleware.ts`

---

## References

- [deprecated_mirror_policy.md](./deprecated_mirror_policy.md) - Deprecation rules
- [feature_parity_checklist.md](./feature_parity_checklist.md) - Feature status
- [removal_checklist.md](./removal_checklist.md) - Removal workflow
- [PRE_DEPRECATED_GATE.md](./PRE_DEPRECATED_GATE.md) - Pre-deprecation validation
