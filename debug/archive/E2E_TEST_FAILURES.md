# E2E Test Failures - Session 4 Late

**Date**: 2026-01-12  
**Status**: 🔴 CRITICAL - 7 backend bugs blocking mutations  
**Phase**: Phase 2 DOCUMENT → Phase 3 EXPLORER → Phase 4 DECISION

---

## Summary

E2E workflow tests revealed **7 critical bugs** in mutation endpoints (POST/PATCH/DELETE).

- ✅ GET requests (reads) working fine: 13 tests pass
- ❌ POST/PATCH requests (writes) failing: 7 tests fail
- **Root cause**: Backend handlers returning 500 or 4xx instead of 2xx success codes

---

## Bug Details

### Bug 1: POST /api/habits - Wrong Status Code
**Test**: `tests/e2e-workflow.spec.ts:100` - Daily Habits  
**Expected**: HTTP 201 Created  
**Received**: HTTP 200 OK  
**Payload**: `{ name: 'E2E Test Habit', description: '...', frequency: 'daily' }`  
**Issue**: Handler exists but returns wrong status code

### Bug 2: POST /api/focus/pause - Internal Server Error
**Test**: `tests/e2e-workflow.spec.ts:184` - Focus Session  
**Expected**: HTTP 200 OK  
**Received**: HTTP 500 Internal Server Error  
**Payload**: No body (state change only)  
**Issue**: Unhandled exception when pausing session (likely session not found or state validation)

### Bug 3: DELETE /api/focus/pause - Internal Server Error  
**Test**: `tests/e2e-workflow.spec.ts:191` - Focus Session  
**Expected**: HTTP 200 OK  
**Received**: HTTP 500 Internal Server Error  
**Payload**: No body (state change only)  
**Issue**: Unhandled exception when resuming session

### Bug 4: PATCH /api/settings - Internal Server Error
**Test**: `tests/e2e-workflow.spec.ts:261` - Settings  
**Expected**: HTTP 200 OK  
**Received**: HTTP 500 Internal Server Error  
**Payload**: `{ theme: 'dark', locale: 'en' }`  
**Issue**: Request format mismatch or database constraint violation

### Bug 5: POST /api/exercise - Internal Server Error
**Test**: `tests/e2e-workflow.spec.ts:326` - Exercise Tracking  
**Expected**: HTTP 201 Created  
**Received**: HTTP 500 Internal Server Error  
**Payload**: `{ name: 'E2E Test Workout', duration_minutes: 30 }`  
**Issue**: POST handler missing or validation error

### Bug 6: POST /api/books - Internal Server Error
**Test**: `tests/e2e-workflow.spec.ts:356` - Reading List  
**Expected**: HTTP 200/201  
**Received**: HTTP 500 Internal Server Error  
**Payload**: `{ title: 'E2E Test Book', author: 'Test Author' }`  
**Issue**: POST handler missing or validation error

### Bug 7: POST /api/ideas - Internal Server Error
**Test**: `tests/e2e-workflow.spec.ts:404` - Ideas  
**Expected**: HTTP 200/201  
**Received**: HTTP 500 Internal Server Error  
**Payload**: `{ title: 'E2E Test Idea', description: 'A brilliant idea' }`  
**Issue**: POST handler missing or validation error

---

## Root Causes (Hypothesis)

**Category 1: 500 Internal Server Errors (5 bugs)**
- Unhandled exception in handler or middleware
- Likely causes:
  - Request payload format mismatch with validation struct
  - Missing database column or constraint violation
  - Unimplemented feature returning panic
  - CSRF dev bypass not working for POST requests
  - Serialization error in response

**Category 2: Wrong Status Code (1 bug)**
- Handler logic exists but returns wrong HTTP status
- Habits endpoint returns 200 instead of 201
- Likely cause: Handler not calling proper response builder

**Category 3: Not Found (1 bug)**  
- GET /api/sync/session returns 404
- Likely cause: Route not registered or endpoint not implemented

---

## Overlap with API Response Format Tests

These same bugs appear in `tests/api-response-format.spec.ts`:
- 26/34 tests passing (76%)
- Same 7 bugs causing 8 failures (some tests check multiple scenarios)

---

## Decision Required

### Option A: Fix Backend (RECOMMENDED)
**Approach**: Fix the actual bugs in backend handlers

**Tasks**:
1. Fix POST /api/habits to return 201 instead of 200
2. Fix POST /api/focus/pause - investigate 500 error
3. Fix DELETE /api/focus/pause - investigate 500 error
4. Fix PATCH /api/settings - check request format and validation
5. Fix POST /api/exercise - ensure POST handler exists and works
6. Fix POST /api/books - ensure POST handler exists and works
7. Fix POST /api/ideas - ensure POST handler exists and works
8. Verify GET /api/sync/session is routed correctly or implement if missing

**Effort**: 2-3 hours  
**Risk**: Low (straightforward endpoint fixes)  
**Benefit**: Fixes real bugs blocking users from creating/updating data  
**Impact**: App becomes functional for mutations

### Option B: Skip Failing Tests
**Approach**: Mark failing tests with `.skip()` and come back later

**Effort**: 10 minutes  
**Risk**: High (hides bugs, false sense of progress)  
**Benefit**: Quick win on test count  
**Impact**: Bugs remain in production

### Option C: Modify Tests to Accept Errors
**Approach**: Change test expectations to accept 500 responses

**Effort**: 15 minutes  
**Risk**: Very high (masks real bugs)  
**Benefit**: All tests pass artificially  
**Impact**: Zero - bugs still exist, users still blocked

---

## Recommendation

**Select Option A**

Rationale:
- These bugs prevent core functionality (create habits, start focus, save settings, etc.)
- Tests are correctly identifying real issues
- POST/PATCH endpoints MUST work for app to be usable
- Fixing now prevents data loss bugs in production

---

## Investigation Checklist

Files to investigate:
- [ ] `app/backend/crates/api/src/routes/habits.rs` - POST handler status code
- [ ] `app/backend/crates/api/src/routes/focus.rs` - pause/resume endpoints
- [ ] `app/backend/crates/api/src/routes/settings.rs` - PATCH handler and validation
- [ ] `app/backend/crates/api/src/routes/sync.rs` - /session endpoint
- [ ] `app/backend/crates/api/src/routes/exercise.rs` - POST handler
- [ ] `app/backend/crates/api/src/routes/books.rs` - POST handler  
- [ ] `app/backend/crates/api/src/routes/ideas.rs` - POST handler
- [ ] `app/backend/crates/api/src/middleware/csrf.rs` - Dev bypass for POST/PATCH
- [ ] Request validation structs in each handler
- [ ] Response serialization in each handler

---

## Next Steps

1. **User selects fix approach** (recommend Option A)
2. **Phase 3 EXPLORER**: Search codebase for missing handlers
3. **Phase 5 FIX**: Implement fixes for each bug
4. **Validation**: Re-run tests to verify all 7 bugs fixed
5. **Phase 6 USER PUSHES**: User pushes changes to production

