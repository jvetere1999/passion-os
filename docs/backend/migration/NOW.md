"Items resolved via repo inspection. Do not add items requiring external access."

# Resolved NOW - Via Repo Inspection

**Date:** January 6, 2026  
**Updated:** January 8, 2026 (Parity Audit)  
**Branch:** `refactor/stack-split`  
**Purpose:** Document items resolved immediately through repo inspection

---

## Summary

| Resolved | Category | Description |
|----------|----------|-------------|
| UNKNOWN-001 | Auth | Session migration → DEC-001 = A (force re-auth) |
| UNKNOWN-003 | Flags | Feature flags already deprecated, all return true |
| UNKNOWN-004 | Audit | admin_audit_log table not used in code |
| UNKNOWN-009 | Mobile | Mobile routes use standard auth/db patterns |
| UNKNOWN-010 | AdSense | AdSense is optional, gracefully disabled if unset |
| UNKNOWN-012 | Schema | Both quests and universal_quests are active |
| UNKNOWN-013 | Schema | user_progress is actively used |
| UNKNOWN-014 | Storage | File size limits exist (no user quotas) |
| UNKNOWN-015 | Storage | No orphan blob cleanup exists |
| UNKNOWN-016 | Lint | Warnings fixed post-migration → DEC-003 = C |
| UNKNOWN-017 | Auth | Admin auth → DEC-004 = B (DB-backed roles) |
| ACTION-006 | Security | CSRF → DEC-002 = A (Origin verification) |
| ACTION-007 | Auth | Session strategy → DEC-001 = A (force re-auth) |
| ACTION-016 | Flags | Audit complete - flags are deprecated stubs |
| ACTION-028 | Lint | Timing decided → DEC-003 = C |
| ACTION-030 | Auth | Admin strategy → DEC-004 = B |
| FGAP-008 | Metrics | Metric drift between docs resolved (WAVE_PLAN_POST20G authoritative) |
| RISK-018 | Docs | Documentation drift mitigated by parity audit updates |

---

## Immediately Actionable (Per PHASE_GATE.md)

| Phase | Action                         | Status         |
|-------|--------------------------------|----------------|
| 06    | Verify skeleton directories    | ✅ **Complete** |
| 07    | Create structure/move plan     | ✅ **Complete** |
| --    | Move frontend to app/frontend/ | ✅ **Complete** |
| --    | Move admin to app/admin/       | ✅ **Complete** |
| 08    | Scaffold backend locally       | ✅ **Complete** |
| 11    | Database migration (local)     | ✅ **Complete** |
| 11a   | Auth substrate migration       | ✅ **Complete** |
| 11b   | Auth implementation            | ✅ **Complete** |
| 11c   | Feature table migrations       | ✅ **Complete** |
| 11d   | D1 deprecation planning        | ✅ **Complete** |
| 14    | R2 Integration                 | ✅ **Complete** |
| 15    | API Contracts                  | ✅ **Complete** |
| 16    | Feature Porting Playbook       | ✅ **Complete** |
| 17    | Frontend API Client            | ✅ **Complete** |
| 17b   | Feature Ownership Map          | ✅ **Complete** |
| 17c   | Backend Modularity Plan        | ✅ **Complete** |
| 17d   | API Contracts Plan             | ✅ **Complete** |
| 18a   | Reference Tracks Domain        | ✅ **Complete** |
| 18b   | Frames Transport               | ✅ **Complete** |
| 20F   | Checkpoint Audit               | ✅ **Complete** |
| 20G   | Wave Plan Post-20G             | ✅ **Complete** |
| 23    | Infrastructure (local)         | ✅ **Complete** |
| 23b   | Cutover Planning               | ✅ **Complete** |
| 18    | Feature routes implementation  | ✅ **Complete** |
| 20    | Admin console split            | ⏳ Ready        |
| --    | ACTION-038: D1 script removal  | 🔒 After parity |
| --    | ACTION-040: Feature routes     | ✅ **Complete** |
| --    | ACTION-041: Reference FE swap  | ⏳ Ready        |
| --    | ACTION-053: Wire reference router | ⏳ Ready (NEW) |
| --    | ACTION-054: Analysis route     | 🔒 Blocked (DECISION-006) |

**Parity Audit Findings (January 8, 2026):**
- Auth routes accept-tos/verify-age ARE implemented (checklist was stale)
- Reference router has full 816-line implementation but is NOT wired in api.rs
- Analysis route is stub-only, purpose unclear (needs decision)
- 3 new gaps: FGAP-009, FGAP-010, and updated RISK-017-019

**Wave 4 Platform Routes Complete (January 2026):**
- `app/database/migrations/0014_platform_substrate.sql` - Platform tables
- `app/backend/crates/api/src/db/platform_models.rs` - Type definitions
- `app/backend/crates/api/src/db/platform_repos.rs` - Database operations
- `app/backend/crates/api/src/routes/calendar.rs` - Calendar CRUD
- `app/backend/crates/api/src/routes/daily_plan.rs` - Daily planning
- `app/backend/crates/api/src/routes/feedback.rs` - User feedback
- `app/backend/crates/api/src/routes/infobase.rs` - Knowledge base
- `app/backend/crates/api/src/routes/ideas.rs` - Idea capture
- `app/backend/crates/api/src/routes/onboarding.rs` - Onboarding flow
- `app/backend/crates/api/src/routes/user.rs` - User settings/account
- `app/frontend/src/lib/api/calendar.ts` - Frontend client
- `app/frontend/src/lib/api/daily-plan.ts` - Frontend client
- `app/frontend/src/lib/api/feedback.ts` - Frontend client
- `app/frontend/src/lib/api/infobase.ts` - Frontend client
- `app/frontend/src/lib/api/ideas.ts` - Frontend client
- `app/frontend/src/lib/api/onboarding.ts` - Frontend client
- `app/frontend/src/lib/api/user.ts` - Frontend client
- `tests/calendar.spec.ts` - E2E tests
- `tests/daily-plan.spec.ts` - E2E tests
- `tests/feedback.spec.ts` - E2E tests
- `tests/user-settings.spec.ts` - E2E tests
- `tests/onboarding.spec.ts` - Updated E2E tests
- `docs/backend/migration/validation_wave4_platform_routes_post20G.md` - Validation

**Infrastructure Phase 23 Complete (Local):**
- `infra/docker-compose.yml` - Local dev compose
- `deploy/README.md` - Deployment documentation
- `deploy/rollback.md` - Rollback procedures
- `deploy/production/docker-compose.yml` - Production compose
- `deploy/scripts/*.sh` - Deploy, rollback, health-check scripts
- `docs/backend/migration/local_dev_auth_bypass.md` - Dev bypass guardrails
- `docs/backend/migration/image_tag_and_migration_strategy.md` - Versioning strategy

**D1 Deprecation Planning Deliverables:**
- `docs/backend/migration/d1_deprecation_report.md` - Full D1 inventory and plan
- Updated `feature_parity_checklist.md` with deprecation status section

**Feature Table Migrations Deliverables:**
- `app/database/migrations/0002_gamification_substrate.sql` - XP, wallet, achievements
- `app/database/migrations/0003_focus_substrate.sql` - Focus sessions
- `app/database/migrations/0004_habits_goals_substrate.sql` - Habits and goals
- `app/database/migrations/0005_quests_substrate.sql` - Quest system
- `app/database/migrations/0006_planning_substrate.sql` - Calendar, daily plans
- `app/database/migrations/0007_market_substrate.sql` - Market items, purchases
- `docs/backend/migration/feature_table_migration_notes.md` - Migration notes
- `docs/backend/migration/data_migration_reconciliation_plan.md` - Data migration plan
- `docs/buisness/data_migration_impact.md` - Business impact documentation

**Frontend API Client Deliverables:**
- `shared/api-client/` - Shared API client package
- `docs/frontend/migration/api_swap_progress.md` - Swap tracking
- `tests/storage.spec.ts` - Playwright tests for storage

**Feature Porting Deliverables:**
- `docs/backend/migration/feature_porting_playbook.md` - Porting process
- `docs/backend/migration/feature_parity_checklist.md` - Status tracking (73/87 routes done)

**API Contracts Deliverables:**
- `shared/api-types/` - Shared TypeScript types package
- `docs/backend/migration/api_contract_strategy.md` - Strategy document
- `docs/frontend/consuming-api-types.md` - Frontend integration guide
- `docs/backend/migration/contract_tests_plan.md` - Testing plan

**R2 Implementation Deliverables:**
- `app/backend/crates/api/src/storage/` - Storage module
- `app/backend/crates/api/src/routes/blobs.rs` - Blob routes
- `docs/backend/migration/r2_api_spec.md` - API specification

**Auth Implementation Deliverables:**
- `app/backend/crates/api/src/db/` - Database models and repos
- `app/backend/crates/api/src/services/` - OAuth and auth services
- `app/backend/crates/api/src/middleware/auth.rs` - Session and RBAC middleware
- `app/backend/crates/api/src/routes/auth.rs` - Auth endpoints
- `docs/backend/migration/auth_impl_notes.md` - Implementation notes

**Gap Checkpoints:**
- [gaps_checkpoint_after_skeleton.md](./gaps_checkpoint_after_skeleton.md)
- [gaps_checkpoint_after_structure.md](./gaps_checkpoint_after_structure.md)
- [gaps_checkpoint_after_frontend_move.md](./gaps_checkpoint_after_frontend_move.md)
- [gaps_checkpoint_after_backend_scaffold.md](./gaps_checkpoint_after_backend_scaffold.md)
- [gaps_checkpoint_after_auth.md](./gaps_checkpoint_after_auth.md)
- [gaps_checkpoint_after_r2.md](./gaps_checkpoint_after_r2.md)
- [gaps_checkpoint_after_api_swaps.md](./gaps_checkpoint_after_api_swaps.md)
- [gaps_checkpoint_after_d1_removal.md](./gaps_checkpoint_after_d1_removal.md)

**Database Deliverables:**
- `app/database/migrations/0001_auth_substrate.sql` - Auth/RBAC/audit tables
- `app/database/migrations/0001_auth_substrate.down.sql` - Rollback
- `app/database/schema.md` - Schema documentation
- `docs/backend/migration/db_substrate_plan.md` - Migration plan

See [PHASE_GATE.md](./PHASE_GATE.md) for full phase status.

---

## UNKNOWN-003: Feature Flag Usage

| Field | Value |
|-------|-------|
| **Source** | UNKNOWN-003, ACTION-016 |
| **What we did** | Grep for FLAG_TODAY usage; read src/lib/flags/index.ts |
| **Evidence** | `.tmp/flag_today_usage.log`, `.tmp/flag_actual_usage.log`, `src/lib/flags/index.ts` |
| **Result** | **RESOLVED** - All flags are deprecated compatibility stubs that always return `true` |

**Details:**
- `src/env.d.ts:28-34` - Type definitions only (7 flags defined)
- `src/lib/flags/index.ts` - All functions return `true` unconditionally
- Comment in file: "All Starter Engine features are now permanently enabled"
- Flags module is safe to remove entirely in migration

**Follow-up:** None required. Flags can be ignored during migration.

---

## UNKNOWN-004: Audit Log Usage

| Field | Value |
|-------|-------|
| **Source** | UNKNOWN-004, ACTION-017 |
| **What we did** | Grep for admin_audit_log in src/ |
| **Evidence** | `.tmp/audit_log_usage.log` (empty) |
| **Result** | **RESOLVED** - Table exists in schema but is NOT used anywhere in code |

**Details:**
- No INSERT, UPDATE, or SELECT on admin_audit_log found
- Table defined in `migrations/0100_master_reset.sql` but never written to
- No audit trail currently exists

**Follow-up:** Implement audit logging from scratch in backend (not migration concern).

---

## UNKNOWN-009: Mobile Routes Dependencies

| Field | Value |
|-------|-------|
| **Source** | UNKNOWN-009, ACTION-024 |
| **What we did** | List mobile files; grep for imports and auth usage |
| **Evidence** | `.tmp/mobile_files.log`, `.tmp/mobile_dependencies.log` |
| **Result** | **RESOLVED** - Mobile routes use standard patterns, no special dependencies |

**Details:**
- 10 mobile route files in `src/app/(mobile)/m/`
- All use standard `auth()` from `@/lib/auth`
- All use standard `getDB()` from `@/lib/db` or `@/lib/perf`
- All use standard `redirect()` from `next/navigation`
- No special R2 access or unique API calls
- Uses same repositories as desktop: `dailyPlans`, `users`
- Uses same flags module (all return true)

**Follow-up:** Mobile routes will work with new backend using same API patterns.

---

## UNKNOWN-010: AdSense Integration

| Field | Value |
|-------|-------|
| **Source** | UNKNOWN-010 |
| **What we did** | Grep for ADSENSE in src/ |
| **Evidence** | `.tmp/adsense_usage.log` |
| **Result** | **RESOLVED** - AdSense is optional and gracefully disabled when env var unset |

**Details:**
- `src/app/layout.tsx:11` - `const ADSENSE_PUBLISHER_ID = process.env.NEXT_PUBLIC_ADSENSE_PUBLISHER_ID || ""`
- `src/app/layout.tsx:125` - `{ADSENSE_PUBLISHER_ID && (` - Only renders if set
- `src/components/ads/AdUnit.tsx:44,58` - Returns empty/null if not configured
- AdSense script only injected when publisher ID is present

**Follow-up:** Keep `NEXT_PUBLIC_ADSENSE_PUBLISHER_ID` as optional frontend-only env var.

---

## UNKNOWN-012: quests vs universal_quests

| Field | Value |
|-------|-------|
| **Source** | UNKNOWN-012, ACTION-018 |
| **What we did** | Grep for quests and universal_quests usage in db/ and api/ |
| **Evidence** | `.tmp/quests_usage.log` |
| **Result** | **RESOLVED** - Both tables are ACTIVE, serve different purposes |

**Details:**
- **`quests` table** - User-specific quests created via:
  - `src/lib/db/repositories/quests.ts` - Full CRUD operations
  - `src/app/api/exercise/route.ts:409` - Creates quests from exercises
  - `src/app/api/admin/content/route.ts:131` - Admin content creation
  - Used for personalized user quests

- **`universal_quests` table** - System-wide quests:
  - `src/app/api/quests/route.ts:33` - Lists active universal quests
  - `src/app/api/admin/quests/route.ts` - Admin CRUD for universal quests
  - `src/lib/db/repositories/activity-events.ts:165` - Quest progress tracking
  - Used for shared achievements all users can complete

**Follow-up:** Migrate BOTH tables to Postgres. They serve distinct purposes.

---

## UNKNOWN-013: user_progress Usage

| Field | Value |
|-------|-------|
| **Source** | UNKNOWN-013, ACTION-019 |
| **What we did** | Grep for user_progress in src/ |
| **Evidence** | `.tmp/user_progress_usage.log` |
| **Result** | **RESOLVED** - Table is ACTIVE, used for XP/level tracking |

**Details:**
- `src/lib/db/repositories/activity-events.ts:132` - INSERT/UPDATE on activity
- `src/lib/db/repositories/activity-events.ts:143,146` - SELECT/UPDATE for level-up
- `src/app/api/admin/backup/route.ts:24` - Included in backups
- `src/app/api/admin/restore/route.ts:167` - Restored from backups
- `src/app/api/admin/users/route.ts:88` - Deleted when user deleted
- `src/app/api/user/delete/route.ts:32` - Deleted on account deletion
- `src/app/api/user/export/route.ts:36` - Included in user data export

**Follow-up:** Migrate table to Postgres. Actively used for gamification.

---

## UNKNOWN-014: Storage Quotas

| Field | Value |
|-------|-------|
| **Source** | UNKNOWN-014, ACTION-022 |
| **What we did** | Grep for quota/limit in storage/; read types.ts |
| **Evidence** | `.tmp/storage_quota.log`, `src/lib/storage/types.ts:97-107` |
| **Result** | **RESOLVED** - Per-file size limits exist. NO per-user quota system. |

**Details:**
- `SIZE_LIMITS.MAX_FILE_SIZE` = 100MB (general)
- `SIZE_LIMITS.MAX_AUDIO_SIZE` = 50MB
- `SIZE_LIMITS.MAX_IMAGE_SIZE` = 10MB
- `SIZE_LIMITS.MULTIPART_THRESHOLD` = 5MB
- `validateFileSize()` enforces limits per upload
- No per-user storage quota tracking exists
- No total storage limit per user

**Follow-up:** Consider implementing per-user quotas in backend (optional enhancement).

---

## UNKNOWN-015: Orphan Blob Cleanup

| Field | Value |
|-------|-------|
| **Source** | UNKNOWN-015, ACTION-023 |
| **What we did** | Grep for cleanup/orphan in scripts/ and storage/ |
| **Evidence** | `.tmp/orphan_cleanup.log` |
| **Result** | **RESOLVED** - NO orphan cleanup mechanism exists |

**Details:**
- Only match: `src/lib/storage/deprecation.ts:147` - Comment about allowing removal
- No scheduled cleanup jobs
- No orphan detection logic
- No garbage collection for blobs without DB references

**Follow-up:** Implement orphan cleanup in backend operations (operational task, not migration blocker).

---

## UNKNOWN-016: Lint Warnings Analysis

| Field | Value |
|-------|-------|
| **Source** | UNKNOWN-016, ACTION-028 |
| **What we did** | Analyzed validation_01.md warning list |
| **Evidence** | `docs/backend/migration/validation_01.md` |
| **Result** | **RESOLVED** - All 44 warnings are in frontend code only |

**Details:**
- **31 unused variables** - All prefixed with `_` (intentional ignore pattern)
- **5 `<img>` vs `<Image>`** - Mobile/avatar components
- **2 React Hook deps** - Complex visualizer callbacks
- **2 dangerouslySetInnerHTML** - Legitimate HTML rendering
- **All in frontend files** - Will move to `app/frontend/`
- **None in backend code paths** - API routes have minor unused params only

**Follow-up:** Fix during frontend migration, not blocking for backend work.

---

## ACTION Items Resolved

| ACTION | Status | Resolution |
|--------|--------|------------|
| ACTION-016 | Done | Flags are deprecated stubs, all return true |
| ACTION-017 | Done | admin_audit_log not used anywhere |
| ACTION-018 | Done | Both quests tables are active |
| ACTION-019 | Done | user_progress is actively used |
| ACTION-022 | Done | File limits exist, no user quotas |
| ACTION-023 | Done | No orphan cleanup exists |
| ACTION-024 | Done | Mobile uses standard patterns |
| ACTION-028 | Done | All warnings are frontend-only |

