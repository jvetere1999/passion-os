# SOLUTION SELECTION - Updated Decision Status

**Generated**: 2026-01-11  
**Updated**: 2026-01-12 21:45 UTC  
**Status**: 🟠 **P0 COMPLETE, P1 DECISION PENDING**  
**Current Gate**: P1 Auth Redirect Target (Option A or B)  
**Purpose**: Document all decisions made and PENDING decisions  
**Production Status**: Schema fixes ready to deploy, auth redirect issue discovered

---

## 🟠 CURRENT DECISION: P1 Auth Redirect Target

**Issue**: When session expires (401), code redirects to `/login` which doesn't exist, causing endless redirect loop.

**Evidence**: 
- User report: "clearing cookies locks you into endless cycle"
- Code analysis: client.ts:117 redirects to non-existent `/login` page
- Frontend structure: Main landing is `/`, signin is `/auth/signin`, no `/login`

### Option A: Redirect to Main Landing Page `/` ⭐ RECOMMENDED
```typescript
// Change in client.ts:117
window.location.href = '/';
```

**Rationale**:
- Clean slate after session clear
- User lands on public page, can see features
- Can choose to sign in or browse
- No redirect loop (/ is public route)
- Natural user experience

**Trade-offs**:
- Loses context of original destination
- User must manually click "Start Ignition" to sign in again
- But notification still shows "session expired" message

### Option B: Redirect to Signin Page `/auth/signin`
```typescript
// Change in client.ts:117
window.location.href = '/auth/signin';
```

**Rationale**:
- Direct path to re-authenticate
- Clear what user needs to do next
- Faster to regain access

**Trade-offs**:
- More aggressive (forces login choice)
- Less friendly after clearing cookies
- Doesn't let user just browse first

**AWAITING USER DECISION**: Reply with "Option A" or "Option B"

---

## 🟢 COMPLETED: P0 Schema Mismatch Fix (Option A Selected)

**User Decision**: Option A (Complete Rewrite)  
**Implementation**: COMPLETE ✅  
**Validation**: PASSED ✅

### What Was Fixed
- [app/backend/crates/api/src/routes/today.rs](app/backend/crates/api/src/routes/today.rs#L318-L368) - Rewrote `fetch_personalization()` to query correct schema
- Deleted dead code: `user_settings_repos.rs` and `user_settings_models.rs`
- Updated module declarations in `db/mod.rs`

### Validation Status
```
✅ cargo check: 0 errors, 209 warnings (pre-existing)
✅ npm lint: 0 errors, 26 warnings (pre-existing)
```

---

## 📋 DECISION HISTORY

### ✅ P0-P5 DECISIONS (Locked & Implemented)

| Priority | Issue | Decision | Status | Implementation |
|----------|-------|----------|--------|-----------------|
| P0 | Session Termination | Option A | ✅ COMPLETE | Centralized 401 handler in API client |
| P1 | Plan My Day | Option A | ✅ COMPLETE | Extended DailyPlanRepo with workout query |
| P2 | Onboarding Modal | Option C | ✅ COMPLETE | Intentionally disabled (manual entry only) |
| P3 | Focus Library | Options A+B | ✅ COMPLETE | R2 upload + reference tracks + B hotfix |
| P4 | Focus Persistence | Option A | ✅ COMPLETE | Integrated with SyncStateContext |
| P5 | Zen Browser | Option A | ✅ COMPLETE | CSS variable support + browser detection |
| P0 | Schema Mismatch | Option A | ✅ COMPLETE | Rewrote fetch_personalization, deleted dead code |

---

## ✅ FIXED ISSUES - HISTORICAL

### P0-A: habits.archived Column ✅ VERIFIED CORRECT

- Status: NOT AN ERROR - Code already uses `is_active = true`
- Location: `app/backend/crates/api/src/db/habits_goals_repos.rs:88`
- Evidence: Query correctly filters `WHERE is_active = true`
- Decision: No change needed - code matches schema

### P0-B: Date Casting ✅ FIXED (3 locations)

**Issue**: Some date columns receiving i64 instead of proper casting  
**Root Cause**: `::date` cast missing on INTEGER columns representing dates

**Fixed Locations**:
1. [habits_goals_repos.rs#L88](habits_goals_repos.rs#L88)
2. [habits_goals_repos.rs#L133](habits_goals_repos.rs#L133)
3. [quests_repos.rs#L199](quests_repos.rs#L199)

**Fix Applied**: Added `::date` cast to convert INT4 to DATE
```rust
// Before: SELECT completion_date FROM ...
// After:  SELECT completion_date::date FROM ...
```

**Validation**: All 3 locations now pass type checking

---

## DECISION CONTEXT & RATIONALE

### Why Option A (Complete Rewrite) Was Selected

**Evidence from Production**:
- 4 critical endpoints returning 500 errors
- Missing columns: `theme`, `key`, `streak_days`
- Type mismatches: INT4 vs INT8
- Root cause: Code using non-existent schema columns

**Option A Benefits**:
1. ✅ Fixes actual schema/code misalignment
2. ✅ Single source of truth (use correct tables)
3. ✅ No technical debt perpetuation
4. ✅ Proper error handling going forward
5. ✅ Interests mapped to correct `user_interests` table
6. ✅ Safe defaults for fields not in schema

**Option B Issues**:
1. ❌ Masks underlying problem
2. ❌ Would break again with next schema change
3. ❌ Creates long-term maintenance burden
4. ❌ Perpetuates confusion between schema and code

---

## ARCHIVE

All historical decision documents have been moved to `debug/archive/` for reference:
- Previous solution selections
- Earlier decision frameworks
- Build fix documentation
- Phase tracking records

Current active decisions are tracked in this file and `debug/DEBUGGING.md`.

---

## 🔴 NEW DECISION: P0 API Response Format Standardization

**Issue**: Response format mismatch between backend and frontend
**Discovery Date**: 2026-01-12 13:10 UTC (during 9-item failure investigation)
**Impact**: Causes data parsing failures, prevents create/update operations
**Scope**: 20+ endpoints, 20+ frontend files

**Current State**:
- Backend: All endpoints return `{ data: <response> }` format (CONSISTENT)
- Frontend: Different files expect different formats (INCONSISTENT)

**Affected Operations**:
1. ✅ Calendar events - FIXED (now expects `{ data: ... }`)
2. ❌ Goals - still expects `{ goals: [...] }`
3. ❌ Habits - still expects `{ data: ... }` (backend correct)
4. ❌ Quests - still expects `{ quests: [...] }`
5. ❌ Focus sessions - still expects `{ session: ... }`
6. ❌ Books - TBD
7. ❌ Workouts - TBD
8. Plus admin, shell, and utility components

### Option A: Standardize Backend to Frontend Expectations ⭐ RECOMMENDED
**Strategy**: Change ALL backend endpoints to return `{ <resource>: <data> }` format

**Backend Changes**:
- goals.rs: Change `{ data: GoalsListResponse }` to `{ goals: GoalsListResponse }`
- habits.rs: Keep current `{ data: ... }`  ← Actually already correct
- quests.rs: Change to `{ quests: ... }`
- focus.rs: Change to `{ session: FocusSession }`
- calendar.rs: REVERT my frontend fix, change to `{ events: [...] }`
- Plus 15+ other routes

**Frontend Changes**: NONE (or revert calendar fix)

**Pros**:
- REST convention (resource names in response)
- Cleaner separation: response keys match resource types
- Frontend code clearer (`{ goals: data }` more intuitive than `{ data: { goals: data } }`)
- Fewer levels of nesting
- Aligns with typical API design

**Cons**:
- More backend work (20+ routes)
- Have to verify each endpoint's response type
- Risk of introducing bugs in each change

**Effort**: 3-4 hours

### Option B: Standardize Frontend to Backend `{ data: ... }` Format
**Strategy**: Update ALL frontend files to expect `{ data: <response> }` format

**Backend Changes**: NONE

**Frontend Changes**:
- GoalsClient.tsx: Change `data.goals` to `data.data.goals`
- FocusClient.tsx: Change `data.session` to `data.data.session`
- QuestsClient.tsx: Change `data.quests` to `data.data.quests`
- Plus 20+ other files

**Pros**:
- No backend work
- Single consistent format everywhere
- Fewer JSON keys (less parsing)
- Already started with calendar fix

**Cons**:
- More frontend files to change
- Violates REST convention
- Extra nesting level `{ data: { ... } }`
- Less intuitive (what's in "data"? which resource?)

**Effort**: 2-3 hours

### Option C: Hybrid - Standardize Where Critical, Leave Rest As-Is
**Strategy**: Fix only P0/P1 critical paths (calendar, events, habits)

**Fixes**:
- Calendar: ✅ ALREADY DONE (expects `{ data: ... }`)
- Habits POST/create: Verify backend is correct
- Quests: Fix one critical path only

**Remaining**: Leave as-is, implement as separate work

**Pros**:
- Fastest to unblock critical features
- Minimal risk of new bugs
- Can be completed in 1 hour

**Cons**:
- Leaves technical debt
- Other features still broken
- Inconsistent across codebase
- Will need to fix same issue multiple times

**Effort**: 1 hour (unblocks critical paths only)

### RECOMMENDATION
**SELECT OPTION A** (Standardize Backend) because:
1. REST best practices - resource names in response keys
2. More maintainable long-term
3. Cleaner API contract
4. Fewer levels of nesting
5. Better alignment with industry standards
6. I can script most of the changes

**Implementation Plan**:
1. Identify all 25+ endpoint response types
2. Update route handlers to use resource-based keys
3. Verify frontend still expects same format
4. Test each endpoint
5. Deploy as single batch (all or nothing)

**Timeline**: 4 hours, ready to deploy same day

---

**User Action Required**: Select Option A, B, or C to proceed with Phase 5 FIX for remaining issues
