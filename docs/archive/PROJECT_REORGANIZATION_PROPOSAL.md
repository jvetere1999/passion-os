# Ignition Project Structure Reorganization Proposal

**Status**: Proposal Phase  
**Date**: January 12, 2026  
**Priority**: High (Project complexity growing)  
**Estimated Implementation Time**: 4-6 hours

---

## Current State Analysis

### Problems with Current Structure

1. **Excessive Top-Level Files** (~30 files in root)
   - No clear separation between build artifacts, docs, and infrastructure
   - Makes it hard to find configuration files
   - Creates cognitive overload

2. **Scattered Documentation**
   - `DEBUGGING.md`, `SOLUTION_SELECTION.md` in root
   - Additional copies in `debug/` and `agent/`
   - Inconsistent naming and location of guidance docs

3. **Nested Depth in Key Directories**
   - `agent/` folder has grown to 30+ files (now contains full state tracking)
   - `debug/` folder has nested `archive/` with historical files
   - Makes navigation difficult

4. **Deployment Confusing**
   - Separate `deploy/` folder with unclear relationship to `infra/`
   - Scripts in both locations
   - Production vs dev environments unclear

5. **Testing Infrastructure Split**
   - Tests in `/tests` at root
   - Docker compose files in `infra/`
   - Scripts in `scripts/`
   - Playwright config at root
   - No clear testing narrative

6. **Utilities & Tools Scattered**
   - `tools/schema-generator/` buried deep
   - `scripts/` directory unclear purpose
   - `prompts/` folder (unclear usage)

---

## Proposed Structure

```
ignition/
├── README.md
├── .gitignore
├── LICENSE
├── package.json (workspace config)
│
├── .config/                              # Configuration (NEW)
│   ├── .env.example                      # Environment template
│   ├── .env.local                        # Local overrides (git-ignored)
│   ├── schema.json                       # ← Moved from root
│   └── tsconfig.json (moved from app/)   # Shared TypeScript config
│
├── infra/                                # Infrastructure & Deployment
│   ├── docker-compose.yml                # Production-like local dev
│   ├── docker-compose.e2e.yml            # E2E testing environment
│   ├── docker-compose.dev.yml            # Frontend + backend dev (NEW)
│   ├── .env.example                      # Docker env template
│   ├── Dockerfile.api                    # ← Moved from app/backend
│   ├── postgres-init.sql                 # Database setup script
│   └── README.md                         # Infrastructure guide
│
├── scripts/                              # Build & Deployment Scripts
│   ├── validate-all.sh                   # Full project validation
│   ├── validate-api.sh                   # API compliance validation
│   ├── run-tests.sh                      # Run all test suites
│   ├── deploy-backend.sh                 # Deploy backend (NEW)
│   ├── deploy-frontend.sh                # Deploy frontend (NEW)
│   └── README.md                         # Scripts guide
│
├── tests/                                # Test Suites
│   ├── api/                              # API tests (NEW subdirectory)
│   │   ├── api-auth.spec.ts              # ← moved
│   │   ├── api-quests.spec.ts            # ← moved
│   │   ├── api-response-format.spec.ts   # ← moved
│   │   └── api-*.spec.ts                 # Other endpoints
│   │
│   ├── e2e/                              # End-to-end UI tests (NEW)
│   │   ├── auth.spec.ts
│   │   ├── dashboard.spec.ts
│   │   └── critical-paths.spec.ts
│   │
│   ├── integration/                      # Integration tests (NEW)
│   │   ├── cross-device-sync.spec.ts     # ← moved
│   │   └── api-sync-settings.spec.ts     # ← moved
│   │
│   ├── playwright.config.ts              # Main Playwright config (NEW)
│   ├── playwright.api.config.ts          # API tests config
│   ├── playwright.e2e.config.ts          # E2E tests config (NEW)
│   └── README.md                         # Testing guide
│
├── docs/                                 # Documentation
│   ├── README.md                         # Main documentation index
│   ├── ARCHITECTURE.md                   # System design
│   ├── API_SPECIFICATION.md              # API contracts (NEW)
│   ├── DEPLOYMENT.md                     # Deployment guide
│   ├── DEVELOPMENT.md                    # Development setup
│   ├── DATABASE.md                       # Database schema & migrations
│   │
│   ├── archive/                          # Historical documentation
│   │   ├── 2026-01-11_decisions.md
│   │   ├── 2026-01-11_api_fixes.md
│   │   └── [historical docs]
│   │
│   ├── decisions/                        # Architecture decision records (NEW)
│   │   ├── ADR-001-api-response-format.md
│   │   ├── ADR-002-error-notification.md
│   │   └── ADR-*.md
│   │
│   └── guides/                           # How-to guides
│       ├── adding-new-feature.md
│       ├── database-migrations.md
│       ├── debugging-guide.md
│       └── testing-guide.md
│
├── app/
│   ├── backend/
│   │   ├── Cargo.toml
│   │   ├── crates/
│   │   │   ├── api/
│   │   │   │   ├── src/
│   │   │   │   │   ├── main.rs
│   │   │   │   │   ├── db/
│   │   │   │   │   │   ├── models.rs
│   │   │   │   │   │   ├── quests_repos.rs
│   │   │   │   │   │   ├── goals_repos.rs
│   │   │   │   │   │   └── [other repos]
│   │   │   │   │   ├── routes/
│   │   │   │   │   ├── middleware/
│   │   │   │   │   └── utils/
│   │   │   │   ├── Cargo.toml
│   │   │   │   └── README.md
│   │   │   ├── auth/                     # Authentication library
│   │   │   ├── migrations/               # Database migrations
│   │   │   └── shared/                   # Shared utilities
│   │   │
│   │   ├── Dockerfile                    # ← moved to infra/
│   │   ├── .dockerignore
│   │   ├── .env.example
│   │   └── README.md
│   │
│   ├── frontend/
│   │   ├── src/
│   │   │   ├── app/
│   │   │   ├── components/
│   │   │   ├── lib/
│   │   │   │   ├── api/                  # API clients (already well-organized)
│   │   │   │   ├── hooks/
│   │   │   │   ├── theme/
│   │   │   │   └── types/
│   │   │   ├── styles/
│   │   │   └── utils/
│   │   │
│   │   ├── package.json
│   │   ├── next.config.ts
│   │   ├── .env.example
│   │   └── README.md
│   │
│   ├── admin/
│   │   ├── [similar structure to frontend]
│   │   └── README.md
│   │
│   ├── database/
│   │   ├── migrations/
│   │   │   ├── 0001_schema.sql
│   │   │   ├── 0002_seeds.sql
│   │   │   └── README.md
│   │   └── README.md
│   │
│   └── README.md                         # App layer overview
│
├── .github/
│   ├── workflows/
│   │   ├── test.yml
│   │   ├── deploy-backend.yml
│   │   ├── deploy-frontend.yml
│   │   └── [other workflows]
│   │
│   ├── instructions/                     # ← Moved from root
│   │   ├── DEBUGGING.instructions.md
│   │   ├── GIT_WORKFLOW.instructions.md
│   │   └── [other instructions]
│   │
│   └── CONTRIBUTING.md
│
├── tools/                                # Build & Development Tools
│   ├── schema-generator/
│   │   ├── generate_all.py
│   │   ├── requirements.txt
│   │   └── README.md
│   │
│   ├── code-gen/                         # Code generation tools (NEW)
│   │   ├── generate-api-client.py
│   │   └── README.md
│   │
│   └── README.md
│
├── .gitignore
├── .gitattributes
├── LICENSE
└── ROOT_FILES_MANIFEST.md                # Documents remaining root-level files (NEW)
```

---

## Detailed Changes

### 1. **Move Configuration to `.config/`**

```bash
# Current → New
schema.json → .config/schema.json
.env.example → .config/.env.example
.env.local → .config/.env.local
```

**Rationale**: Centralizes all configuration files, keeps root clean

### 2. **Reorganize Tests by Type**

```bash
tests/
├── api/               # API contract tests
├── e2e/              # End-to-end UI tests
└── integration/      # Cross-system integration tests
```

**Rationale**: Clearer test organization, easier to run specific test types

### 3. **Consolidate Documentation**

```bash
docs/
├── decisions/        # Architecture Decision Records
├── guides/          # How-to guides
└── archive/         # Historical documentation
```

**Rationale**: All docs in one place, clear organization, decisions tracked

### 4. **Clarify Deployment vs Infrastructure**

```bash
infra/               # Infrastructure setup (Docker, Postgres)
scripts/             # Build, deploy, validate scripts
```

**Rationale**: Clear separation of concerns

### 5. **Centralize Tools**

```bash
tools/
├── schema-generator/  # Database schema generation
├── code-gen/         # Code generation tools
└── scripts/          # Utility scripts
```

**Rationale**: Single place for all build/dev tools

---

## Migration Plan

### Phase 1: Preparation (30 min)
- [ ] Create `.config/` directory structure
- [ ] Create `tools/` subdirectories
- [ ] Create `tests/api`, `tests/e2e`, `tests/integration`
- [ ] Create `docs/decisions`, `docs/guides`

### Phase 2: File Migration (2 hours)
- [ ] Move `schema.json` → `.config/schema.json`
- [ ] Move `.env.example` → `.config/.env.example`
- [ ] Move Dockerfile → `infra/Dockerfile.api`
- [ ] Move test files into organized structure
- [ ] Move documentation files
- [ ] Move `.github/instructions/` → current location (in `.github/`)

### Phase 3: Update References (1.5 hours)
- [ ] Update `import` statements (schema.json path)
- [ ] Update GitHub workflows to reference new paths
- [ ] Update script references in `package.json`
- [ ] Update Docker references in compose files
- [ ] Update documentation links

### Phase 4: Archive Old Structure (30 min)
- [ ] Move root-level debug files to `docs/archive/`
- [ ] Move deprecated files to `deprecated/` (per instructions)
- [ ] Create `ROOT_FILES_MANIFEST.md` documenting what remains

### Phase 5: Testing & Validation (1 hour)
- [ ] Run `npm install` to ensure dependencies still work
- [ ] Run `cargo check` to ensure Rust still builds
- [ ] Run test scripts to verify test discovery
- [ ] Verify GitHub workflows still trigger correctly

---

## Impact Analysis

### What Changes

| Category | Current | New | Impact |
|----------|---------|-----|--------|
| Root-level files | ~35 | ~10 | Major cleanup |
| Test location clarity | Scattered | Organized | Better DX |
| Documentation location | Scattered | Centralized | Better findability |
| Config clarity | Mixed | Centralized in `.config/` | Better clarity |

### What Stays the Same

- Application code structure (`app/backend`, `app/frontend`, `app/admin`)
- Database migrations location
- GitHub Actions workflows location (but organization improves)
- All functionality remains identical

### Backwards Compatibility

- **Git History**: Preserved (git can track renames)
- **Workflows**: May need one-time updates
- **Documentation**: Links need updating (but can be automated)
- **Scripts**: Will update paths automatically

---

## Cleanup Strategy

### Phase 1: Remove Duplication
```
Duplicated Files to Remove/Archive:
- agent/DEBUGGING.md → archive (moved to debug/DEBUGGING.md)
- debug/archive/* → docs/archive/
- deprecated/ → move to docs/deprecated/
```

### Phase 2: Consolidate Decision Tracking
```
Current State:
- debug/DEBUGGING.md
- debug/SOLUTION_SELECTION.md
- agent/DECISIONS.md
- agent/DECISIONS_REGISTER.md

New State (single source of truth):
- docs/decisions/ADR-*.md (Architecture Decision Records)
- docs/IMPLEMENTATION_LOG.md (Current work)
```

### Phase 3: Archive Historical Files
```
Keep:
- Latest implementation docs
- Current decisions
- Active issues

Archive:
- Past implementation results
- Old phase documents
- Historical debug logs
```

### Phase 4: Remove Obsolete Directories
```
Delete:
- deprecated/ (if fully archived)
- qc/ (move to docs/archive/)
- debug_log/ (consolidate into docs/)
- prompts/ (evaluate necessity)
```

---

## Implementation Strategy

### Safe Migration Approach

1. **Create New Structure** (non-destructive)
   - Create all new directories
   - Copy files to new locations
   - Update references

2. **Verify Everything Works**
   - Run tests from new locations
   - Run builds from new locations
   - Check all imports resolve

3. **Commit Before Cleanup**
   - Commit with new structure in place
   - Both old and new locations exist
   - Easy to revert if issues found

4. **Remove Old Files**
   - Once verified, delete old files
   - Archives old content to `deprecated/`
   - Final cleanup commit

---

## Files That Will Remain in Root

```
LICENSE              # Required
README.md            # Required
.gitignore           # Required
.gitattributes       # Git configuration
package.json         # Workspace root (optional, but recommended)
```

**Rationale**: These are standard project files that should remain at root

---

## Benefits

1. **Improved Developer Experience**
   - Clear navigation
   - Logical organization
   - Easier onboarding

2. **Better Maintainability**
   - Reduced cognitive load
   - Easier to find things
   - Clearer boundaries

3. **Scalability**
   - Room to grow docs
   - Clear place for new tools
   - Organized test suite

4. **Professional Structure**
   - Follows industry standards
   - Similar to major projects (React, Vue, Node.js)
   - Better for contributions

5. **Reduced Clutter**
   - ~25 fewer files in root
   - Cleaner git status
   - Easier to spot configuration

---

## Recommendations

**✅ Proceed with**: Full reorganization as proposed

**Timing**: Execute after current API fix validation completes

**Effort**: 4-6 hours for complete migration

**Risk**: Low (primarily file moves, no logic changes)

**Rollback**: Simple (git revert to previous commit)

---

## Next Steps

1. Review this proposal
2. Approve or request modifications
3. Execute migration (4-6 hours)
4. Update team documentation
5. Celebrate cleaner project! 🎉
