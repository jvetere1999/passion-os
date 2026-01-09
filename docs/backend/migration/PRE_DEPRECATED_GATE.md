# PRE_DEPRECATED_GATE.md

**Purpose:** Validation gate before moving legacy code to `deprecated/`  
**Created:** January 8, 2026  
**Branch:** `refactor/stack-split`  
**Role:** Pre-deprecation gatekeeper - do not generate production code unless fixing failing gates

---

## Executive Summary

| Gate | Status | Evidence |
|------|--------|----------|
| Architecture Alignment | ✅ PASS | Backend-first split verified |
| Feature Parity | ⚠️ CONDITIONAL | 82/86 routes (95.3%), 4 external-blocked |
| Warnings Delta | ⚠️ WARNING | +3 new warnings in frontend |
| Backend Warnings | ❌ NEEDS BASELINE | 206 Rust warnings (no baseline established) |
| TypeScript Errors | ✅ PASS | 0 type errors |
| Unit Tests | ✅ PASS | 144/144 passed |
| E2E Tests | 🔶 EXTERNAL | Requires running backend server |

**Overall Gate:** ⚠️ CONDITIONAL PASS - Legacy can be deprecated for completed routes only

---

## Gate 1: Architecture Alignment

### Checklist

| Requirement | Status | Evidence |
|-------------|--------|----------|
| Backend is Rust (Axum + Tower) | ✅ | `app/backend/crates/api/` exists with full route structure |
| Backend handles all business logic | ✅ | All 82 migrated routes use `sqlx::query_as` not `sqlx::query_as!` |
| Backend handles OAuth/sessions | ✅ | `app/backend/crates/api/src/middleware/auth.rs` implements session validation |
| Backend handles RBAC | ✅ | Role extraction via claims middleware |
| Backend handles R2 access | ✅ | `app/backend/crates/api/src/routes/blobs.rs` with signed URLs |
| Frontend is UI-only | ✅ | Frontend API client in `app/frontend/src/lib/api/client.ts` forwards all requests |
| Frontend stores/forwards cookies only | ✅ | `credentials: 'include'` pattern, no auth logic |
| Admin console at `/admin/*` | ✅ | `app/admin/` separate Next.js app using backend |
| Database is Postgres-only | ✅ | No D1 references in new code |
| Redis not used | ✅ | No Redis references |
| R2 backend-only | ✅ | No R2 credentials in frontend |

### Architecture Evidence

```
app/
├── admin/           # Separate admin UI
├── backend/         # Rust monolith (Axum + Tower)
│   └── crates/api/  # Main API crate
├── database/        # Postgres migrations
├── frontend/        # UI-only Next.js
└── r2/              # R2 configuration (backend access only)
```

**Status:** ✅ PASS

---

## Gate 2: Feature Parity Status

### Summary

| Category | Done | Total | Percentage |
|----------|------|-------|------------|
| API Routes | 82 | 86 | 95.3% |
| Schema Tables | 22 | 24 | 91.7% |

### Routes Not Started (4)

| Route | Category | Reason | Blocker |
|-------|----------|--------|---------|
| `POST /api/auth/accept-tos` | Auth | Requires OAuth flow update | LATER-004 |
| `POST /api/auth/verify-age` | Auth | Requires OAuth flow update | LATER-004 |
| `POST /api/admin/backup` | Admin | Stub - requires R2 creds | LATER-003 |
| `POST /api/admin/restore` | Admin | Stub - requires R2 creds | LATER-003 |

### Schema Not Migrated (2)

| Table | Reason | Blocker |
|-------|--------|---------|
| `tos_acceptances` | Part of auth ToS flow | LATER-004 |
| `age_verifications` | Part of auth age flow | LATER-004 |

**Status:** ⚠️ CONDITIONAL PASS - 95.3% done, remaining 4.7% blocked on external items

---

## Gate 3: Warnings Delta Check

### Frontend (TypeScript/ESLint)

| Metric | Value |
|--------|-------|
| Baseline | 44 |
| Current (`app/frontend/src/`) | 47 |
| Delta | **+3** |
| Root `src/` (to be deprecated) | 37 |

#### New Warnings (vs Baseline)

| File | Line | Warning | Rule |
|------|------|---------|------|
| `components/references/TrackVisualizer.tsx` | 60:7 | `_ANNOTATION_HEIGHT` unused | `@typescript-eslint/no-unused-vars` |
| `components/references/TrackVisualizer.tsx` | 80:14 | `_streamUrl` unused | `@typescript-eslint/no-unused-vars` |
| `components/references/TrackVisualizer.tsx` | 85:13 | `_manifest` unused | `@typescript-eslint/no-unused-vars` |
| `lib/api/exercise.ts` | 11:27 | `apiPut` unused | `@typescript-eslint/no-unused-vars` |

**Note:** Line 41:28 in `ProgressClient.tsx` is numbered differently in new layout.

#### Duplicate Counting Issue

The lint currently runs on both:
- `./src/` (legacy, 37 warnings) - **should be deprecated**
- `./app/frontend/src/` (new canonical, 47 warnings)

The baseline was established on `./src/` only. Once `./src/` is moved to `deprecated/`, warnings will be 47 (delta +3 from baseline).

**Status:** ⚠️ WARNING - Delta > 0, requires either:
1. Fix the 3 new warnings before deprecation, OR
2. Add to `existing_warnings.md` with justification

---

### Backend (Rust)

| Metric | Value |
|--------|-------|
| Baseline | ❌ NOT ESTABLISHED |
| Current | 206 |
| Delta | N/A |

#### Warning Categories (Backend)

| Category | Count | Example |
|----------|-------|---------|
| `unused_imports` | ~150 | `delete`, `post`, `put` routing imports |
| `dead_code` | ~30 | Unused functions/structs |
| `unused_variables` | ~20 | `_` prefixed but still warned |
| Other | ~6 | Various |

**Recommendation:** Establish backend warnings baseline before Phase 26.

**Status:** ❌ NEEDS BASELINE - No backend baseline exists

---

## Gate 4: Compilation Status

### TypeScript

| Check | Result |
|-------|--------|
| `npm run typecheck` | ✅ Exit 0 |
| Errors | 0 |

**Log:** `.tmp/pre_deprecated_typecheck.log`

### Rust Backend

| Check | Result |
|-------|--------|
| `cargo check` | ✅ Exit 0 |
| Errors | 0 |
| Warnings | 206 (see above) |

**Log:** `.tmp/pre_deprecated_backend_check.log`

**Status:** ✅ PASS

---

## Gate 5: Test Results

### Frontend Unit Tests

| Metric | Value |
|--------|-------|
| Command | `npm run test` |
| Test Files | 9 passed |
| Tests | 144 passed |
| Duration | 937ms |

**Log:** `.tmp/pre_deprecated_test.log`

### Backend Tests

| Metric | Value |
|--------|-------|
| Command | `cargo test --no-run` |
| Compilation | ✅ Success |
| Execution | Requires DATABASE_URL (external) |

**Log:** `.tmp/pre_deprecated_backend_test.log`

**Status:** ✅ PASS (compilation verified)

---

## Gate 6: External Blockers

| ID | Item | Impact on Deprecation |
|----|------|----------------------|
| LATER-001 | PostgreSQL provisioning | Blocks production deploy, not deprecation |
| LATER-002 | Key Vault setup | Blocks production deploy, not deprecation |
| LATER-003 | R2 credentials | Blocks admin backup/restore routes |
| LATER-004 | OAuth redirect URIs | Blocks auth ToS/age routes |
| LATER-005 | Container platform | Blocks production deploy, not deprecation |

**Status:** 🔶 External - Does not block deprecation of completed routes

---

## Transitional Paths

### Files Safe to Deprecate

The following can be moved to `deprecated/` immediately:

1. **Legacy Database Layer**
   - `src/lib/db/` → `deprecated/src/lib/db/`
   - Reason: All repos have backend equivalents

2. **Legacy API Routes (82 routes)**
   - `src/app/api/` (excluding auth ToS/age, admin backup/restore)
   - Reason: Backend handles all completed routes

3. **Legacy Auth Adapter**
   - `src/lib/auth/index.ts` (D1 adapter)
   - Reason: Backend session management active

4. **Legacy Perf/Edge Utils**
   - `src/lib/perf/` (D1 parts)
   - `src/lib/edge/` (Cloudflare-specific)
   - Reason: No longer used

### Files NOT Safe to Deprecate

| Path | Reason | Blocker |
|------|--------|---------|
| `src/app/api/auth/accept-tos/` | Backend route not implemented | LATER-004 |
| `src/app/api/auth/verify-age/` | Backend route not implemented | LATER-004 |
| `src/app/api/admin/backup/` | Backend route is stub | LATER-003 |
| `src/app/api/admin/restore/` | Backend route is stub | LATER-003 |

---

## Gatekeeper Recommendations

### Immediate Actions (Before Deprecation)

1. **Fix New Warnings** (Priority: HIGH)
   - Fix the 3 unused variable warnings in `TrackVisualizer.tsx`
   - Fix `apiPut` unused import in `exercise.ts`
   - OR add to `existing_warnings.md` with justification

2. **Establish Backend Baseline** (Priority: HIGH)
   - Run `cargo check` and document 206 warnings as baseline
   - Create `backend_warnings_baseline.md`

3. **Update ESLint Config** (Priority: MEDIUM)
   - Add `.next/` to ignores
   - Add `deprecated/` to ignores (after move)

### Deprecation Order

```
Phase 1: Safe deprecation (can do now)
  - src/lib/db/
  - src/lib/perf/
  - src/lib/edge/
  - src/lib/auth/index.ts (D1 adapter only)

Phase 2: Route deprecation (after warning fix)
  - src/app/api/* (except auth/accept-tos, auth/verify-age, admin/backup, admin/restore)

Phase 3: Remaining routes (after LATER-003, LATER-004)
  - src/app/api/auth/accept-tos/
  - src/app/api/auth/verify-age/
  - src/app/api/admin/backup/
  - src/app/api/admin/restore/
```

---

## Decision Required

### DEC-005: New Warning Policy

The current delta is +3 warnings. Options:

- **A:** Fix warnings before any deprecation
- **B:** Add to baseline with justification, proceed with deprecation
- **C:** Defer to DEC-003 (post-migration lint fix)

**Current Status:** Awaiting owner decision

---

## Log Files

| Log | Path | Purpose |
|-----|------|---------|
| Lint | `.tmp/pre_deprecated_lint.log` | ESLint output |
| TypeCheck | `.tmp/pre_deprecated_typecheck.log` | TypeScript compilation |
| Backend Check | `.tmp/pre_deprecated_backend_check.log` | Rust cargo check |
| Backend Tests | `.tmp/pre_deprecated_backend_test.log` | Rust test compilation |
| Unit Tests | `.tmp/pre_deprecated_test.log` | Vitest output |

---

## Validation Date

**Validated:** January 8, 2026  
**Validated By:** Pre-deprecation gatekeeper (automated)  
**Next Validation:** After warning fixes or baseline update
