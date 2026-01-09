# Removal Checklist

**Date:** January 8, 2026  
**Branch:** `refactor/stack-split`  
**Purpose:** Step-by-step checklist for moving legacy code to deprecated mirror

---

## ⚠️ CRITICAL BLOCKERS

### Current State: Root `src/` Has Broken Imports

The root `src/` codebase has **60 "Cannot find module" TypeScript errors** because:
1. DB repositories were moved to `deprecated/` but root `src/` code still imports them
2. Perf module was moved to `deprecated/` but root `src/` code still imports them

**This is a pre-existing baseline issue** from incomplete previous deprecation.

### Blocking Condition for Further Deprecation

**Further deprecation is BLOCKED until:**
1. Root `src/` is fully replaced by `app/frontend/`, OR
2. Root `src/` code is updated to use backend API instead of direct DB imports

**Status:** Cannot deprecate `src/lib/flags/`, `src/lib/admin/`, `wrangler.toml`, or `open-next.config.ts` because root `src/` code imports from them. Moving these would add MORE broken imports.

---

## Pre-Deprecation Gates

Before deprecating ANY code, verify:

- [ ] **Root `src/` replaced** - All active pages moved to `app/frontend/`
- [ ] **Backend parity confirmed** - See [feature_parity_checklist.md](./feature_parity_checklist.md)
- [ ] **Tests passing** - TypeScript, ESLint, unit tests, E2E
- [ ] **No new warnings** - Per DEC-003=C warning baseline rule
- [ ] **Phase gates clear** - See [PHASE_GATE.md](./PHASE_GATE.md)

---

## Batch 1: BLOCKED - Root `src/` Still Active

These files CANNOT be deprecated because root `src/` code imports them:

### 1.1 Feature Flags Module - ❌ BLOCKED

**Reason:** 5 files in `src/` import `@/lib/flags`:
- `src/app/(app)/today/TodayGridClient.tsx`
- `src/app/(app)/today/MomentumBanner.tsx`
- `src/app/(app)/today/StarterBlock.tsx`
- `src/app/(app)/focus/FocusClient.tsx`
- `src/components/mobile/screens/MobileTodayClient.tsx`

**Unblock Action:** Move these pages to `app/frontend/` or update imports to use `app/frontend/src/lib/flags/`

---

### 1.2 Admin Module - ❌ BLOCKED

**Reason:** 3 files in `src/` import `@/lib/admin`:
- `src/app/(app)/admin/docs/page.tsx`
- `src/app/(app)/admin/page.tsx`
- `src/components/shell/UserMenu.tsx`

**Unblock Action:** Move admin pages to `app/admin/` or update imports

---

### 1.3 Cloudflare Configuration - ❌ BLOCKED

**Reason:** `wrangler.toml` and `open-next.config.ts` may be needed for root `src/` build

**Unblock Action:** Confirm root `src/` is no longer deployed via Cloudflare

---

## Batch 2: Storage Module - ❌ BLOCKED

| Step | Command/Action | Status |
|------|----------------|--------|
| 1 | Verify `app/backend/crates/api/src/routes/auth.rs` has OAuth | ⏳ |
| 2 | Verify OAuth login works via backend | ⏳ |
| 3 | `git mv src/lib/auth/providers.ts deprecated/src/lib/auth/` | ⏳ |
| 4 | `git mv src/lib/auth/__tests__ deprecated/src/lib/auth/` | ⏳ |
| 5 | Run `npm run typecheck` | ⏳ |
| 6 | Run auth E2E tests | ⏳ |
| 7 | Commit: `deprecate: move remaining src/lib/auth to deprecated` | ⏳ |

**Keep in Active Code:**
- `src/lib/auth/useAuth.ts` → Move to `app/frontend/src/lib/auth/`
- `src/lib/auth/SessionProvider.tsx` → Move to `app/frontend/src/lib/auth/`

---

## Batch 4: Middleware

Deprecate after Axum middleware validated.

### 4.1 Next.js Middleware

| Step | Command/Action | Status |
|------|----------------|--------|
| 1 | Verify `app/backend/crates/api/src/middleware/` exists | ⏳ |
| 2 | Verify auth middleware works (session validation) | ⏳ |
| 3 | Verify CSRF middleware works (Origin verification) | ⏳ |
| 4 | `git mv src/middleware.ts deprecated/src/middleware.ts` | ⏳ |
| 5 | Run `npm run typecheck` | ⏳ |
| 6 | Run auth E2E tests | ⏳ |
| 7 | Commit: `deprecate: move src/middleware.ts to deprecated` | ⏳ |

**Validation:** Protected routes still require authentication

---

## Batch 5: DB Module Cleanup

Already deprecated, but verify cleanup.

### 5.1 Verify DB Deprecation Complete

| Step | Check | Status |
|------|-------|--------|
| 1 | `src/lib/db/` is empty or has only `__tests__/` | ⏳ |
| 2 | All repos in `deprecated/src/lib/db/repositories/` | ✅ Done |
| 3 | No imports of `src/lib/db` in active code | ⏳ |
| 4 | No D1 references in active code | ⏳ |

---

## Post-Deprecation Validation

After each batch, run full validation:

```bash
# Redirect to .tmp/ per copilot instructions
npm run typecheck 2>&1 > .tmp/typecheck-post-deprecation.log
npm run lint 2>&1 > .tmp/lint-post-deprecation.log
npm run test 2>&1 > .tmp/test-post-deprecation.log
npm run build 2>&1 > .tmp/build-post-deprecation.log
```

### Validation Checklist

| Check | Command | Expected |
|-------|---------|----------|
| TypeScript | `npm run typecheck` | 0 errors |
| ESLint | `npm run lint` | ≤ baseline warnings |
| Unit Tests | `npm run test` | All pass |
| Build | `npm run build` | Success |
| E2E Tests | `npx playwright test` | All pass |

---

## Rollback Procedure

If deprecation breaks something:

```bash
# Move back from deprecated
git mv deprecated/src/lib/auth src/lib/auth

# Revert feature_parity_checklist.md changes
git checkout HEAD~1 -- docs/backend/migration/feature_parity_checklist.md

# Run validation
npm run typecheck && npm run lint && npm run test
```

---

## Final Cleanup (Post-Cutover)

After production cutover is complete and stable:

### Delete Deprecated Directory

| Step | Command/Action | Status |
|------|----------------|--------|
| 1 | Wait 30 days after cutover | ⏳ |
| 2 | Verify no rollback needed | ⏳ |
| 3 | `rm -rf deprecated/` | ⏳ |
| 4 | `git add -A && git commit -m "cleanup: remove deprecated code"` | ⏳ |

### Delete Build Artifacts

| Path | Action |
|------|--------|
| `.open-next/` | Delete (not in git) |
| `.wrangler/` | Delete (not in git) |
| `node_modules/.cache/` | Clear cache |

---

## Summary

| Batch | Files | Dependencies | Priority |
|-------|-------|--------------|----------|
| 1 | flags, admin, wrangler, open-next | None | Immediate |
| 2 | storage module | Phase 14 R2 validated | After R2 |
| 3 | auth remaining | Phase 11a OAuth validated | After OAuth |
| 4 | middleware | Axum middleware validated | After middleware |
| 5 | DB cleanup verification | All repos deprecated | Verification only |

---

## References

- [deprecation_map.md](./deprecation_map.md) - Full inventory
- [deprecated_mirror_policy.md](./deprecated_mirror_policy.md) - Policy rules
- [feature_parity_checklist.md](./feature_parity_checklist.md) - Feature status
- [PHASE_GATE.md](./PHASE_GATE.md) - Phase gates
- [PRE_DEPRECATED_GATE.md](./PRE_DEPRECATED_GATE.md) - Pre-deprecation validation
