# DEBUGGING - Comprehensive Change Plan

**Generated**: 2026-01-11  
**Status**: LISTING PHASE - All changes documented before execution  
**Execution**: Awaiting approval. Lint test will run before any code changes.

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

## ALL PLANNED CHANGES BY CATEGORY

### Schema/Database Changes (Level: CRITICAL)
**Must be done FIRST - affects all dependent code**

## 1. Session Validation & Routing Issues

### 1.1 Missing Session Validation on Protected Routes
**Category**: CRITICAL - Security/UX  
**Current State**: Inner site routes are accessible without session check  
**Location**: `app/frontend/src/app/(app)` - all routes

**Problem**:
- User without valid session can see protected pages (will just show blank/error state)
- No immediate redirect to login when session expires
- Middleware doesn't enforce session presence

**Required Changes**:
1. Create session validation guard in `(app)/layout.tsx`
2. Check `useAuth()` hook and redirect to login if not authenticated
3. Add middleware check in `middleware.ts` for auth routes
4. Show loading state while validating session

**Files to Modify**:
- `app/frontend/src/app/(app)/layout.tsx` - Add session guard
- `app/frontend/src/middleware.ts` - Add auth redirect logic
- `app/frontend/src/lib/auth/AuthProvider.tsx` - Enhance session check

---

## 2. TOS State Persistence & Sync Integration

### 2.1 TOS State Not Maintained on Refresh
**Category**: HIGH - Feature Completeness  
**Current State**: TOS acceptance is in DB but not reflected in memory on page reload  
**Location**: TOS modal component + auth context

**Problem**:
- TOS accepted status is saved to DB via backend
- But on page refresh, frontend doesn't know user accepted
- Modal reappears because sync endpoint fails (500 error)
- Root cause: sync endpoint queries broken schema

**Root Cause** (from previous analysis):
- Sync endpoint queries `inbox_items.is_read` (doesn't exist, should be `is_processed`)
- Sync endpoint queries `daily_plans.completed_count` (doesn't exist, only has `items` JSONB)
- These failures prevent sync data from loading, so TOS state isn't refreshed

**Required Changes**:
1. Fix schema mismatches in sync endpoint (detailed in section 3)
2. Add `tos_accepted` flag to sync poll response
3. Store TOS state in memory state (similar to progress/badges)
4. Update auth context to reflect TOS state after sync
5. Hide TOS modal if `tos_accepted === true`

**Files to Modify**:
- `app/backend/crates/api/src/routes/sync.rs` - Add TOS to poll response + fix queries
- `app/frontend/src/lib/sync/SyncStateContext.tsx` - Add TOS state field
- `app/frontend/src/lib/auth/AuthProvider.tsx` - Use TOS from sync state
- `app/frontend/src/components/onboarding/TOSModal.tsx` - Check sync state for TOS

---

## 3. Schema Synchronization - CRITICAL

### 3.1 inbox_items.is_read Column Missing
**Category**: CRITICAL - Data Model  
**Source**: Desync between backend code and migration  
**Location**: 
- Backend query: `app/backend/crates/api/src/routes/sync.rs` line 349
- Migration: `app/backend/migrations/0001_schema.sql` (correct)
- Schema: `tools/schema-generator/schema.json` (correct)

**Current State**:
- Migration creates: `inbox_items` table with `is_processed` (boolean) column
- Backend code queries: `is_read` column (doesn't exist)
- Schema.json defines: `is_processed` column ✓

**Decision**: Use schema.json as authoritative (optimal feature set)

**Changes Needed**:
1. Update backend query from `is_read` to `is_processed`
2. Update backend models in `db/inbox_models.rs` to use `is_processed`

**Files to Modify**:
- `app/backend/crates/api/src/routes/sync.rs` - Line 349
- `app/backend/crates/api/src/routes/today.rs` - Any queries using `is_read`
- `app/backend/crates/api/src/db/inbox_models.rs` - Field name

---

### 3.2 daily_plans.completed_count / total_count Columns Missing  
**Category**: CRITICAL - Data Model  
**Source**: Desync between backend code and migration  
**Location**:
- Backend query: `app/backend/crates/api/src/routes/sync.rs` line 288-297
- Migration: `app/backend/migrations/0001_schema.sql` (correct)
- Schema: `tools/schema-generator/schema.json` (correct)

**Current State**:
- Migration creates: `daily_plans` table with only `items` (JSONB) for items storage
- Backend code queries: `completed_count`, `total_count` (don't exist)
- Schema.json defines: `items` JSONB array only ✓

**Decision**: Parse counts from JSONB items array (schema.json is authoritative)

**Changes Needed**:
1. Change query from selecting count columns to selecting `items` JSONB
2. Parse `items` array in Rust to count: total items and completed items
3. Calculate percent from parsed values

**Files to Modify**:
- `app/backend/crates/api/src/routes/sync.rs` - Lines 288-297, also update `fetch_plan_status`
- Update type signatures to work with JSONB parsing

---

### 3.3 daily_plan_items Table Missing
**Category**: CRITICAL - Data Model  
**Source**: Desync between backend code and schema design  
**Location**:
- Backend query: `app/backend/crates/api/src/routes/today.rs` lines 167, 256
- Migration: Not defined (doesn't exist) ✓
- Schema: Not defined (doesn't exist) ✓

**Current State**:
- Migration does NOT create this table
- Backend code queries: `SELECT id, items FROM daily_plan_items`
- Schema.json does NOT define this table
- Items are stored as JSONB array in `daily_plans.items`

**Decision**: Items exist only in `daily_plans.items` JSONB (schema.json is correct)

**Changes Needed**:
1. Remove queries from `daily_plan_items` table
2. Use `daily_plans.items` JSONB instead
3. Parse item array in Rust or return JSONB to frontend

**Files to Modify**:
- `app/backend/crates/api/src/routes/today.rs` - Lines 167, 256
- Update query logic to use daily_plans directly

---

### 3.4 Type Casting Issue: date = text
**Category**: HIGH - Runtime Error  
**Location**: `app/backend/crates/api/src/routes/sync.rs` line 295
**Current State**: Date comparison without type cast causes operator error

**Problem**:
```rust
.bind(&today)  // String "2026-01-11"
// But column is DATE type
// Need: date = $2::date
```

**Changes Needed**:
1. Add explicit cast in SQL: `WHERE user_id = $1 AND date = $2::date`

**Files to Modify**:
- `app/backend/crates/api/src/routes/sync.rs` - All date comparisons

---

## 4. User Profile State Persistence

### 4.1 User Profile Not Updated on Refresh
**Category**: MEDIUM - Feature Completeness  
**Current State**: User profile (name, email, image) not cached, requires backend hit

**Problem**:
- User profile retrieved at auth time but not cached
- On refresh, profile is re-fetched from auth endpoint
- Could be cached in memory like sync state for performance

**Required Changes**:
1. Add user profile to sync state context
2. Fetch user profile in sync poll response
3. Cache profile in memory (not localStorage)
4. Update on refresh

**Files to Modify**:
- `app/backend/crates/api/src/routes/sync.rs` - Add user profile to poll response
- `app/frontend/src/lib/sync/SyncStateContext.tsx` - Add profile field
- `app/frontend/src/lib/auth/AuthProvider.tsx` - Use synced profile

---

## 5. Theme/Feature Flags State Persistence

### 5.1 Feature Flags & Theme Not Maintained on Refresh
**Category**: MEDIUM - Feature Completeness  
**Current State**: Feature flags and theme settings not synced

**Problem**:
- Feature flags loaded but not cached
- Theme preference not synced with backend
- No consistency across browser sessions

**Required Changes**:
1. Add feature flags to sync poll response
2. Add theme preference to sync poll response
3. Store in sync state context (memory only)
4. Update auth context when theme changes

**Files to Modify**:
- `app/backend/crates/api/src/routes/sync.rs` - Add flags and theme
- `app/frontend/src/lib/sync/SyncStateContext.tsx` - Add fields
- `app/frontend/src/lib/theme/index.ts` - Sync with state

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
