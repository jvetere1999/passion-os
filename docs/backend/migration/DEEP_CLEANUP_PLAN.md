# Deep Cleanup Plan

**Date:** January 8, 2026  
**Branch:** `refactor/stack-split`  
**Phase:** Post-Migration Deep Cleanup  
**Status:** 🟡 In Progress

---

## Overview

This document enumerates cleanup targets, risks, and "done" checks for the post-migration deep cleanup phase.

---

## 1. Directory Cleanup Targets

### 1.1 Generated/Temp Artifacts (Move to `.tmp/` or Delete)

| Path | Type | Action | Risk | Status |
|------|------|--------|------|--------|
| `.open-next/` | Generated build | In .gitignore, verify not tracked | Low | ✅ Verified |
| `test-results/` | Playwright artifacts | In .gitignore, verify not tracked | Low | ✅ Verified |
| `playwright-report/` | Playwright report | In .gitignore, verify not tracked | Low | ✅ Verified |
| `.wrangler/` | Wrangler cache | In .gitignore, verify not tracked | Low | ✅ Verified |
| `.next/` | Next.js cache | In .gitignore, verify not tracked | Low | ✅ Verified |
| `.perf/` | Perf artifacts | Moved to deprecated/generated/, added to .gitignore | Low | ✅ Complete |
| `tree.json` | Directory snapshot | Moved to deprecated/generated/tree.json | Low | ✅ Complete |
| `tsconfig.tsbuildinfo` | TS incremental | In .gitignore, verify not tracked | Low | ✅ Verified |

### 1.2 Legacy Code (Already in `deprecated/`)

| Path | Contents | Status |
|------|----------|--------|
| `deprecated/src/app/api/` | 22 legacy API routes | ✅ Complete |
| `deprecated/src/lib/db/` | D1 database module | ✅ Complete |
| `deprecated/src/lib/perf/` | Performance helpers | ✅ Complete |
| `deprecated/src/lib/auth/index.ts` | Legacy auth | ✅ Partial |
| `deprecated/scripts/` | Old deployment scripts | ✅ Complete |

### 1.3 Markdown Policy Compliance

Per copilot-instructions: Migration docs live under `docs/backend/migration/`

| Check | Status |
|-------|--------|
| All migration docs in correct location | ✅ Verified |
| No markdown in `app/` subdirectories | ⏳ To verify |
| Docs structure follows target layout | ⏳ To verify |

---

## 2. Shared Code Extraction Targets

### 2.1 Backend Shared Modules

Already extracted to `app/backend/crates/api/src/shared/`:

| Module | Purpose | Status |
|--------|---------|--------|
| `shared/auth/` | Auth context extraction | ✅ Exists |
| `shared/http/` | HTTP response helpers | ✅ Exists |
| `shared/ids.rs` | Typed ID helpers | ✅ Exists |
| `shared/db/` | Database utilities | ✅ Exists |
| `shared/audit.rs` | Audit logging | ✅ Exists |

### 2.2 Potential Extraction Targets

| Pattern | Files Affected | Priority | Risk | Status |
|---------|----------------|----------|------|--------|
| JSON body extraction boilerplate | Routes (25+) | P2 | Low | ✅ Already uses Axum extractors |
| Pagination logic | 8+ routes | P2 | Low | ✅ validate_pagination() exists |
| Timestamp formatting | 15+ files | P3 | Low | ⏳ Review later |
| UUID validation | 20+ handlers | P2 | Low | ✅ Validator.uuid() exists |

### 2.3 Frontend Shared Modules

Already centralized in `app/frontend/src/lib/api/client.ts`:

| Pattern | Status |
|---------|--------|
| Base API client wrapper | ✅ Complete (apiGet, apiPost, apiPut, apiPatch, apiDelete) |
| Error handling | ✅ ApiError class |
| Request options | ✅ ApiRequestOptions interface |
| URL building | ✅ buildUrl function |
| All domain clients | ✅ Using centralized client (16 domain files verified) |

---

## 3. Style Normalization Targets

### 3.1 Backend (Rust)

| Check | Tool | Status |
|-------|------|--------|
| Format compliance | `cargo fmt --check` | ⏳ |
| Lint warnings | `cargo clippy` | ⏳ |
| Module naming | snake_case | ⏳ |
| Type naming | PascalCase | ⏳ |

### 3.2 Frontend (TypeScript)

| Check | Tool | Status |
|-------|------|--------|
| ESLint compliance | `npm run lint` | ⏳ |
| TypeScript strictness | `npm run typecheck` | ⏳ |
| File naming | kebab-case | ⏳ |
| Component naming | PascalCase | ⏳ |

---

## 4. Performance Sanity Targets

### 4.1 Candidate Hotspots

| Area | File | Concern | Priority |
|------|------|---------|----------|
| Session lookup | `auth.rs` | Per-request DB call | P1 |
| RBAC entitlements | `auth.rs:100` | N+1 query risk | P1 |
| Activity event logging | `routes/*.rs` | Fire-and-forget spawns | P2 |
| Reference track upload | `reference.rs` | Large file handling | P2 |
| Gamification aggregates | `gamification.rs` | Complex joins | P2 |

### 4.2 Safe Optimizations to Consider

| Optimization | Risk | Measurable | Priority |
|--------------|------|------------|----------|
| Session cache (in-memory, TTL) | Low | Latency reduction | P1 |
| Batch entitlement fetch | Low | Query count reduction | P1 |
| Connection pool tuning | Low | Throughput | P2 |
| Index verification | Very Low | Query plans | P2 |

---

## 5. Human Readability Targets

### 5.1 Code Readability

| Pattern | Files | Issue | Action |
|---------|-------|-------|--------|
| Long functions (>100 lines) | TBD | Hard to follow | Extract helpers |
| Deep nesting (>4 levels) | TBD | Complex logic | Flatten |
| Magic numbers | TBD | Unclear intent | Extract constants |
| Unclear variable names | TBD | Context loss | Rename |

### 5.2 Documentation Readability

| Document | Issue | Action |
|----------|-------|--------|
| gaps.md (1189 lines) | Very long | Consider splitting by status |
| feature_parity_checklist.md (736 lines) | Long | Acceptable (canonical) |
| risk_register.md (476 lines) | Long | Acceptable (comprehensive) |

---

## 6. Done Checks

### 6.1 Directory Cleanup

- [ ] All `.gitignore`d directories verified not tracked
- [ ] `tree.json` moved to `.tmp/`
- [ ] `.perf/` contents evaluated
- [ ] No stale generated artifacts in git

### 6.2 Shared Code

- [ ] No duplicate error mapping patterns
- [ ] No duplicate auth extraction patterns
- [ ] No duplicate pagination patterns
- [ ] Frontend API client fully centralized

### 6.3 Style Normalization

- [ ] `cargo fmt --check` passes
- [ ] `cargo clippy` warnings ≤ baseline
- [ ] `npm run lint` passes
- [ ] `npm run typecheck` passes

### 6.4 Performance

- [ ] 3-5 hotspots identified
- [ ] At least 1 optimization applied
- [ ] Before/after metrics documented

### 6.5 Human Readability

- [ ] HUMAN_READABILITY_REPORT.md created
- [ ] Top 5 worst offenders identified
- [ ] At least 3 improvements made

### 6.6 Validation

- [ ] Full typecheck passes
- [ ] Full lint passes
- [ ] Unit tests pass
- [ ] Build succeeds
- [ ] E2E smoke passes (if UI touched)
- [ ] validation_deep_cleanup.md created

---

## 7. Risks and Mitigations

| Risk | Likelihood | Impact | Mitigation |
|------|------------|--------|------------|
| Breaking change from refactor | Medium | High | Reversible batches; full test suite |
| Warnings increase | Low | Medium | Check baseline before/after |
| Performance regression | Low | Medium | Measure before optimization |
| Lost context from renames | Low | Low | Git blame preserved |

---

## 8. Execution Order

1. ✅ Create this plan (DEEP_CLEANUP_PLAN.md)
2. ⏳ Directory cleanup (verify .gitignore, move stale files)
3. ⏳ Shared code audit (identify duplication)
4. ⏳ Style normalization (fmt, clippy, lint)
5. ⏳ Performance sanity (identify hotspots)
6. ⏳ Human readability audit (create report)
7. ⏳ Final validation (typecheck, lint, test, build)

---

## References

- [final_readiness_report.md](./final_readiness_report.md)
- [deprecation_map.md](./deprecation_map.md)
- [validation_deep_cleanup.md](./validation_deep_cleanup.md) (to be created)
- [HUMAN_READABILITY_REPORT.md](./HUMAN_READABILITY_REPORT.md) (to be created)
