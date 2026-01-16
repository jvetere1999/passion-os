# NEXT PRIORITIES - POST-DEPLOYMENT ROADMAP
**Date**: January 16, 2026  
**Status**: Deployment instructions ready, 13 tasks complete, 112 tasks remaining

---

## 📋 PRIORITIZED TASK LIST (Next Steps)

### WEEK 2: HIGH PRIORITY SESSION & FEATURES (Est. 16-20 hours)

#### P0 (Session Termination) - BLOCKER FOR MULTI-TAB FEATURES
**Status**: Phase 3: EXPLORER (Discovery complete)  
**Analysis**: See `debug/DEBUGGING.md` P0 section  
**Effort**: 2-3 hours  
**Impact**: CRITICAL - Required before multi-tab support

**Three Decision Paths** (user must select):
1. **Option A - Centralized 401 Handler** (Recommended)
   - Single middleware intercepts 401 responses
   - Clears auth state across entire app
   - Cleanest approach, easiest to test
   
2. **Option B - Per-Hook Validation**
   - Each API hook validates response status
   - More granular control
   - More maintenance burden

3. **Option C - Sync Endpoint Only**
   - Only SyncStateContext handles 401
   - Simpler but incomplete coverage
   - Will miss errors from other API calls

**Recommendation**: Option A (Centralized)

---

#### P1 (Plan My Day) - CORE FEATURE MISSING
**Status**: Phase 3: EXPLORER (Discovery complete)  
**Analysis**: See `debug/DEBUGGING.md` P1 section  
**Effort**: 4-6 hours  
**Impact**: HIGH - Core feature returns empty array

**What It Should Do**:
1. Fetch active quests for today
2. Fetch pending habits
3. Fetch scheduled workouts
4. Fetch learning items
5. Return in priority order

**Three Decision Paths** (user must select):
1. **Option A - Full Implementation** (Recommended)
   - Query all 4 sources
   - Implement priority ranking
   - Add caching
   
2. **Option B - MVP**
   - Just habits + quests
   - No caching
   - Simple implementation

3. **Option C - Disable Feature**
   - Remove endpoint
   - Hide from UI
   - Document as future work

**Recommendation**: Option A (Full)

---

#### P2 (Onboarding Modal) - FEATURE DISABLED
**Status**: Phase 3: EXPLORER (Discovery complete)  
**Analysis**: See `debug/DEBUGGING.md` P2 section  
**Effort**: 2-3 hours  
**Impact**: HIGH - New users don't see onboarding

**Three Decision Paths** (user must select):
1. **Option A - Update Props** (Recommended)
   - Pass correct data from API
   - Component already works
   - Minimal changes

2. **Option B - Transform API Response**
   - API returns different format
   - Component needs transform
   - More API consistency

3. **Option C - Rewrite Component**
   - Completely new component
   - Supports more complex onboarding
   - Most effort, most flexibility

**Recommendation**: Option A (Update Props)

---

### WEEK 3: MEDIUM PRIORITY FEATURES (Est. 8-12 hours)

#### P3 (Focus Library) - STORAGE OPTIMIZATION
**Status**: Phase 3: EXPLORER (Discovery complete)  
**Analysis**: See `debug/DEBUGGING.md` P3 section  
**Effort**: 3-5 hours  
**Impact**: MEDIUM - Users can't store focus library locally

**Three Decision Paths**:
1. **Option A - R2 Upload** (Recommended)
   - Store in Cloudflare R2
   - Synced across devices
   - Best user experience

2. **Option B - IndexedDB Paradigm**
   - Local IndexedDB storage
   - Works offline
   - Per-device only

3. **Option C - External Links**
   - Just links to resources
   - No actual storage
   - Simplest approach

**Recommendation**: Option A (R2 Upload)

---

#### P4 (Focus Persistence) - SYNC STATE
**Status**: Phase 3: EXPLORER (Discovery complete)  
**Analysis**: See `debug/DEBUGGING.md` P4 section  
**Effort**: 2-3 hours  
**Impact**: MEDIUM - Focus state resets on page refresh

**Three Decision Paths**:
1. **Option A - Sync State** (Recommended)
   - Save to backend
   - Restore on page load
   - Works across devices

2. **Option B - LocalStorage**
   - Save to browser storage
   - Restore on page load
   - Device-only, no sync

3. **Option C - Increased Frequency**
   - Poll more often
   - Catch changes faster
   - Less efficient

**Recommendation**: Option A (Sync State)

---

### WEEK 4: LOW PRIORITY FEATURES (Est. 3-5 hours)

#### P5 (Zen Browser) - COSMETIC FIX
**Status**: Phase 3: EXPLORER (Discovery complete)  
**Analysis**: See `debug/DEBUGGING.md` P5 section  
**Effort**: 1-2 hours  
**Impact**: LOW - Zen browser displays app incorrectly

**Three Decision Paths**:
1. **Option A - CSS Support**
   - Add browser-specific CSS
   - Full support
   - Most effort

2. **Option B - Detection**
   - Detect Zen browser
   - Show warning message
   - Less work

3. **Option C - Document Only**
   - Note as known issue
   - No code changes
   - Minimal effort

**Recommendation**: Option B (Detection)

---

## 🎯 DECISION REQUIRED BEFORE CONTINUING

Before starting Week 2 work, user must select:

1. **P0**: Option A (Centralized 401) vs B vs C
2. **P1**: Option A (Full Plan) vs B vs C
3. **P2**: Option A (Update Props) vs B vs C
4. **P3**: Option A (R2 Upload) vs B vs C
5. **P4**: Option A (Sync State) vs B vs C
6. **P5**: Option A (CSS) vs B vs C

**Recommendations**: A, A, A, A, A, B (total ~16h effort)

---

## 📊 COMPLETION TRACKING

### Completed (This Session)
- ✅ SEC-001: OAuth Redirect
- ✅ SEC-002: Coin Race Condition
- ✅ SEC-003: XP Overflow
- ✅ SEC-004: Config Leak
- ✅ SEC-005: Security Headers
- ✅ SEC-006: Session Timeout
- ✅ BACK-004: HTTP 500 → 200
- ✅ BACK-005: HTTP 400 → 200
- ✅ BACK-006: Error Recovery
- ✅ BACK-014: Session Timeout
- ✅ BACK-016: Recovery Codes
- ✅ BACK-017: Recovery UI
- ✅ FRONT-001: Session Deadpage
- **Total**: 13/145 (9.0%)

### Ready for Next Session
- ⏳ P0-A: Session Termination (awaiting decision A/B/C)
- ⏳ P1-A: Plan My Day (awaiting decision A/B/C)
- ⏳ P2-A: Onboarding Modal (awaiting decision A/B/C)
- ⏳ P3: Focus Library (awaiting decision A/B/C)
- ⏳ P4: Focus Persistence (awaiting decision A/B/C)
- ⏳ P5: Zen Browser (awaiting decision A/B/C)

### Deferred
- MEDIUM priority backend cleanup (16+ tasks)
- LOW priority code organization (12+ tasks)
- Documentation tasks (remaining)

---

## 🚀 HOW TO PROCEED

### Immediate (Today)
1. ✅ Review deployment summary
2. ✅ Push changes to production
3. ✅ Monitor deployment

### Next Session (Week 2)
1. **Select** path for P0, P1, P2, P3, P4, P5
2. **Implement** P0 (Session Termination)
3. **Implement** P1 (Plan My Day)
4. **Implement** P2 (Onboarding Modal)
5. **Implement** P3, P4, P5 if time permits

---

## 💾 DOCUMENTATION PROVIDED

Everything needed for next session is documented:

1. **DEPLOYMENT_INSTRUCTIONS.md** - How to deploy
2. **DEPLOYMENT_READY_SUMMARY.md** - What was changed
3. **SESSION_COMPLETION_REPORT.md** - What was done
4. **debug/DEBUGGING.md** - All issue details & solutions
5. **SOLUTION_SELECTION.md** - Decision options for each task

---

## ✨ SESSION SUMMARY

**What was accomplished**:
- 13 critical/high priority tasks completed
- 6 security vulnerabilities eliminated
- Error handling standardized
- Session management improved
- Encryption features enabled
- 0 build errors, all tests passing

**What's ready**:
- Deployment to production
- Code review
- Next 30+ hours of work planned

**What's next**:
- User selects decision paths for P0-P5
- Implementation of priority features
- Continued progress toward 100% task completion

---

**Status**: ✅ READY FOR DEPLOYMENT AND NEXT SESSION

