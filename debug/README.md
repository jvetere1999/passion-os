# Debug Folder - Organization & Usage

**Folder Purpose**: Track active debugging work, pending decisions, and historical fixes  
**Last Reorganized**: 2026-01-12 18:54 UTC  
**Authority**: [DEBUGGING.instructions.md](../../.github/instructions/DEBUGGING.instructions.md)

---

## File Structure (Mandatory)

```
debug/
├── DEBUGGING.md           ← MAIN: Active issues, fixes, validation results
├── SOLUTION_SELECTION.md  ← MAIN: Pending decisions awaiting user action
├── README.md              ← THIS FILE: How to use debug folder
└── archive/               ← HISTORICAL: All old files, past phases, completed work
    ├── 2026-01-12_*.md    ← Archived from current session
    ├── 2026-01-11_*.md    ← Archived from previous sessions
    └── README.md          ← Archive index
```

### Rules (STRICT)

✅ **Allowed in Root**:
- `DEBUGGING.md` - Active issues ONLY (Phase 2+)
- `SOLUTION_SELECTION.md` - Pending decisions ONLY
- `README.md` - This usage guide
- `archive/` - Directory for all historical files

❌ **NOT Allowed in Root**:
- Multiple versions of the same issue
- Completed/past phases
- Historical tracking files
- Any file that should be in `archive/`

---

## DEBUGGING.md - Active Issues

### When to Use
- **Always**: When tracking current work
- **Always**: Before making code changes
- **Always**: After fixes are applied

### Structure

```markdown
# DEBUGGING - Active Issues & Fixes

## Summary Section
- Current status
- Test results
- Phase progress

## Bug #N - Issue Name
### Phase: 1-6 Status
- **Problem**: What's broken
- **Root Cause**: Why it's broken
- **Fix Applied**: What was changed
- **Files Changed**: With line numbers
- **Validation Results**: Test/compile results
- **Status**: ✅ FIXED or 🟡 BLOCKED

## Remaining Issues
- Organized by category
- Link to code locations
- Status for each
```

### Example Entry

```markdown
## Bug #11 - Missing User Extension (FIXED)

**Phase**: 5 (FIX COMPLETE)

**Problem**: 
- Auth middleware set `AuthContext` extension
- Route handlers expected `User` extension

**Root Cause**:
- File: [middleware/auth.rs](../app/backend/crates/api/src/middleware/auth.rs#L153-L177)
- Middleware only validated, didn't convert

**Fix Applied** (2026-01-12 18:49 UTC):
- Modified `require_auth` to create User from AuthContext
- Lines 153-177 updated

**File Changed**:
- [app/backend/crates/api/src/middleware/auth.rs](../app/backend/crates/api/src/middleware/auth.rs#L153-L177)

**Validation Results**:
✅ cargo check: 0 errors
✅ Tests: 17 passed (up from 2)

**Status**: ✅ FIXED
```

---

## SOLUTION_SELECTION.md - Pending Decisions

### When to Use
- When 2+ solution paths exist
- When user input needed
- Before implementation

### Structure

```markdown
# SOLUTION SELECTION - Current Decisions

## P1: Issue Name
**Issue**: What needs deciding
**Options**: A, B, C

### Option A: Title ⭐ RECOMMENDED
**Pros**: ...
**Cons**: ...
**Effort**: X hours

### Option B: Title
**Pros**: ...
**Cons**: ...
**Effort**: X hours

### Recommendation
**Choose Option A** - Why
**Decision Owner**: User
**Status**: ⏳ AWAITING USER SELECTION
```

### Example

```markdown
## P1: CSRF Bypass for Development

**Issue**: POST requests failing 403 CSRF in tests

### Option A: Disable CSRF in Dev Mode ⭐ RECOMMENDED
**Pros**:
- Simple implementation (~10 lines)
- Aligns with existing patterns

**Cons**:
- Reduces dev security (low risk - local only)

**Effort**: 30-60 minutes

### Recommendation
**Choose Option A** - Simple, fast, aligns with dev bypass
**Decision Owner**: User
**Status**: ⏳ AWAITING USER SELECTION
```

---

## Archival Process

### When to Archive
After fixing issue OR after decision made, move files to archive/ with timestamp prefix

### Command
```bash
cd debug/
mv OLD_FILE.md archive/2026-01-12_OLD_FILE.md
```

### Archive Naming
- Format: `YYYY-MM-DD_FILENAME.md`
- Example: `2026-01-12_DECISION_A_IMPLEMENTATION.md`
- Group by date for easy browsing

---

## Process Phases Reference

| Phase | Name | Purpose | Documentation |
|-------|------|---------|----------------|
| 1 | ISSUE | Identify problem | Problem description + evidence |
| 2 | DOCUMENT | Analyze root cause | Root cause analysis + impact classification |
| 3 | EXPLORER | Search codebase | Related issues + affected code paths |
| 4 | DECISION | Multiple solutions | Options with pros/cons → User selects |
| 5 | FIX | Implement solution | Code changes + validation results |
| 6 | USER PUSHES | Deployment | User runs `git push origin BRANCH` |

**Where**: Issue → Phase 1 entry in DEBUGGING.md  
**When Multiple Solutions**: Move to Phase 4 in SOLUTION_SELECTION.md  
**After Fix**: Return to Phase 5 in DEBUGGING.md with results  
**After Push**: Mark as complete, archive the issue

---

## Current Session Status

**Session**: 2026-01-12  
**Phase**: 5 (FIX) → 6 (awaiting user pushes)  
**Active Issues**: 2 pending decisions  
**Test Results**: 17 passed, 17 failed (50% pass rate)  
**Backend Status**: Running, validated, ready

### Active Decisions
1. **P1 CSRF Bypass**: Option A (Dev Mode) recommended
2. **P2 Route Registration**: Option A (Audit & Register) recommended

### Next Action
User selects approach for each decision → Agent implements → Tests validated → Ready for push

---

## Best Practices

✅ **DO**:
- Keep DEBUGGING.md focused on active issues
- Use file:line format for code references
- Include timestamp for all changes
- Archive old files immediately after completion
- Link between DEBUGGING.md and SOLUTION_SELECTION.md
- Document validation results for every fix
- Clear phase status at all times

❌ **DON'T**:
- Leave multiple versions in root
- Put completed issues in DEBUGGING.md (archive them)
- Make decisions without documenting options
- Change code without updating DEBUGGING.md first
- Forget to include file:line references
- Leave decisions ambiguous about next steps

---

## Reference

- **Authority**: [DEBUGGING.instructions.md](../../.github/instructions/DEBUGGING.instructions.md)
- **Main Issue File**: [DEBUGGING.md](DEBUGGING.md)
- **Decision File**: [SOLUTION_SELECTION.md](SOLUTION_SELECTION.md)
- **Archive**: [archive/](archive/)
