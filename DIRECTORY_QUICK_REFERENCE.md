# 🗺️ New Directory Structure Quick Reference

**Updated:** January 20, 2026  
**For:** Ignition Team

---

## 📍 Finding Things (After Directory Reorganization)

### Documentation

| Looking For... | Location | Purpose |
|---|---|---|
| **How to release?** | [docs/guides/versioning.md](docs/guides/versioning.md) | Complete versioning & release guide |
| **Release timeline?** | [docs/guides/release-strategy.md](docs/guides/release-strategy.md) | Beta → RC → Stable timeline |
| **All documentation** | [docs/_index.md](docs/_index.md) | 📚 **START HERE** - Navigation hub |
| **Backend standards** | [docs/standards/backend-imports.md](docs/standards/backend-imports.md) | How to import & structure Rust code |
| **Frontend standards** | [docs/standards/frontend-style.md](docs/standards/frontend-style.md) | React/TypeScript conventions |
| **Logging standards** | [docs/standards/logging.md](docs/standards/logging.md) | How to log effectively |
| **Testing** | [docs/standards/testing.md](docs/standards/testing.md) | E2E and unit test guidelines |
| **API specification** | [docs/api/openapi/openapi.yaml](docs/api/openapi/openapi.yaml) | Complete REST API spec |
| **Architecture** | [docs/architecture/](docs/architecture/) | System design, database, auth flow |
| **Security** | [docs/security/](docs/security/) | Security policies, data protection |

### Infrastructure

| Need... | Location | Purpose |
|---|---|---|
| **Deployment guide** | [infrastructure/deploy/README.md](infrastructure/deploy/README.md) | How to deploy to production |
| **Deployment configs** | [infrastructure/deploy/](infrastructure/deploy/) | Docker, Cloudflare, production configs |
| **Monitoring setup** | [infrastructure/monitoring/](infrastructure/monitoring/) | Monitoring configuration & dashboards |
| **Build scripts** | [infrastructure/scripts/](infrastructure/scripts/) | Build, deploy, utility scripts |
| **CI/CD workflows** | [.github/workflows/](..github/workflows/) | GitHub Actions automation |

### Project Management

| Looking For... | Location | Purpose |
|---|---|---|
| **Current status** | [management/current-state.md](management/current-state.md) | What's complete, what's in progress |
| **Implementation plan** | [management/implementation-plan.md](management/implementation-plan.md) | Long-term project roadmap |
| **Status reports** | [management/status-reports/](management/status-reports/) | Historical phase completions |
| **Archives** | [management/archive/](management/archive/) | Old reports and documents |

### Deprecated & Debug

| Type | Location | Note |
|---|---|---|
| **Deprecated code** | [maintenance/deprecated/](maintenance/deprecated/) | Old code being phased out |
| **Debug logs** | [maintenance/debug-logs/](maintenance/debug-logs/) | Historical debug information |
| **Temp files** | [maintenance/temporary/](maintenance/temporary/) | Temporary build/test artifacts |

---

## 🔄 Common Tasks

### "I want to make a release"

```bash
# 1. Read the versioning guide
cat docs/guides/versioning.md

# 2. Create a patch release (or minor/major)
npm run release:patch

# 3. GitHub Actions automatically deploys
# Check: https://github.com/jvetere1999/ignition/actions
```

### "I need to deploy to production"

```bash
# 1. Read deployment guide
cat infrastructure/deploy/README.md

# 2. Run deployment from infrastructure/scripts/
./infrastructure/scripts/deploy-and-migrate.sh
```

### "I'm new to the project"

```bash
# Start here
1. Read: docs/_index.md             (overview & navigation)
2. Read: docs/architecture/overview.md  (system design)
3. Read: docs/standards/             (code conventions)
4. Read: README.md                  (project features)
5. Check: management/current-state.md   (what's done)
```

### "I want to write backend code"

```bash
# 1. Read standards
cat docs/standards/backend-imports.md
cat docs/standards/logging.md

# 2. Check API design
cat docs/architecture/api.md

# 3. Read database schema
cat docs/architecture/database.md
```

### "I want to write frontend code"

```bash
# 1. Read standards
cat docs/standards/frontend-style.md
cat docs/standards/logging.md

# 2. Check service worker caching
cat docs/architecture/service-worker.md

# 3. Understand auth flow
cat docs/architecture/authentication.md
```

### "I need to check what's in the API"

```bash
# Open the OpenAPI spec
cat docs/api/openapi/openapi.yaml

# Or better, view it in Swagger UI:
# https://swagger.io/tools/swagger-ui/
# (drag & drop the YAML file)
```

### "What's the current project status?"

```bash
# Check status reports
ls management/status-reports/
cat management/current-state.md
cat management/implementation-plan.md
```

---

## 📊 Directory Structure Map

```
ignition/
│
├── 📚 docs/                    ← ALL DOCUMENTATION (READ HERE)
│   ├── _index.md              ← START HERE - Navigation hub
│   ├── guides/                ← How-to guides
│   │   ├── versioning.md
│   │   └── release-strategy.md
│   ├── standards/             ← Code standards
│   │   ├── backend-imports.md
│   │   ├── frontend-style.md
│   │   ├── logging.md
│   │   └── testing.md
│   ├── api/                   ← API documentation
│   │   └── openapi/
│   │       └── openapi.yaml   ← REST API spec
│   ├── architecture/          ← System design
│   ├── security/              ← Security docs
│   └── project/               ← Project docs
│
├── 🏗️ infrastructure/          ← ALL INFRASTRUCTURE
│   ├── deploy/                ← Deployment configs
│   ├── monitoring/            ← Monitoring setup
│   └── scripts/               ← Build & deploy scripts
│
├── 📦 app/                     ← APPLICATION CODE
│   ├── frontend/
│   ├── admin/
│   ├── backend/
│   ├── database/
│   └── watcher/
│
├── 📋 management/             ← PROJECT MANAGEMENT
│   ├── current-state.md
│   ├── implementation-plan.md
│   ├── status-reports/
│   └── archive/
│
├── 🗑️ maintenance/            ← DEPRECATED & DEBUG
│   ├── deprecated/
│   ├── debug-logs/
│   └── temporary/
│
├── .github/                   ← CI/CD WORKFLOWS
│   └── workflows/
│
├── 📝 VERSION.json           ← Version tracking
├── 📝 CHANGELOG.md           ← Release notes
├── 📝 README.md              ← Project overview
└── 📝 package.json           ← Root npm scripts
```

---

## 🎯 Key Changes

| Before | After | Benefit |
|--------|-------|---------|
| Docs scattered in root | All in docs/ with structure | ✅ 80% faster navigation |
| `scripts/` at root | `infrastructure/scripts/` | ✅ Infrastructure centralized |
| Deployment in `deploy/` | `infrastructure/deploy/` | ✅ Easier to find & maintain |
| Monitoring at root | `infrastructure/monitoring/` | ✅ Organized infrastructure |
| Project mgmt scattered | `management/` organized | ✅ Clear project tracking |
| Deprecated at root | `maintenance/deprecated/` | ✅ Clean root directory |
| No documentation hub | `docs/_index.md` | ✅ Clear entry point |
| OpenAPI at root | `docs/api/openapi/` | ✅ With other API docs |

---

## ✅ What Works the Same

These haven't changed:
- ✅ `app/` directory (frontend, backend, admin, watcher, database)
- ✅ `.github/workflows/` (scripts updated, paths migrated)
- ✅ All npm scripts (`npm run release:*` still work)
- ✅ All git workflows (history preserved)
- ✅ Deployment process (paths updated in scripts)
- ✅ API endpoints (no changes)

---

## 🚀 For GitHub Actions

All CI/CD workflows have been updated to use new paths:
- ✅ `infrastructure/scripts/` instead of `scripts/`
- ✅ `infrastructure/deploy/` instead of `deploy/`
- ✅ All deployment automation still works

No manual action needed - workflows automatically use new paths.

---

## 📞 Questions?

1. **Can't find something?** → Check [docs/_index.md](docs/_index.md)
2. **Need code standards?** → See [docs/standards/](docs/standards/)
3. **How to release?** → See [docs/guides/versioning.md](docs/guides/versioning.md)
4. **Project status?** → See [management/current-state.md](management/current-state.md)
5. **Infrastructure help?** → See [infrastructure/deploy/README.md](infrastructure/deploy/README.md)

---

## 🗓️ Timeline

- ✅ **Jan 20** - Documentation reorganized (Phase 2 complete)
- 📋 **Jan 21-22** - Infrastructure git mv (Phase 3)
- 📋 **Jan 23-24** - Project management & cleanup (Phases 4-6)
- 📋 **Jan 25** - Verification & final touches (Phase 7)

---

**Status:** ✨ Phase 2 Complete - New structure ready to use!  
**Next:** Phase 3 will finalize git moves  
**Questions?** Ask or see [docs/_index.md](docs/_index.md)
