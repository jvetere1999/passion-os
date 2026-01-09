# E2E Test Coverage Map (Post-20G)

**Date:** January 7, 2026  
**Branch:** `refactor/stack-split`  
**Purpose:** Map all existing Playwright tests to WAVE_PLAN_POST20G parity IDs and critical user journeys

---

## Executive Summary

| Metric | Value |
|--------|-------|
| **Total Playwright Test Files** | 20 |
| **Total Test Cases** | ~95 |
| **Parity IDs with E2E Coverage** | 18/71 (25%) |
| **Critical Journeys Covered** | 6/12 (50%) |
| **Security Tests** | 8 |
| **Accessibility Tests** | 12 |

---

## Coverage by Wave

### Wave 0: Infrastructure (12/12 Routes - 100% Backend, 75% E2E)

| PARITY-ID | Route | Test File(s) | Test Count | Journey Coverage |
|-----------|-------|--------------|------------|------------------|
| PARITY-001 | POST /auth/google | `tests/auth.spec.ts` | 3 | OAuth initiation UI ✅ |
| PARITY-002 | POST /auth/azure | `tests/auth.spec.ts` | 3 | OAuth initiation UI ✅ |
| PARITY-003 | GET /auth/callback/:provider | `tests/auth.spec.ts` | 1 | Error handling ✅ |
| PARITY-004 | POST /auth/logout | `tests/auth.spec.ts` | 0 | ❌ Missing |
| PARITY-005 | GET /health | None | 0 | (Internal only) |
| PARITY-006 | POST /api/blobs/upload | `tests/storage.spec.ts` | 2 | Signed URL ✅ |
| PARITY-007 | POST /api/blobs/upload-url | `tests/storage.spec.ts` | 3 | MIME validation ✅ |
| PARITY-008 | GET /api/blobs/:id | `tests/storage.spec.ts` | 2 | 404 handling ✅ |
| PARITY-009 | DELETE /api/blobs/:id | `tests/storage.spec.ts` | 2 | Auth + ownership ✅ |
| PARITY-010 | GET /api/blobs/:id/info | `tests/storage.spec.ts` | 0 | (Covered via GET :id) |
| PARITY-011 | GET /api/blobs/:id/download-url | `tests/storage.spec.ts` | 0 | ❌ Missing explicit |
| PARITY-012 | GET /api/blobs | `tests/storage.spec.ts` | 2 | List + shape ✅ |

**Wave 0 E2E Total:** 9/12 routes covered (75%)

---

### Wave 0.5: Reference Tracks (6/6 Routes - 100% E2E)

| PARITY-ID | Route | Test File(s) | Test Count | Journey Coverage |
|-----------|-------|--------------|------------|------------------|
| PARITY-013 | Reference track CRUD | `app/frontend/tests/reference-tracks.spec.ts` | 5 | Upload → List → Select ✅ |
| PARITY-014 | Track analysis | `app/frontend/tests/reference-tracks.spec.ts` | 2 | Visualizer load ✅ |
| PARITY-015 | Annotations CRUD | `app/frontend/tests/reference-tracks.spec.ts` | 3 | Create → Persist → Delete ✅ |
| PARITY-016 | Regions CRUD | `app/frontend/tests/reference-tracks.spec.ts` | 3 | Create loop → Persist ✅ |
| PARITY-017 | Frames transport | `app/frontend/tests/reference-tracks.spec.ts` | 1 | (Implicit via visualizer) |
| PARITY-018 | Admin templates | None | 0 | ❌ No E2E (backend tests only) |

**Wave 0.5 E2E Total:** 5/6 routes covered (83%)

---

### Wave 1: Foundation (0/9 Routes - 0% Backend, 0% E2E)

| PARITY-ID | Route | Test File(s) | Test Count | Journey Coverage |
|-----------|-------|--------------|------------|------------------|
| PARITY-019 | GET /gamification/teaser | None | 0 | ❌ Pending backend |
| PARITY-020 | GET /gamification/summary | `tests/database-operations.spec.ts` | 3 | Page load only |
| PARITY-021 | GET,POST /focus | `tests/database-operations.spec.ts` | 3 | API response check |
| PARITY-022 | GET /focus/active | `tests/database-operations.spec.ts` | 1 | API response check |
| PARITY-023 | GET,POST,DELETE /focus/pause | `tests/database-operations.spec.ts` | 1 | API response check |
| PARITY-024 | POST /focus/:id/complete | None | 0 | ❌ Missing |
| PARITY-025 | POST /focus/:id/abandon | None | 0 | ❌ Missing |
| PARITY-026 | GET,POST /habits | `tests/database-operations.spec.ts` | 2 | Page + API check |
| PARITY-027 | GET,POST /goals | `tests/database-operations.spec.ts` | 2 | Page + API check |

**Note:** Wave 1 routes not yet implemented in backend. Tests are placeholder/smoke only.

---

### Wave 2: Core Features (0/4 Routes - 0% E2E)

| PARITY-ID | Route | Test File(s) | Test Count | Journey Coverage |
|-----------|-------|--------------|------------|------------------|
| PARITY-028 | GET,POST /quests | `tests/database-operations.spec.ts` | 2 | Page + API check |
| PARITY-029 | Calendar CRUD | None | 0 | ❌ Missing |
| PARITY-030 | GET,POST /daily-plan | `tests/database-operations.spec.ts` | 2 | Page + API check |
| PARITY-031 | GET,POST /feedback | None | 0 | ❌ Missing |

---

### Wave 3: Complex Features (0/8 Routes - 0% E2E)

| PARITY-ID | Route | Test File(s) | Test Count | Journey Coverage |
|-----------|-------|--------------|------------|------------------|
| PARITY-032 | Exercise CRUD | `tests/database-operations.spec.ts` | 1 | Page load only |
| PARITY-033 | POST /exercise/seed | None | 0 | ❌ Admin only |
| PARITY-034 | Books CRUD | `tests/database-operations.spec.ts` | 1 | Page load only |
| PARITY-035 | GET,POST /programs | None | 0 | ❌ Missing |
| PARITY-036 | GET /market | `tests/market.spec.ts` | 4 | Page + items ✅ |
| PARITY-037 | Market items CRUD | `tests/market.spec.ts` | 2 | Wallet + click |
| PARITY-038 | POST /market/purchase | `tests/market.spec.ts` | 2 | API check |
| PARITY-039 | POST /market/redeem | `tests/market.spec.ts` | 1 | API check |

---

### Wave 4: Specialized Features (6/17 Backend - 35% E2E)

| PARITY-ID | Route | Test File(s) | Test Count | Journey Coverage |
|-----------|-------|--------------|------------|------------------|
| PARITY-040 | GET /learn | `tests/database-operations.spec.ts` | 4 | Topic + drill pages |
| PARITY-041 | Learn progress | None | 0 | ❌ Missing |
| PARITY-042 | Learn review | None | 0 | ❌ Missing |
| PARITY-043 | Reference tracks | `app/frontend/tests/reference-tracks.spec.ts` | 14 | Full CRUD ✅ |
| PARITY-044 | Reference track detail | `app/frontend/tests/reference-tracks.spec.ts` | (included above) | ✅ |
| PARITY-045 | Track analysis | `app/frontend/tests/reference-tracks.spec.ts` | (included above) | ✅ |
| PARITY-046 | Track play | `app/frontend/tests/reference-tracks.spec.ts` | (included above) | ✅ |
| PARITY-047 | Track stream | `app/frontend/tests/reference-tracks.spec.ts` | 1 | Signed URL check ✅ |
| PARITY-048 | Reference upload | `app/frontend/tests/reference-tracks.spec.ts` | 2 | Upload flow ✅ |
| PARITY-049 | GET /onboarding | `tests/onboarding.spec.ts` | 4 | Flow + skip ✅ |
| PARITY-050 | POST /onboarding/start | `tests/onboarding.spec.ts` | 1 | (Implicit) |
| PARITY-051 | POST /onboarding/skip | `tests/onboarding.spec.ts` | 1 | Skip action ✅ |
| PARITY-052 | POST /onboarding/reset | None | 0 | ❌ Missing |
| PARITY-053 | POST /onboarding/step | `tests/onboarding.spec.ts` | 1 | Interest select |
| PARITY-054 | Infobase CRUD | `tests/database-operations.spec.ts` | 1 | Page load only |
| PARITY-055 | Ideas CRUD | `tests/database-operations.spec.ts` | 3 | Page + API check |
| PARITY-056 | GET,POST /analysis | None | 0 | ❌ Missing |

---

### Wave 5: User & Admin (1/15 Routes - 7% E2E)

| PARITY-ID | Route | Test File(s) | Test Count | Journey Coverage |
|-----------|-------|--------------|------------|------------------|
| PARITY-057 | POST /auth/accept-tos | None | 0 | ❌ Missing |
| PARITY-058 | POST /auth/verify-age | None | 0 | ❌ Missing |
| PARITY-059 | DELETE /user/delete | None | 0 | ❌ Missing |
| PARITY-060 | GET /user/export | None | 0 | ❌ Missing |
| PARITY-061 | GET,DELETE /admin/users | None | 0 | ❌ Admin (backend tests) |
| PARITY-062 | GET,DELETE /admin/cleanup-users | None | 0 | ❌ Admin |
| PARITY-063 | GET /admin/stats | None | 0 | ❌ Admin |
| PARITY-064 | GET,PATCH /admin/feedback | None | 0 | ❌ Admin |
| PARITY-065 | GET,PATCH /admin/quests | None | 0 | ❌ Admin |
| PARITY-066 | GET,PATCH,DELETE /admin/skills | `tests/database-operations.spec.ts` | 1 | Skills seeded check |
| PARITY-067 | GET,POST,DELETE /admin/content | None | 0 | ❌ Admin |
| PARITY-068 | GET,DELETE /admin/db-health | `tests/database-operations.spec.ts` | 3 | Health checks ✅ |
| PARITY-069 | GET /admin/backup | None | 0 | ❌ Admin |
| PARITY-070 | POST /admin/restore | None | 0 | ❌ Admin |
| PARITY-071 | Admin Templates | None | 0 | ❌ Admin (backend tests only) |

---

## Critical User Journeys

### Covered Journeys ✅

| Journey | Test File(s) | Parity IDs | Tests |
|---------|--------------|------------|-------|
| **OAuth Login (Google + Azure)** | `tests/auth.spec.ts` | PARITY-001, PARITY-002, PARITY-003 | 6 |
| **Protected Route Redirect** | `tests/auth.spec.ts` | PARITY-001-004 | 6 |
| **Storage Upload + Download** | `tests/storage.spec.ts` | PARITY-006-012 | 10 |
| **Reference Track Lifecycle** | `app/frontend/tests/reference-tracks.spec.ts` | PARITY-013-017, PARITY-043-048 | 14 |
| **Theme Persistence** | `tests/theme.spec.ts` | N/A (UI) | 7 |
| **Onboarding Flow** | `tests/onboarding.spec.ts` | PARITY-049-053 | 6 |

### Missing Journeys ❌

| Journey | Priority | Parity IDs | Notes |
|---------|----------|------------|-------|
| **OAuth Callback Success** | P1 | PARITY-001-004 | Need mock OAuth for full flow |
| **Session Persistence Across Refresh** | P1 | PARITY-001-004 | Requires auth fixture |
| **RBAC Gating to Admin Console** | P1 | PARITY-061-071 | Admin routes not yet ported |
| **Focus Session Complete → XP Award** | P1 | PARITY-021-025, PARITY-019-020 | Backend not ported |
| **Market Purchase Flow** | P2 | PARITY-036-039 | Backend not ported |
| **User Data Export** | P2 | PARITY-060 | Backend not ported |

---

## Security Tests

| Category | Test File | Count | Evidence |
|----------|-----------|-------|----------|
| **R2 Credential Exposure** | `app/frontend/tests/reference-tracks.spec.ts` | 1 | No R2 keys in page content |
| **Token Exposure (localStorage)** | `app/frontend/tests/reference-tracks.spec.ts` | 1 | No tokens in localStorage |
| **Unauthenticated API Rejection** | `tests/auth.spec.ts`, `app/frontend/tests/reference-tracks.spec.ts` | 3 | 401 on protected routes |
| **IDOR Prevention** | `tests/storage.spec.ts`, `app/frontend/tests/reference-tracks.spec.ts` | 2 | 404 for other user's data |
| **CSRF (Origin Check)** | `tests/storage.spec.ts` | 1 | Mutation rejection without Origin |
| **MIME Type Validation** | `tests/storage.spec.ts` | 1 | Rejects executable MIME types |

**Total Security Tests:** 8

---

## Accessibility Tests

| Page | Test File | Count | Checks |
|------|-----------|-------|--------|
| **Home** | `tests/home.spec.ts`, `tests/accessibility.spec.ts` | 5 | Alt text, link hrefs, lang |
| **Hub** | `tests/hub.spec.ts`, `tests/accessibility.spec.ts` | 4 | Heading structure, search input |
| **DAW Detail** | `tests/accessibility.spec.ts` | 3 | Back nav, kbd elements, headings |
| **Templates** | `tests/accessibility.spec.ts` | 1 | Category card accessibility |
| **Keyboard Nav** | `tests/accessibility.spec.ts` | 1 | Tab through elements |

**Total Accessibility Tests:** 12 (across 2 files)

---

## UI/Responsive Tests

| Category | Test File | Count |
|----------|-----------|-------|
| **Mobile Viewport (375px)** | `tests/home.spec.ts`, `tests/navigation.spec.ts` | 3 |
| **Tablet Viewport (768px)** | `tests/home.spec.ts` | 1 |
| **Desktop Viewport (1280px+)** | `tests/home.spec.ts`, `tests/navigation.spec.ts` | 2 |
| **Theme Dark/Light** | `tests/theme.spec.ts` | 7 |
| **404 Handling** | `tests/hub.spec.ts`, `tests/navigation.spec.ts` | 2 |

---

## Test File Inventory

### Root `/tests/` Directory

| File | Lines | Tests | Parity Coverage |
|------|-------|-------|-----------------|
| `auth.spec.ts` | 108 | 10 | PARITY-001-004 |
| `storage.spec.ts` | 148 | 11 | PARITY-006-012 |
| `onboarding.spec.ts` | 72 | 6 | PARITY-049-053 |
| `market.spec.ts` | 94 | 8 | PARITY-036-039 |
| `hub.spec.ts` | 115 | 9 | N/A (public) |
| `home.spec.ts` | 93 | 9 | N/A (public) |
| `templates.spec.ts` | 126 | 10 | N/A (public) |
| `theme.spec.ts` | 112 | 7 | N/A (UI) |
| `accessibility.spec.ts` | 184 | 12 | N/A (a11y) |
| `database-operations.spec.ts` | 441 | 28 | Multiple waves |

### Frontend `/app/frontend/tests/` Directory

| File | Lines | Tests | Parity Coverage |
|------|-------|-------|-----------------|
| `reference-tracks.spec.ts` | 425 | 14 | PARITY-013-017, PARITY-043-048 |
| `navigation.spec.ts` | 106 | 8 | N/A (routing) |
| `auth.spec.ts` | - | (duplicate) | - |
| `database-operations.spec.ts` | - | (duplicate) | - |
| `hub.spec.ts` | - | (duplicate) | - |
| `market.spec.ts` | - | (duplicate) | - |
| `onboarding.spec.ts` | - | (duplicate) | - |
| `templates.spec.ts` | - | (duplicate) | - |
| `theme.spec.ts` | - | (duplicate) | - |
| `accessibility.spec.ts` | - | (duplicate) | - |

**Note:** Frontend tests appear to be duplicates/symlinks of root tests for frontend-specific execution.

---

## Gap Analysis Summary

### High Coverage (>75% E2E)

- **Wave 0.5 Reference Tracks:** 83% - Comprehensive CRUD + security tests
- **Wave 0 Auth:** 75% - OAuth UI, redirects, providers
- **Wave 0 Storage:** 75% - Blobs CRUD, MIME validation, IDOR

### Low Coverage (<25% E2E)

- **Wave 1-5 Features:** 0-10% - Backend not yet ported
- **Admin Routes:** 0% - Requires separate admin test setup
- **User GDPR Routes:** 0% - Export/delete not ported

### Missing Critical Tests (Blockers for Migration)

1. **Session persistence across refresh** - Requires auth fixture
2. **CSRF enforcement (full suite)** - Only 1 partial test
3. **Session rotation on privilege change** - Not tested
4. **Admin RBAC gating** - No admin E2E tests

---

## References

- [WAVE_PLAN_POST20G.md](./WAVE_PLAN_POST20G.md) - Authoritative wave plan
- [feature_parity_checklist.md](./feature_parity_checklist.md) - Feature status
- [TEST_BACKLOG_POST20G.md](./TEST_BACKLOG_POST20G.md) - Prioritized test backlog
- [checkpoint_20F.md](./checkpoint_20F.md) - 110 backend tests, Playwright passing

---

**Updated:** January 7, 2026 - Initial coverage map creation for UNKNOWN-011 resolution

