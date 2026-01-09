# Validation: Deprecation Readiness Assessment

**Date:** January 8, 2026  
**Branch:** `refactor/stack-split`  
**Phase:** 25b (Deprecation Readiness)  
**Status:** 🔴 **BLOCKED**

---

## Objective

Assess readiness to deprecate legacy code and move it to `deprecated/` mirror.

---

## Summary

| Check | Result |
|-------|--------|
| deprecation_map.md created | ✅ Pass |
| removal_checklist.md created | ✅ Pass |
| Batch 1 deprecation | 🔴 **Failed - Reverted** |
| TypeScript baseline | 🔴 **60 broken imports** |
| Deprecation blocked | ⚠️ Yes - see blockers |

---

## Deliverables Created

1. **[deprecation_map.md](./deprecation_map.md)** - Complete inventory of legacy code and deprecation status
2. **[removal_checklist.md](./removal_checklist.md)** - Step-by-step checklist for deprecation (blocked)

---

## Batch 1 Deprecation Attempt

### Files Targeted

| File | Action | Result |
|------|--------|--------|
| `src/lib/flags/` | Move to `deprecated/src/lib/flags/` | ❌ Reverted |
| `src/lib/admin/` | Move to `deprecated/src/lib/admin/` | ❌ Reverted |
| `wrangler.toml` | Move to `deprecated/wrangler.toml` | ❌ Reverted |
| `open-next.config.ts` | Move to `deprecated/open-next.config.ts` | ❌ Reverted |

### Failure Reason

Root `src/` code still imports these modules:

**`@/lib/flags` imports (5 files):**
- `src/app/(app)/today/TodayGridClient.tsx`
- `src/app/(app)/today/MomentumBanner.tsx`
- `src/app/(app)/today/StarterBlock.tsx`
- `src/app/(app)/focus/FocusClient.tsx`
- `src/components/mobile/screens/MobileTodayClient.tsx`

**`@/lib/admin` imports (3 files):**
- `src/app/(app)/admin/docs/page.tsx`
- `src/app/(app)/admin/page.tsx`
- `src/components/shell/UserMenu.tsx`

Moving these would add 8 more broken imports to the already-broken baseline.

---

## Pre-Existing Baseline Issues

The root `src/` codebase has **60 "Cannot find module" TypeScript errors** from previous incomplete deprecation:

| Module | Import Count |
|--------|-------------|
| `@/lib/perf` | 16 |
| `@/lib/db/repositories/users` | 11 |
| `@/lib/db/repositories/dailyPlans` | 7 |
| `@/lib/db` | 5 |
| `@/lib/db/repositories/referenceTracks` | 4 |
| `@/lib/db/repositories/onboarding` | 4 |
| `@/lib/db/repositories/market` | 4 |
| `@/lib/db/repositories/gamification` | 3 |
| `@/lib/db/repositories/activity-events` | 3 |
| `@/lib/db/repositories/track-analysis` | 1 |
| `@/lib/db/repositories/calendarEvents` | 1 |
| `@/components/references/ReferenceLibraryV2` | 1 |
| **Total** | **60** |

---

## Blockers Documented

### ACTION-055: Fix Root `src/` Broken Imports

**Status:** Blocked (Architecture)  
**Priority:** HIGH  
**Description:** Previous deprecation of DB/perf modules was incomplete. Consuming code in root `src/` was not updated.

### ACTION-056: Unblock Flags/Admin/Config Deprecation

**Status:** Blocked (ACTION-055)  
**Priority:** MEDIUM  
**Description:** Cannot deprecate remaining modules until ACTION-055 is resolved.

---

## Recommendations

1. **Complete frontend cutover first** - Move all active pages from root `src/` to `app/frontend/`
2. **Do not deprecate piecemeal** - Batch deprecation of root `src/` after full replacement
3. **Consider "big bang" approach** - Once `app/frontend/` is validated, deprecate entire root `src/` at once

---

## Updates Made

| Document | Update |
|----------|--------|
| [deprecation_map.md](./deprecation_map.md) | Created with accurate status (60 broken imports noted) |
| [removal_checklist.md](./removal_checklist.md) | Created with blockers documented |
| [gaps.md](./gaps.md) | Added ACTION-055, ACTION-056 |
| [PHASE_GATE.md](./PHASE_GATE.md) | Added Phase 25b (Deprecation Readiness) |

---

## Validation Result

**Status:** 🔴 **BLOCKED**

Deprecation cannot proceed until root `src/` is replaced by `app/frontend/`. See:
- [gaps.md#ACTION-055](./gaps.md)
- [gaps.md#ACTION-056](./gaps.md)
