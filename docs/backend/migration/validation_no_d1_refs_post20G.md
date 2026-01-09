# D1 Removal Validation - Post Gate 20G

## Summary

D1 (Cloudflare SQLite database) has been successfully removed from the main `src/` codebase. All database operations now go through the Rust backend at `api.ecent.online`.

**Date:** 2025-01-15
**Gate:** 20G (Parity Proven)
**Branch:** refactor/stack-split

---

## Changes Made

### 1. Auth Module (`src/lib/auth/index.ts`)

**Before:** Used `@auth/d1-adapter` and D1Database directly for session management.

**After:** Backend-first auth that:
- Fetches session from `${API_BASE_URL}/auth/session`
- Forwards cookies for authentication
- Returns next-auth compatible Session type
- Exports `auth`, `signIn`, `signOut`, `handlers`, `getSession`

### 2. Today Types (`src/app/(app)/today/types.ts`)

**Created:** Local type definitions extracted from former D1 repositories:
- `PlanItem`, `DailyPlanSummary`
- `TodayServerState`, `TodayUserState`
- `TodayVisibility`
- `QuickPick`, `ResumeLast`, `InterestPrimer`, `DynamicUIData`
- `UserPersonalization`
- Helper functions: `getDefaultUserState`, `getDefaultVisibility`, etc.

### 3. Today Logic Module (`src/lib/today/`)

**Restored:** Pure functions that don't depend on D1:
- `todayVisibility.ts` - Visibility rules
- `momentum.ts` - Session feedback state
- `softLanding.ts` - Post-action reduced mode
- `resolveNextAction.ts` - Starter CTA resolver
- `safetyNets.ts` - Validation and fallbacks
- `fetchPersonalization.ts` - Returns defaults (API fetches in client)
- `index.ts` - Re-exports all modules

### 4. Today Page (`src/app/(app)/today/page.tsx`)

**Before:** Server component with D1 queries via `getDB()`, `ensureUserExists()`, `getTodayServerState()`, etc.

**After:** Server component that:
- Gets session from backend via `auth()`
- Uses default user state for SSR
- Passes defaults to `TodayGridClient`
- Client components fetch real data from backend API

### 5. Today Child Components

**Updated imports to use local types:**
- `TodayGridClient.tsx` - `from "./types"`
- `InterestPrimer.tsx` - `from "./types"`
- `QuickPicks.tsx` - `from "./types"`
- `ResumeLast.tsx` - `from "./types"`

### 6. Mobile Pages

**`src/app/(mobile)/m/page.tsx`:**
- Removed D1 imports
- Uses default state for SSR
- `MobileTodayClient` fetches real data

**`src/app/(mobile)/m/do/page.tsx`:**
- Removed D1 imports
- Uses default props
- `MobileDoClient` fetches real data

### 7. Components

**`src/components/mobile/screens/MobileTodayClient.tsx`:**
- Import types from `@/app/(app)/today/types`

**`src/components/onboarding/OnboardingProvider.tsx`:**
- Fetches onboarding state from backend API
- Passes null state/flow (modal fetches its own data)

**`src/components/debug/DebugOverlay.tsx`:**
- Import types from `@/app/(app)/today/types`

### 8. Configuration

**`wrangler.toml`:**
- `[[d1_databases]]` section removed

**`package.json`:**
- `@auth/d1-adapter` dependency removed
- 17 D1-related npm scripts removed

**`src/env.d.ts`:**
- `DB: D1Database` removed from `CloudflareEnv`

**`tsconfig.json`:**
- `deprecated/**/*` added to exclude
- `app/**/*` added to exclude (separate tsconfigsexist)

### 9. Deprecated Files

Legacy D1-dependent code moved to `deprecated/` mirrors:
- `deprecated/src/lib/db/` - All repositories and client
- `deprecated/src/lib/auth/index.ts` - D1Adapter auth
- `deprecated/src/lib/perf/` - getDB and request context
- `deprecated/src/lib/today/fetchPersonalization.ts` - D1 version
- `deprecated/src/app/api/` - All legacy API routes
- `deprecated/scripts/` - D1 database scripts
- `deprecated/src/components/onboarding/OnboardingProvider.tsx`

---

## Verification

### TypeScript Check
```
$ npm run typecheck
> tsc --noEmit
(no errors)
```

### Grep Verification (No D1 in src/)
```
$ grep -r "D1Database\|from \"@/lib/db/repositories\|from \"@/lib/perf\|getDB" src/
(no results)
```

### Files Changed
- 15 files modified in `src/`
- 1 file created (`src/app/(app)/today/types.ts`)
- 6 files restored to `src/lib/today/`

---

## Architecture Notes

### Backend-First Pattern

All data now flows through the Rust backend:
1. **Session**: `auth()` → `GET /auth/session`
2. **Daily Plan**: `getDailyPlan()` → `GET /api/daily-plan`
3. **Onboarding**: `getOnboardingState()` → `GET /api/onboarding`
4. **Gamification**: Client components → `GET /api/gamification/summary`

### SSR Strategy

Server components use **default/empty state** for initial render:
- Avoids blocking SSR on backend calls
- Client components hydrate with real data
- Reduces TTFB while maintaining functionality

### Cookie Forwarding

Server components forward cookies to backend:
```typescript
const cookieStore = await cookies();
const cookieHeader = cookieStore.toString();
fetch(url, { headers: { Cookie: cookieHeader } });
```

---

## Remaining Work

1. **app/frontend/** - Separate codebase with own tsconfig, needs similar cleanup
2. **app/admin/** - Admin console, uses stub auth
3. **Integration Tests** - Verify backend API works end-to-end
4. **Performance** - Monitor SSR latency with backend calls

---

## Blockers Resolved

- ✅ D1Database type references removed
- ✅ @auth/d1-adapter dependency removed
- ✅ wrangler.toml D1 binding removed
- ✅ TypeScript compiles cleanly
- ✅ Legacy code preserved in deprecated/
