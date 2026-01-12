# PHASE 7 - PRODUCTION RUNTIME ERRORS 🔴

**Date**: 2026-01-12 01:09 UTC  
**Status**: 🔴 **ACTIVE INVESTIGATION - DO NOT FIX**  
**Severity**: CRITICAL - App stuck loading after login  
**Environment**: Production (api.ecent.online, ignition.ecent.online)  
**Deployment**: P0-P5 implementations pushed and deployed  

---

## Error Summary

### Errors Observed
1. **500 - API Errors** (Database failures)
   - `/api/onboarding` → 500
   - `/api/sync/poll` → 500 (recurring, 721ms, repeating every 30s)
   - `/api/today` → 500

2. **404 - Not Found**
   - `/api/focus/active` → 404

3. **Symptoms**
   - App stuck on loading after login
   - SyncState polling failing repeatedly
   - "Database error" message repeated
   - CSS preload warnings (minor)

---

## Error Timeline

```
2026-01-12T01:09:16.657Z - /api/onboarding fails (500)
2026-01-12T01:09:16.800Z - /api/sync/poll fails (500) - "Database error"
2026-01-12T01:09:17.189Z - /api/today fails (500)
2026-01-12T01:09:47.014Z - /api/sync/poll repeats (500) - 30s poll interval
```

---

## Endpoints with Issues

### 🔴 500 Errors - Likely Database/Connection Issues

1. **`GET /api/onboarding`**
   - Source: P2 implementation (onboarding modal disabled)
   - Expected: Return onboarding state (or empty/null if disabled)
   - Actual: 500 Database error

2. **`GET /api/sync/poll`**
   - Source: P4 implementation (SyncStateContext refactored)
   - Expected: Return poll data (habits, quests, focus, etc.)
   - Actual: 500 Database error (critical - blocks entire app)
   - Polling: Every 30s, failing repeatedly

3. **`GET /api/today`**
   - Source: Core feature (Today page)
   - Expected: Return daily data
   - Actual: 500 Database error

### 🔴 404 Error - Missing Endpoint

1. **`GET /api/focus/active`**
   - Source: P3 or P4 implementation
   - Expected: Return active focus session
   - Actual: 404 Not Found (endpoint may not exist)

---

## Investigation Status

### Pending Discovery
- [ ] Check backend logs for database connection errors
- [ ] Verify database migrations applied correctly
- [ ] Check if new P3 endpoints registered properly
- [ ] Verify API route definitions for /api/focus/active
- [ ] Check PostgreSQL connection status
- [ ] Review changes made in P0-P5 that touch these endpoints
- [ ] Check if any breaking schema changes introduced

### Known Deployments
- Frontend: Deployed via GitHub Actions → Cloudflare Workers ✅
- Admin: Deployed via GitHub Actions → Cloudflare Workers ✅
- Backend: Should have been deployed via Fly.io

### Questions to Answer
1. Was backend deployed with P0-P5 changes?
2. Did database migrations run?
3. Are all P0-P5 endpoint changes backward compatible?
4. Is `/api/focus/active` endpoint supposed to exist?

---

## Code Locations to Investigate

### Backend Endpoints
- [ ] `app/backend/crates/api/src/routes/onboarding.rs` - P2 changes
- [ ] `app/backend/crates/api/src/routes/sync.rs` - P0/P4 changes
- [ ] `app/backend/crates/api/src/routes/today.rs` - Check for breakage
- [ ] `app/backend/crates/api/src/routes/focus.rs` - P3 changes (missing endpoint?)

### Frontend Integration Points
- [ ] `app/frontend/src/lib/api/client.ts` - P0 401 handler might interfere
- [ ] `app/frontend/src/lib/sync/SyncStateContext.tsx` - P4 polling logic
- [ ] `app/frontend/src/components/onboarding/OnboardingProvider.tsx` - P2 disabled modal

---

## Investigation Findings

### ✅ Routes Verified to Exist

1. **`/api/focus/active`** 
   - ✅ Defined in `app/backend/crates/api/src/routes/focus.rs` (line 144)
   - ✅ Handler: `async fn get_active()`
   - ✅ Method: GET with User auth
   - ✅ Returns: `ActiveResponse` with session and pause state
   - **Status**: Route exists, 404 suggests routing issue or middleware blocking

2. **`/api/onboarding`**
   - ✅ Defined in `app/backend/crates/api/src/routes/onboarding.rs` (line 66)
   - ✅ Handler: `async fn get_onboarding()`
   - ✅ Method: GET with User auth
   - ✅ Calls: `OnboardingRepo::get_full_state()` (database query)
   - **Status**: Route exists, 500 suggests database error

3. **`/api/sync/poll`**
   - ✅ Defined in `app/backend/crates/api/src/routes/sync.rs` (line 130)
   - ✅ Handler: `async fn poll_all()` 
   - ✅ Method: GET with AuthContext
   - ✅ Parallel queries: `tokio::try_join!()` with 5 fetch functions
   - **Status**: Route exists, 500 suggests database error in one of 5 fetch functions

### 📊 Routes Making Database Calls (Sync Poll)

All 5 functions called in parallel via `tokio::try_join!()`:

1. **`fetch_progress()`** (line 217)
   - Query: user_progress, user_wallet, user_streaks (LEFT JOINs)
   - Tables: users, user_progress, user_wallet, user_streaks
   - Returns: level, total_xp, coins, streak_days

2. **`fetch_badges()`** (line 262)
   - Calls 4 sub-functions in parallel
   - May query: inbox, quests, habits tables

3. **`fetch_focus_status()`** (line 279)
   - Query: active focus session data

4. **`fetch_plan_status()`** (line 316)
   - Query: daily plan completion data

5. **`fetch_user_data()`** (line 370)
   - Query: user profile, theme, settings

### 🔴 Suspected Root Causes

**Database Connection/Query Failures**:
- Multiple tables referenced in `fetch_progress()`: user_progress, user_wallet, user_streaks
- If any query fails, entire poll_all() fails (500 error)
- Repeated 500 every 30s suggests consistent database issue

**Missing Tables or Schema**:
- user_progress table might not exist
- user_wallet table might not exist  
- user_streaks table might not exist
- Schema migration may not have run

**API Route Registration**:
- `/api/focus/active` returns 404 but route exists in code
- Suggests route not registered in api.rs or middleware blocking request
- Check `app/backend/crates/api/src/routes/api.rs` for focus route registration

### 📋 Code Locations Needing Backend Logs

1. **Database Error Source**:
   - Check backend logs for full error message (not just 500)
   - See which table/query is failing in sync.rs fetch functions
   - Verify database connection is active

2. **404 Error Source**:
   - Check if `/api/focus/active` route registered in main api router
   - Check middleware or auth guards blocking route
   - Verify route path matches expected `/api/focus/active`

3. **Onboarding Query Issue**:
   - Check if `OnboardingRepo::get_full_state()` has database issue
   - Verify onboarding tables exist and have correct schema

---

## Next Investigation Steps

### Required Information (Pending)
- [ ] Backend error logs showing full database error messages
- [ ] Database connection status (is PostgreSQL accessible?)
- [ ] Schema migration status (did migrations apply correctly?)
- [ ] Route registration in `app/backend/crates/api/src/routes/api.rs`

### 📋 Code to Check (Do Not Fix)
- [ ] `app/backend/crates/api/src/routes/api.rs` - focus route registration
   - ✅ Verified: `/focus` routes registered at line 21
   - ✅ Verified: `/onboarding` routes registered at line 47
   - ✅ Verified: `/sync` routes registered at line 64
   - ✅ Verified: `/today` routes registered at line 69
   - Conclusion: Routes ARE registered, 404 suggests auth/middleware/proxy issue
- [ ] Migration files for user_progress, user_wallet, user_streaks tables
- [ ] AppError enum to understand error messages
- [ ] Backend startup logs for connection errors

---
