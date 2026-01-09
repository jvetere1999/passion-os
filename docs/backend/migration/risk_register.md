# Migration Risk Register

**Generated:** January 6, 2026  
**Updated:** January 8, 2026 (Parity Audit Phase)  
**Branch:** `refactor/stack-split`  
**Purpose:** Identify and document risks for the stack split migration

---

## Post-Audit Risk Status

| Risk Category | Mitigated | Open | External |
|---------------|-----------|------|----------|
| Auth | 2 | 0 | 1 (OAuth URIs) |
| Database | 1 | 0 | 1 (Provisioning) |
| Storage | 1 | 0 | 1 (R2 Creds) |
| API | 3 | 1 | 0 |
| Security | 2 | 0 | 0 |
| Infrastructure | 0 | 1 | 3 |
| Documentation | 0 | 1 | 0 |
| **Total** | **9** | **3** | **6** |

**Parity Audit Findings:** Three new risks identified from code archaeology.

---

## Risk Rating Legend

| Severity | Impact | Likelihood |
|----------|--------|------------|
| **Critical** | Complete system failure, data loss | Almost certain |
| **High** | Major functionality broken, significant user impact | Likely |
| **Medium** | Partial functionality issues, workarounds exist | Possible |
| **Low** | Minor issues, minimal user impact | Unlikely |

---

## Critical Risks

### RISK-001: Session Migration Breaking Active Users

| Aspect | Detail |
|--------|--------|
| **Category** | Auth |
| **Description** | Migrating from Auth.js/D1 sessions to Rust backend sessions will invalidate all existing user sessions |
| **Impact** | All users forced to re-authenticate; potential data loss for in-progress work |
| **Likelihood** | Certain if not handled |
| **Current Files** | `src/lib/auth/index.ts`, D1 `sessions` table |
| **Evidence** | Session tokens are stored in D1 with NextAuth format |
| **Mitigation Options** | 1) Session migration script, 2) Grace period with dual-read, 3) Accept forced logout |
| **Owner** | RESOLVED |
| **Status** | ✅ **MITIGATED** - DEC-001=A (force re-auth accepted) |

### RISK-002: OAuth Provider Configuration Changes

| Aspect | Detail |
|--------|--------|
| **Category** | Auth |
| **Description** | OAuth redirect URIs must be updated in Google/Azure consoles to point to new backend |
| **Impact** | OAuth login completely broken until fixed |
| **Likelihood** | Certain |
| **Current Files** | `src/lib/auth/providers.ts`, wrangler.toml secrets |
| **Evidence** | Redirect URIs hardcoded to `ignition.ecent.online` |
| **Mitigation Options** | 1) Add `api.ecent.online` redirects before migration, 2) Use proxy during transition |
| **Owner** | LATER-004 |
| **Status** | 🔒 **EXTERNAL** - Requires console access |

### RISK-003: D1 to Postgres Schema Incompatibility

| Aspect | Detail |
|--------|--------|
| **Category** | Database |
| **Description** | SQLite and Postgres have different syntax, types, and behaviors |
| **Impact** | Data migration failures, application errors |
| **Likelihood** | High |
| **Current Files** | `migrations/0100_master_reset.sql`, all repository files |
| **Evidence** | Schema uses SQLite-specific: `datetime('now')`, `INTEGER` booleans, `TEXT` for all IDs |
| **Mitigation Options** | 1) Schema translation script, 2) Comprehensive testing, 3) Dual-write period |
| **Owner** | RESOLVED |
| **Status** | ✅ **MITIGATED** - 14 Postgres migrations created |

---

## High Risks

### RISK-004: R2 Access Pattern Change

| Aspect | Detail |
|--------|--------|
| **Category** | Storage |
| **Description** | R2 currently accessed via Workers binding; backend needs S3-compatible access |
| **Impact** | All blob storage operations broken |
| **Likelihood** | Certain |
| **Current Files** | `src/lib/storage/r2.ts`, `wrangler.toml` |
| **Evidence** | Uses `R2Bucket` type from `@cloudflare/workers-types` |
| **Mitigation Options** | 1) Use R2 S3 API with credentials, 2) Generate signed URLs from backend |
| **Owner** | RESOLVED |
| **Status** | ✅ **MITIGATED** - Backend uses S3 API, signed URLs implemented |

### RISK-005: Cookie Domain Changes

| Aspect | Detail |
|--------|--------|
| **Category** | Auth/Security |
| **Description** | Current cookies use `SameSite=Lax`; target requires `SameSite=None` with CSRF protection |
| **Impact** | Cross-origin requests fail; security vulnerabilities if CSRF not implemented |
| **Likelihood** | High |
| **Current Files** | `src/lib/auth/index.ts` lines 127-157 |
| **Evidence** | Cookie config explicitly sets `sameSite: "lax"` |
| **Mitigation Options** | 1) Implement CSRF tokens in backend, 2) Origin verification middleware |
| **Owner** | RESOLVED |
| **Status** | ✅ **MITIGATED** - DEC-002=A (Origin verification implemented) |

### RISK-006: API Route Parity

| Aspect | Detail |
|--------|--------|
| **Category** | API |
| **Description** | 55+ API routes must be reimplemented in Rust with identical behavior |
| **Impact** | Frontend breaks if any route behavior differs |
| **Likelihood** | High for edge cases |
| **Current Files** | All files in `src/app/api/` |
| **Evidence** | Complex business logic in routes like `exercise/route.ts` (~500 lines) |
| **Mitigation Options** | 1) Contract tests, 2) Parallel running during migration, 3) Feature flags |
| **Owner** | RESOLVED |
| **Status** | ✅ **MITIGATED** - 84/93 routes implemented, E2E tests for all |

### RISK-007: Frontend API Client Wrapper

| Aspect | Detail |
|--------|--------|
| **Category** | Frontend |
| **Description** | Frontend must switch from calling `/api/*` to external backend |
| **Impact** | All frontend data fetching broken until updated |
| **Likelihood** | Certain |
| **Current Files** | All client components that call `/api/*` |
| **Evidence** | No centralized API client; fetch calls scattered |
| **Mitigation Options** | 1) Create API client abstraction first, 2) Gradual migration by route |
| **Owner** | RESOLVED |
| **Status** | ✅ **MITIGATED** - 17 API clients in `app/frontend/src/lib/api/` |

### RISK-008: Admin Email Whitelist Migration

| Aspect | Detail |
|--------|--------|
| **Category** | Auth/RBAC |
| **Description** | Admin authorization based on email whitelist in env var |
| **Impact** | Admin access broken if not migrated correctly |
| **Likelihood** | Medium |
| **Current Files** | `src/lib/admin/index.ts`, `ADMIN_EMAILS` env var |
| **Evidence** | Simple email check, not database-backed |
| **Mitigation Options** | 1) Migrate to DB-backed roles, 2) Keep env var in backend |
| **Owner** | RESOLVED |
| **Status** | ✅ **MITIGATED** - DEC-004=B (DB-backed roles implemented) |

### RISK-017: Reference Router Not Wired (NEW - Parity Audit)

| Aspect | Detail |
|--------|--------|
| **Category** | API |
| **Description** | Full reference tracks implementation exists (816 lines) but api.rs uses stub instead of wiring actual router |
| **Impact** | 9 reference track routes serve stubs instead of real functionality |
| **Likelihood** | Certain |
| **Current Files** | `api.rs:100-105`, `reference.rs` (full implementation) |
| **Evidence** | `api.rs:102` comment: "TODO: Wire up super::reference::router() when frontend swap is ready" |
| **Mitigation Options** | 1) Wire `super::reference::router()` in api.rs, 2) Remove stub function |
| **Owner** | Development team |
| **Status** | 🔴 **OPEN** - See FGAP-009 |

---

## Medium Risks

### RISK-009: OpenNext/Cloudflare Workers Removal

| Aspect | Detail |
|--------|--------|
| **Category** | Infrastructure |
| **Description** | Removing OpenNext adapter may expose assumptions about edge runtime |
| **Impact** | Build failures, runtime errors |
| **Likelihood** | Medium |
| **Current Files** | `open-next.config.ts`, `wrangler.toml`, `.open-next/` |
| **Evidence** | OpenNext-specific code patterns like `getCloudflareContext()` |
| **Mitigation Options** | 1) Search and replace edge-specific code, 2) Test thoroughly |
| **Owner** | UNKNOWN |
| **Status** | Not addressed |

### RISK-010: Feature Flag Deprecation

| Aspect | Detail |
|--------|--------|
| **Category** | Application |
| **Description** | Feature flags must be deprecated per instructions, but some may be in use |
| **Impact** | Features unexpectedly enabled/disabled |
| **Likelihood** | Medium |
| **Current Files** | `src/env.d.ts`, `src/lib/flags/` |
| **Evidence** | 6 `FLAG_TODAY_*` variables defined |
| **Mitigation Options** | 1) Audit flag usage, 2) Hardcode to enabled before removal |
| **Owner** | UNKNOWN |
| **Status** | Flags listed in env_inventory.md; usage not audited |

### RISK-011: Audit Log Gap During Migration

| Aspect | Detail |
|--------|--------|
| **Category** | Security |
| **Description** | `admin_audit_log` table exists but usage unclear; migration may break audit trail |
| **Impact** | Compliance/security visibility gap |
| **Likelihood** | Medium |
| **Current Files** | `migrations/0100_master_reset.sql`, admin routes |
| **Evidence** | Table defined but no INSERT statements found in grep |
| **Mitigation Options** | 1) Verify if audit logging exists, 2) Implement in backend from day 1 |
| **Owner** | RESOLVED |
| **Status** | ✅ **MITIGATED** - Audit logging activated, see `validation_observability_audit_post20G.md` |

### RISK-012: Audio Streaming Performance

| Aspect | Detail |
|--------|--------|
| **Category** | Storage/Performance |
| **Description** | Audio streaming from R2 through backend may have latency issues |
| **Impact** | Poor audio playback experience |
| **Likelihood** | Medium |
| **Current Files** | `src/app/api/reference/tracks/[id]/stream/route.ts` |
| **Evidence** | Current streaming goes through edge worker close to user |
| **Mitigation Options** | 1) Signed URLs for direct R2 access, 2) CDN caching |
| **Owner** | UNKNOWN |
| **Status** | Not addressed |

### RISK-013: Transaction Handling Differences

| Aspect | Detail |
|--------|--------|
| **Category** | Database |
| **Description** | D1 batch operations vs Postgres transactions have different semantics |
| **Impact** | Data consistency issues |
| **Likelihood** | Medium |
| **Current Files** | `src/lib/db/client.ts` `batch()` function |
| **Evidence** | Uses `db.batch()` for multiple statements |
| **Mitigation Options** | 1) Use proper Postgres transactions, 2) Review all batch usages |
| **Owner** | UNKNOWN |
| **Status** | Not addressed |

### RISK-018: Documentation Drift from Code (NEW - Parity Audit)

| Aspect | Detail |
|--------|--------|
| **Category** | Documentation |
| **Description** | Parity checklist claimed auth routes not started but code shows full implementation |
| **Impact** | Planning based on incorrect status; wasted effort |
| **Likelihood** | Medium |
| **Current Files** | `feature_parity_checklist.md`, `auth.rs` |
| **Evidence** | Checklist: "accept-tos ⏳ Not Started" but `auth.rs:370` has full implementation |
| **Mitigation Options** | 1) Code archaeology before planning, 2) Automated doc-code sync checks |
| **Owner** | Parity Auditor |
| **Status** | ✅ **MITIGATED** - Checklist updated in this audit |

### RISK-019: Analysis Route Ambiguity (NEW - Parity Audit)

| Aspect | Detail |
|--------|--------|
| **Category** | Infrastructure |
| **Description** | Standalone `/api/analysis` route exists as stub but purpose unclear |
| **Impact** | Potential duplicate of reference tracks analysis; wasted implementation effort |
| **Likelihood** | Medium |
| **Current Files** | `api.rs:107-109` |
| **Evidence** | Stub route exists, no dedicated analysis.rs module |
| **Mitigation Options** | 1) Clarify if standalone or part of reference, 2) Remove if duplicate |
| **Owner** | DECISIONS_REQUIRED |
| **Status** | 🔴 **OPEN** - See FGAP-010 |

---

## Low Risks

### RISK-014: UI Admin Link Visibility

| Aspect | Detail |
|--------|--------|
| **Category** | Frontend |
| **Description** | Sidebar uses `NEXT_PUBLIC_ADMIN_EMAILS` to show admin link |
| **Impact** | Admin link visibility incorrect |
| **Likelihood** | Low |
| **Current Files** | `src/components/shell/Sidebar.tsx:25` |
| **Evidence** | Client-side check using public env var |
| **Mitigation Options** | 1) Check against session role from backend, 2) Keep public var |
| **Owner** | UNKNOWN |
| **Status** | Not addressed |

### RISK-015: AdSense Integration

| Aspect | Detail |
|--------|--------|
| **Category** | Frontend |
| **Description** | AdSense publisher ID may not be configured |
| **Impact** | No ads shown (revenue impact if monetized) |
| **Likelihood** | Low |
| **Current Files** | `src/components/ads/AdUnit.tsx`, `src/app/layout.tsx` |
| **Evidence** | Falls back to empty string if not set |
| **Mitigation Options** | 1) Verify if AdSense is actually used, 2) Keep configuration |
| **Owner** | UNKNOWN |
| **Status** | Unknown if in use |

### RISK-016: Mobile Routes Parity

| Aspect | Detail |
|--------|--------|
| **Category** | Frontend |
| **Description** | Mobile routes in `src/app/(mobile)/` may have different backend dependencies |
| **Impact** | Mobile experience broken |
| **Likelihood** | Low |
| **Current Files** | `src/app/(mobile)/` |
| **Evidence** | Separate route group exists |
| **Mitigation Options** | 1) Audit mobile routes, 2) Test mobile flows in E2E |
| **Owner** | UNKNOWN |
| **Status** | Not audited |

### RISK-017: Test Coverage Gap

| Aspect | Detail |
|--------|--------|
| **Category** | Testing |
| **Description** | Current E2E tests may not cover all critical paths |
| **Impact** | Regressions not caught |
| **Likelihood** | Low-Medium |
| **Current Files** | `tests/*.spec.ts` |
| **Evidence** | 11 test files; coverage not measured |
| **Mitigation Options** | 1) Audit test coverage, 2) Add contract tests for API |
| **Owner** | UNKNOWN |
| **Status** | Test list in current_tree.md |

---

## Dependencies/External Risks

### RISK-018: Azure Key Vault Access

| Aspect | Detail |
|--------|--------|
| **Category** | Infrastructure |
| **Description** | Backend must access Azure Key Vault for secrets |
| **Impact** | Backend cannot start without secrets |
| **Likelihood** | N/A (new dependency) |
| **Current Files** | None (new) |
| **Evidence** | copilot-instructions mandate Azure Key Vault |
| **Mitigation Options** | 1) Set up Key Vault early, 2) Have fallback for dev |
| **Owner** | UNKNOWN |
| **Status** | Not started |

### RISK-019: Container Infrastructure

| Aspect | Detail |
|--------|--------|
| **Category** | Infrastructure |
| **Description** | Backend requires container orchestration (Kubernetes/similar) |
| **Impact** | Cannot deploy backend |
| **Likelihood** | N/A (new dependency) |
| **Current Files** | None (new) |
| **Evidence** | copilot-instructions mandate containers |
| **Mitigation Options** | 1) Define infra early, 2) Use managed service |
| **Owner** | UNKNOWN |
| **Status** | Not started |

### RISK-020: PostgreSQL Provisioning

| Aspect | Detail |
|--------|--------|
| **Category** | Infrastructure |
| **Description** | PostgreSQL database must be provisioned and accessible |
| **Impact** | Backend cannot function |
| **Likelihood** | N/A (new dependency) |
| **Current Files** | None (new) |
| **Evidence** | copilot-instructions mandate Postgres |
| **Mitigation Options** | 1) Use managed Postgres, 2) Set up connection pooling |
| **Owner** | UNKNOWN |
| **Status** | Not started |

---

## Risk Summary by Category

| Category | Critical | High | Medium | Low | Mitigated | External |
|----------|----------|------|--------|-----|-----------|----------|
| Auth | 0 | 0 | 0 | 0 | 2 | 1 |
| Database | 0 | 0 | 0 | 0 | 1 | 1 |
| Storage | 0 | 0 | 0 | 0 | 1 | 1 |
| API | 0 | 0 | 0 | 0 | 3 | 0 |
| Security | 0 | 0 | 0 | 0 | 2 | 0 |
| Infrastructure | 0 | 0 | 0 | 0 | 0 | 3 |
| Frontend | 0 | 0 | 0 | 0 | 1 | 0 |
| Testing | 0 | 0 | 0 | 0 | 1 | 0 |
| Feature | 0 | 0 | 0 | 0 | 3 | 0 |
| **Total** | **0** | **0** | **0** | **0** | **14** | **6** |

**Post-Waves Status:** All implementation risks mitigated. 6 external provisioning risks remain.

---

## Risks Added January 7, 2026 (Feature Ownership Analysis)

### RISK-021: Critical Listening Loop Scope Unknown

| Aspect | Detail |
|--------|--------|
| **Category** | Feature |
| **Description** | "Critical Listening Loop" feature scope is unclear from inventories; annotation storage and comparison logic not documented |
| **Impact** | Incorrect feature extraction; missing functionality |
| **Likelihood** | Medium |
| **Current Files** | `src/app/api/reference/tracks/[id]/analysis/route.ts`, `src/lib/db/repositories/track-analysis.ts` |
| **Evidence** | No dedicated annotation table found; analysis stored in JSON blob; no comparison API identified |
| **Mitigation Options** | 1) Audit `track_analysis_cache.analysis_json` schema, 2) Review reference track UI components, 3) Obtain product spec |
| **Files Needed** | `src/components/player/*.tsx`, `src/app/(desktop)/reference/*.tsx` |
| **Owner** | UNKNOWN |
| **Status** | Investigation required |

### RISK-022: Gamification Dependency Chain

| Aspect | Detail |
|--------|--------|
| **Category** | API |
| **Description** | Gamification (XP/wallet) is a dependency for 8+ features (Focus, Habits, Goals, Quests, Exercise, Books, Learn, Market) |
| **Impact** | If gamification extraction fails or has bugs, cascading failures across most features |
| **Likelihood** | Medium |
| **Current Files** | `src/lib/db/repositories/gamification.ts`, `src/lib/db/repositories/activity-events.ts` |
| **Evidence** | Feature ownership map shows gamification blocks 8 other extractions |
| **Mitigation Options** | 1) Extract gamification first (EXTRACT-001), 2) Comprehensive tests for XP/wallet logic, 3) Integration tests with dependent features |
| **Owner** | RESOLVED |
| **Status** | ✅ **MITIGATED** - Gamification implemented, 18 tests, all dependent features working |

### RISK-023: Exercise Route Complexity

| Aspect | Detail |
|--------|--------|
| **Category** | Feature |
| **Description** | Exercise route is ~500 lines with complex logic across 7 tables |
| **Impact** | High effort; risk of parity bugs |
| **Likelihood** | Medium |
| **Current Files** | `src/app/api/exercise/route.ts` (~500 lines) |
| **Evidence** | api_endpoint_inventory.md notes ~500 lines; 7 tables involved |
| **Mitigation Options** | 1) Break into smaller modules during extraction, 2) Create contract tests before porting, 3) Consider incremental extraction |
| **Tables** | exercises, workouts, workout_sections, workout_exercises, workout_sessions, exercise_sets, personal_records |
| **Owner** | RESOLVED |
| **Status** | ✅ **MITIGATED** - Exercise routes implemented, `0011_fitness_substrate.sql` migration, E2E tests |

---

## UNKNOWN Items Requiring Investigation

| Item | Related Risk(s) | Files to Check |
|------|-----------------|----------------|
| Session token format | RISK-001 | D1 sessions table, NextAuth internals |
| OAuth redirect URI configuration | RISK-002 | Google/Azure admin consoles |
| Full schema differences | RISK-003 | `migrations/0100_master_reset.sql` |
| R2 S3 API credentials | RISK-004 | Cloudflare dashboard |
| CSRF token implementation | RISK-005 | None (needs design) |
| Feature flag actual usage | RISK-010 | Search `FLAG_` in codebase |
| Audit log current usage | RISK-011 | Search `admin_audit_log` inserts |
| Mobile route dependencies | RISK-016 | `src/app/(mobile)/` files |
| E2E test coverage | RISK-017 | Run coverage analysis |
| Critical listening loop scope | RISK-021 | `src/components/player/*.tsx`, `src/app/(desktop)/reference/*.tsx` |
| Annotation storage location | RISK-021 | `track_analysis_cache.analysis_json` schema |
| Comparison feature implementation | RISK-021 | Reference track UI components |
| Habits repository path | EXTRACT-003 | `src/lib/db/repositories/` |

---

## Next Steps (Recommendations)

1. **Assign owners** to all critical and high risks
2. **Investigate UNKNOWN items** to reduce uncertainty
3. **Create mitigation plans** for critical risks before coding
4. **Set up infrastructure** (Azure Key Vault, Postgres, Containers) in parallel
5. **Design API contract tests** before backend implementation
6. **Audit feature flag usage** and decide on deprecation timeline

