# Debug Log - Schema Synchronization Fixes

**Date**: 2026-01-11  
**Status**: COMPLETED ✅  
**Category**: Schema Desynchronization, TOS Persistence, Session Security

---

## Issues Fixed

### 1. inbox_items.is_read → is_processed (CRITICAL)
**Problem**: Backend queries `is_read` column that doesn't exist in schema  
**Root Cause**: Backend code written for old schema, migration uses new schema v2.0.0  
**Solution Applied**:
- Updated `app/backend/crates/api/src/db/inbox_models.rs`: Changed `is_read` to `is_processed`
- Updated `app/backend/crates/api/src/db/inbox_repos.rs`: Query uses `is_processed`
- Updated `app/backend/crates/api/src/routes/sync.rs`: Badge count query uses `is_processed`

**Validation**: Backend compiles successfully, no schema mismatch errors

---

### 2. daily_plans Count Columns Missing (CRITICAL)
**Problem**: Backend queries `completed_count`, `total_count` columns that don't exist  
**Root Cause**: Schema v2.0.0 stores items as JSONB array, not separate columns  
**Solution Applied**:
- Updated `app/backend/crates/api/src/routes/sync.rs` `fetch_plan_status()`:
  - Changed query from selecting count columns to selecting `items` JSONB
  - Added JSONB parsing: `serde_json::from_value::<Vec<_>>(items_json)`
  - Calculate counts by iterating items and checking `completed` field
- Updated `app/backend/crates/api/src/routes/today.rs` `fetch_user_state()`:
  - Parse items JSONB to count completed vs total
- Updated `app/backend/crates/api/src/routes/today.rs` `fetch_plan_summary()`:
  - Parse items JSONB for plan summary

**Validation**: Backend compiles successfully, JSONB parsing implemented with fallbacks

---

### 3. daily_plan_items Table Missing (CRITICAL)
**Problem**: Backend queries `daily_plan_items` table that doesn't exist  
**Root Cause**: Schema v2.0.0 stores items inline in `daily_plans.items` JSONB  
**Solution Applied**:
- Updated `app/backend/crates/api/src/routes/today.rs`:
  - Removed JOIN to `daily_plan_items`
  - Query `daily_plans.items` directly
  - Parse JSONB array for item details

**Validation**: Backend compiles successfully, no references to non-existent table

---

### 4. Date Type Casting Error (HIGH)
**Problem**: `operator does not exist: date = text` error  
**Root Cause**: Passing string to DATE column without explicit cast  
**Solution Applied**:
- Updated all date queries in `sync.rs` and `today.rs` to use `::date` cast:
  - `WHERE date = $1::date` instead of `WHERE date = $1`

**Validation**: Type casting explicit, no operator errors

---

### 5. TOS Modal Reappearing After Refresh (HIGH)
**Problem**: TOS modal shows again after accepting and refreshing page  
**Root Cause**: Sync endpoint returned 500 (due to schema issues above), preventing TOS state from loading  
**Solution Applied**:
- Added `UserData` to sync response with `tos_accepted` field
- Added `fetch_user_data()` to backend sync endpoint
- Updated frontend `SyncStateContext` to include `user` state
- Updated `TOSModal` to check `user.tos_accepted` from sync state
- Added loading state while sync initializes

**Validation**: Modal hides when `tos_accepted === true`, shows loading during initialization

---

### 6. Missing Session Guard (CRITICAL - Security)
**Problem**: Protected routes accessible without authentication  
**Root Cause**: No session validation in app layout  
**Solution Applied**:
- Updated `app/frontend/src/app/(app)/layout.tsx`:
  - Made component client-side ("use client")
  - Added `useAuth()` hook
  - Redirect to login if `!isAuthenticated && !isLoading`
  - Return null while checking/redirecting

**Validation**: Frontend lints pass, session guard implemented

---

## Files Modified

**Backend**:
- `app/backend/crates/api/src/routes/sync.rs` - User data, query fixes, JSONB parsing
- `app/backend/crates/api/src/routes/today.rs` - JSONB parsing for plan items
- `app/backend/crates/api/src/db/inbox_models.rs` - is_processed field
- `app/backend/crates/api/src/db/inbox_repos.rs` - is_processed query

**Frontend**:
- `app/frontend/src/lib/api/sync.ts` - UserData type, PollResponse update
- `app/frontend/src/lib/sync/SyncStateContext.tsx` - User state management
- `app/frontend/src/components/shell/TOSModal.tsx` - Loading + sync state check
- `app/frontend/src/components/shell/TOSModal.module.css` - Loading animations
- `app/frontend/src/app/(app)/layout.tsx` - Session guard

---

## Test Results

✅ **Backend Lint**: `cargo check --bin ignition-api` - Compiles successfully (217 warnings, 0 errors)  
✅ **Frontend Lint**: `npm run lint` - Pass (warnings only, no errors)  
✅ **Schema Consistency**: Migration matches schema.json v2.0.0  

---

## Lessons Learned

1. **Always check migration vs backend code**: Schema v2.0.0 was correct but backend wasn't updated
2. **JSONB is authoritative**: When schema uses JSONB, parse it - don't expect denormalized columns
3. **Type casting matters**: PostgreSQL is strict - always cast when types don't match exactly
4. **Sync state for UI optimization**: User profile/TOS cached in memory prevents redundant fetches

---

## Rollback Instructions

If issues arise:
1. Revert commits related to schema fixes
2. Backend will fail on schema mismatches (expected)
3. Must either fix forward or rollback migration to match old code
