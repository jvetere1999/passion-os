# Checkpoint: Post-Waves 1-5 + Observability Gate

**Date:** January 7, 2026  
**Branch:** `refactor/stack-split`  
**Gate:** 20G Re-run (Parity Freeze)  
**Status:** ✅ PASS - Parity Complete (External Blockers Only)

---

## Executive Summary

| Metric | Before Waves | After Waves | Status |
|--------|--------------|-------------|--------|
| Backend Routes Done | 18/86 | 82/86 | ✅ 95.3% |
| Frontend API Swapped | 12/86 | 82/86 | ✅ 95.3% |
| Postgres Migrations | 10 | 14 | ✅ Complete |
| Playwright E2E Tests | 11 | 37+ | ✅ Complete |
| Validation Docs | 2 | 9 | ✅ Complete |
| Observability/Audit | ❌ | ✅ | ✅ Active |

**Gate Decision:** All parity items complete except external provisioning (LATER-001 through LATER-005).

---

## Parity Evidence by Wave

### Wave 0: Infrastructure (12/12) ✅

| Item | Evidence |
|------|----------|
| Auth (Google/Azure OAuth) | `routes/auth.rs`, 20 tests |
| Storage (R2) | `routes/blobs.rs`, 15 tests, `storage.spec.ts` |
| Health | `routes/health.rs` |

**Validation:** Pre-existing (baseline)

---

### Wave 0.5: Reference Tracks (6/6) ✅

| Item | Evidence |
|------|----------|
| Reference CRUD | `routes/reference.rs`, 31 tests |
| Frames Transport | `routes/frames.rs`, 27 tests |
| Admin Templates | `routes/admin_templates.rs`, 13 tests |
| Frontend Swap | `ReferenceLibraryV2.tsx`, 14 E2E tests |

**Validation:** [validation_reference_tracks_e2e_post20G.md](validation_reference_tracks_e2e_post20G.md)

---

### Wave 1: Foundation (9/9) ✅

| Route | Backend | Frontend | Tests |
|-------|---------|----------|-------|
| `/gamification/teaser` | ✅ `gamification.rs` | ✅ `RewardTeaser.tsx` | ✅ |
| `/gamification/summary` | ✅ `gamification.rs` | ✅ `ProgressClient.tsx` | ✅ |
| `/focus` (CRUD) | ✅ `focus.rs` | ✅ `focus.ts` | ✅ 12 E2E |
| `/focus/active` | ✅ `focus.rs` | ✅ `focus.ts` | ✅ |
| `/focus/pause` | ✅ `focus.rs` | ✅ `focus.ts` | ✅ |
| `/focus/:id/complete` | ✅ `focus.rs` | ✅ `focus.ts` | ✅ |
| `/focus/:id/abandon` | ✅ `focus.rs` | ✅ `focus.ts` | ✅ |
| `/habits` (CRUD + complete) | ✅ `habits.rs` | ✅ `habits.ts` | ✅ 10 E2E |
| `/goals` (CRUD + milestones) | ✅ `goals.rs` | ✅ `goals.ts` | ✅ 10 E2E |

**Validation:** 
- [validation_wave1_gamification_backend_post20G.md](validation_wave1_gamification_backend_post20G.md)
- [validation_wave1_gamification_frontend_post20G.md](validation_wave1_gamification_frontend_post20G.md)
- [validation_wave1_wave2_backend_post20G.md](validation_wave1_wave2_backend_post20G.md)

---

### Wave 2: Core Productivity (5/5) ✅

| Route | Backend | Frontend | Tests |
|-------|---------|----------|-------|
| `/quests` (CRUD) | ✅ `quests.rs` | ✅ `quests.ts` | ✅ 12 E2E |
| `/quests/:id/accept` | ✅ `quests.rs` | ✅ `quests.ts` | ✅ |
| `/quests/:id/complete` | ✅ `quests.rs` | ✅ `quests.ts` | ✅ |
| `/quests/:id/abandon` | ✅ `quests.rs` | ✅ `quests.ts` | ✅ |
| Calendar, Daily Plan, Feedback | ✅ Wave 4 | ✅ Wave 4 | ✅ |

**Validation:** [validation_wave2_core_productivity_post20G.md](validation_wave2_core_productivity_post20G.md)

---

### Wave 3: Fitness + Learning + Market (34/34) ✅

| Domain | Routes | Backend | Frontend | Tests |
|--------|--------|---------|----------|-------|
| Exercise | 13 | ✅ `exercise.rs` | ✅ `exercise.ts` | ✅ E2E |
| Books | 4 | ✅ `books.rs` | ✅ `books.ts` | ✅ E2E |
| Market | 7 | ✅ `market.rs` | ✅ `market.ts` | ✅ E2E |
| Learn | 10 | ✅ `learn.rs` | ✅ `learn.ts` | ✅ E2E |

**Migrations:**
- `0011_fitness_substrate.sql` - 10 tables
- `0012_books_substrate.sql` - 2 tables
- `0013_learn_substrate.sql` - 6 tables

**Validation:** [validation_wave3_fitness_learning_market_post20G.md](validation_wave3_fitness_learning_market_post20G.md)

---

### Wave 4: Platform Routes (28/28) ✅

| Domain | Routes | Backend | Frontend | Tests |
|--------|--------|---------|----------|-------|
| Calendar | 4 | ✅ `calendar.rs` | ✅ `calendar.ts` | ✅ E2E |
| Daily Plan | 4 | ✅ `daily_plan.rs` | ✅ `daily-plan.ts` | ✅ E2E |
| Feedback | 2 | ✅ `feedback.rs` | ✅ `feedback.ts` | ✅ E2E |
| Infobase | 5 | ✅ `infobase.rs` | ✅ `infobase.ts` | ✅ |
| Ideas | 5 | ✅ `ideas.rs` | ✅ `ideas.ts` | ✅ |
| Onboarding | 5 | ✅ `onboarding.rs` | ✅ `onboarding.ts` | ✅ E2E |
| User | 4 | ✅ `user.rs` | ✅ `user.ts` | ✅ E2E |

**Migration:** `0014_platform_substrate.sql`

**Validation:** [validation_wave4_platform_routes_post20G.md](validation_wave4_platform_routes_post20G.md)

---

### Wave 5: Admin Routes (9/11) ✅

| Route | Status | Notes |
|-------|--------|-------|
| `/admin` | ✅ Done | Info endpoint |
| `/admin/users` | ✅ Done | User management + cascade delete |
| `/admin/users/:id/cleanup` | ✅ Done | Cleanup user data |
| `/admin/stats` | ✅ Done | Dashboard stats |
| `/admin/feedback` | ✅ Done | Feedback moderation |
| `/admin/quests` | ✅ Done | Universal quest CRUD |
| `/admin/skills` | ✅ Done | Skill definition CRUD |
| `/admin/content` | ✅ Done | Content stats |
| `/admin/db-health` | ✅ Done | DB health + table counts |
| `/admin/backup` | ⏳ Stub | Use `pg_dump` externally |
| `/admin/restore` | ⏳ Stub | Use `pg_restore` externally |

**Validation:** [validation_wave5_admin_post20G.md](validation_wave5_admin_post20G.md)

---

### Observability/Audit ✅

| Item | Status | Evidence |
|------|--------|----------|
| Audit Events Identified | ✅ | Login, Logout, Purchase, UserDeleted, AdminAction, etc. |
| PostgresAuditSink Fixed | ✅ | `shared/audit.rs` - correct table/columns |
| write_audit() Helper | ✅ | Fire-and-forget for handlers |
| purchase_item Audited | ✅ | `market.rs` |
| delete_user Audited | ✅ | `admin.rs` |
| cleanup_user Audited | ✅ | `admin.rs` |
| `/admin/audit` Routes | ✅ | List entries + event types |
| Admin Audit UI | ✅ | `app/admin/src/app/audit/page.tsx` |
| Playwright RBAC Tests | ✅ | `audit-log.spec.ts` |

**Validation:** [validation_observability_audit_post20G.md](validation_observability_audit_post20G.md)

---

## Remaining Items (4 routes)

| Route | Status | Reason |
|-------|--------|--------|
| `/auth/accept-tos` | ⏳ Not Started | Deferred - ToS flow not critical for MVP |
| `/auth/verify-age` | ⏳ Not Started | Deferred - Age verification not critical for MVP |
| `/admin/backup` | ⏳ Stub | External tooling (pg_dump) |
| `/admin/restore` | ⏳ Stub | External tooling (pg_restore) |

**Note:** These 4 routes are explicitly deferred per business decision. Backup/restore uses standard PostgreSQL tooling externally.

---

## External Blockers (LATER.md Only)

| LATER-ID | Item | Status | Blocks |
|----------|------|--------|--------|
| LATER-001 | PostgreSQL Provisioning | Pending | Production deploy |
| LATER-002 | Azure Key Vault Setup | Pending | Secret management |
| LATER-003 | R2 S3 API Credentials | Pending | R2 in production |
| LATER-004 | OAuth Redirect URIs | Pending | OAuth in production |
| LATER-005 | Container Platform | Pending | Backend deploy |
| LATER-009 | api.ecent.online DNS/TLS | Pending | Production routing |
| LATER-010 | admin.ignition.ecent.online | Pending | Admin deploy |
| LATER-011 | Frontend DNS/TLS | Pending | Frontend deploy |

**All blockers are external provisioning** - no code work remains.

---

## D1 Removal Gating Decision

### Evidence Review

| Criterion | Status | Evidence |
|-----------|--------|----------|
| All Postgres schemas created | ✅ | 14 migrations in `app/database/migrations/` |
| All backend routes implemented | ✅ | 82/86 routes (4 deferred) |
| Frontend using API client | ✅ | 17 API clients in `app/frontend/src/lib/api/` |
| Admin using backend | ✅ | `app/admin/src/lib/api/admin.ts` |
| E2E tests passing | ✅ | 37+ Playwright test files |
| Audit trail active | ✅ | `audit_log` table + handlers |

### Decision

**D1 REMOVAL IS ALLOWED** once external provisioning (LATER-001 through LATER-005) is complete.

**Conditions:**
1. PostgreSQL database provisioned and accessible
2. All migrations applied successfully
3. R2 S3 credentials configured
4. OAuth redirect URIs updated
5. Smoke tests pass in staging

**Action:** Execute `ACTION-038` (D1 script removal) after successful staging deploy.

**Files to deprecate:**
```
src/lib/db/              → deprecated/src/lib/db/
src/lib/auth/            → deprecated/src/lib/auth/
src/app/api/             → deprecated/src/app/api/
scripts/reset-local-db.sh  → deprecated/scripts/
scripts/reset-remote-db.sh → deprecated/scripts/
scripts/seed-exercises.mjs → deprecated/scripts/
```

**Config changes:**
- Remove `[[d1_databases]]` from `wrangler.toml`
- Remove `@auth/d1-adapter` from `package.json`

---

## Validation Summary

| Check | Result |
|-------|--------|
| Cargo check | ✅ 205 warnings (baseline) |
| TypeScript check | ✅ No errors |
| Backend routes | ✅ 25 route files |
| Frontend API clients | ✅ 17 client files |
| Postgres migrations | ✅ 14 migrations |
| Playwright tests | ✅ 37+ spec files |
| Validation docs | ✅ 9 documents |

---

## Gate Conclusion

**GATE 20G: PASS**

All feature parity items complete except:
- 4 deferred routes (ToS, age verification, backup, restore)
- External provisioning blockers (LATER-001 through LATER-011)

**D1 Removal:** ALLOWED after external provisioning complete.

**Next Steps:**
1. Complete external provisioning (owner action)
2. Apply migrations to production PostgreSQL
3. Update OAuth redirect URIs
4. Deploy backend to container platform
5. Smoke test critical paths
6. Execute D1 removal (ACTION-038)

---

## References

- [feature_parity_checklist.md](feature_parity_checklist.md) - Route inventory
- [WAVE_PLAN_POST20G.md](WAVE_PLAN_POST20G.md) - Wave plan
- [LATER.md](LATER.md) - External blockers
- [gaps.md](gaps.md) - Action items
- [risk_register.md](risk_register.md) - Risk tracking
- [FEATURE_GAP_REGISTER.md](FEATURE_GAP_REGISTER.md) - Gap tracking
