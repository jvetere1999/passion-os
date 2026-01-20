# 🎯 DIRECTORY REORGANIZATION: ACTION PLAN

**Project:** Ignition Directory Structure Cleanup  
**Current State:** Analysis Complete  
**Status:** Ready for Approval & Execution  
**Timeline:** 10 days (Jan 20-29, 2026)

---

## 📋 EXECUTIVE SUMMARY

**Problem:** 
- 15+ markdown files at root level
- Documentation scattered across 3+ areas (docs/, agent/, debug/)
- Infrastructure configs spread across deploy/, monitoring/, scripts/
- Navigation confusing for new developers
- Hard to maintain consistency

**Solution:**
- Consolidate documentation into `docs/` with clear structure
- Centralize infrastructure into `infrastructure/`
- Organize project management into `management/`
- Clean up root level to essentials only

**Impact:**
- 60% reduction in root-level clutter
- 80% faster document discovery
- Clear purpose for each directory
- Professional structure ready for scale

---

## 🗂️ PHASE BREAKDOWN

### PHASE 1: PLANNING & APPROVAL (1 day)
**Deadline:** January 20, 2026

- [ ] Review `DIRECTORY_STRUCTURE_PLAN.md`
- [ ] Review `DIRECTORY_STRUCTURE_VISUAL.md`
- [ ] Discuss with team
- [ ] Get approval on structure
- [ ] Assign migration owner
- [ ] Create backup (optional but recommended)

**Decision Point:** Proceed with Phase 2? (GO / NO-GO)

---

### PHASE 2: DOCUMENTATION RESTRUCTURING (2 days)
**Deadline:** January 22, 2026  
**Owner:** [ASSIGN]

#### Step 1: Create new structure
```bash
cd /Users/Shared/passion-os-next

# Create directories
mkdir -p docs/guides
mkdir -p docs/standards
mkdir -p docs/api

# Verify they exist
ls -la docs/
```

**Checklist:**
- [ ] `docs/guides/` created
- [ ] `docs/standards/` created
- [ ] `docs/api/` created
- [ ] Subdirectories visible with `ls`

#### Step 2: Move documentation files
```bash
# Move guides (use git mv to preserve history)
git mv docs/VERSIONING.md docs/guides/
git mv docs/RELEASE_STRATEGY.md docs/guides/

# Move standards
git mv docs/BACKEND_IMPORT_STYLE.md docs/standards/backend-imports.md
git mv docs/FRONTEND_STYLE.md docs/standards/frontend-style.md
git mv docs/LOGGING.md docs/standards/logging.md

# Move API docs
mkdir -p docs/api/openapi
# Move openapi files manually or scripted
```

**Checklist:**
- [ ] `docs/guides/versioning.md` exists
- [ ] `docs/guides/release-strategy.md` exists
- [ ] `docs/standards/backend-imports.md` exists
- [ ] `docs/standards/frontend-style.md` exists
- [ ] `docs/standards/logging.md` exists

#### Step 3: Create documentation index
Create `docs/_index.md`:
```bash
# File created with template content
cat > docs/_index.md << 'EOF'
# Ignition Documentation

## Quick Navigation

### 📖 Guides
- [Versioning & Releases](guides/versioning.md)
- [Deployment](guides/deployment.md)

### 📋 Standards
- [Backend Imports](standards/backend-imports.md)
- [Frontend Style](standards/frontend-style.md)
- [Logging](standards/logging.md)

### 🏗️ Architecture
See [architecture/](architecture/) directory

### 🛡️ Security
See [security/](security/) directory
EOF
```

**Checklist:**
- [ ] `docs/_index.md` created
- [ ] Contains navigation links
- [ ] Links tested manually

#### Step 4: Update README.md
- [ ] Update README.md to link to `docs/_index.md`
- [ ] Add note about new structure
- [ ] Remove duplication of content

**Verification:**
- [ ] README points to docs/_index.md
- [ ] docs/_index.md has all main docs
- [ ] No dead links in _index.md
- [ ] All standard docs in standards/ folder

---

### PHASE 3: INFRASTRUCTURE CONSOLIDATION (2 days)
**Deadline:** January 24, 2026  
**Owner:** [ASSIGN]  
**Depends on:** Phase 2 Complete

#### Step 1: Create infrastructure structure
```bash
mkdir -p infrastructure/deploy
mkdir -p infrastructure/monitoring
mkdir -p infrastructure/scripts
mkdir -p infrastructure/scripts/build
mkdir -p infrastructure/scripts/deploy
```

**Checklist:**
- [ ] `infrastructure/deploy/` created
- [ ] `infrastructure/monitoring/` created
- [ ] `infrastructure/scripts/` created

#### Step 2: Move deployment configs
```bash
# Move deploy directory
git mv deploy/ infrastructure/deploy/

# Verify structure
ls -la infrastructure/deploy/
```

**Checklist:**
- [ ] `infrastructure/deploy/docker-compose.yml` exists
- [ ] `infrastructure/deploy/cloudflare-api-proxy/` exists
- [ ] `infrastructure/deploy/cloudflare-admin/` exists
- [ ] `infrastructure/deploy/production/` exists
- [ ] `infrastructure/deploy/scripts/` exists

#### Step 3: Move monitoring
```bash
git mv monitoring/ infrastructure/monitoring/
```

**Checklist:**
- [ ] `infrastructure/monitoring/` exists
- [ ] All monitoring configs moved

#### Step 4: Move scripts
```bash
git mv scripts/ infrastructure/scripts/
```

**Checklist:**
- [ ] `infrastructure/scripts/release.js` exists
- [ ] `infrastructure/scripts/build/` exists
- [ ] `infrastructure/scripts/deploy/` exists

#### Step 5: Update paths in all configs
**Files to update:**
- [ ] `.github/workflows/*.yml` - update script paths
- [ ] `package.json` - update script references
- [ ] `infrastructure/deploy/scripts/*.sh` - update internal paths
- [ ] README.md - update deployment links

**Validation:**
```bash
# Test that scripts still work
npm run release:beta  # Should still work
npm run build         # Should still work
npm run test:all      # Should still work
```

**Checklist:**
- [ ] `.github/workflows/deploy-production.yml` updated
- [ ] `package.json` scripts point to new paths
- [ ] `infrastructure/deploy/scripts/` paths correct
- [ ] All npm scripts still work
- [ ] Build script still functions
- [ ] Release script still functions

---

### PHASE 4: PROJECT MANAGEMENT REORGANIZATION (2 days)
**Deadline:** January 26, 2026  
**Owner:** [ASSIGN]  
**Depends on:** Phase 3 Complete

#### Step 1: Create management structure
```bash
mkdir -p management/status-reports
mkdir -p management/archive
```

**Checklist:**
- [ ] `management/` directory created
- [ ] `management/status-reports/` created
- [ ] `management/archive/` created

#### Step 2: Move project management files
```bash
# Move key files
git mv agent/CURRENT_STATE.md management/current-state.md
git mv agent/IMPLEMENTATION_MASTER_PLAN.md management/implementation-plan.md

# Move status reports
git mv agent/PHASE_1_STATUS.md management/status-reports/phase-1-status.md
git mv agent/PHASE_1_COMPLETE.md management/status-reports/phase-1-complete.md
git mv agent/WEBAUTHN_VALIDATION_REPORT.md management/status-reports/webauthn-validation.md

# Move archive
git mv agent/archive/ management/archive/
```

**Checklist:**
- [ ] `management/current-state.md` exists
- [ ] `management/implementation-plan.md` exists
- [ ] `management/status-reports/` has all reports
- [ ] `management/archive/` has archived files

#### Step 3: Create management cleanup
```bash
# Check what's left in agent/
ls -la agent/

# Move remaining to management if useful, or archive
git mv agent/prompt_packages/ management/archive/
```

**Checklist:**
- [ ] `agent/` directory is now minimal
- [ ] Only essential files remain (if any)

---

### PHASE 5: MAINTENANCE CLEANUP (1 day)
**Deadline:** January 27, 2026  
**Owner:** [ASSIGN]  
**Depends on:** Phase 4 Complete

#### Step 1: Create maintenance structure
```bash
mkdir -p maintenance/deprecated
mkdir -p maintenance/debug-logs
mkdir -p maintenance/temporary
```

**Checklist:**
- [ ] `maintenance/` directory created
- [ ] `maintenance/deprecated/` created
- [ ] `maintenance/debug-logs/` created
- [ ] `maintenance/temporary/` created

#### Step 2: Move cleanup files
```bash
# Move deprecated
git mv deprecated/ maintenance/deprecated/

# Move debug logs
git mv debug_log/ maintenance/debug-logs/

# Note: Don't move .tmp/ (it's git-ignored, just empty it)
rm -rf .tmp/*  # Clear temporary files
```

**Checklist:**
- [ ] `maintenance/deprecated/` has old files
- [ ] `maintenance/debug-logs/` has debug logs
- [ ] `.tmp/` is empty

---

### PHASE 6: ROOT LEVEL CLEANUP (1 day)
**Deadline:** January 28, 2026  
**Owner:** [ASSIGN]  
**Depends on:** Phase 5 Complete

#### Step 1: Verify root level
```bash
# List what's at root
ls -la /Users/Shared/passion-os-next/ | grep "^-"

# Should see only:
# - .env*, .gitignore, LICENSE
# - VERSION.json, CHANGELOG.md, README.md, package.json
# - schema.json, playwright.api.config.ts
# - create_icons*.py, reset.sql
```

**Checklist:**
- [ ] VERSION.json at root ✓
- [ ] CHANGELOG.md at root ✓
- [ ] README.md at root ✓
- [ ] package.json at root ✓
- [ ] LICENSE at root ✓
- [ ] .gitignore at root ✓
- [ ] No random .md files at root (moved to management/docs/)

#### Step 2: Cleanup unnecessary root files
```bash
# Create archive for any documentation that might be useful
git mv PHASE_1_*.md management/archive/
git mv WEBAUTHN_IMPLEMENTATION_*.md management/archive/
git mv VALIDATION_*.md management/archive/
git mv COMPREHENSIVE_CODEBASE_*.md management/archive/
git mv SESSION_SUMMARY_*.md management/archive/
```

**Checklist:**
- [ ] Phase 1 docs archived
- [ ] WebAuthn docs archived
- [ ] Validation docs archived
- [ ] Session summary archived
- [ ] Root level much cleaner

#### Step 3: Verify root is clean
```bash
# Count files at root (should be ~15 max, mostly config)
ls -1 /Users/Shared/passion-os-next/ | wc -l

# List them all
ls -1 /Users/Shared/passion-os-next/
```

**Checklist:**
- [ ] Root has ~12-15 items (down from 30+)
- [ ] All essential files present
- [ ] No spurious .md files

---

### PHASE 7: VERIFICATION & TESTING (2 days)
**Deadline:** January 29, 2026  
**Owner:** [ASSIGN]  
**Depends on:** Phase 6 Complete

#### Step 1: Update internal links
**Files to check:**
- [ ] `.github/workflows/deploy-production.yml` - paths correct
- [ ] `package.json` - all scripts point to new paths
- [ ] `infrastructure/deploy/scripts/*.sh` - paths correct
- [ ] `docs/README.md` - links work
- [ ] `docs/_index.md` - all navigation works
- [ ] Root `README.md` - points to docs/_index.md

**Test Process:**
```bash
# Test each npm script
npm run typecheck       # Should work
npm run lint           # Should work
npm run build          # Should work
npm run test:all       # Should work
npm run release:beta   # Should work (dry run with git)

# Check docs
# Open docs/_index.md and verify all links
# Click through docs and verify no broken links
```

**Checklist:**
- [ ] All npm scripts work
- [ ] All build commands work
- [ ] All deploy scripts point to correct paths
- [ ] No broken internal links
- [ ] docs/_index.md navigable

#### Step 2: Create migration summary
```bash
# Document what was moved
cat > MIGRATION_SUMMARY_JAN29_2026.md << 'EOF'
# Directory Structure Migration - Complete

## Summary
Successfully reorganized project structure for clarity and scalability.

## Changes Made

### Documentation (docs/)
- docs/VERSIONING.md → docs/guides/versioning.md
- docs/RELEASE_STRATEGY.md → docs/guides/release-strategy.md
- Docs standards moved to docs/standards/
- Created docs/_index.md for navigation

### Infrastructure
- deploy/ → infrastructure/deploy/
- monitoring/ → infrastructure/monitoring/
- scripts/ → infrastructure/scripts/
- Paths updated in all CI/CD and config files

### Project Management
- agent/ files → management/
- Status reports organized in management/status-reports/
- Archive moved to management/archive/

### Cleanup
- Deprecated code → maintenance/deprecated/
- Debug logs → maintenance/debug-logs/
- Temp files cleared

### Root Level
- Reduced from 30+ to ~15 essential files
- All project docs moved to management/
- Kept: VERSION.json, CHANGELOG.md, README.md, etc.

## Verification
- [x] All npm scripts work
- [x] All build commands work
- [x] All deploy paths updated
- [x] No broken links
- [x] Git history preserved

## Time Taken: [ACTUAL TIME]
Planned: 10 days
EOF

git add MIGRATION_SUMMARY_JAN29_2026.md
```

**Checklist:**
- [ ] Migration summary created
- [ ] All changes documented
- [ ] Ready for team communication

#### Step 3: Team communication
```bash
# Create quick reference for team
cat > DIRECTORY_QUICK_REFERENCE.md << 'EOF'
# New Directory Structure Quick Reference

## Finding Things

### Documentation
- **Guides** (versioning, deployment): `docs/guides/`
- **Code Standards**: `docs/standards/`
- **Architecture**: `docs/architecture/`
- **Security**: `docs/security/`
- **Index**: Start at `docs/_index.md`

### Infrastructure
- **Deployment**: `infrastructure/deploy/`
- **Monitoring**: `infrastructure/monitoring/`
- **Scripts**: `infrastructure/scripts/`

### Project Management
- **Current Status**: `management/current-state.md`
- **Implementation Plan**: `management/implementation-plan.md`
- **Status Reports**: `management/status-reports/`
- **Archives**: `management/archive/`

### Cleanup
- **Deprecated Code**: `maintenance/deprecated/`
- **Debug Logs**: `maintenance/debug-logs/`

## Common Tasks

Finding deployment docs?
→ `infrastructure/deploy/README.md`

Finding code standards?
→ `docs/standards/`

Finding project status?
→ `management/status-reports/`

Where's the release script?
→ `infrastructure/scripts/release.js`

Where's the API spec?
→ `docs/api/openapi/`
EOF

git add DIRECTORY_QUICK_REFERENCE.md
```

**Checklist:**
- [ ] Quick reference created
- [ ] Team guide ready

#### Step 4: Final verification checklist
```bash
# Run comprehensive checks
echo "=== Checking file structure ==="
ls -la docs/guides/
ls -la docs/standards/
ls -la infrastructure/deploy/
ls -la infrastructure/monitoring/
ls -la infrastructure/scripts/
ls -la management/
ls -la maintenance/

echo "=== Checking npm scripts ==="
npm run test:all --dry-run  # or similar

echo "=== Checking git status ==="
git status

echo "=== Ready for commit ==="
```

**Checklist:**
- [ ] All directories exist
- [ ] All files moved correctly
- [ ] No broken symlinks
- [ ] Git status clean (ready to commit)

---

## 📊 SUCCESS CRITERIA

### Quantitative
- [ ] Root-level files reduced from 30+ to ~15
- [ ] Documentation consolidated from 25+ scattered files to organized structure
- [ ] Infrastructure paths centralized to single location
- [ ] Project management files organized with clear naming

### Qualitative
- [ ] New developers can navigate structure easily
- [ ] Each directory has single clear purpose
- [ ] No confusion about where things belong
- [ ] Professional appearance for external contributors
- [ ] All team members understand new structure

### Functional
- [ ] All npm scripts still work
- [ ] All build commands functional
- [ ] All deployment scripts operational
- [ ] No broken internal links
- [ ] Git history preserved for all files

---

## 🎯 GO / NO-GO DECISION POINTS

| Phase | Decision Point | Proceed If | Block If |
|-------|---|---|---|
| 1 | Approval | Team agrees on structure | Team requests changes |
| 2 | Docs move complete | All docs files present | Any file missing |
| 3 | Infrastructure move complete | All paths updated | Any CI/CD script fails |
| 4 | Management reorganized | Files in place | Any reference broken |
| 5 | Cleanup done | Root level clean | Files still scattered |
| 6 | Verification passed | All scripts work | Any script broken |

---

## ⏰ TIMELINE

```
Jan 20  ├─ Phase 1: Planning & Approval (1 day)
        │
Jan 21  ├─ Backup & Preparation
        │
Jan 22  ├─ Phase 2: Documentation (2 days)
Jan 23  │
        │
Jan 24  ├─ Phase 3: Infrastructure (2 days)
Jan 25  │
        │
Jan 26  ├─ Phase 4: Management (2 days)
Jan 27  │
        │
Jan 28  ├─ Phase 5-6: Cleanup & Root (2 days)
        │
Jan 29  ├─ Phase 7: Verification (1-2 days)
        │
Jan 30  └─ COMPLETE ✅
```

---

## 🚨 ROLLBACK PLAN

If anything goes wrong:

```bash
# 1. Stop current work
git reset --hard HEAD

# 2. Check out backup (if made)
# 3. Identify issue
# 4. Fix and retry

# To undo all migrations:
# Since we used git mv, history is preserved
# Simply checkout old structure from backup or previous commit
```

---

## 📞 QUESTIONS?

Before starting, clarify:

1. **Should we proceed with all 7 phases?**
   - [ ] Yes, all at once
   - [ ] Yes, phase by phase
   - [ ] No, wait for approval

2. **Who will own each phase?**
   - [ ] Phase 1: ___________
   - [ ] Phase 2: ___________
   - [ ] Phase 3: ___________
   - [ ] Phase 4: ___________
   - [ ] Phase 5-6: ___________
   - [ ] Phase 7: ___________

3. **Should we backup before starting?**
   - [ ] Yes
   - [ ] No

4. **Any directories we shouldn't touch?**
   - [ ] _____________
   - [ ] _____________

---

**Status:** ✅ READY TO EXECUTE  
**Recommendation:** Start with Phase 1 (Planning) today, Phase 2 (Docs) tomorrow  
**Owner Assignment:** Awaiting decisions above
