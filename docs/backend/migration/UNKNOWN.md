"This file tracks unknown facts. Do not add action items here; those belong in gaps.md."

# Migration Unknowns Log

**Created:** January 6, 2026  
**Updated:** January 6, 2026  
**Branch:** `refactor/stack-split`  
**Purpose:** Single source of truth for all unknowns blocking or affecting migration

---

## Open Unknowns (Requiring External Access)


### UNKNOWN-002: OAuth Redirect URI Configuration

| Field | Value |
|-------|-------|
| **UNKNOWN** | What redirect URIs are currently configured in Google Cloud Console and Azure AD app registration? |
| **Impact** | OAuth login will break if new backend URLs aren't added before migration |
| **Needed** | Google Cloud Console access, Azure Portal access |
| **Can defer** | No - blocks OAuth testing |
| **Status** | **External** → See [LATER.md](./LATER.md#later-004) |

---

### UNKNOWN-005: R2 S3 API Credentials

| Field | Value |
|-------|-------|
| **UNKNOWN** | What are the R2 S3-compatible API credentials for backend access? |
| **Impact** | Backend cannot access R2 storage |
| **Needed** | Cloudflare dashboard access |
| **Can defer** | No - blocks R2 migration |
| **Status** | **External** → See [LATER.md](./LATER.md#later-003) |

---

### UNKNOWN-006: Azure Key Vault Setup

| Field | Value |
|-------|-------|
| **UNKNOWN** | Is Azure Key Vault provisioned? What is the access pattern for the backend? |
| **Impact** | Backend cannot retrieve secrets at runtime |
| **Needed** | Azure subscription access |
| **Can defer** | No - blocks backend deployment |
| **Status** | **External** → See [LATER.md](./LATER.md#later-002) |

---

### UNKNOWN-007: PostgreSQL Provisioning

| Field | Value |
|-------|-------|
| **UNKNOWN** | Where will PostgreSQL be hosted? What connection parameters are needed? |
| **Impact** | Cannot deploy or test backend |
| **Needed** | Infrastructure decision and provisioning |
| **Can defer** | No - blocks all backend work |
| **Status** | **External** → See [LATER.md](./LATER.md#later-001) |

---

### UNKNOWN-008: Container Infrastructure

| Field | Value |
|-------|-------|
| **UNKNOWN** | What container orchestration platform will host the backend? |
| **Impact** | Cannot deploy backend |
| **Needed** | Architecture decision |
| **Can defer** | Yes - can develop locally first |
| **Status** | **External** → See [LATER.md](./LATER.md#later-005) |

---

### UNKNOWN-009: Backend Warnings Baseline

| Field | Value |
|-------|-------|
| **UNKNOWN** | What is the acceptable baseline for Rust backend warnings? |
| **Impact** | Cannot enforce no-regression policy for backend |
| **Needed** | Owner decision on 206 current warnings |
| **Can defer** | No - blocks Phase 24 (Legacy Deprecation) |
| **Status** | **Pending** → Add to DECISIONS_REQUIRED.md |

**Context:** Backend has 206 warnings (mostly unused imports from route scaffolding). Need owner decision:
- A: Accept 206 as baseline, fix later
- B: Fix all before deprecation
- C: Fix unused imports only (~150), accept rest as baseline

---


---

## Resolved Unknowns

### UNKNOWN-011: E2E Test Coverage ✓

| Field | Value |
|-------|-------|
| **Resolution** | Coverage map and prioritized test backlog created |
| **Evidence** | [E2E_COVERAGE_MAP_POST20G.md](./E2E_COVERAGE_MAP_POST20G.md), [TEST_BACKLOG_POST20G.md](./TEST_BACKLOG_POST20G.md) |
| **Details** | 20 test files, ~95 test cases, 18/71 parity IDs covered (25%), 6/12 critical journeys covered (50%). 51 tests backlogged with priorities P0-P4. |
| **Resolved Date** | January 7, 2026 |
| **Follow-up** | Execute P0 security tests before production; P2+ tests blocked on backend feature extraction |

See: [E2E_COVERAGE_MAP_POST20G.md](./E2E_COVERAGE_MAP_POST20G.md) for full coverage map

---

### UNKNOWN-001: Session Token Format and Migration Path ✓

| Field | Value |
|-------|-------|
| **Resolution** | Force re-authentication chosen; no token migration needed |
| **Evidence** | DEC-001 = A in DECISIONS.md |
| **Details** | D1 unseeded data may be deleted at cutover |
| **Resolved Date** | January 6, 2026 |
| **Follow-up** | Implement force re-auth in backend; no legacy token handling |

---

### UNKNOWN-017: Admin Authorization Strategy ✓

| Field | Value |
|-------|-------|
| **Resolution** | Database-backed roles chosen |
| **Evidence** | DEC-004 = B in DECISIONS.md |
| **Details** | Admin authorization = DB-backed roles (user-borne gating persisted) |
| **Resolved Date** | January 6, 2026 |
| **Follow-up** | Add roles column/table to user schema |

---

### UNKNOWN-003: Feature Flag Actual Usage ✓

| Field | Value |
|-------|-------|
| **Resolution** | All feature flags are deprecated stubs that always return `true` |
| **Evidence** | `src/lib/flags/index.ts` - All functions unconditionally return true |
| **Details** | Module comment: "All Starter Engine features are now permanently enabled" |
| **Resolved Date** | January 6, 2026 |
| **Follow-up** | None - flags can be removed during migration |

See: [NOW.md](./NOW.md) for full evidence

---

### UNKNOWN-004: Audit Log Current Implementation ✓

| Field | Value |
|-------|-------|
| **Resolution** | `admin_audit_log` table exists in schema but is NOT used in code |
| **Evidence** | Grep returned 0 matches for `admin_audit_log` in `src/` |
| **Details** | Table defined in schema but never written to |
| **Resolved Date** | January 6, 2026 |
| **Follow-up** | Implement audit logging fresh in backend |

See: [NOW.md](./NOW.md) for full evidence

---

### UNKNOWN-009: Mobile Routes Dependencies ✓

| Field | Value |
|-------|-------|
| **Resolution** | Mobile routes use standard auth/db patterns, no special dependencies |
| **Evidence** | `src/app/(mobile)/m/*.tsx` - All use standard `auth()`, `getDB()`, repositories |
| **Details** | 10 mobile route files, all follow same patterns as desktop |
| **Resolved Date** | January 6, 2026 |
| **Follow-up** | Mobile will work with new backend using same API |

See: [NOW.md](./NOW.md) for full evidence

---

### UNKNOWN-010: AdSense Integration Status ✓

| Field | Value |
|-------|-------|
| **Resolution** | AdSense is optional; gracefully disabled when env var unset |
| **Evidence** | `src/app/layout.tsx:125` - Conditional render only if ADSENSE_PUBLISHER_ID set |
| **Details** | `src/components/ads/AdUnit.tsx` returns null if not configured |
| **Resolved Date** | January 6, 2026 |
| **Follow-up** | Keep as optional frontend env var |

See: [NOW.md](./NOW.md) for full evidence

---

### UNKNOWN-012: quests vs universal_quests Table ✓

| Field | Value |
|-------|-------|
| **Resolution** | BOTH tables are active, serve different purposes |
| **Evidence** | `src/lib/db/repositories/quests.ts` (user quests), `src/app/api/quests/route.ts` (universal) |
| **Details** | `quests` = user-specific; `universal_quests` = system-wide achievements |
| **Resolved Date** | January 6, 2026 |
| **Follow-up** | Migrate both tables to Postgres |

See: [NOW.md](./NOW.md) for full evidence

---

### UNKNOWN-013: user_progress Table Usage ✓

| Field | Value |
|-------|-------|
| **Resolution** | Table is ACTIVE, used for XP/level tracking |
| **Evidence** | `src/lib/db/repositories/activity-events.ts:132,143,146` |
| **Details** | INSERT/UPDATE on activity, SELECT for level-up, included in backup/restore/export |
| **Resolved Date** | January 6, 2026 |
| **Follow-up** | Migrate table to Postgres |

See: [NOW.md](./NOW.md) for full evidence

---

### UNKNOWN-014: Storage Quotas ✓

| Field | Value |
|-------|-------|
| **Resolution** | Per-file size limits exist; NO per-user quota system |
| **Evidence** | `src/lib/storage/types.ts:99-107` - SIZE_LIMITS constant |
| **Details** | MAX_FILE_SIZE=100MB, MAX_AUDIO_SIZE=50MB, MAX_IMAGE_SIZE=10MB |
| **Resolved Date** | January 6, 2026 |
| **Follow-up** | Consider implementing per-user quotas in backend (optional) |

See: [NOW.md](./NOW.md) for full evidence

---

### UNKNOWN-015: Orphan Blob Cleanup ✓

| Field | Value |
|-------|-------|
| **Resolution** | NO orphan cleanup mechanism exists |
| **Evidence** | Grep for cleanup/orphan in scripts/ and storage/ returned no cleanup logic |
| **Details** | No scheduled jobs, no garbage collection for blobs |
| **Resolved Date** | January 6, 2026 |
| **Follow-up** | Implement cleanup in backend operations (not migration blocker) |

See: [NOW.md](./NOW.md) for full evidence

---

### UNKNOWN-016: Pre-existing Lint Warnings ✓

| Field | Value |
|-------|-------|
| **Resolution** | Fix post-migration with temporary baseline waiver |
| **Evidence** | DEC-003 = C in DECISIONS.md; [exceptions.md](./exceptions.md) |
| **Details** | 44 warnings baselined; no new warnings allowed; count must not increase |
| **Resolved Date** | January 6, 2026 |
| **Follow-up** | Fix all warnings after frontend/admin split is complete |

See: [exceptions.md](./exceptions.md) for waiver details

---

## How to Add Unknowns

When you encounter missing or ambiguous information during migration work:

1. Add an entry to this file with the next `UNKNOWN-XXX` number
2. Fill in all fields: UNKNOWN, Impact, Needed, Can defer, Status
3. In other documents, link to this file rather than duplicating the unknown
4. When resolved, move to the "Resolved Unknowns" section with resolution notes

---

## References

- [PHASE_GATE.md](./PHASE_GATE.md) - Phase gating status
- [DECISIONS.md](./DECISIONS.md) - Owner decision record (all chosen)
- [NOW.md](./NOW.md) - Items resolved via repo inspection
- [LATER.md](./LATER.md) - Items requiring external access
- [gaps.md](./gaps.md) - Action items (ACTION-XXX)
- [risk_register.md](./risk_register.md) - Related risks

