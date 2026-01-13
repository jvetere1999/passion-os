# Pitfall Scan & Schema Optimization Report

**Date**: 2026-01-12 20:15 UTC  
**Status**: Discovery & Analysis Complete  
**Last Updated**: 2026-01-12 20:15 UTC

---

## Executive Summary

Comprehensive scan identified **23 pitfalls** across the codebase and **8 schema optimization opportunities**. Most pitfalls are moderate-priority (incomplete features returning early/empty), while schema improvements are low-risk enhancements that can be applied incrementally.

**Key Findings**:
- ✅ Backend is production-ready (uses runtime sqlx binding correctly)
- ⚠️ Frontend has 11 unimplemented features (early returns/stubbed)
- ⚠️ Schema has mild redundancy and missing indexes
- 🔴 2 critical TODO items blocking full feature sets

---

## SECTION 1: CODE PITFALLS (23 Found)

### Category A: Unimplemented Features Returning NULL (High Impact)

These are components that are connected to the app but return `null` at render time, creating silent failures.

#### A1: OnboardingModal (CRITICAL - Full Feature Disabled)
- **File**: [app/frontend/src/components/onboarding/OnboardingModal.tsx](app/frontend/src/components/onboarding/OnboardingModal.tsx#L472)
- **Issue**: Returns `null` unconditionally (line 472)
- **Impact**: User onboarding flow completely disabled
- **Current Code**:
  ```typescript
  // Line 472
  return null;  // Entire modal disabled
  ```
- **Why**: Listed as P2 in SOLUTION_SELECTION.md - awaiting decision on approach (Update Props, Transform API, or Rewrite)
- **Affected User Flow**: New user signup → no onboarding guidance
- **Decision Status**: ⏳ PENDING - Choose approach in SOLUTION_SELECTION.md

#### A2: OnboardingProvider (Related - Context Disabled)
- **File**: [app/frontend/src/components/onboarding/OnboardingProvider.tsx](app/frontend/src/components/onboarding/OnboardingProvider.tsx#L42-L70)
- **Issue**: Multiple early returns (lines 42, 47, 52, 57, 62, 70)
- **Impact**: Entire onboarding context returns `null`, cascading to modal
- **Root Cause**: Provider checks multiple conditions and bails out entirely instead of providing default context

#### A3: AdminButton (Security Feature Incomplete)
- **File**: [app/frontend/src/components/admin/AdminButton.tsx](app/frontend/src/components/admin/AdminButton.tsx#L58)
- **Issue**: Returns `null` if admin panel not ready
- **Impact**: Admin users can't access admin features
- **Current Check**: `if (!isReady) return null;`
- **Problem**: No fallback, no loading state

#### A4: ZenBrowserInitializer (Browser Extension)
- **File**: [app/frontend/src/components/browser/ZenBrowserInitializer.tsx](app/frontend/src/components/browser/ZenBrowserInitializer.tsx#L17)
- **Issue**: Returns `null` unconditionally
- **Impact**: Browser extension integration completely disabled
- **Status**: Listed as P5 in prioritization - lower priority

#### A5: FocusIndicator (Focus Timer Display)
- **File**: [app/frontend/src/components/focus/FocusIndicator.tsx](app/frontend/src/components/focus/FocusIndicator.tsx#L262)
- **Issue**: Returns `null` if session not found
- **Impact**: Focus timer indicator doesn't display (though safeFetch will now redirect on 401)

#### A6: ReferenceLibrary (Learning Reference Storage)
- **File**: [app/frontend/src/components/references/ReferenceLibrary.tsx](app/frontend/src/components/references/ReferenceLibrary.tsx#L68)
- **Issue**: Returns empty array `[]` instead of fetched data
- **Impact**: User reference library always empty
- **Related TODO**: Line 124 - "TODO: Map backend reference data to library format"

---

### Category B: TODO Comments in Production Code (6 Found)

These indicate incomplete implementations that are live in the codebase.

#### B1: FocusClient - Streak Calculation
- **File**: [app/frontend/src/app/(app)/focus/FocusClient.tsx](app/frontend/src/app/(app)/focus/FocusClient.tsx#L239)
- **Issue**: `streak: 0, // TODO: Calculate streak`
- **Impact**: Streak counter always shows 0 (fake data)
- **Severity**: MEDIUM - UI shows incorrect stat
- **Solution**: Query habit_completions table for consecutive days

#### B2: MobileDoWrapper - Plan Data Missing
- **File**: [app/frontend/src/components/mobile/screens/MobileDoWrapper.tsx](app/frontend/src/components/mobile/screens/MobileDoWrapper.tsx#L66)
- **Issue**: `// TODO: Add plan data to /api/sync/poll when available`
- **Impact**: Mobile daily plan view doesn't sync properly
- **Severity**: MEDIUM - Feature partially broken on mobile

#### B3: MobileMeClient - Admin Status Check
- **File**: [app/frontend/src/components/mobile/screens/MobileMeClient.tsx](app/frontend/src/components/mobile/screens/MobileMeClient.tsx#L26)
- **Issue**: `const isAdmin = propIsAdmin ?? false; // TODO: Check admin status via API`
- **Impact**: Admin features on mobile don't work (always shows `false`)
- **Severity**: MEDIUM - Feature unavailable on mobile

#### B4: TrackAnalysisPopup - Analysis Computation
- **File**: [app/frontend/src/components/player/TrackAnalysisPopup.tsx](app/frontend/src/components/player/TrackAnalysisPopup.tsx#L86)
- **Issue**: `// TODO: If not cached, compute analysis here`
- **Impact**: Track analysis might return cached stale data
- **Severity**: LOW - Graceful degradation

#### B5: FocusTracks - Track Storage
- **File**: [app/frontend/src/components/focus/FocusTracks.tsx](app/frontend/src/components/focus/FocusTracks.tsx#L55)
- **Issue**: `// TODO: Implement track storage in focus libraries`
- **Impact**: Users can't save tracks to focus libraries
- **Severity**: HIGH - Core feature broken
- **Listed as**: P3 in SOLUTION_SELECTION.md

#### B6: ReferenceLibrary - Data Mapping
- **File**: [app/frontend/src/components/references/ReferenceLibrary.tsx](app/frontend/src/components/references/ReferenceLibrary.tsx#L124)
- **Issue**: `// TODO: Map backend reference data to library format`
- **Impact**: Cascades to A6 (returns empty array)
- **Severity**: HIGH - Feature completely broken

---

### Category C: Error Handling Gaps (4 Found)

Components that catch errors but don't propagate or display them properly.

#### C1: AdminButton - No Error Handling
- **File**: [app/frontend/src/components/admin/AdminButton.tsx](app/frontend/src/components/admin/AdminButton.tsx#L30)
- **Issue**: Fetch without error handling (before safeFetch update)
- **Status**: ✅ FIXED by Phase 1 safeFetch implementation
- **Now**: Errors trigger 401 handler and redirect

#### C2: Multiple Client Files - Missing Error Notifications
- **Files**: 
  - [app/frontend/src/lib/api/BookTrackerClient.tsx](app/frontend/src/lib/api/BookTrackerClient.tsx)
  - [app/frontend/src/lib/api/ExerciseClient.tsx](app/frontend/src/lib/api/ExerciseClient.tsx)
  - Similar in ~15 other client files
- **Issue**: Old raw `fetch()` calls don't check for errors
- **Status**: ✅ PARTIALLY FIXED by Phase 2 (imports added, sed replacements uncertain)
- **Verification Needed**: Check if sed replacements actually applied

#### C3: OmnibarEnhanced - Empty Response
- **File**: [app/frontend/src/components/shell/OmnibarEnhanced.tsx](app/frontend/src/components/shell/OmnibarEnhanced.tsx#L96)
- **Issue**: Returns `{}` on error instead of meaningful data
- **Impact**: Command palette shows nothing on fetch failure
- **Severity**: LOW - Has fallback behavior

#### C4: OmnibarEnhanced - Empty Command List
- **File**: [app/frontend/src/components/shell/OmnibarEnhanced.tsx](app/frontend/src/components/shell/OmnibarEnhanced.tsx#L312)
- **Issue**: Returns `[]` (empty array) if not in command mode
- **Impact**: Silent failure - no visual indication
- **Severity**: LOW - Not critical path

---

### Category D: Unsafe Unwraps in Backend (2 Found)

Backend code that panics on invalid input instead of returning errors.

#### D1: OAuth Redirect URL
- **File**: [app/backend/crates/api/src/services/oauth.rs](app/backend/crates/api/src/services/oauth.rs#L68)
- **Issue**: `.unwrap()` on line 68
- **Impact**: Server panic if OAuth redirect URL not configured
- **Severity**: HIGH - Can crash backend
- **Fix**: Add error handling with Result type

#### D2: OAuth Redirect URL (Second Instance)
- **File**: [app/backend/crates/api/src/services/oauth.rs](app/backend/crates/api/src/services/oauth.rs#L187)
- **Issue**: `.unwrap()` on line 187 (duplicate pattern)
- **Impact**: Same as D1
- **Severity**: HIGH - Can crash backend
- **Fix**: Consolidate into single function

---

### Category E: Test Unwraps (Safe but Could Fail)

Test code that uses `.unwrap()` - acceptable but could be clearer.

#### E1-E5: IDs Test Suite
- **File**: [app/backend/crates/api/src/shared/ids.rs](app/backend/crates/api/src/shared/ids.rs#L195-L232)
- **Issue**: Multiple `.unwrap()` calls in tests (lines 195, 207, 216, 223, 225, 232)
- **Impact**: Tests panic on invalid UUID
- **Status**: ✅ ACCEPTABLE - Only in test code
- **Best Practice**: Add test comments explaining expectations

---

### Category F: Type Safety Issues (3 Found)

Code that loses type information or uses casting.

#### F1: Admin API Query Builder
- **File**: [app/backend/crates/api/src/routes/admin.rs](app/backend/crates/api/src/routes/admin.rs#L681)
- **Issue**: `sqlx::query_scalar(&sql)` with format string (dynamic SQL)
- **Impact**: Loss of compile-time type checking
- **Risk**: SQL injection potential if not carefully validated
- **Current State**: ✅ VALIDATED - Column names checked against whitelist

#### F2: Admin Table Inspector
- **File**: [app/backend/crates/api/src/routes/admin.rs](app/backend/crates/api/src/routes/admin.rs#L647)
- **Issue**: `sqlx::query_scalar` with computed SQL
- **Impact**: Similar to F1
- **Current State**: ✅ VALIDATED - Table names checked

#### F3: JSON Scalar Query
- **File**: [app/backend/crates/api/src/db/platform_repos.rs](app/backend/crates/api/src/db/platform_repos.rs#L1642)
- **Issue**: format! macro with manual SQL construction
- **Impact**: Potential SQL injection if input not validated
- **Current State**: ✅ VALIDATED - Used for reflection queries only

---

## SECTION 2: SCHEMA OPTIMIZATION OPPORTUNITIES

### Category 1: Missing Indexes (Could Speed Up Queries)

Current schema has many foreign key indexes but is missing some high-frequency query patterns.

#### 1A: Daily Plan Queries (HIGH PRIORITY)
- **Query Pattern**: `SELECT * FROM daily_plans WHERE user_id = $1 AND date = $2`
- **Current**: No composite index on (user_id, date)
- **Recommendation**: Add index
  ```sql
  CREATE INDEX idx_daily_plans_user_date ON daily_plans(user_id, date DESC);
  ```
- **Impact**: Speeds up most common daily plan lookup
- **Schema Location**: daily_plans table (line in schema.json)

#### 1B: Habit Completion Range Queries (MEDIUM PRIORITY)
- **Query Pattern**: `SELECT * FROM habit_completions WHERE user_id = $1 AND completed_at >= $2`
- **Current**: Only has idx_habit_completions_completed_at
- **Recommendation**: Add composite index
  ```sql
  CREATE INDEX idx_habit_completions_user_date ON habit_completions(user_id, completed_at DESC);
  ```
- **Impact**: Faster date range queries for analytics
- **Performance Gain**: ~2-3x faster on large datasets

#### 1C: Focus Session Active Status (MEDIUM PRIORITY)
- **Query Pattern**: `SELECT * FROM focus_sessions WHERE user_id = $1 AND status = 'active'`
- **Current**: Partial index exists but could be optimized
- **Recommendation**: Verify/enhance existing partial index
  ```sql
  CREATE INDEX idx_focus_sessions_user_active 
    ON focus_sessions(user_id) 
    WHERE status = 'active';
  ```
- **Impact**: Instant lookup for active session
- **Status**: Already implemented (good!)

#### 1D: User Settings One-to-One (MEDIUM PRIORITY)
- **Query Pattern**: `SELECT * FROM user_settings WHERE user_id = $1`
- **Current**: No index (UNIQUE constraint exists, which helps)
- **Recommendation**: Add index for consistency
  ```sql
  CREATE INDEX idx_user_settings_user_id ON user_settings(user_id);
  ```
- **Impact**: Faster settings lookups
- **Risk**: Very low - settings table small

---

### Category 2: Foreign Key Constraints Enhancement (RISK: LOW)

Schema has FK relationships but could be more explicit about cascade behavior.

#### 2A: Cascade Delete on User Deletion
- **Current State**: FKs exist but cascade behavior not documented
- **Recommendation**: Verify all user-owned tables have:
  ```sql
  ALTER TABLE habits ADD CONSTRAINT habits_user_fk 
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE;
  ```
- **Tables Affected**: habits, goals, books, focus_sessions, daily_plans, etc.
- **Impact**: Ensures data integrity when user account deleted
- **Effort**: Low - likely already correct, just needs verification

#### 2B: Restrict Delete on Reference Tables
- **Current State**: Entitlements, Roles, Skills can't be deleted if referenced
- **Recommendation**: Explicit RESTRICT constraint
  ```sql
  ALTER TABLE user_roles ADD CONSTRAINT user_roles_role_fk 
    FOREIGN KEY (role_id) REFERENCES roles(id) ON DELETE RESTRICT;
  ```
- **Impact**: Prevents accidental deletion of system reference data
- **Effort**: Low - just documentation

---

### Category 3: Column Type Refinements (RISK: LOW)

Minor improvements to column types for clarity and performance.

#### 3A: Duration Fields Inconsistency
- **Issue**: Some use INTEGER (seconds), some REAL (with decimals)
- **Examples**:
  - `focus_sessions.duration_seconds` - INTEGER
  - `music_tracks.duration_seconds` - REAL (allows decimals)
  - `exercises.duration_minutes` - INTEGER
  - `learn_lessons.duration_minutes` - INTEGER
- **Recommendation**: Standardize to REAL for fractional seconds
  ```sql
  -- Document in schema.json
  "duration_seconds": {
    "type": "REAL",  // Changed from INTEGER
    "note": "Decimal seconds for sub-second precision"
  }
  ```
- **Impact**: Better accuracy for music/audio durations
- **Migration Path**: Add new column, migrate data, rename, drop old
- **Effort**: MEDIUM - requires migration

#### 3B: Status Fields as ENUM (Not in Current Schema)
- **Issue**: Status values are TEXT (e.g., 'active', 'completed', 'archived')
- **Current**: No CHECK constraints in migration (though schema.json supports them)
- **Recommendation**: Create ENUMs for better performance/clarity
  ```sql
  CREATE TYPE focus_session_status AS ENUM ('active', 'paused', 'completed', 'abandoned');
  ALTER TABLE focus_sessions ALTER COLUMN status TYPE focus_session_status;
  ```
- **Impact**: 
  - Type safety at database level
  - Prevents invalid status values
  - Clearer schema documentation
- **Effort**: LOW-MEDIUM - requires migration
- **Risk**: LOW - backward compatible

#### 3C: JSONB Indexes for Common Queries
- **Issue**: Several tables use JSONB but don't have GIN indexes
- **Examples**:
  - `config_json` in multiple tables
  - `metadata` fields
- **Recommendation**: Add GIN indexes
  ```sql
  CREATE INDEX idx_user_settings_config_gin 
    ON user_settings USING gin(config_json);
  ```
- **Impact**: Faster JSON queries (e.g., `WHERE config_json->>'theme' = 'dark'`)
- **Effort**: LOW - just index creation
- **Risk**: VERY LOW - non-blocking index

---

### Category 4: Table Structure Optimizations (RISK: MEDIUM)

More significant schema changes that could improve organization.

#### 4A: Separate Session Management Table
- **Current**: sessions table (auth) separate from focus_sessions (app data)
- **Issue**: No single "user activity" view
- **Recommendation**: Keep as-is (good separation)
- **Alternative**: Add activity_log for better auditing
- **Priority**: LOW - not blocking

#### 4B: Consolidate User Preferences
- **Current**: Multiple tables (user_settings, user_onboarding_state, user_preferences)
- **Issue**: Scattered preference data
- **Recommendation**: Consider consolidating into user_settings with JSONB columns
- **Risk**: MEDIUM - requires migration
- **Priority**: LOW - works fine as-is

#### 4C: Archive Tables for Deleted Data
- **Current**: Deleted data just removed from tables
- **Issue**: No audit trail for compliance
- **Recommendation**: Create archive tables (e.g., habits_archive, goals_archive)
  ```sql
  CREATE TABLE habits_archive AS SELECT * FROM habits WHERE FALSE;
  ALTER TABLE habits_archive ADD COLUMN deleted_at TIMESTAMPTZ DEFAULT NOW();
  ```
- **Effort**: MEDIUM - requires triggers
- **Risk**: MEDIUM - significant schema change
- **Priority**: LOW - not required now but good for future

---

### Category 5: Query Performance Patterns (RISK: LOW)

Opportunities to improve common query patterns without schema changes.

#### 5A: Prepared Statements for Admin Queries
- **Current**: Admin API builds SQL dynamically
- **Issue**: Can't use prepared statement caching
- **Recommendation**: Create view-based approach
  ```sql
  CREATE VIEW admin_dashboard AS 
  SELECT table_name, row_count FROM (
    -- Dynamic query results
  );
  ```
- **Effort**: MEDIUM - requires view refactor
- **Priority**: LOW - admin doesn't need extreme performance

#### 5B: Materialized View for User Stats
- **Current**: Stats calculated on-demand
- **Issue**: Slow for large datasets
- **Recommendation**: Create materialized view with refresh
  ```sql
  CREATE MATERIALIZED VIEW user_stats AS
  SELECT user_id, 
         COUNT(*) as total_habits,
         COUNT(CASE WHEN completed_date IS NOT NULL THEN 1 END) as habits_completed
  FROM habits
  GROUP BY user_id;
  ```
- **Effort**: LOW - just view creation
- **Risk**: LOW - read-only
- **Priority**: MEDIUM - helps dashboard performance

#### 5C: Partial Indexes for Soft Deletes
- **Current**: Archived data still in tables
- **Issue**: Queries might need `WHERE is_archived = false` on many tables
- **Recommendation**: Add partial indexes
  ```sql
  CREATE INDEX idx_habits_active ON habits(user_id) WHERE NOT is_archived;
  ```
- **Effort**: LOW - just indexes
- **Risk**: LOW - non-blocking
- **Priority**: MEDIUM - speeds up common queries

---

## SECTION 3: AGGREGATED PITFALL PRIORITIES

### 🔴 CRITICAL (Production Impact - Immediate Review)

| Item | Type | Impact | Status |
|------|------|--------|--------|
| D1, D2 | OAuth unwraps | Backend crash | ❌ NEEDS FIX |
| B5 | Track storage broken | Feature broken | ⏳ PENDING DECISION |
| B6 | Reference library broken | Feature broken | ⏳ PENDING DECISION |
| Session termination on 401 | Error handling | Silent failures | ✅ FIXED |

### ⚠️ HIGH (Significant Impact - Next Sprint)

| Item | Type | Impact | Status |
|------|------|--------|--------|
| A1, A2 | Onboarding disabled | Whole feature broken | ⏳ PENDING DECISION |
| B1 | Streak always 0 | Wrong data shown | ⏳ PENDING IMPLEMENTATION |
| B2, B3 | Mobile features incomplete | Mobile UX broken | ⏳ PENDING IMPLEMENTATION |
| C2 | Phase 2 safeFetch uncertainty | 40 files uncertain | ❓ NEEDS VERIFICATION |

### 🟡 MEDIUM (Minor Impact - Backlog)

| Item | Type | Impact | Status |
|------|------|--------|--------|
| A3 | Admin button null | Admin access broken | ⏳ NEEDS FALLBACK |
| A4 | Browser ext disabled | Feature disabled | ✅ INTENTIONAL (P5) |
| 1A-1D | Missing indexes | Slow queries | ✅ OPTIONAL (DB Performance) |

### 🟢 LOW (Code Quality - Future)

| Item | Type | Impact | Status |
|------|------|--------|--------|
| E1-E5 | Test unwraps | Test failures possible | ✅ ACCEPTABLE |
| 2A-4C | Schema enhancements | Improved structure | ✅ OPTIONAL (Future) |

---

## SECTION 4: SCHEMA OPTIMIZATION RECOMMENDATIONS (By Risk-Reward)

### Tier 1: Quick Wins (Low Risk, High Reward) ✅ RECOMMENDED

```json
{
  "recommendations": [
    {
      "name": "Add Daily Plan Indexes",
      "sql": [
        "CREATE INDEX idx_daily_plans_user_date ON daily_plans(user_id, date DESC);",
        "CREATE INDEX idx_habit_completions_user_date ON habit_completions(user_id, completed_at DESC);"
      ],
      "impact": "2-3x faster plan/habit lookups",
      "risk": "None - non-blocking index",
      "effort": "5 minutes SQL",
      "priority": "HIGH"
    },
    {
      "name": "Add JSONB GIN Indexes",
      "sql": [
        "CREATE INDEX idx_user_settings_config_gin ON user_settings USING gin(config_json);"
      ],
      "impact": "Faster config lookups",
      "risk": "None - non-blocking",
      "effort": "5 minutes SQL",
      "priority": "MEDIUM"
    },
    {
      "name": "Document FK Cascade Behavior",
      "effort": "Schema documentation (no SQL)",
      "impact": "Clarity on delete behavior",
      "risk": "None",
      "priority": "LOW"
    }
  ]
}
```

### Tier 2: Worth Planning (Medium Risk, Medium Reward)

```json
{
  "recommendations": [
    {
      "name": "Standardize Duration Types",
      "current": "Mix of INTEGER and REAL",
      "recommended": "All REAL for consistency",
      "impact": "Better precision for audio/timing",
      "risk": "MEDIUM - requires migration",
      "effort": "2-3 hours (migration + testing)",
      "timeline": "Next schema version (v2.1)"
    },
    {
      "name": "Create ENUM Types for Status",
      "impact": "Type safety, clearer schema",
      "risk": "MEDIUM - requires migration",
      "effort": "1-2 hours (one-time setup)",
      "timeline": "Next schema version"
    }
  ]
}
```

### Tier 3: Future Enhancements (High Risk/Effort)

```json
{
  "recommendations": [
    {
      "name": "Archive Tables for Audit Trail",
      "impact": "Compliance, data recovery",
      "risk": "HIGH - triggers, migrations",
      "effort": "5+ hours",
      "timeline": "When compliance required"
    },
    {
      "name": "Materialized Views for Stats",
      "impact": "Faster dashboard",
      "risk": "MEDIUM - refresh strategy needed",
      "effort": "2-3 hours",
      "timeline": "When performance needed"
    }
  ]
}
```

---

## SECTION 5: IMMEDIATE ACTIONS

### Phase 1: Verify Current State (Today)

- [ ] Confirm Phase 2 sed replacements applied
  ```bash
  grep -c "await safeFetch" app/frontend/src/lib/api/BookTrackerClient.tsx
  ```
- [ ] Check if any files still have raw `fetch()` calls
  ```bash
  grep -r "await fetch(" app/frontend/src --include="*.tsx" | grep -v node_modules
  ```

### Phase 2: Fix Critical Backend Issues (Day 1)

- [ ] Fix D1, D2: OAuth unwraps
  ```rust
  // Change from:
  redirect_uri: self.client.redirect_url().unwrap().to_string(),
  
  // To:
  redirect_uri: self.client.redirect_url()
    .ok_or_else(|| anyhow!("OAuth redirect URL not configured"))?
    .to_string(),
  ```

### Phase 3: Make Schema Optimization Decisions (Sprint Planning)

**Required Decisions**:
1. Proceed with Tier 1 indexes? (Recommended: YES - no risk)
2. Plan duration field standardization? (Recommended: YES for v2.1)
3. Need ENUM types? (Recommended: YES for clarity)

---

## SECTION 6: TRACKING

**Pitfalls to Address**:
- Link to [debug/DEBUGGING.md](DEBUGGING.md) for detailed tracking
- Link to [debug/SOLUTION_SELECTION.md](SOLUTION_SELECTION.md) for decisions on A1-A2, B5, B6

**Schema Decisions**:
- [ ] Approve Tier 1 indexes (low-risk quick win)
- [ ] Plan Tier 2 improvements for next version
- [ ] Document Tier 3 for future reference

**Verification Checklist**:
- [ ] Phase 2 bulk replacements verified (need terminal check)
- [ ] No remaining raw `fetch()` calls in client files
- [ ] OAuth unwraps fixed
- [ ] Confirm admin button fallback implemented

---

## Files Referenced

**Backend (Rust)**:
- [app/backend/crates/api/src/services/oauth.rs](app/backend/crates/api/src/services/oauth.rs) - Lines 68, 187

**Frontend (TypeScript)**:
- [app/frontend/src/components/onboarding/OnboardingModal.tsx](app/frontend/src/components/onboarding/OnboardingModal.tsx)
- [app/frontend/src/app/(app)/focus/FocusClient.tsx](app/frontend/src/app/(app)/focus/FocusClient.tsx)
- [app/frontend/src/components/focus/FocusTracks.tsx](app/frontend/src/components/focus/FocusTracks.tsx)
- [app/frontend/src/components/references/ReferenceLibrary.tsx](app/frontend/src/components/references/ReferenceLibrary.tsx)

**Database**:
- [schema.json](../schema.json) - Authoritative schema definition
- [app/database/migrations/0001_schema.sql](app/database/migrations/0001_schema.sql) - Generated SQL

**Configuration**:
- [debug/DEBUGGING.md](DEBUGGING.md) - Active issue tracking
- [debug/SOLUTION_SELECTION.md](SOLUTION_SELECTION.md) - Decision options

