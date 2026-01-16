# Session 6 - Recommended Next Priorities (5-10 Tasks)

**Created**: January 16, 2026  
**Focus**: Maximum impact with moderate effort  
**Target**: Reach 55-65/145 tasks (38-45% completion)  
**Estimated Time**: 6-8 hours  

---

## 🎯 PRIORITY 1: SECURITY FIXES (Already Complete - But Listed for Reference)

These 6 critical security issues are marked complete in DEBUGGING.md:

- ✅ **SEC-001**: OAuth Redirect URI Validation (0.2h, CRITICAL)
- ✅ **SEC-002**: Coin Race Condition Fix (1.5h, CRITICAL)
- ✅ **SEC-003**: XP Integer Overflow Prevention (1.5h, CRITICAL)
- ✅ **SEC-004**: Config Variable Leak Prevention (0.2h, CRITICAL)
- ✅ **SEC-005**: Missing Security Headers (0.2h, CRITICAL)
- ✅ **SEC-006**: Session Activity Tracking (0.3h, CRITICAL)

**Status**: All 6 security issues complete and ready for production

---

## 🎯 PRIORITY 2: VAULT STATE SECURITY (1 hour)

**BACK-001**: Fix Vault State Lock Mechanism

**Effort**: 1 hour (Phase 1 - Critical security fix)  
**Impact**: 7/10 (Security/stability)  
**Severity**: HIGH  

**What It Is**:
- Vault state uses in-memory locking (Arc<Mutex>)
- Concurrent mutations could cause race conditions
- Need explicit transaction boundaries + advisory locks

**Why It Matters**:
- Vault is most sensitive user data (encryption keys)
- Race condition could lead to data corruption or loss
- Critical for production readiness

**Implementation Path**:
1. Review vault unlock flow in vault_repos.rs
2. Add explicit transaction boundaries (BEGIN/COMMIT)
3. Use PostgreSQL advisory locks for concurrent access prevention
4. Test concurrent unlock/lock scenarios
5. Add logging for lock acquisition/release

**Success Criteria**:
- All vault mutations wrapped in transactions
- Advisory locks used for concurrent access
- Unit tests prove atomicity
- No race condition possible

**Files to Modify**:
- [app/backend/crates/api/src/db/vault_repos.rs](../../app/backend/crates/api/src/db/vault_repos.rs)
- [app/backend/crates/api/src/routes/vault.rs](../../app/backend/crates/api/src/routes/vault.rs)

---

## 🎯 PRIORITY 3: QUESTS REPOSITORY SQL INJECTION (2 hours)

**BACK-002**: Remove format! Macros from Queries

**Effort**: 2 hours (Major refactoring)  
**Impact**: 8/10 (Affects 40+ queries)  
**Severity**: HIGH  

**What It Is**:
- quests_repos.rs has 40+ SQL queries built with format! macros
- format! macros are NOT safe; potential SQL injection vulnerability
- Must convert to sqlx parameterized queries

**Why It Matters**:
- SQL injection is critical security risk
- 40+ queries affected = broad exposure
- Easy to fix with systematic refactoring

**Implementation Path**:
1. Identify all format! macro usage in [quests_repos.rs](../../app/backend/crates/api/src/db/quests_repos.rs)
2. For each query, convert to:
   ```rust
   // Before (UNSAFE):
   sqlx::query(&format!("SELECT * FROM quests WHERE id = {}", id))
   
   // After (SAFE):
   sqlx::query("SELECT * FROM quests WHERE id = $1")
       .bind(id)
   ```
3. Run integration tests after each conversion (60+ tests)
4. Add cargo clippy rule to prevent future format! in queries

**Success Criteria**:
- 0 format! macros in SQL queries
- All 40+ queries parameterized
- 60+ integration tests pass
- No regressions

**Files to Modify**:
- [app/backend/crates/api/src/db/quests_repos.rs](../../app/backend/crates/api/src/db/quests_repos.rs)

---

## 🎯 PRIORITY 4: GOALS REPOSITORY REFACTORING (1.5 hours)

**BACK-002b**: Extract Common Goal Operations

**Effort**: 1.5 hours (Code extraction)  
**Impact**: 7/10 (Maintenance, ~400 lines affected)  
**Severity**: HIGH  

**What It Is**:
- goals_repos.rs has duplicated code patterns for:
  - Milestone completion with XP awards
  - Progress tracking and recalculation
  - Goal archival and cleanup
- Opportunity to extract 3-4 common functions

**Why It Matters**:
- Code duplication leads to maintenance issues
- If bug found in milestone logic, must fix in 3 places
- Extracted helpers make code more testable

**Implementation Path**:
1. Identify duplicated patterns in [goals_repos.rs](../../app/backend/crates/api/src/db/goals_repos.rs)
2. Extract as helper functions:
   - `award_goal_milestone_bonus(user_id, goal_id, bonus_xp)`
   - `recalculate_goal_progress(user_id, goal_id)`
   - `archive_goal(user_id, goal_id)`
3. Replace all call sites with helpers
4. Run tests to verify no regressions

**Success Criteria**:
- ~100 lines of duplicate code eliminated
- 3-4 extracted helper functions
- All tests pass
- Code is more maintainable

**Files to Modify**:
- [app/backend/crates/api/src/db/goals_repos.rs](../../app/backend/crates/api/src/db/goals_repos.rs)

---

## 🎯 PRIORITY 5: FOCUS FEATURES ENHANCEMENT (1.5 hours)

**BACK-003**: Implement Focus Streak Tracking

**Effort**: 1.5 hours (New feature)  
**Impact**: 6/10 (Gamification feature)  
**Severity**: MEDIUM  

**What It Is**:
- Focus sessions have no streak tracking
- Schema has `focus_streaks` table but it's unused
- Can implement daily focus streaks (1+ sessions = streak day)

**Why It Matters**:
- Gamification feature (users like streaks)
- Motivates daily usage
- Completes schema definition

**Implementation Path**:
1. Create `focus_streaks_repos.rs` with:
   - `increment_focus_streak(user_id)` - increment daily streak
   - `get_current_streak(user_id)` - fetch active streak
   - `reset_streak_if_missed(user_id)` - reset on missed day
2. Call `increment_focus_streak()` when focus session completes
3. Add `current_focus_streak` to UserProgress model
4. Include streak in /api/sync/poll response (SyncResponse)

**Success Criteria**:
- Focus streaks tracked accurately
- Reset logic works (checks 24h gap)
- Sync response includes streak data
- Tests cover all edge cases

**Files to Create**:
- [app/backend/crates/api/src/db/focus_streaks_repos.rs](../../app/backend/crates/api/src/db/focus_streaks_repos.rs) (NEW)

**Files to Modify**:
- [app/backend/crates/api/src/db/focus_repos.rs](../../app/backend/crates/api/src/db/focus_repos.rs)
- [app/backend/crates/api/src/routes/sync.rs](../../app/backend/crates/api/src/routes/sync.rs)
- [app/frontend/src/lib/sync/SyncStateContext.tsx](../../app/frontend/src/lib/sync/SyncStateContext.tsx)

---

## 🎯 PRIORITY 6: EXERCISE TRACKING COMPLETION (1.5 hours)

**BACK-004**: Implement Workout Completion Tracking

**Effort**: 1.5 hours (Complete missing feature)  
**Impact**: 7/10 (Core feature)  
**Severity**: MEDIUM  

**What It Is**:
- Workout creation exists (POST /api/exercise/workouts)
- Workout completion NOT implemented
- Need to implement workout_session completion

**Why It Matters**:
- Exercise tracking is core feature but incomplete
- Users can't complete workouts (stuck in pending state)
- Quick win - mostly follow habit/quest patterns

**Implementation Path**:
1. Create `POST /api/exercise/workouts/:id/complete` endpoint
2. Implement in exercise_repos.rs:
   - `complete_workout(user_id, workout_id, duration_minutes, notes)`
   - Award XP based on difficulty + duration
   - Record in points_ledger
   - Create workout_session record
3. Add to frontend: WorkoutClient.tsx
4. Add to /api/sync response (completed workouts count)

**Success Criteria**:
- Workout completion flow works end-to-end
- XP awards correctly
- Sync response updates
- Tests cover success and error cases

**Files to Create**:
- Tests for workout completion

**Files to Modify**:
- [app/backend/crates/api/src/db/exercise_repos.rs](../../app/backend/crates/api/src/db/exercise_repos.rs)
- [app/backend/crates/api/src/routes/exercise.rs](../../app/backend/crates/api/src/routes/exercise.rs)
- [app/frontend/src/app/(app)/exercise/ExerciseClient.tsx](../../app/frontend/src/app/(app)/exercise/ExerciseClient.tsx) (NEW)
- [app/backend/crates/api/src/routes/sync.rs](../../app/backend/crates/api/src/routes/sync.rs)

---

## 🎯 PRIORITY 7: LEARN/LESSONS COMPLETION (1.5 hours)

**BACK-005**: Implement Learning Progress Tracking

**Effort**: 1.5 hours (Similar to workout pattern)  
**Impact**: 6/10 (Learning feature)  
**Severity**: MEDIUM  

**What It Is**:
- Learning modules exist (lessons, chapters)
- Lesson completion not tracked
- Need to implement lesson_progress records

**Why It Matters**:
- Learning is key feature for knowledge retention
- Progress tracking enables user motivation
- Follows same patterns as workouts

**Implementation Path**:
1. Create `POST /api/learn/:lesson_id/complete` endpoint
2. Implement in learn_repos.rs:
   - `complete_lesson(user_id, lesson_id, duration_minutes, notes)`
   - Award XP based on difficulty
   - Update lesson_progress records
   - Check if chapter complete (all lessons done)
3. Add to frontend: LearningClient.tsx
4. Add to /api/sync response (learning progress)

**Success Criteria**:
- Lesson completion works
- XP awards
- Chapter completion detected
- Sync response includes learning progress

**Files to Modify**:
- [app/backend/crates/api/src/db/learn_repos.rs](../../app/backend/crates/api/src/db/learn_repos.rs)
- [app/backend/crates/api/src/routes/learn.rs](../../app/backend/crates/api/src/routes/learn.rs)
- [app/frontend/src/app/(app)/learn/LearnClient.tsx](../../app/frontend/src/app/(app)/learn/LearnClient.tsx) (NEW)

---

## 🎯 PRIORITY 8: BOOKS COMPLETION TRACKING (1 hour)

**BACK-006**: Implement Book/Reading Progress

**Effort**: 1 hour (Simpler than others)  
**Impact**: 5/10 (Reading feature)  
**Severity**: MEDIUM  

**What It Is**:
- Books can be added to library
- Book reading progress not tracked
- Need reading_sessions to track pages/chapters read

**Why It Matters**:
- Encourages reading habit
- Tracks reading progress
- Simple to implement (follows patterns)

**Implementation Path**:
1. Create `POST /api/books/:id/reading-session` endpoint
2. Implement in books_repos.rs:
   - `record_reading_session(user_id, book_id, pages_read, duration_minutes)`
   - Award XP (1 XP per 10 pages or similar)
   - Update book_progress records
   - Check if book complete
3. Add to frontend button
4. Add to /api/sync response

**Success Criteria**:
- Reading sessions recorded
- Progress tracked
- Completion detection works
- XP awarded

**Files to Modify**:
- [app/backend/crates/api/src/db/books_repos.rs](../../app/backend/crates/api/src/db/books_repos.rs)
- [app/backend/crates/api/src/routes/books.rs](../../app/backend/crates/api/src/routes/books.rs)

---

## 📊 TIMELINE & EXPECTED OUTCOME

### Session 6 (Current)
- ✅ Validation + documentation complete (1 hour)
- ⏳ Next: BACK-001 (Vault security)

### Session 7 (Next)
- **Target**: BACK-001, BACK-002, BACK-002b = 4.5 hours
- **Expected Progress**: 50-54 → 55-58 tasks (38-40%)

### Sessions 8-9
- **Target**: BACK-003, BACK-004, BACK-005, BACK-006 = 6 hours
- **Expected Progress**: 55-58 → 61-64 tasks (42-44%)

### By End of Week 3
- **Expected**: 60-65 tasks complete (41-45%)
- **Security**: All 6 critical fixes done
- **Backend**: Major refactoring + core features complete
- **Codebase**: ~90% cleaner and more maintainable

---

## 🚀 QUICK START (For Next Session)

### To Start BACK-001 (Vault Security):
1. Read: [backend_vault_state.md](../../debug/analysis/backend_vault_state.md#phase-1-security-fix-critical---1-hour)
2. Locate: [vault_repos.rs](../../app/backend/crates/api/src/db/vault_repos.rs)
3. Identify: Vault unlock/lock functions
4. Add: Transaction boundaries + advisory locks
5. Test: Run vault_tests.rs
6. Validate: cargo check = 0 errors

### To Start BACK-002 (Quests SQL):
1. Search: grep "format!(" app/backend/crates/api/src/db/quests_repos.rs
2. For each match: Convert to sqlx parameterized query
3. Test: Run tests after each conversion
4. Validate: npm run lint = 0 errors

---

## ✅ CRITERIA FOR SUCCESS

Each task when complete must satisfy:

1. **Code Quality**:
   - ✅ cargo check: 0 errors
   - ✅ npm run lint: 0 new errors
   - ✅ No breaking changes

2. **Testing**:
   - ✅ Unit tests pass
   - ✅ Integration tests pass
   - ✅ Edge cases covered

3. **Documentation**:
   - ✅ Code comments explain logic
   - ✅ DEBUGGING.md updated with Phase 5 completion
   - ✅ Any new architectural patterns documented

4. **Validation**:
   - ✅ No regressions
   - ✅ Error handling complete
   - ✅ User-facing notifications for errors

---

**Next Session Target**: Complete BACK-001 through BACK-003 = reach 55-58 tasks (38-40%)
