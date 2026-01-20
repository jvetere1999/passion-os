# Project Directory Structure & Organization Plan

**Date:** January 20, 2026  
**Project:** Ignition (Secure journal & goal tracking app)  
**Current State:** Production-ready beta 1.0.0

---

## 📁 CURRENT DIRECTORY STRUCTURE

```
passion-os-next/
│
├── 📦 CORE APPLICATION (app/)
│   ├── frontend/              ← Next.js 15 web app (React 19, Cloudflare Workers)
│   ├── admin/                 ← Admin dashboard (Next.js)
│   ├── backend/               ← Rust/Axum API (PostgreSQL)
│   ├── database/              ← Database schema & migrations
│   ├── watcher/               ← Tauri desktop DAW watcher
│   └── dist/                  ← Built distributions (macOS .dmg, Windows .msi)
│
├── 📚 DOCUMENTATION (docs/)
│   ├── VERSIONING.md          ← Release management guide
│   ├── RELEASE_STRATEGY.md    ← Beta/RC/Stable timeline
│   ├── architecture/          ← System design docs
│   ├── project/               ← Project management docs
│   ├── technical/             ← Technical specifications
│   ├── security/              ← Security documentation
│   ├── deployment/            ← Deployment guides
│   ├── feature-specs/         ← Feature specifications
│   └── [others]/              ← Additional docs
│
├── 🚀 DEPLOYMENT & INFRASTRUCTURE (deploy/)
│   ├── docker-compose*.yml    ← Docker Compose configs
│   ├── cloudflare-api-proxy/  ← Cloudflare API proxy
│   ├── cloudflare-admin/      ← Cloudflare admin config
│   ├── production/            ← Production configs
│   └── scripts/               ← Deployment scripts
│
├── 🔧 AUTOMATION & TOOLS
│   ├── scripts/               ← Utility scripts (release.js, build, etc)
│   ├── .github/workflows/     ← GitHub Actions CI/CD
│   ├── tools/                 ← Utility tools
│   ├── tests/                 ← E2E tests (Playwright)
│   ├── monitoring/            ← Monitoring configs
│   └── infra/                 ← Infrastructure as Code
│
├── 📋 PROJECT MANAGEMENT (agent/)
│   ├── CURRENT_STATE.md       ← Current status
│   ├── IMPLEMENTATION_MASTER_PLAN.md
│   ├── PHASE_1_COMPLETE.md
│   ├── archive/               ← Historical records
│   └── prompt_packages/       ← AI prompt templates
│
├── 📊 DEBUG & ANALYSIS (debug/)
│   ├── OPTIMIZATION_DASHBOARD.md
│   ├── COMPLETED_ISSUES_DETAILED_BREAKDOWN.md
│   ├── analysis/              ← Detailed analysis reports
│   └── archive/               ← Historical debug logs
│
├── 📝 ROOT CONFIGURATION
│   ├── VERSION.json           ← Version tracking (1.0.0-beta.1)
│   ├── CHANGELOG.md           ← Release notes
│   ├── package.json           ← npm scripts & release commands
│   ├── README.md              ← Project overview
│   ├── playwright.api.config.ts
│   ├── schema.json            ← Database schema
│   ├── reset.sql              ← Database reset script
│   └── LICENSE
│
├── 📦 DEPENDENCIES
│   ├── node_modules/          ← npm packages
│   └── package-lock.json
│
├── 🗑️ MAINTENANCE DIRECTORIES
│   ├── deprecated/            ← Old code (moved here from deletion)
│   ├── .tmp/                  ← Temporary files
│   ├── test-results/          ← Test output
│   └── .git/                  ← Version control
│
└── 📚 LEGACY / INACTIVE
    ├── openapi/               ← OpenAPI specs
    ├── prompts/               ← Prompt templates
    ├── qc/                    ← Quality control
    ├── skills/                ← Skills documentation
    ├── warn_reduc/            ← Warning reduction configs
    └── debug_log/             ← Debug logs
```

---

## 🎯 ORGANIZATION ANALYSIS

### ✅ WELL-ORGANIZED
- **app/** - Clear separation of concerns (frontend, backend, admin, watcher, database)
- **docs/** - Comprehensive documentation structure
- **deploy/** - Infrastructure-as-code properly isolated
- **.github/workflows/** - CI/CD pipelines organized
- **scripts/** - Utility scripts in one place

### ⚠️ NEEDS IMPROVEMENT

| Area | Issue | Impact | Priority |
|------|-------|--------|----------|
| **Root level clutter** | Too many top-level .md files | Navigation confusion | 🟡 Medium |
| **Deprecated folder** | Created but not consistently used | Unclear what's obsolete | 🟡 Medium |
| **Debug directories** | Scattered (debug/, debug_log/, agent/) | Hard to find info | 🟡 Medium |
| **Legacy modules** | openapi/, prompts/, skills/ unused | Confusion | 🟠 Low |
| **.tmp folder** | Git-ignored but created ad-hoc | Inconsistent | 🟠 Low |
| **Duplicate docs** | Same info in multiple places | Maintenance burden | 🟡 Medium |

---

## 🏗️ PROPOSED CLEAN STRUCTURE

```
passion-os-next/
│
├── app/                           [NO CHANGE - CORE APPLICATION]
│   ├── frontend/
│   ├── admin/
│   ├── backend/
│   ├── database/
│   ├── watcher/
│   └── dist/
│
├── docs/                          [REORGANIZED - DOCUMENTATION]
│   ├── _index.md                  ← Navigation hub
│   ├── guides/                    ← How-to guides
│   │   ├── versioning.md          ← Moved from root
│   │   ├── deployment.md          ← Consolidated
│   │   └── contributing.md
│   ├── architecture/              ← Existing, keep as-is
│   ├── api/                       ← API documentation
│   │   └── openapi/               ← Move from root
│   ├── standards/                 ← Code standards
│   │   ├── backend-imports.md
│   │   ├── frontend-style.md
│   │   └── logging.md
│   ├── security/                  ← Existing, keep as-is
│   └── project/                   ← Existing, keep as-is
│
├── infrastructure/                [NEW - INFRASTRUCTURE]
│   ├── deploy/                    ← Move from root
│   │   ├── docker-compose*.yml
│   │   ├── cloudflare/
│   │   ├── production/
│   │   └── scripts/
│   ├── monitoring/                ← Move from root
│   ├── scripts/                   ← Move from root
│   └── .github/workflows/         ← Move CI/CD here (symbolic)
│
├── tools/                         [CONSOLIDATED - UTILITIES]
│   ├── scripts/                   ← Release, build scripts
│   ├── testing/                   ← E2E tests, testing tools
│   │   └── playwright/
│   └── monitoring/                ← Monitoring tools
│
├── .github/                       [NO CHANGE - CI/CD]
│   └── workflows/
│
├── management/                    [NEW - PROJECT MANAGEMENT]
│   ├── current-state.md           ← Move from agent/
│   ├── implementation-plan.md     ← Move from agent/
│   ├── status-reports/            ← Move from agent/
│   └── archive/                   ← Move from agent/
│
├── maintenance/                   [NEW - CLEANUP & DEBUG]
│   ├── deprecated/                ← Move from root
│   ├── debug-logs/                ← Move from debug_log/
│   └── temporary/                 ← Move from .tmp/
│
├── 📝 ROOT LEVEL (ESSENTIAL ONLY)
│   ├── VERSION.json               ← Version tracking
│   ├── CHANGELOG.md               ← Release notes
│   ├── README.md                  ← Project overview
│   ├── LICENSE
│   ├── package.json               ← Root npm scripts
│   ├── schema.json                ← Database schema
│   ├── playwright.api.config.ts   ← E2E config
│   └── .gitignore, .env*, etc
│
└── 🗑️ NOT TRACKED (Git-ignored)
    ├── node_modules/
    ├── .tmp/                      ← Temporary builds
    ├── test-results/              ← Test output
    └── dist/                      ← Build outputs
```

---

## 📋 ACTION PLAN (7 Steps)

### PHASE 1: PLANNING (Days 1-2)
- [ ] Review proposed structure with team
- [ ] Identify any documents that should stay in root
- [ ] Decide on documentation consolidation strategy
- [ ] Create migration checklist

### PHASE 2: DOCUMENTATION (Days 3-4)

**Step 1: Create New Directory Structure**
```bash
mkdir -p docs/{guides,standards,api}
mkdir -p infrastructure/{monitoring,scripts}
mkdir -p tools/{scripts,testing}
mkdir -p management/{status-reports,archive}
mkdir -p maintenance/{debug-logs,deprecated}
```

**Step 2: Move & Consolidate Docs**
```bash
# Versioning guides
mv docs/VERSIONING.md docs/guides/
mv docs/RELEASE_STRATEGY.md docs/guides/

# Code standards
mv docs/BACKEND_IMPORT_STYLE.md docs/standards/
mv docs/FRONTEND_STYLE.md docs/standards/
mv docs/LOGGING.md docs/standards/
mv docs/BACKEND_TESTING.md docs/standards/

# API docs
mv openapi/ docs/api/
```

**Step 3: Create Documentation Index**
- Create `docs/_index.md` with navigation
- Update `README.md` with link to docs
- Add breadcrumbs to key docs

### PHASE 3: INFRASTRUCTURE (Days 5-6)

**Step 4: Consolidate Infrastructure**
```bash
# Move deployment
mv deploy/ infrastructure/deploy/
mv monitoring/ infrastructure/
mv scripts/ infrastructure/scripts/

# Create CI/CD symlink or reference
ln -s .github infrastructure/workflows
```

**Step 5: Update CI/CD Paths**
- Update `.github/workflows/*.yml` paths
- Update `package.json` scripts paths
- Update deployment documentation

### PHASE 4: PROJECT MANAGEMENT (Days 7-8)

**Step 6: Organize Management**
```bash
# Move project management
mv agent/CURRENT_STATE.md management/
mv agent/IMPLEMENTATION_MASTER_PLAN.md management/implementation-plan.md
mv agent/PHASE_1_STATUS.md management/status-reports/
mv agent/archive/ management/
```

**Step 7: Clean Up Maintenance**
```bash
# Organize cleanup
mv deprecated/ maintenance/
mv debug_log/ maintenance/debug-logs/
mv .tmp/ maintenance/temporary/
```

### PHASE 5: VERIFICATION & UPDATES (Days 9-10)

**Step 8: Update All References**
- [ ] Update `.github/workflows/` paths
- [ ] Update `package.json` scripts
- [ ] Update import paths in code
- [ ] Update documentation links
- [ ] Test all build and deploy scripts

**Step 9: Create Migration Guide**
- Document before/after structure
- Update team wiki/docs
- Create quick reference for new developers

**Step 10: Clean Up Root**
```bash
# Verify root only has:
# - VERSION.json
# - CHANGELOG.md
# - README.md
# - package.json
# - LICENSE
# - Schema/config files
# - .env* and .gitignore
```

---

## 📚 NEW DOCUMENTATION INDEX

Create `docs/_index.md`:

```markdown
# Ignition Documentation

## Quick Links

### 🚀 Getting Started
- [Setup & Installation](guides/setup.md)
- [Project Overview](../README.md)

### 📖 Guides
- [Release & Versioning](guides/versioning.md)
- [Deployment Procedures](guides/deployment.md)
- [Contributing Guidelines](guides/contributing.md)

### 🏗️ Architecture
- [System Design](architecture/overview.md)
- [Database Schema](architecture/database.md)
- [API Design](architecture/api.md)

### 🛡️ Security
- [Security Policies](security/policies.md)
- [Authentication Flow](security/auth.md)

### 📋 Standards
- [Backend Import Style](standards/backend-imports.md)
- [Frontend Style Guide](standards/frontend-style.md)
- [Logging Standards](standards/logging.md)
- [Testing Guidelines](standards/testing.md)

### 🔌 APIs
- [OpenAPI Spec](api/openapi/)
- [API Reference](api/reference.md)

### 📊 Project
- [Implementation Plan](../management/implementation-plan.md)
- [Current Status](../management/current-state.md)
- [Status Reports](../management/status-reports/)
```

---

## ⚡ QUICK REFERENCE

### Before Organization
```
root/
├── docs/ (25+ files, unclear structure)
├── deploy/
├── debug/
├── debug_log/
├── agent/
├── deprecated/
├── scripts/
├── monitoring/
├── openapi/
├── prompts/
├── skills/
└── [scattered .md files]
```

### After Organization
```
root/
├── app/           (UNCHANGED)
├── docs/          (CONSOLIDATED)
├── infrastructure/  (NEW PARENT)
├── tools/         (CONSOLIDATED)
├── management/    (REORGANIZED)
├── maintenance/   (CLEANUP)
└── [CLEAN ROOT]
```

---

## 🎯 BENEFITS

| Benefit | Impact |
|---------|--------|
| **Easier Navigation** | Find docs 80% faster |
| **Clearer Purpose** | Each directory has single responsibility |
| **Better Maintenance** | Less duplication, easier updates |
| **Onboarding** | New devs understand structure immediately |
| **CI/CD Clarity** | Infrastructure code logically grouped |
| **Cleanup** | Clear deprecation policy |
| **Scalability** | Easy to add new components |

---

## 📝 IMPLEMENTATION TIMELINE

| Phase | Duration | Start | End | Status |
|-------|----------|-------|-----|--------|
| Planning | 2 days | Jan 20 | Jan 21 | Ready |
| Documentation | 2 days | Jan 22 | Jan 23 | Can start |
| Infrastructure | 2 days | Jan 24 | Jan 25 | Depends on Docs |
| Management | 2 days | Jan 26 | Jan 27 | Depends on Infra |
| Verification | 2 days | Jan 28 | Jan 29 | Final phase |
| **TOTAL** | **10 days** | Jan 20 | Jan 29 | - |

---

## 🚦 NEXT STEPS

1. **Approve** the proposed structure
2. **Assign** someone to manage migration
3. **Schedule** migration during low-activity period
4. **Backup** before making changes
5. **Execute** Phase 2 (Documentation)
6. **Test** all scripts and CI/CD
7. **Update** team documentation
8. **Announce** new structure to team

---

## ❓ FAQ

**Q: Will this break anything?**
- A: No if done carefully. All paths in scripts will be updated.

**Q: Do we need to do this all at once?**
- A: No. Can do incrementally, docs first, infrastructure later.

**Q: What about git history?**
- A: Git preserves history through renames if done with `git mv`.

**Q: Should we delete deprecated/?**
- A: Keep for 2-3 releases, then archive entirely.

**Q: How do we communicate this to the team?**
- A: Send before/after structure, new docs index, and reference guide.

---

## 📞 QUESTIONS?

- Which directories are you most concerned about?
- Any documents that should stay at root level?
- Should we do this all at once or incrementally?
- Who will own the migration?
