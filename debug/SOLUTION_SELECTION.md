# SOLUTION SELECTION - Unsolved Issues

**Generated**: 2026-01-11
**Updated**: 2026-01-11 (After P0 fixes)
**Status**: CRITICAL P0 ERRORS FIXED - FOCUSING ON P1-P4 ISSUES
**Purpose**: Document solution options for remaining unsolved issues
**Process**: Issue → Document → Explorer → Decision → Fix → User Pushes (see `.github/instructions/DEBUGGING.instructions.md`)

---

## ✅ FIXED ISSUES (2026-01-11)

### P0-A: habits.archived Column ✅ VERIFIED CORRECT

- Status: NOT AN ERROR - Code already uses `is_active = true`
- Location: today.rs:390
- No fix needed

### P0-B: Date Type Casting ✅ FIXED

- Status: FIXED in 3 locations
- habits_goals_repos.rs:88 - `completed_date = $2::date`
- habits_goals_repos.rs:133 - `completed_date = $2::date`
- quests_repos.rs:199 - `last_completed_date = $1::date`
- sync.rs:436 already had cast from previous commit
- Validation: cargo check = 0 errors

---

## 🔴 UNSOLVED ISSUES - Awaiting Decisions

---

**See DEBUGGING.md for P0 issue details and fixes applied.**

---

## PRIORITY P0: Session Termination on Invalid Sync (CRITICAL - SECURITY)

**Status**: Not yet implemented
**Requires Decision**: Middleware-based (Option A) or API client-based (Option B)?
**Phase**: 4 (DECISION) - Awaiting user selection

### Current State

**Location**: Auth session validation
**Status**: PARTIAL - Backend validates, frontend doesn't clear on 401

### Evidence

Backend auth middleware (`auth.rs`):

- Returns 401 when session invalid
- Doesn't send invalidation signal

Frontend (`AuthProvider.tsx`):

- Has `signOut()` function
- Uses cookies for auth
- No automatic wipeout on 401

### Root Cause

**TYPE**: Missing Security Feature

When backend session expires or is deleted:

1. Sync endpoint returns 401
2. Frontend catches error but doesn't react
3. User sees error state but session persists in memory
4. Stale data remains in sync state context
5. No localStorage/IndexedDB cleanup

**Security Risk**: Deleted backend session leaves frontend data exposed

### Impact

- **SEVERITY**: CRITICAL - Data leakage risk
- **SCOPE**: All users with expired sessions
- **USER EXPERIENCE**: Confusing error states
- **SECURITY IMPACT**: Stale data accessible after logout/session revoke

---

## 🔧 SOLUTION OPTIONS - Session Termination

### OPTION A: Centralized 401 Handler (Recommended)

**Effort**: 3-4 hours
**Risk**: LOW - Standard pattern

**Steps**:

1. Create global `apiClient` wrapper with interceptor
2. Check all responses for 401
3. On 401:
   - Call `clearAllClientData()` function
   - Clear sync state context
   - Clear localStorage (if any session data)
   - Clear IndexedDB (optional - audio is device-specific)
   - Call `signOut()` to clear cookies
   - Redirect to login with `?session_expired=true`
4. Add toast/notification: "Your session has expired"

**Pros**:

- Centralized logic (one place)
- Catches all 401s automatically
- Clean separation of concerns
- Standard security pattern
- Error notification jewel shows user

**Cons**:

- Need to wrap all API calls
- Risk of breaking existing fetch calls

---

### OPTION B: Per-Hook Validation

**Effort**: 6-8 hours
**Risk**: HIGH - Easy to miss hooks

**Steps**:

1. Update each API hook (useSync, useAuth, etc.)
2. Add 401 check in each error handler
3. Call cleanup + redirect
4. Duplicate logic across hooks

**Pros**:

- Granular control
- No global interceptor

**Cons**:

- Repetitive code
- Easy to forget hooks
- Maintenance nightmare
- Inconsistent behavior

---

### OPTION C: Sync Endpoint Only

**Effort**: 1 hour
**Risk**: MEDIUM - Incomplete coverage

**Steps**:

1. Add 401 handler only in `SyncStateContext`
2. Since sync polls every 30s, catches expired sessions eventually
3. Cleanup + redirect on sync 401

**Pros**:

- Quick fix
- Covers most cases (sync is frequent)

**Cons**:

- Doesn't catch 401 from other endpoints
- 30s delay before cleanup
- Incomplete solution

---

## 👤 YOUR SELECTION - Session Termination

**Preferred Option**: ____a_____
**Reason**: _______do__
**Acceptable Alternatives**: ____do_____

---

## PRIORITY P1: Plan My Day Generation Broken (CRITICAL)

**Status**: Not yet implemented
**Requires Decision**: Full generation (Option A), MVP (Option B), or disable (Option C)?
**Phase**: 4 (DECISION) - Awaiting user selection

### Current State

**Location**: Backend `DailyPlanRepo::generate()` implementation
**Status**: INCOMPLETE - Generate function returns empty plans

### Evidence

```rust
// app/backend/crates/api/src/db/platform_repos.rs:398
pub async fn generate(
    pool: &PgPool,
    user_id: Uuid,
    date: NaiveDate,
) -> Result<DailyPlanResponse, AppError> {
    let mut items: Vec<PlanItem> = vec![];
    // TODO: Actually generate items from:
    // - Active quests
    // - Scheduled workouts
    // - Due habits
    // - Learning items
  
    // Currently returns empty plan
```

### Root Cause

**TYPE**: Feature Not Implemented

Backend migration moved endpoint but didn't implement generation logic:

1. Old D1 version had generation logic
2. New Postgres backend has skeleton only
3. No queries to fetch active quests/habits/workouts
4. Returns empty `items` array

### Impact

- **SEVERITY**: CRITICAL - Core feature broken
- **SCOPE**: All users trying to generate daily plan
- **USER EXPERIENCE**: "Plan My Day" button does nothing useful
- **BUSINESS IMPACT**: Key workflow broken, reduces daily engagement

### Validation Requirements

When implemented (selected option):

- Error notification jewel shows if generation fails
- Returns actual items (not empty array)
- No TODO comments in production path

### Data Sources Needed

From schema.json v2.0.0:

- `quests` table: WHERE `status = 'active'` AND `user_id = ?`
- `habit_instances` table: WHERE `date = ?` AND `status = 'pending'`
- `workouts` table: WHERE scheduled for date (calendar integration)
- `learning_items` table: WHERE due/recommended for date

---

## 🔧 SOLUTION OPTIONS - Plan My Day

### OPTION A: Implement Full Generation Logic (Recommended)

**Effort**: 4-6 hours
**Risk**: MEDIUM - Multiple table queries

**Steps**:

1. Query active quests (limit 3)
2. Query pending habits for date
3. Query scheduled workouts (calendar_events)
4. Query recommended learning items
5. Add default focus session item
6. Build PlanItem array with priorities
7. Insert into `daily_plans.items` JSONB

**Pros**:

- Complete feature
- Follows product spec
- Supports all plan sources

**Cons**:

- Requires multiple queries
- Complex priority logic
- Needs transaction handling

---

### OPTION B: Simplified Generation (Quick Fix)

**Effort**: 2-3 hours
**Risk**: LOW - Limited scope

**Steps**:

1. Query only active quests (top 3)
2. Add default focus session
3. Return simple 4-item plan
4. Skip habits/workouts/learning for now

**Pros**:

- Quick to implement
- Low risk
- Core value delivered (quests + focus)

**Cons**:

- Incomplete feature
- Missing habits/workouts
- Not full product vision

---

### OPTION C: Manual Plan Entry Only

**Effort**: 0 hours
**Risk**: NONE - Feature disabled

**Steps**:

1. Remove "Generate" button from UI
2. Force users to manually add items
3. Document as "manual planning mode"

**Pros**:

- No backend work
- No risk of bugs

**Cons**:

- Poor UX
- Defeats purpose of feature
- Users expect generation

---

## 👤 YOUR SELECTION - Plan My Day

**Preferred Option**: A
**Reason**: _________
**Acceptable Alternatives**: _________

---

## PRIORITY P2: Onboarding Modal Not Rendering (HIGH)

**Status**: Disabled in code (intentionally, awaiting API format fix)
**Requires Decision**: Update modal props (Option A), transform API response (Option B), or rewrite (Option C)?
**Phase**: 4 (DECISION) - Awaiting user selection

### Current State

**Location**: `app/frontend/src/components/onboarding/OnboardingProvider.tsx` line 61-63
**Status**: DISABLED - Intentionally commented out during migration

### Evidence

```tsx
// TODO: The OnboardingModal component needs to be updated to work with
// the new API response format. For now, we'll skip rendering it.
// The modal expects: initialState, flow (with steps array), userId
// The API returns: state, flow (without steps), current_step, all_steps
console.log("Onboarding needed but modal temporarily disabled during migration");
return null;
```

### Root Cause

**TYPE**: API Contract Mismatch (Migration Incomplete)

Backend moved from D1 (frontend) to Postgres (backend), but:

1. **Old Modal Expects**:

   - `initialState`: UserOnboardingState
   - `flow`: OnboardingFlow with nested `steps` array
   - `userId`: string
2. **New API Returns**:

   - `state`: OnboardingState (flat)
   - `flow`: OnboardingFlow WITHOUT steps array
   - `current_step`: OnboardingStep (single)
   - `all_steps`: OnboardingStepSummary[] (separate array)

### Impact

- **SEVERITY**: HIGH - New users can't complete onboarding
- **SCOPE**: All new users, feature selection disabled
- **USER EXPERIENCE**: Users see no onboarding, miss feature customization
- **BUSINESS IMPACT**: Poor first-run experience, reduced engagement

### Validation Requirements

When implemented (selected option):

- Error notification jewel shows if modal load fails
- Modal fully renders (not null/placeholder)
- Feature selection persists after refresh

### Dependencies

- ✅ Backend API working (returns data)
- ✅ OnboardingModal component exists
- ❌ Modal props don't match API response

---

## 🔧 SOLUTION OPTIONS - Onboarding

### OPTION A: Update Modal Props (Recommended)

**Effort**: 2-3 hours
**Risk**: LOW - Type changes only

**Steps**:

1. Update `OnboardingModalProps` interface to match new API
2. Change `flow` prop to not expect nested `steps`
3. Add `current_step` and `all_steps` props
4. Update modal rendering logic to use `all_steps` array
5. Update step navigation to use `current_step`

**Pros**:

- Preserves existing modal logic
- Clean separation of data vs UI
- Easy to test

**Cons**:

- Requires modal refactor
- May need to update multiple render functions

---

### OPTION B: Transform API Response

**Effort**: 1 hour
**Risk**: MEDIUM - Data transformation complexity

**Steps**:

1. Keep modal props unchanged
2. In OnboardingProvider, transform API response:
   ```tsx
   const transformedFlow = {
     ...onboarding.flow,
     steps: onboarding.all_steps
   };
   ```
3. Pass transformed data to modal

**Pros**:

- Quick fix
- No modal changes
- Maintains backwards compatibility

**Cons**:

- Hacky solution
- Duplicates data structure
- Doesn't follow new API design

---

### OPTION C: Rewrite Modal for New API

**Effort**: 4-6 hours
**Risk**: MEDIUM - Full rewrite

**Steps**:

1. Redesign modal to consume flat API structure
2. Fetch steps on demand instead of nested
3. Update state management
4. Rewrite navigation logic

**Pros**:

- Future-proof design
- Better performance (no nested data)
- Cleaner architecture

**Cons**:

- Time-consuming
- Higher risk of regressions
- Requires extensive testing

---

## 👤 YOUR SELECTION - Onboarding

**Preferred Option**: C
**Reason**: _________
**Acceptable Alternatives**: _________

---

## PRIORITY P3: Create Focus Library Broken (HIGH)

**Status**: Frontend uses IndexedDB, backend has no R2 storage
**Requires Decision**: Add R2 upload (Option A), use reference library paradigm (Option B), or external links (Option C)?
**Phase**: 4 (DECISION) - Awaiting user selection

### Current State

**Location**: Focus library creation flow
**Status**: BACKEND WORKING, FRONTEND STORAGE ISSUES

### Evidence

Backend API works:

```typescript
// POST /api/focus/libraries
export async function createFocusLibrary(
  name: string,
  description?: string,
  libraryType: string = 'custom'
): Promise<FocusLibrary>
```

Frontend issue (from FocusTracks.tsx line 95):

```tsx
// DEPRECATED: localStorage-based library creation (2026-01-10)
// This should use backend API: POST /api/focus/libraries
// TODO: Implement track storage in focus libraries
setFocusLibrary(null); // Placeholder until backend track support
```

### Root Cause

**TYPE**: Migration Incomplete + Storage Gap

1. **Backend**: focus_libraries table exists, CRUD works
2. **Backend**: focus_library_tracks table exists but no track file storage
3. **Frontend**: Audio files stored in IndexedDB (client-side)
4. **Gap**: No R2 storage integration for tracks

Architecture mismatch:

- Reference library: Stores audio blobs in IndexedDB (client-side only)
- Focus library: Expects backend storage (R2) but only has metadata tables

### Impact

- **SEVERITY**: HIGH - Feature appears broken
- **SCOPE**: Users trying to add focus music
- **USER EXPERIENCE**: Can create library but can't add tracks
- **BUSINESS IMPACT**: Focus feature incomplete

### Validation Requirements

When implemented (selected option):

- Error notification jewel shows if track upload/storage fails
- Tracks fully playable (not placeholder)
- No TODO comments in production path

---

## 🔧 SOLUTION OPTIONS - Create Focus Library

### OPTION A: Add R2 Track Upload (Recommended)

**Effort**: 6-8 hours
**Risk**: MEDIUM - New R2 integration

**Steps**:

1. Create presigned URL endpoint for R2 uploads
2. Upload audio file to R2 from frontend
3. Store R2 key in `focus_library_tracks.track_url`
4. Add track download/streaming endpoint
5. Update frontend to use R2 URLs instead of IndexedDB

**Pros**:

- Proper backend storage
- Tracks sync across devices
- Scalable solution
- Aligns with architecture

**Cons**:

- Significant implementation time
- R2 costs for storage
- Need streaming infrastructure

---

### OPTION B: Use Reference Library Paradigm

**Effort**: 2 hours
**Risk**: LOW - Reuse existing code

**Steps**:

1. Keep audio files in IndexedDB (client-side)
2. Store only metadata in backend (library name, track titles)
3. Frontend manages audio blobs like ReferenceLibrary
4. Sync metadata via backend, blobs stay local

**Pros**:

- Quick implementation
- Reuses reference library code
- No R2 costs
- Offline-capable

**Cons**:

- Tracks don't sync across devices
- Duplicates storage approach
- Not scalable long-term

---

### OPTION C: YouTube/External Links Only

**Effort**: 1 hour
**Risk**: LOW - Minimal change

**Steps**:

1. Don't upload audio files
2. Store only YouTube URLs or external links
3. Use iframe/embed for playback
4. Backend stores URLs only

**Pros**:

- Simplest solution
- No storage costs
- Large music library access

**Cons**:

- Requires internet
- YouTube ToS issues
- No offline support
- Limited control

---

## 👤 YOUR SELECTION - Create Focus Library

**Preferred Option**: A and B
**Reason**: _________
**Acceptable Alternatives**: _________

---

## PRIORITY P4: Focus State Not Persisted in Sync (MEDIUM)

**Status**: Data flows from API but frontend doesn't cache it
**Requires Decision**: Add to sync state (Option A), keep separate + localStorage (Option B), or increase sync frequency (Option C)?
**Phase**: 4 (DECISION) - Awaiting user selection

### Current State

**Location**: Sync endpoint returns focus status, but frontend doesn't persist
**Status**: WORKING BUT INCOMPLETE - Data flows but not cached

### Evidence

Backend (`sync.rs`):

```rust
async fn fetch_focus_status(pool: &PgPool, user_id: Uuid) -> Result<FocusStatusData, AppError> {
    // Queries focus_sessions table
    // Returns: has_active_session, mode, time_remaining, expires_at
}
```

Frontend (`SyncStateContext.tsx`):

- **ISSUE**: Focus data comes in sync response but isn't stored in context
- No `focus` field in sync state
- Components query `/api/focus` directly instead of using sync cache

### Root Cause

**TYPE**: Incomplete Integration

Sync response includes focus data, but:

1. Frontend sync context doesn't have focus state field
2. Focus components bypass sync state (make direct API calls)
3. No memory persistence for focus session across page reloads
4. Duplicate queries (sync + component-level)

### Impact

- **SEVERITY**: MEDIUM - Feature works but inefficient
- **SCOPE**: Focus timer users
- **USER EXPERIENCE**: Extra API calls, potential flicker on reload
- **BUSINESS IMPACT**: Minor - increased server load

### Validation Requirements

When implemented (selected option):

- Focus state persists in memory across page reloads
- No extra API calls for focus status
- Error notification if sync/focus API fails

---

## 🔧 SOLUTION OPTIONS - Focus Persistence

### OPTION A: Add to Sync State (Recommended)

**Effort**: 2 hours
**Risk**: LOW - Additive change

**Steps**:

1. Add `focus: FocusStatusData | null` to SyncStateContext
2. Update `fetchPollData()` to set focus state
3. Update FocusIndicator to use `useSyncState()` instead of direct fetch
4. Update focus timer page to check sync state first

**Pros**:

- Single source of truth
- Reduces API calls
- Consistent with other sync data (badges, plan, user)

**Cons**:

- Need to update multiple components
- Sync interval (30s) might be too slow for timer

---

### OPTION B: Keep Separate + Add LocalStorage

**Effort**: 1 hour
**Risk**: LOW - Simple addition

**Steps**:

1. Add localStorage cache for focus session
2. Components check localStorage first
3. Fall back to API if stale
4. Update on focus start/end/pause

**Pros**:

- Quick fix
- Real-time updates
- No sync dependency

**Cons**:

- Duplicates data (sync + localStorage)
- Manual cache invalidation
- Not aligned with memory-only architecture

---

### OPTION C: Increase Sync Frequency for Focus

**Effort**: 30 minutes
**Risk**: MEDIUM - Performance impact

**Steps**:

1. When focus session active, reduce sync interval from 30s to 5s
2. Reset to 30s when session ends
3. Use conditional polling logic

**Pros**:

- Stays in sync state
- Real-time enough for timer
- No localStorage

**Cons**:

- Increased server load during focus
- Complex polling logic
- May affect other sync data freshness

---

## 👤 YOUR SELECTION - Focus Persistence

**Preferred Option**: A
**Reason**: _________
**Acceptable Alternatives**: _________

---

## PRIORITY P5: Zen Browser Transparency Issue (HIGH - BROWSER COMPATIBILITY)

**Status**: CSS compatibility issue with Zen-Nebula theme
**Requires Decision**: Add backdrop-filter support (Option A), Zen-specific detection (Option B), or document only (Option C)?
**Phase**: 4 (DECISION) - Awaiting user selection

### Current State

**Location**: Frontend CSS/styling
**Status**: Low/no transparency support on Zen Browser with Nebula theme

### Problem

- User reports low transparency support when using Zen Browser v3.3 with Nebula theme package
- Link: https://github.com/JustAdumbPrsn/Zen-Nebula/releases/tag/v3.3
- May be CSS variable inheritance or backdrop-filter support issue

### Impact

- **SEVERITY**: HIGH - Visual appearance only
- **SCOPE**: Zen Browser users with Nebula theme
- **USER EXPERIENCE**: Visual degradation (low opacity)
- **BUSINESS IMPACT**: Niche browser - low priority but should be trackable

### Validation Requirements

When implemented (selected option):

- Tested in Zen Browser v3.3 with Nebula theme
- All UI elements visible and interactive
- No error notifications needed (cosmetic issue)

---

## 🔧 SOLUTION OPTIONS - Zen Browser Transparency

### OPTION A: Add CSS Transparency Support (Recommended)

**Effort**: 1-2 hours
**Risk**: LOW - CSS-only changes

**Steps**:

1. Test app in Zen Browser with Nebula theme
2. Add backdrop-filter polyfill or fallback
3. Implement CSS variable overrides for transparency
4. Add Zen-specific media query support
5. Document tested configuration

**Pros**:

- Fixes transparency issue for Zen users
- No JS overhead
- Benefits other browsers too

**Cons**:

- Requires Zen Browser testing environment
- May have unexpected cascade effects

---

### OPTION B: Zen-Specific Detection

**Effort**: 1 hour
**Risk**: LOW - Conditional styling

**Steps**:

1. Detect Zen Browser via user-agent
2. Apply Zen-specific CSS overrides
3. Increase opacity/brightness on elements
4. Add feature detection for Nebula theme

**Pros**:

- Targeted fix
- Won't affect other browsers
- Easy to maintain

**Cons**:

- User-agent detection fragile
- Only helps Zen users

---

### OPTION C: Document and Track

**Effort**: 15 minutes
**Risk**: NONE - Documentation only

**Steps**:

1. Add note to README about Zen Browser compatibility
2. Create GitHub issue for future enhancement
3. Link to Zen-Nebula theme repository
4. Mark as "known limitation"

**Pros**:

- No development effort
- Transparent about limitations
- Community can contribute

**Cons**:

- Doesn't fix for users
- Niche issue remains

---

## 👤 YOUR SELECTION - Zen Browser Transparency

**Preferred Option**: A
**Reason**: _________
**Acceptable Alternatives**: _________

---

## 📊 PRIORITY MATRIX & EXECUTION ORDER

See [DEBUGGING.md](DEBUGGING.md) for detailed implementation plan and execution order.

**Summary**:

| Issue                    | Priority     | Effort | Risk   | Impact                     |
| ------------------------ | ------------ | ------ | ------ | -------------------------- |
| Session Termination      | **P0** | 3-4h   | LOW    | CRITICAL (Security)        |
| Plan My Day              | **P1** | 4-6h   | MEDIUM | CRITICAL (Core Feature)    |
| Onboarding               | **P2** | 2-3h   | LOW    | HIGH (First-run UX)        |
| Focus Persistence        | **P4** | 2h     | LOW    | MEDIUM (Optimization)      |
| Create Focus Library     | **P3** | 6-8h   | MEDIUM | HIGH (Enhancement)         |
| Zen Browser Transparency | **P5** | 1-2h   | LOW    | HIGH (Niche Compatibility) |

---

## 📋 YOUR FINAL SELECTIONS

**AFTER reviewing all solution options above, enter your selections below**:

1. **P0 - Session Termination**: Option _____ (Reason: _______)
2. **P1 - Plan My Day**: Option _____ (Reason: _______)
3. **P2 - Onboarding**: Option _____ (Reason: _______)
4. **P3 - Create Focus Library**: Option _____ (Reason: _______)
5. **P4 - Focus Persistence**: Option _____ (Reason: _______)
6. **P5 - Zen Browser**: Option _____ (Reason: _______)

**Execution Timeline**: _____________________

---

## ✅ VALIDATION CHECKLIST

Before implementation of each issue:

- [ ] Option selected and documented above
- [ ] Rationale clearly stated
- [ ] Dependencies identified
- [ ] Lint/test plan defined (per `.github/instructions/DEBUGGING.instructions.md`)
- [ ] Schema.json v2.0.0 reviewed for all data models
- [ ] Backend compilation validated before frontend changes
- [ ] Frontend lint validation before commit
- [ ] Error notification jewel shows for all error paths
- [ ] No placeholder code in production paths

---

## 📚 REFERENCE DOCUMENTS

- **Instructions**: [`.github/instructions/DEBUGGING.instructions.md`](../../.github/instructions/DEBUGGING.instructions.md)
- **Detailed Analysis**: [DEBUGGING.md](DEBUGGING.md)
- **Schema Authority**: `schema.json` v2.0.0
- **Architecture**: `.github/copilot-instructions.md`
- **Migration**: `agent/COMPREHENSIVE_REBUILD_PLAN.md`
