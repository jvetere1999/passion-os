# DEBUGGING INSTRUCTIONS

**Last Updated**: 2026-01-11  
**Status**: Active Production Debugging Protocol  
**Authority**: Replaces all previous debugging workflows

---

## ABSOLUTE DEBUGGING PROCESS

Agent MUST follow this sequence for ALL issues:

```
ISSUE → DOCUMENT → EXPLORER → DECISION (if needed) → FIX → USER PUSHES
```

### Phase 1: ISSUE (Discovery & Validation)
- Identify the problem from logs, error messages, or user reports
- Document exact location, code, and error message
- Validate against schema.json (v2.0.0 is authoritative)
- Determine if schema mismatch, missing implementation, or true bug
- Create entry in `debug/DEBUGGING.md`

### Phase 2: DOCUMENT (Detailed Analysis)
- Full error context with timestamps
- Code locations (file:line format)
- Schema validation (what schema says vs what code does)
- User impact and severity classification (CRITICAL/HIGH/MEDIUM/LOW)
- Evidence from logs/code/schema
- Document in `debug/DEBUGGING.md` with complete root cause analysis

### Phase 3: EXPLORER (Discovery Work)
- Search codebase for related issues (grep for error patterns)
- Check if issue appears elsewhere (unintended consistency)
- Verify no recent related fixes already applied
- Identify all affected code paths
- Document findings in `debug/DEBUGGING.md`
- **NO CODE CHANGES YET**

### Phase 4: DECISION (If Needed)
- If multiple solution paths exist:
  - Document all options (A, B, C) in `debug/SOLUTION_SELECTION.md`
  - Include effort/risk/pros/cons for each
  - **WAIT FOR USER TO SELECT**
- If only one solution: proceed to Phase 5
- Mark status as "Requires Decision" or "Ready to Fix"

### Phase 5: FIX (Implementation)
- **ONLY after user approves selection or approach**
- Make changes per user's selected option
- Run validation:
  - `cargo check --bin ignition-api` (backend)
  - `npm run lint` (frontend)
  - All must return 0 errors (warnings acceptable)
- Update `debug/DEBUGGING.md` with:
  - Exact files changed (file:line format)
  - Test results (cargo check, npm lint)
  - Ready status: "Yes, ready for push"
- **DO NOT COMMIT**
- Onece you have deemed "Ready for Push", report to user with exact changes and validation results, move the priority to in testing once it is given the green light by user move to complete

### Phase 6: USER PUSHES
- Agent documents what was changed
- User runs: `git push origin BRANCH`
- Agent monitors deployment (if applicable)
- Confirm fix in production (if applicable)
- If user lists additgional issues following validation of deployment create new entries in `debug/DEBUGGING.md` and repeat process

---

## TIGHT RESTRICTIONS (MANDATORY)

### ❌ WHAT AGENT MUST NEVER DO:
1. **Commit without explicit user approval** ("commit" or "push" in user message)
2. **Make changes without discovery documentation** (skip Phase 2 or 3)
3. **Assume schema vs code when in doubt** (always validate with schema.json v2.0.0)
4. **Skip validation** (cargo check + npm lint mandatory before reporting "ready")
5. **Make multiple unrelated changes** (one issue/decision per cycle)
6. **Update instructions without user request** (only user can authorize meta-changes)
7. **Propose multiple solutions without user decision request** (Phase 4 gates implementation)
8. **Skip "Ready for push" confirmation** (user must see exact state before pushing)

### ✅ WHAT AGENT MUST ALWAYS DO:
1. **Document before fixing** (DEBUGGING.md first, code second)
2. **Use Phase 1-6 sequence** (no skipping phases)
3. **Validate every fix** (cargo check + npm lint mandatory)
4. **Wait for user approval** (never auto-commit)
5. **List ALL changes before "ready"** (file:line format in chat)
6. **Link documents** (DEBUGGING.md ↔ SOLUTION_SELECTION.md)
7. **Mark phase clearly** ("Phase 2: DOCUMENT", "Phase 5: FIX", etc.)
8. **Ask before deciding** (if multiple options, present to user for selection)

---

## INFORMED DECISIONS REGISTRY

All decisions between DEBUGGING.md and SOLUTION_SELECTION.md MUST align:

### Decision Mapping (DEBUGGING → SOLUTION_SELECTION)

| DEBUGGING.md | SOLUTION_SELECTION.md | Status | Notes |
|---|---|---|---|
| P0-A: habits.archived | P0-A: habits.archived | ✅ ALIGNED | Not an error - code uses `is_active = true` |
| P0-B: Date Casting | P0-B: Date Casting | ✅ ALIGNED | FIXED in 3 locations (habits_goals_repos.rs:88,133 + quests_repos.rs:199) |
| P0: Session Termination | P0: Session Termination | ✅ ALIGNED | 3 options (A: Centralized 401 Handler, B: Per-Hook, C: Sync Only) |
| P1: Plan My Day | P1: Plan My Day | ✅ ALIGNED | 3 options (A: Full, B: MVP, C: Disable) |
| P2: Onboarding Modal | P2: Onboarding Modal | ✅ ALIGNED | 3 options (A: Update Props, B: Transform API, C: Rewrite) |
| P3: Focus Library | P3: Focus Library | ✅ ALIGNED | 3 options (A: R2 Upload, B: IndexedDB Paradigm, C: External Links) |
| P4: Focus Persistence | P4: Focus Persistence | ✅ ALIGNED | 3 options (A: Sync State, B: LocalStorage, C: Increased Frequency) |
| P5: Zen Browser | P5: Zen Browser | ✅ ALIGNED | 3 options (A: CSS Support, B: Detection, C: Document Only) |

### Validation Requirement: Both Docs Reference Same Issues
```
✅ EXAMPLE (CORRECT):
debug/DEBUGGING.md:
  "### Priority P0: Session Termination..."
  "See SOLUTION_SELECTION.md Section 'Session Termination' for options"

debug/SOLUTION_SELECTION.md:
  "## PRIORITY P0: Session Termination..."
  "See DEBUGGING.md for detailed analysis"
```

---

## VALIDATION REQUIREMENTS

### Before Phase 5 (FIX): MUST Validate These Items

#### 1. ✅ Error Notification Jewel (UI Indication System)
**Purpose**: Users see immediately when errors occur (not silent failures)

**Validation Checklist**:
- [ ] All error responses trigger visual notification
- [ ] Backend 500 errors show user-facing message (not raw error)
- [ ] Network errors (401, 403, 500) display notification jewel
- [ ] Sync failure shows in UI (not silent polling)
- [ ] Toast/banner visible for auth failures
- [ ] Error persists until user acknowledges or condition resolves

**Implementation Examples**:
```typescript
// ✅ CORRECT: Error notification
if (response.status === 401) {
  showNotification('Session expired. Please log in again.');
  redirectToLogin();
}

// ❌ WRONG: Silent failure
if (response.status === 401) {
  console.error('401'); // User sees nothing
}
```

**Code Locations to Check**:
- `app/frontend/src/components/ui/Toast.tsx` or `Notification.tsx`
- All API hooks (useSync, useFetch, etc.) - must catch errors
- SyncStateContext - must show 401 notification
- Auth middleware - must display session expired message

#### 2. ✅ Full Implementation of Unimplemented Features
**Purpose**: No placeholder code in production; all features fully functional

**Critical Features Requiring Full Implementation**:

##### Admin API Tester (COMPLETED ✅)
- Location: `app/admin/src/components/ApiTester.tsx`
- Status: FULLY IMPLEMENTED (35+ endpoints)
- Validation:
  - [ ] Can fetch list of all endpoints
  - [ ] Can execute GET/POST/PUT/DELETE methods
  - [ ] Response displays correctly
  - [ ] Authentication works for protected endpoints
  - [ ] Error responses show error details

##### Plan My Day Generation
- Location: `app/backend/crates/api/src/db/platform_repos.rs`
- Current Status: **INCOMPLETE** - Returns empty array
- Requires Decision: Option A (Full), B (MVP), or C (Disable)
- Validation (when implemented):
  - [ ] Query fetches active quests
  - [ ] Query fetches pending habits for date
  - [ ] Query fetches scheduled workouts
  - [ ] Query fetches learning items
  - [ ] Items returned in priority order
  - [ ] JSONB storage works

##### Session Termination on 401
- Requires Decision: Option A (Centralized), B (Per-Hook), C (Sync Only)
- Validation (when implemented):
  - [ ] Backend 401 triggers frontend cleanup
  - [ ] Sync state cleared
  - [ ] Cookies removed
  - [ ] Redirect to login works
  - [ ] Multiple tabs sync auth state

##### Onboarding Modal
- Location: `app/frontend/src/components/onboarding/OnboardingProvider.tsx`
- Current Status: **DISABLED** - Returns null
- Requires Decision: Option A (Update Props), B (Transform API), C (Rewrite)
- Validation (when implemented):
  - [ ] Modal appears on new user first login
  - [ ] Accepts onboarding flow from API
  - [ ] Feature selection captured
  - [ ] State persists after refresh

**Implementation Checklist**:
- No `return null` without clear comment explaining why
- No `TODO` comments in production code paths
- No `.skip()` or `.focus()` in tests
- All endpoints return data (not empty arrays/objects)
- All async operations have error handling with user notification

---

## FILE ORGANIZATION

### Debug Folder Structure (STRICT)
```
debug/
├── DEBUGGING.md              # ✅ ONLY active issues, fixes, validation results
├── SOLUTION_SELECTION.md     # ✅ ONLY decision options for unsolved issues
└── archive/                  # Everything else (historical, completed, reports)
    ├── 2026-01-11_fixes.md
    ├── ACTION_PLANS.md
    ├── VALIDATION_RESULTS.md
    ├── IMPLEMENTATION_RESULTS_*.md
    ├── PHASE_*.md
    └── README.md
```

### Organization Rules (MANDATORY)
- **debug/DEBUGGING.md**: Active issues only (Phase 2+)
- **debug/SOLUTION_SELECTION.md**: Pending decisions only
- **debug/archive/**: ALL historical files, completed phases, past results
- **Nothing else in debug root**

### Reference
- **Primary**: `debug/DEBUGGING.md` - Current active work
- **Secondary**: `debug/SOLUTION_SELECTION.md` - Pending decisions
- **History**: `debug/archive/` - Completed, past phases
- **Schema**: `schema.json` (v2.0.0) - Authoritative data model

---

## EXAMPLE WORKFLOW (Session Termination Fix)

### Phase 1: ISSUE
```
User Report: "Session doesn't clear when auth expires"
Log Evidence: 401 response but app still shows logged-in state
```

### Phase 2: DOCUMENT
```markdown
# P0: Session Termination on Invalid Sync

Location: Frontend SyncStateContext
Error: 401 response not handled
Impact: Stale data accessible after logout
See: debug/DEBUGGING.md for full analysis
```

### Phase 3: EXPLORER
```bash
# Search for 401 handling
grep -r "401" app/frontend/src/

# Check all API hooks
grep -r "response.status" app/frontend/src/

# Result: Found 8 locations, only 1 has 401 check
```

### Phase 4: DECISION
```markdown
## PRIORITY P0: Session Termination

Option A: Centralized 401 Handler (Recommended)
Option B: Per-Hook Validation
Option C: Sync Endpoint Only

Waiting for user selection...
```

### Phase 5: FIX (After User Selects Option A)
```bash
# Create app/frontend/src/lib/api/apiClient.ts
# Add 401 interceptor
# Update all fetch calls to use apiClient
# Test: npm run lint → 0 errors
# Status: Ready for push
```

### Phase 6: USER PUSHES
```
Agent Reports:
- Files changed: apiClient.ts (new), SyncStateContext.tsx (modified)
- Validation: cargo check ✅, npm lint ✅
- Ready for: git push origin production

User Runs: git push origin production
```

---

## VALIDATION SCRIPT

Before declaring "Ready for Push", Agent MUST run:

```bash
# Backend validation
cd app/backend
cargo check --bin ignition-api 2>&1 | tee .tmp/cargo_check.log

# Frontend validation
cd app/frontend
npm run lint 2>&1 | tee .tmp/npm_lint.log

# Report results:
# - 0 errors required
# - Warnings acceptable
# - Both logs recorded for audit
```

---

## AUDIT TRAIL

Every fix cycle MUST record in `debug/DEBUGGING.md`:

```markdown
## Fix Cycle #N - [ISSUE NAME]

**Date**: YYYY-MM-DD HH:MM UTC
**Phase**: 1-6 (with status)
**Files Changed**: file.rs:123-145, file.tsx:89-112
**Validation Results**: 
- cargo check: ✅ 0 errors, 217 warnings (pre-existing)
- npm lint: ✅ 0 errors, 0 warnings
**Status**: Ready for push
**User Push**: PENDING / COMPLETED
```

---

## DECISION LOG

Every decision between DEBUGGING.md and SOLUTION_SELECTION.md must be:
1. **Documented** in both files (exact same reference)
2. **Ranked** by severity (P0-P5)
3. **Owned** by specific person (user selects option)
4. **Validated** per implementation (error notification + feature complete)
5. **Audited** in DEBUGGING.md with fix results

---

## SCHEMA GENERATOR & MIGRATION FLOW

### Single Source of Truth
**Root**: `schema.json` (v2.0.0) - ONLY authoritative schema file

### Generation Pipeline
```
schema.json (ROOT - Edit this only)
   ↓
generate_all.py (direct read from root)
   ↓
app/backend/migrations/0001_schema.sql (Generated)
app/frontend/src/lib/generated_types.ts (Generated)
app/backend/crates/api/src/db/generated.rs (Generated)
app/backend/migrations/0002_seeds.sql (Generated)
```

### Process
1. **Edit root schema.json** with all schema changes
2. **Run generate_all.py** to regenerate migrations and code
3. Migrations are generated artifacts, NEVER edit directly
4. NO intermediate schema file—direct pipeline from root

### Mandatory Rules
- ✅ Edit ONLY root `schema.json` for schema changes
- ✅ Never edit migrations directly
- ✅ Never run build_schema.py (deprecated)
- ✅ Always run generate_all.py after schema changes
- ✅ Always validate: cargo check + npm lint after generation

---

## HAND-OFF TO USER

Before user pushes, agent MUST confirm:

```markdown
## ✅ READY FOR PUSH

**Changes Summary**:
- [file.rs](file.rs#L88-L92) - Added ::date cast
- [file.rs](file.rs#L133-L137) - Added ::date cast
- [file.rs](file.rs#L199-L202) - Added ::date cast

**Validation**:
✅ cargo check: 0 errors
✅ npm lint: 0 errors

**Status**: All changes tested and ready
**User Action**: Push to production when ready
```

---

## REFERENCE

- **Process**: Issue → Document → Explorer → Decision → Fix → User Pushes
- **Files**: `debug/DEBUGGING.md` + `debug/SOLUTION_SELECTION.md`
- **Restrictions**: No commits, no assumptions, always validate
- **Validation**: Error notifications + full feature implementation
- **Authority**: schema.json v2.0.0
