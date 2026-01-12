# DEBUGGING - Active Issues & Solutions

**Generated**: 2026-01-11  
**Updated**: 2026-01-11 22:35 - PRODUCTION EMERGENCY  
**Status**: 🚨 CRITICAL PRODUCTION ERRORS - IMMEDIATE ACTION REQUIRED  
**Previous Fixes**: See `debug_log/2026-01-11_schema_sync_fixes.md`

---

## 🚨 PRODUCTION EMERGENCY - IMMEDIATE FIXES REQUIRED

### User Impact: FROZEN LOADING SCREEN
**Time**: 2026-01-11 22:32:00 UTC  
**User**: jvetere1999@gmail.com  
**Symptoms**: App freezes on loading screen due to multiple 500 errors

---

## 🟢 P0 CRITICAL ERRORS - FIXED

### P0-A: habits.archived Column Missing ✅ VERIFIED CORRECT
**Status**: NOT AN ERROR - Code uses `is_active = true` (correct schema)
**Location**: `app/backend/crates/api/src/routes/today.rs:390`
**Code**: `WHERE h.user_id = $1 AND h.is_active = true`
**Resolution**: No fix needed - schema is correct

---

### P0-B: Date Type Casting Error ✅ FIXED
**Status**: FIXED in 3 locations
**Fixes Applied**:
1. ✅ habits_goals_repos.rs:88 - `completed_date = $2::date`
2. ✅ habits_goals_repos.rs:133 - `completed_date = $2::date`
3. ✅ quests_repos.rs:199 - `last_completed_date = $1::date`
4. ✅ sync.rs:436 already had `::date` cast (from previous commit)

**Validation**: cargo check = 0 errors
**Ready**: Yes, ready for push

---

### P0-3: Zen Browser Transparency Issue
**Category**: HIGH - UX/Compatibility  
**Current State**: App opaque when Zen-Nebula theme expects transparency  
**Location**: Frontend CSS

**Problem**:
- Zen Browser (Firefox-based) with Zen-Nebula v3.3 theme
- Theme modifies window transparency
- App uses solid backgrounds, no backdrop-filter support

**Action**: See SOLUTION_SELECTION.md Section: "Zen Browser Transparency"

---

## IMMEDIATE EXECUTION PLAN

### Step 1: Fix habits.archived (10 minutes)
```bash
cd /Users/Shared/passion-os-next/app/backend

# Fix the query
# In crates/api/src/routes/today.rs line 390:
# Change: h.archived = false
# To:     h.is_active = true

# Check for other instances
rg "\.archived" crates/api/src/routes/

# Compile
cargo check --bin ignition-api
```

### Step 2: Verify Date Fix Deployment (5 minutes)
```bash
# Check deployment status
flyctl releases --app ignition-api

# Check last deploy time (should match our commit)
git log --oneline -1 app/backend/

# If timestamps don't match: redeploy needed
```

### Step 3: Deploy Backend (10 minutes)
```bash
cd app/backend
flyctl deploy

# Wait for deployment
flyctl logs --app ignition-api
```

### Step 4: Verify Fix (5 minutes)
```bash
# Load app in browser
# Check for 500 errors in console
# Verify loading screen completes
# Check sync endpoint works

curl -v https://api.ecent.online/sync/poll \
  -H "Cookie: session=YOUR_SESSION" \
  | jq
```

---

## REQUIRED CONTEXT INSTRUCTIONS

Before making ANY changes to this codebase:
1. Document all changes in DEBUGGING.md with clear categories
2. List complete change set in chat message
3. Run lint tests on all modified files
4. Update DEBUGGING.md with test results
5. Wait for explicit approval before executing
6. Commit with detailed changelog

---

## ✅ COMPLETED FIXES - 2026-01-11

### Date Type Casting - FIXED
- ✅ habits_goals_repos.rs:88 - `completed_date = $2::date`
- ✅ habits_goals_repos.rs:133 - `completed_date = $2::date`
- ✅ quests_repos.rs:199 - `last_completed_date = $1::date`
- All files compiled: 0 errors
- All linting passed: 0 new errors

### Previously Fixed
- ✅ sync.rs:436 already has `::date` cast (in previous commit)
- ✅ today.rs uses `is_active = true` (not `archived`)
- ✅ Admin API Test Tool completed and integrated

**Status**: Ready for push

---

## 🔴 UNSOLVED ISSUES - Awaiting Decisions

### Priority P0: Session Termination on Invalid Sync (CRITICAL - SECURITY)
**Status**: Not yet implemented  
**Requires Decision**: Middleware-based (Option A) or API client-based (Option B)?  
**See**: SOLUTION_SELECTION.md Section "Session Termination"

---

### Priority P1: Plan My Day Generation Broken (CRITICAL)
**Status**: Not yet implemented  
**Requires Decision**: Full generation (Option A), MVP (Option B), or disable (Option C)?  
**See**: SOLUTION_SELECTION.md Section "Plan My Day"

---

### Priority P2: Onboarding Modal Not Rendering (HIGH)
**Status**: Disabled in code (intentionally, awaiting API format fix)  
**Requires Decision**: Update modal props (Option A), transform API response (Option B), or rewrite (Option C)?  
**See**: SOLUTION_SELECTION.md Section "Onboarding"

---

### Priority P3: Create Focus Library Broken (HIGH)
**Status**: Frontend uses IndexedDB, backend has no R2 storage  
**Requires Decision**: Add R2 upload (Option A), use reference library paradigm (Option B), or external links (Option C)?  
**See**: SOLUTION_SELECTION.md Section "Create Focus Library"

---

### Priority P4: Focus State Not Persisted in Sync (MEDIUM)
**Status**: Data flows from API but frontend doesn't cache it  
**Requires Decision**: Add to sync state (Option A), keep separate + localStorage (Option B), or increase sync frequency (Option C)?  
**See**: SOLUTION_SELECTION.md Section "Focus Persistence"

---

### Priority P3: Zen Browser Transparency Issue (HIGH)
**Status**: CSS compatibility issue with Zen-Nebula theme  
**Requires Decision**: Add backdrop-filter support (Option A), Zen-specific detection (Option B), or document only (Option C)?  
**See**: SOLUTION_SELECTION.md Section "Zen Browser Transparency"

---

## � PRODUCTION CRITICAL ISSUES (Discovered 2026-01-11 22:32)

### Priority P0-A: habits.archived Column Error (BLOCKING PROD)
**Category**: CRITICAL - Production Broken  
**Current State**: Backend queries non-existent column, 500 error  
**Location**: `app/backend/crates/api/src/routes/today.rs:395`

**Problem**:
```
ERROR: column h.archived does not exist
```

Backend code queries `h.archived = false` but schema v2.0.0 defines `is_active` (not `archived`).

**Evidence from Logs**:
```
22:32:01 {"message":"Database error (legacy)","error.message":"error returned from database: column h.archived does not exist"}
22:32:01 {"message":"response failed","classification":"Status code: 500 Internal Server Error","latency":"749 ms"}
```

**Schema Authority** (schema.json v2.0.0, habits table):
- ✅ HAS: `is_active` (BOOLEAN, NOT NULL)
- ❌ NO: `archived` field

**Impact**:
- BLOCKING: /today endpoint returns 500
- User sees frozen loading screen
- Cannot access dashboard

**See SOLUTION_SELECTION.md Section: "Production Critical - habits.archived" for options**

---

### Priority P0-B: Date Casting Still Broken (BLOCKING PROD)
**Category**: CRITICAL - Production Broken  
**Current State**: Missing ::date cast in sync endpoint causing 500 errors  
**Location**: `app/backend/crates/api/src/routes/sync.rs:436`

**Problem**:
```
ERROR: operator does not exist: date = text
```

The January 11 schema fix addressed SOME date casting issues (sync.rs line 324, today.rs lines 165, 259) but MISSED line 436 in sync.rs.

**Evidence from Logs**:
```
22:32:01 {"message":"Database error (legacy)","error.message":"error returned from database: operator does not exist: date = text"}
22:32:01 {"message":"response failed","classification":"Status code: 500 Internal Server Error","latency":"542 ms"}
```

**Code Analysis**:
- ✅ FIXED: sync.rs line 324 `WHERE date = $2::date`
- ✅ FIXED: today.rs line 165 `WHERE date = $2::date`
- ✅ FIXED: today.rs line 259 `WHERE date = $2::date`
- ❌ MISSED: sync.rs line 436 `AND hc.completed_date = $2` (NO CAST)

**Impact**:
- BLOCKING: /sync endpoint returns 500
- Sync polling fails every 30 seconds
- Badge counts don't update
- Habit completion check broken

**See SOLUTION_SELECTION.md Section: "Production Critical - Date Casting" for options**

---

### Priority P0-C: Zen Browser Transparency Issue (INFORMATIONAL)
**Category**: INFORMATIONAL - Browser Compatibility  
**Current State**: Low/no transparency support on Zen Browser with Nebula theme  
**Location**: Frontend CSS/styling

**Problem**:
- User reports low transparency support when using Zen Browser v3.3 with Nebula theme package
- Link: https://github.com/JustAdumbPrsn/Zen-Nebula/releases/tag/v3.3
- May be CSS variable inheritance or backdrop-filter support issue

**Impact**:
- COSMETIC: Visual appearance only
- Does not block functionality
- Zen Browser is niche (Firefox fork)

**Analysis Needed**:
- Test app in Zen Browser with Nebula theme
- Check backdrop-filter CSS support
- Verify CSS variable cascade
- May require Zen-specific media query or user-agent detection

**See SOLUTION_SELECTION.md Section: "Zen Browser Transparency" for options**

---

## �📝 IGNITIONS NOTE (Low Impact - Informational)

**Category**: INFORMATIONAL - Design Working As Intended  
**Current State**: Ignitions (suggested actions) seem low impact when aligned with current state  
**Location**: Today dashboard ignition system

**Analysis**:
- System is working correctly per design
- Ignitions provide contextual suggestions based on user state
- "Low impact" feeling when suggestions match what user already knows
- This is expected behavior: smart suggestions shouldn't surprise, should confirm

**Action**: NO BUG - Design review might consider more proactive suggestions

---

## 🎯 IMPLEMENTATION PLAN

### Phase 1: Security + Critical Bugs (Day 1)
**Priority**: P0, P1  
**Duration**: ~8 hours

1. **Session Termination** (P0) - 3-4 hours
   - Implement centralized 401 handler
   - Clear sync state + localStorage + cookies on 401
   - Redirect to login with session_expired flag

2. **Plan My Day Generation** (P1) - 4-6 hours
   - Implement full generation logic OR simplified version
   - Query active quests, habits, workouts, learning
   - Build PlanItem array with priorities

### Phase 2: UX Improvements (Day 2)
**Priority**: P2, P4  
**Duration**: ~5 hours

3. **Onboarding Modal** (P2) - 2-3 hours
   - Update modal props to match new API
   - OR transform API response for backwards compatibility

4. **Focus Persistence** (P4) - 2 hours
   - Add focus state to SyncStateContext
   - Update components to use sync state

### Phase 3: Enhancements (Days 3-4)
**Priority**: P3  
**Duration**: ~8 hours

5. **Focus Library Tracks** (P3) - 6-8 hours
   - Add R2 upload integration
   - OR keep IndexedDB with metadata sync
   - OR external link support only

---

## ✅ PRE-EXECUTION CHECKLIST

Before starting any implementation:

- [ ] **Read** `SOLUTION_SELECTION.md` completely
- [ ] **Select** preferred solution option for each issue
- [ ] **Document** selections in SOLUTION_SELECTION.md
- [ ] **Confirm** execution order with stakeholder
- [ ] **Verify** schema.json v2.0.0 is current authority
- [ ] **Check** no uncommitted changes in repo

---

## 🧪 TESTING PLAN

### Session Termination Testing
- [ ] Delete session in backend (admin panel or DB)
- [ ] Verify frontend detects 401 on next sync poll
- [ ] Confirm all client data cleared (sync state, cookies)
- [ ] Verify redirect to login with message
- [ ] Test multiple tabs (all should clear)

### Plan My Day Testing
- [ ] Generate plan with active quests
- [ ] Verify items from: quests, habits, workouts, learning
- [ ] Check priority ordering
- [ ] Test with no active items (should add focus only)
- [ ] Verify JSONB storage in daily_plans table

### Onboarding Testing
- [ ] Create test user (or reset onboarding state)
- [ ] Verify modal appears on first login
- [ ] Complete feature selection flow
- [ ] Verify choices saved to backend
- [ ] Refresh page, modal should NOT reappear

### Focus Library Testing
- [ ] Create new focus library
- [ ] Add track (upload OR link OR IndexedDB)
- [ ] Verify track playable
- [ ] Check persistence across sessions
- [ ] Test delete library + tracks

### Focus Persistence Testing
- [ ] Start focus session
- [ ] Refresh page
- [ ] Verify timer state shows correctly
- [ ] Check sync state includes focus data
- [ ] No duplicate API calls for focus status

---

## 📊 VALIDATION REQUIREMENTS

### Backend Validation
```bash
cd app/backend
cargo check --bin ignition-api
cargo test --bin ignition-api
```
**Requirements**:
- ✅ Zero compilation errors
- ✅ Warnings acceptable (unused imports, dead code)
- ✅ Tests pass (if applicable)

### Frontend Validation
```bash
cd app/frontend
npm run lint
npm run type-check
```
**Requirements**:
- ✅ Zero ESLint errors
- ✅ Warnings acceptable (unused vars, missing deps)
- ✅ Zero TypeScript errors

### Integration Testing
```bash
# From repo root
npm run test:api
```
**Requirements**:
- ✅ All auth tests pass
- ✅ Sync endpoint tests pass
- ✅ Daily plan tests pass

---

## 🚀 DEPLOYMENT CHECKLIST

After all fixes implemented and tested:

- [ ] All backend lint passed
- [ ] All frontend lint passed
- [ ] Manual testing completed
- [ ] Git staged all changes
- [ ] Created comprehensive commit message
- [ ] Pushed to production branch
- [ ] Monitored Fly.io deployment logs
- [ ] Verified frontend deployment (Cloudflare Workers)
- [ ] Smoke test production endpoints
- [ ] Move DEBUGGING.md to debug_log with timestamp
- [ ] Update CURRENT_STATE.md

---

## 📚 RELATED DOCUMENTATION

- **Schema Authority**: `schema.json` v2.0.0
- **Completed Fixes**: `debug_log/2026-01-11_schema_sync_fixes.md`
- **Solution Selection**: `SOLUTION_SELECTION.md`
- **Architecture**: `.github/copilot-instructions.md`
- **Migration Plan**: `agent/COMPREHENSIVE_REBUILD_PLAN.md`

---

## 🆘 ROLLBACK PLAN

If critical issues arise after deployment:

### Option 1: Revert Commit
```bash
git revert HEAD
git push origin production
```

### Option 2: Rollback Specific Feature
- Identify failing feature (session termination, plan generation, etc.)
- Git revert only that commit
- Deploy hotfix

### Option 3: Full Rollback
- Revert to last known good commit
- Redeploy backend + frontend
- Investigate issues offline

---

## 💡 DECISION LOG

**Schema Authority**: schema.json v2.0.0 (2026-01-10)  
**Migration Approach**: Fix backend to match schema (schema is truth)  
**Storage Strategy**: Memory-only for UI optimization data (no localStorage for sync state)  
**Authentication**: Backend session cookies + 401 on expiry  
**Data Flow**: Backend Postgres → API → Frontend sync state → Components

---

## NOTES

- Ignitions comment noted but no action needed (working as designed)
- All priorities based on security risk + user impact + implementation effort
- Session termination is P0 due to data leakage security risk
- Plan My Day is P1 due to core feature being completely broken
- Focus library can be phased (P3) since workaround exists (reference library)


---

## Summary of Changes by Category

### CRITICAL (Blocking TOS issue):
- [ ] Fix `inbox_items.is_read` → `is_processed` (sync.rs + models)
- [ ] Fix `daily_plans` queries (use JSONB, not count columns)
- [ ] Remove `daily_plan_items` table references
- [ ] Fix date type casting
- [ ] Add session validation guards on protected routes

### HIGH (Feature Completeness):
- [ ] Add TOS state to sync response
- [ ] Update TOS modal to use sync state
- [ ] Test session redirect on expired auth

### MEDIUM (Performance/UX):
- [ ] Cache user profile in sync state
- [ ] Add feature flags to sync
- [ ] Add theme to sync

---

## Testing Plan

**Phase 1 - Lint Check**:
1. Run ESLint on frontend changes
2. Run Rust build check on backend changes
3. Verify no type errors

**Phase 2 - Schema Validation**:
1. Verify migration matches schema.json
2. Verify generated types match both
3. Run test queries against schema

**Phase 3 - Integration**:
1. Test TOS flow (accept, refresh, verify state)
2. Test session expiry (should redirect)
3. Test sync endpoint (should return 200, not 500)
4. Test badge counts (should update from sync)
5. Test user profile (should persist on refresh)

---

## Execution Order

1. **Fix schema mismatches** (critical path)
   - Update backend queries in sync.rs
   - Test sync endpoint responds correctly
   - Verify no 500 errors

2. **Add TOS to sync state** 
   - Update sync response to include tos_accepted
   - Update SyncStateContext to track TOS
   - Update TOSModal to check sync state

3. **Add session validation**
   - Add checks in (app) layout
   - Add middleware redirects
   - Test unauthenticated access

4. **Optimize profile/flags caching**
   - Add to sync response
   - Update context

5. **Test full flow**
   - User logs in
   - Accepts TOS
   - Refreshes page
   - TOS modal doesn't reappear
   - All sync data persists in memory

---

## Risk Assessment

**High Risk**:
- Changing schema queries could break if JSONB parsing fails
- Mitigation: Add error handling and fallback values

**Medium Risk**:
- Adding fields to sync response could cause slowdown
- Mitigation: Keep response minimal, cache at client

**Low Risk**:
- Adding session validation guard
- Mitigation: Clear error messages for debugging

---

## Rollback Plan

If sync endpoint changes cause issues:
1. Revert backend route changes
2. Fall back to fetching separate endpoints
3. Use error state to handle missing data gracefully
