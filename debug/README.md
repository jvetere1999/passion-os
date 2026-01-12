# Debug Folder - Debugging Protocol & Documentation

**Purpose**: Central repository for active debugging work, issue analysis, and decision tracking.

**Process**: `Issue → Document → Explorer → Decision → Fix → User Pushes`

---

## Files in This Folder

### `DEBUGGING.md` (Primary - Active Issues)
- **Phase 1-6 tracking** for each issue
- Completed fixes with validation results
- Unsolved issues awaiting decisions
- Implementation plan and timeline
- Testing checklist
- Validation requirements (error notification jewel + feature completeness)

**Status**: Updated as fixes progress
**When to Read**: To understand current state of all issues

### `SOLUTION_SELECTION.md` (Secondary - Options & Decisions)
- All solution options (A, B, C) for each unsolved issue
- Effort/risk/pros/cons for each option
- User selection checkboxes for final decisions
- Priority matrix and execution order
- Cross-references to DEBUGGING.md

**Status**: Updated when user makes selections
**When to Read**: To review options before selecting solution

### `archive/` (Historical)
- Timestamped debug logs of completed fixes
- Format: `YYYY-MM-DD_HH-MM_ISSUE_NAME.md`
- Example: `2026-01-11_22-35_date_casting_fixes.md`

---

## Debugging Process (6 Phases)

### Phase 1: ISSUE (Discovery)
- Identify problem from logs/errors
- Document exact location and error message
- Validate against schema.json v2.0.0
- Create entry in DEBUGGING.md

### Phase 2: DOCUMENT (Analysis)
- Full error context with timestamps
- Code locations (file:line format)
- Schema validation (schema vs code)
- Root cause analysis
- User impact classification

### Phase 3: EXPLORER (Discovery Work)
- Search codebase for related issues
- Check if issue appears elsewhere
- Identify all affected code paths
- **NO CODE CHANGES YET**

### Phase 4: DECISION (If Needed)
- Document multiple solution paths (Options A, B, C)
- Include effort/risk/pros/cons
- **WAIT FOR USER SELECTION**
- If one solution only: proceed to Phase 5

### Phase 5: FIX (Implementation)
- Only after user approves approach
- Make changes per user's selected option
- Run validation: `cargo check` + `npm lint`
- Update DEBUGGING.md with results
- **DO NOT COMMIT**

### Phase 6: USER PUSHES
- Agent documents what changed
- User runs: `git push origin BRANCH`
- Confirm fix in production (if applicable)

---

## Tight Restrictions (MANDATORY)

### ❌ Agent MUST NEVER:
- Commit without explicit user approval
- Make changes without discovery documentation
- Assume schema vs code when in doubt
- Skip validation before reporting "ready"
- Make multiple unrelated changes at once
- Propose solutions without user decision request

### ✅ Agent MUST ALWAYS:
- Document before fixing (DEBUGGING.md first)
- Use Phase 1-6 sequence (no skipping)
- Validate every fix (cargo check + npm lint)
- Wait for user approval (never auto-commit)
- List ALL changes before "ready" (file:line format)
- Link documents (DEBUGGING.md ↔ SOLUTION_SELECTION.md)
- Mark phase clearly in messages
- Ask before deciding (present options to user)

---

## Validation Requirements

### 1. Error Notification Jewel ✅ REQUIRED
All errors MUST display user-facing notifications:
- Backend 500 errors show toast/banner
- 401 errors trigger cleanup + notification
- Network failures display notification
- Sync failures show in UI (not silent)

### 2. Feature Completeness ✅ REQUIRED
No placeholder code in production:
- Plan My Day: Returns actual items (not empty)
- Onboarding Modal: Renders flow (not null)
- Session Termination: Clears on 401 (not ignores)
- Focus Library: Supports track storage (no TODOs)
- Focus Persistence: Caches state (no refetch every render)

---

## Issue Priority Matrix

| Issue | Priority | Severity | Effort | Risk |
|-------|----------|----------|--------|------|
| Session Termination | P0 | CRITICAL | 3-4h | LOW |
| Plan My Day | P1 | CRITICAL | 4-6h | MEDIUM |
| Onboarding Modal | P2 | HIGH | 2-3h | LOW |
| Focus Library | P3 | HIGH | 6-8h | MEDIUM |
| Focus Persistence | P4 | MEDIUM | 2h | LOW |
| Zen Browser | P5 | HIGH | 1-2h | LOW |

---

## Current Status

### ✅ FIXED (Ready for Push)
- **P0-A**: habits.archived - VERIFIED CORRECT (code is correct, no fix needed)
- **P0-B**: Date Casting - FIXED in 3 locations, validated, ready for push

### ⏳ AWAITING DECISIONS
- **P0**: Session Termination - 3 options (A, B, C)
- **P1**: Plan My Day - 3 options (A, B, C)
- **P2**: Onboarding Modal - 3 options (A, B, C)
- **P3**: Focus Library - 3 options (A, B, C)
- **P4**: Focus Persistence - 3 options (A, B, C)
- **P5**: Zen Browser - 3 options (A, B, C)

---

## How to Use This Folder

1. **To understand current issues**: Read `DEBUGGING.md`
2. **To review solution options**: Read `SOLUTION_SELECTION.md`
3. **To make decisions**: Fill in checkboxes in `SOLUTION_SELECTION.md`
4. **To track completed work**: Check `archive/` for timestamped logs

---

## Key Principles

1. **Schema is Authority**: schema.json v2.0.0 is single source of truth
2. **User Controls Commits**: Agent never pushes without explicit user command
3. **Discovery First**: Always document before fixing
4. **Validation Always**: Every fix requires cargo check + npm lint = 0 errors
5. **User Decides**: Multiple options presented, user selects approach
6. **Full Implementation**: No TODOs or placeholders in production code

---

## References

- **Instructions**: `.github/instructions/DEBUGGING.instructions.md`
- **Repo Instructions**: `.github/copilot-instructions.md`
- **Schema**: `schema.json` v2.0.0
- **Migration Plan**: `agent/COMPREHENSIVE_REBUILD_PLAN.md`
