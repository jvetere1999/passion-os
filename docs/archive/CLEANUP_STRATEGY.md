# Ignition Project Cleanup Strategy

**Status**: Active  
**Created**: January 12, 2026  
**Last Updated**: January 12, 2026  
**Scope**: Full project cleanup and optimization

---

## Executive Summary

The Ignition project has grown from a simple prototype to a production system with:
- 3 application layers (Backend, Frontend, Admin)
- 30+ test files
- 50+ documentation files
- Multiple experimental directories
- Scattered configuration files

This strategy consolidates everything into a clean, maintainable structure following industry best practices.

---

## Current Mess Analysis

### 1. Root Directory Clutter (~30 files)

**Current State**:
```
❌ schema.json (config file at root)
❌ DEBUGGING.md (documentation at root)
❌ SOLUTION_SELECTION.md (documentation at root)
❌ DATABASE_SCHEMA_DESYNC.md (outdated)
❌ HOTFIX_REQUIRED.md (outdated)
❌ DEBUGGING_REORGANIZATION_COMPLETE.md (old work)
❌ generate_schema.sh (build script at root)
❌ playwright.api.config.ts (config at root)
❌ reset.sql (database setup at root)
```

**Impact**: 
- Makes `ls` output overwhelming
- Hard to find actual config files
- Unclear what's current vs archived
- Violates project convention

**Fix**: Move to appropriate subdirectories

---

### 2. Scattered Documentation (50+ files)

**Current State**:
```
❌ Root level:
   - DEBUGGING.md
   - SOLUTION_SELECTION.md
   
❌ /debug/:
   - DEBUGGING.md (duplicate!)
   - SOLUTION_SELECTION.md (duplicate!)
   - archive/ (nested archive)
   
❌ /agent/:
   - DEBUGGING.md (third copy!)
   - DEBUGGING_PLAN.md
   - PROGRESS.md
   - SESSION_SUMMARY.md
   - [25+ other tracking files]
   
❌ /docs/:
   - Mixed content (guides, technical, history)
   
❌ /deprecated/:
   - Old code (but full directory structure mirrored)
   
❌ /debug_log/:
   - Log files from past sessions
```

**Impact**:
- 3 copies of same document (confusing!)
- No clear "source of truth"
- Hard to find current decisions
- Historical clutter mixed with active docs

**Fix**: Consolidate into single source of truth

---

### 3. Test Files Organization

**Current State**:
```
/tests/
├── api-admin.spec.ts
├── api-auth.spec.ts
├── api-books.spec.ts
├── api-e2e.spec.ts
├── api-fitness.spec.ts
├── api-focus.spec.ts
├── api-gamification.spec.ts
├── api-habits-goals.spec.ts
├── api-learn.spec.ts
├── api-market-quests.spec.ts
├── api-sync-settings.spec.ts
├── cross-device-sync.spec.ts
└── (NEW) api-response-format.spec.ts
```

**Issues**:
- All tests at same level (hard to find)
- Test types mixed (API, E2E, integration)
- No clear test categories

**Fix**: Organize by test type in subdirectories

---

### 4. Configuration Files Scattered

**Current State**:
```
❌ Root:
   - schema.json
   - .env.local
   
❌ /infra/:
   - .env.example
   - .env.local (second copy!)
   
❌ /app/backend:
   - .env.example (third copy!)
   
❌ /app/frontend:
   - .env.example (fourth copy!)
```

**Impact**:
- Multiple env file copies
- Unclear which is authoritative
- Schema location not obvious
- Configuration scattered across repo

**Fix**: Centralize in `.config/` with symlinks to app directories

---

### 5. Deployment & Infrastructure Confusion

**Current State**:
```
❌ deploy/
   ├── rollback.md
   ├── routing.md
   ├── cloudflare-admin/
   ├── cloudflare-api-proxy/
   ├── production/
   └── scripts/

❌ infra/
   ├── docker-compose.yml
   ├── docker-compose.e2e.yml
   └── [configs]
   
❌ scripts/
   ├── deploy-and-migrate.sh
   ├── neon-migrate.sh
   ├── run-e2e-tests.sh
   └── validate-schema-locally.sh
```

**Issues**:
- Unclear: What's infrastructure vs deployment?
- Scripts scattered in 3 locations
- No clear deployment flow
- Production routing docs buried in deploy/

**Fix**: Consolidate infrastructure + deployment guidance

---

### 6. Tools Directory Unclear

**Current State**:
```
/tools/
└── schema-generator/
    └── (only one tool)
```

**Issues**:
- Only one tool, but has dedicated folder
- No place for future tools
- Not clear this is for build/dev tools
- `prompts/` and `qc/` directories serve unclear purposes

**Fix**: Expand tools for future build/code-gen tools

---

## Cleanup Strategy (Detailed)

### PHASE 1: Documentation Consolidation

**Goal**: Single source of truth for all decisions and documentation

**Steps**:

1. **Archive Old Decision Logs**
   ```bash
   # Move to docs/archive/
   debug/DEBUGGING.md → docs/archive/2026-01-11_debugging.md
   debug/SOLUTION_SELECTION.md → docs/archive/2026-01-11_solutions.md
   agent/DEBUGGING.md → docs/archive/2026-01-11_agent_debug.md
   debug_log/* → docs/archive/debug_logs/
   agent/PROGRESS.md → docs/archive/2026-01-11_progress.md
   ```

2. **Create Decision Records (ADR format)**
   ```
   docs/decisions/
   ├── ADR-001-api-response-format.md        # Decision A implementation
   ├── ADR-002-error-notification-system.md
   ├── ADR-003-ableton-theme-system.md
   └── ADR-004-session-termination.md
   ```

3. **Consolidate Active Documentation**
   ```
   docs/
   ├── IMPLEMENTATION_LOG.md (current work)
   ├── ARCHITECTURE.md (system design)
   ├── API_SPECIFICATION.md (new)
   ├── DEPLOYMENT.md (deployment guide)
   └── DEVELOPMENT.md (dev setup)
   ```

**Commands**:
```bash
# Archive old decision logs
mkdir -p docs/archive/debug_logs
mv debug/DEBUGGING.md docs/archive/2026-01-11_debugging.md
mv debug/SOLUTION_SELECTION.md docs/archive/2026-01-11_solutions.md
mv debug_log/* docs/archive/debug_logs/

# Remove duplicate decision docs
rm agent/DEBUGGING.md agent/PROGRESS.md agent/SESSION_SUMMARY.md

# Keep only:
# - docs/decisions/ADR-*.md (decisions)
# - docs/guides/ (how-tos)
# - docs/archive/ (history)
```

**Files to Keep Active**:
- `docs/ARCHITECTURE.md` - System design
- `docs/API_SPECIFICATION.md` - API contracts
- `docs/DEVELOPMENT.md` - Dev setup guide
- `docs/DEPLOYMENT.md` - Deployment procedure

---

### PHASE 2: Configuration Centralization

**Goal**: Single source of truth for configuration

**Steps**:

1. **Create `.config/` directory**
   ```bash
   mkdir -p .config
   ```

2. **Move configuration files**
   ```bash
   mv schema.json .config/
   mv .env.example .config/
   mv .env.local .config/
   ```

3. **Create symlinks** (for app-specific .env files)
   ```bash
   ln -s ../../.config/.env.example app/backend/.env.example
   ln -s ../../.config/.env.example app/frontend/.env.example
   ln -s ../../.config/.env.example app/admin/.env.example
   ```

4. **Update imports**
   - Any code using `import schema from './schema.json'` → `'../.config/schema.json'`
   - Python scripts: update path references

**Why This Works**:
- Single source of truth
- Apps can override with symlink targets
- Easy to manage in Git
- Clear separation of concerns

---

### PHASE 3: Test Organization

**Goal**: Tests organized by type and easily discoverable

**Steps**:

1. **Create test subdirectories**
   ```bash
   mkdir -p tests/api tests/e2e tests/integration
   ```

2. **Move test files**
   ```bash
   # API contract tests
   mv tests/api-*.spec.ts tests/api/
   mv tests/api-response-format.spec.ts tests/api/
   
   # E2E UI tests
   mv tests/api-e2e.spec.ts tests/e2e/
   
   # Integration tests
   mv tests/cross-device-sync.spec.ts tests/integration/
   mv tests/api-sync-settings.spec.ts tests/integration/
   ```

3. **Move Playwright configs**
   ```bash
   # Create dedicated test directory config
   cp playwright.api.config.ts tests/
   mv playwright.api.config.ts tests/playwright.api.config.ts
   
   # Create new E2E config
   # (copied from api-e2e existing structure)
   mv tests/api-e2e.spec.ts tests/e2e/api-e2e.spec.ts
   ```

4. **Update GitHub Actions**
   ```yaml
   # Old: npx playwright test --config=playwright.api.config.ts
   # New: npx playwright test tests/api --config=tests/playwright.api.config.ts
   ```

**Result**:
```
tests/
├── api/                    # API contract tests
│   ├── api-response-format.spec.ts
│   ├── api-quests.spec.ts
│   └── playwright.api.config.ts
├── e2e/                   # End-to-end UI tests
│   ├── api-e2e.spec.ts
│   └── playwright.e2e.config.ts
└── integration/           # Cross-system tests
    ├── cross-device-sync.spec.ts
    └── playwright.integration.config.ts
```

---

### PHASE 4: Scripts Consolidation

**Goal**: All build/deploy/validation scripts in one place

**Steps**:

1. **Consolidate in `/scripts/`**
   ```bash
   # Move deploy scripts
   mv deploy/scripts/* scripts/
   mv scripts/deploy-and-migrate.sh scripts/deploy-backend.sh
   mv scripts/neon-migrate.sh scripts/utils/
   
   # Keep validation/test scripts
   # (already in scripts/ from new additions)
   ```

2. **Organize scripts/subdirectories**
   ```bash
   scripts/
   ├── deploy-backend.sh
   ├── deploy-frontend.sh
   ├── validate-all.sh
   ├── validate-api.sh
   ├── run-tests.sh
   ├── utils/
   │   ├── neon-migrate.sh
   │   └── database-setup.sh
   └── README.md
   ```

3. **Update package.json**
   ```json
   {
     "scripts": {
       "test": "./scripts/run-tests.sh",
       "validate": "./scripts/validate-all.sh",
       "deploy:backend": "./scripts/deploy-backend.sh",
       "deploy:frontend": "./scripts/deploy-frontend.sh"
     }
   }
   ```

**Commands**:
```bash
chmod +x scripts/*.sh
chmod +x scripts/utils/*.sh
```

---

### PHASE 5: Directory Cleanup

**Goal**: Remove unnecessary/redundant directories

**Steps**:

1. **Evaluate `/agent/` directory**
   ```
   Current: 30+ files for state tracking
   New: Keep only if used for active decision tracking
   Otherwise: Archive to docs/archive/agent/
   
   Decision: ARCHIVE (state should be in docs/ now)
   ```

2. **Evaluate `/qc/` directory**
   ```
   Current: QC process documentation
   Action: Move to docs/quality-assurance/
   ```

3. **Evaluate `/prompts/` directory**
   ```
   Current: LLM prompt packages (seems experimental)
   Action: Archive to docs/archive/prompts/ (low priority)
   ```

4. **Archive `/deprecated/` properly**
   ```
   Current: Mirror of entire old structure
   Action: Keep as-is (minimal space, useful for reference)
   OR: Delete if code has been fully migrated
   ```

5. **Consolidate `/debug/` and `/debug_log/`**
   ```bash
   # Archive everything
   mv debug/archive/* docs/archive/
   mv debug_log/* docs/archive/debug_logs/
   
   # These dirs can be deleted once fully archived
   rm -rf debug debug_log
   ```

---

### PHASE 6: Root Directory Cleanup

**Goal**: Minimal, clean root directory

**Steps**:

1. **Remove outdated files**
   ```bash
   rm DEBUGGING_REORGANIZATION_COMPLETE.md
   rm HOTFIX_REQUIRED.md
   rm DATABASE_SCHEMA_DESYNC.md
   ```

2. **Move build scripts**
   ```bash
   mv generate_schema.sh tools/schema-generator/
   mv reset.sql app/database/
   ```

3. **Move test config**
   ```bash
   mv playwright.api.config.ts tests/
   ```

4. **Create root manifest**
   ```bash
   # Document what remains and why
   cat > ROOT_FILES_MANIFEST.md << 'EOF'
   # Root Directory Files
   
   These files remain in the project root:
   - README.md (project overview)
   - LICENSE (license)
   - .gitignore (git configuration)
   - package.json (workspace config)
   - [other necessary files]
   
   For organization, see docs/PROJECT_REORGANIZATION_PROPOSAL.md
   EOF
   ```

**Result**:
```bash
ls -la
total ~12 files (down from ~30)
README.md
LICENSE
.gitignore
package.json
ROOT_FILES_MANIFEST.md
[remaining files only if essential]
```

---

### PHASE 7: Update Internal References

**Goal**: Ensure all imports and references still work

**Steps**:

1. **Python script updates**
   ```python
   # Old: schema_path = 'schema.json'
   # New: schema_path = '.config/schema.json'
   ```

2. **Build script updates**
   ```bash
   # Old: cat reset.sql | psql ...
   # New: cat app/database/reset.sql | psql ...
   ```

3. **Docker reference updates**
   ```dockerfile
   # Old: COPY schema.json /app/
   # New: COPY .config/schema.json /app/
   ```

4. **GitHub Actions updates**
   ```yaml
   # Update all path references:
   - run: ./scripts/run-tests.sh          # (new location)
   - run: ./scripts/validate-all.sh       # (new location)
   ```

5. **Documentation link updates**
   ```markdown
   # Old: [See DEBUGGING.md](./DEBUGGING.md)
   # New: [See decisions](./docs/decisions/)
   ```

---

## Execution Timeline

| Phase | Task | Time | Status |
|-------|------|------|--------|
| 1 | Documentation consolidation | 45 min | Not Started |
| 2 | Configuration centralization | 30 min | Not Started |
| 3 | Test organization | 45 min | Not Started |
| 4 | Scripts consolidation | 30 min | Not Started |
| 5 | Directory cleanup | 30 min | Not Started |
| 6 | Root cleanup | 15 min | Not Started |
| 7 | Update references | 1 hour | Not Started |
| 8 | Testing & validation | 1 hour | Not Started |
| **TOTAL** | | **4-6 hours** | |

---

## Risk Mitigation

### What Could Go Wrong?

| Risk | Probability | Mitigation |
|------|-------------|-----------|
| Broken imports | High | Update references in Phase 7, test thoroughly |
| Workflow failures | Medium | Test GitHub Actions after phase 6 |
| Database migration issues | Low | Keep schema.json backward compatible |
| Team confusion | High | Document all changes in migration guide |

### Rollback Plan

```bash
# Simple: revert to previous commit
git revert --no-edit <commit-hash>

# The move is primarily file reorganization, 
# so if needed, changes are easy to undo
```

---

## Benefits Summary

### Immediate
- ✅ ~18 fewer files in root directory
- ✅ Cleaner `git status` output
- ✅ Easier to find configuration files
- ✅ Single source of truth for decisions

### Long-term
- ✅ Better developer onboarding
- ✅ Clearer project structure for new contributors
- ✅ Easier to scale and add new tools
- ✅ Professional project appearance
- ✅ Reduced cognitive load

### Measurable
```
Before: 35+ files in root, 50+ docs scattered, 3x decision duplication
After:  ~10 files in root, 15+ docs organized, single source of truth

Improvement: ~65% cleaner root, 70% better doc organization
```

---

## Success Criteria

- [ ] Root directory has ≤12 files
- [ ] All test files organized by type
- [ ] No duplicate documentation files
- [ ] All scripts in `/scripts/` directory
- [ ] Configuration files in `.config/` directory
- [ ] All imports/references updated and tested
- [ ] GitHub Actions workflows still work
- [ ] Database migrations still work
- [ ] Team members briefed on new structure

---

## Next Steps

1. **Approval**: Review and approve cleanup strategy
2. **Create branch**: `feat/project-reorganization`
3. **Execute phases**: Follow timeline above
4. **Testing**: Validate at each phase
5. **Team communication**: Brief team on changes
6. **Merge**: Once all phases complete and tested
7. **Documentation**: Update contribution guide with new structure

---

## References

- Project Reorganization Proposal: `docs/PROJECT_REORGANIZATION_PROPOSAL.md`
- Current Architecture: `docs/ARCHITECTURE.md`
- Development Setup: `docs/DEVELOPMENT.md`
