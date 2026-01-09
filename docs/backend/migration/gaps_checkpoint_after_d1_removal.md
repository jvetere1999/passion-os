"Gap checkpoint after D1 deprecation planning. Confirms no hidden dependencies."

# Gap Checkpoint: After D1 Deprecation Planning

**Date:** January 7, 2026  
**Branch:** `refactor/stack-split`  
**Prior Phase:** D1 Deprecation Planning (Phase 1.11)  
**Next Phase:** Feature Routes Implementation (Phase 18)  
**Purpose:** Confirm no hidden D1 dependencies remain undocumented

---

## Summary

| Category | Status |
|----------|--------|
| D1 Deprecation Report | ✅ **Complete** |
| Hidden Dependencies Found | ⚠️ **3 additional items** |
| New Issues | **3** (documented below) |
| New Decisions Required | **0** |
| Next Phase | **18: Feature Routes** ✅ Ready |

---

## Hidden Dependencies Discovered

### ISSUE-001: D1 Scripts in package.json

**Type:** Repo-auditable → Implementation

**Finding:** `package.json` contains 11 D1-specific npm scripts not documented in deprecation report.

| Script | Command |
|--------|---------|
| `db:generate` | `wrangler d1 migrations create passion_os` |
| `db:migrate:local` | `wrangler d1 migrations apply passion_os --local` |
| `db:migrate:prod` | `wrangler d1 migrations apply passion_os --remote` |
| `db:migrate:file:local` | `wrangler d1 execute passion_os --local --file` |
| `db:migrate:file:prod` | `wrangler d1 execute passion_os --remote --file` |
| `db:studio:local` | `wrangler d1 execute passion_os --local --command 'SELECT 1'` |
| `db:seed:local` | `wrangler d1 execute passion_os --local --file=...` |
| `db:seed:remote` | `wrangler d1 execute passion_os --remote --file=...` |
| `db:reset:master:local` | `wrangler d1 execute ignition --local --file=...` |
| `db:reset:master:remote` | `wrangler d1 execute ignition --remote --file=...` |

**Action:** Add to ACTION-038 (package.json D1 script removal)

**Status:** Added to gaps.md

---

### ISSUE-002: D1 Reset Scripts

**Type:** Repo-auditable → Implementation

**Finding:** Two shell scripts with D1 wrangler commands not in deprecation report.

| Script | D1 Commands |
|--------|-------------|
| `scripts/reset-local-db.sh` | 2 wrangler d1 commands |
| `scripts/reset-remote-db.sh` | 3 wrangler d1 commands |

**Action:** Add to files-to-deprecate in d1_deprecation_report.md

**Status:** Noted for update

---

### ISSUE-003: Duplicate D1 Code in app/frontend

**Type:** Repo-auditable → Implementation

**Finding:** D1 code duplicated in `app/frontend/src/lib/db/`:

| File | D1 Reference |
|------|--------------|
| `app/frontend/src/lib/db/client.ts` | D1Result interface, getDB() |
| `app/frontend/src/lib/db/index.ts` | D1Result export |
| `app/frontend/src/app/api/reference/upload/route.ts` | env.DB usage |
| `app/frontend/src/app/api/reference/tracks/[id]/stream/route.ts` | env.DB usage |

**Action:** Already covered by EXC-002 (frontend move exception), will be deprecated when routes migrated

**Status:** No new action needed, covered by existing plan

---

## Updated Totals

### D1 Footprint (Revised)

| Metric | Prior | Updated |
|--------|-------|---------|
| Files with D1Database import | 24 | 28 |
| Repository files | 15 | 15 |
| API route files using D1 | 51 | 55 |
| D1-related npm scripts | 0 | 11 |
| D1-related shell scripts | 0 | 2 |

### Files to Deprecate (Additions)

Add to `deprecated/`:

```
scripts/reset-local-db.sh → deprecated/scripts/reset-local-db.sh
scripts/reset-remote-db.sh → deprecated/scripts/reset-remote-db.sh
scripts/seed-exercises.mjs → deprecated/scripts/seed-exercises.mjs
```

---

## Referenced IDs

### Existing Unknowns (Unchanged)

| ID | Status | Impact on D1 Removal |
|----|--------|----------------------|
| UNKNOWN-002 | External | OAuth URIs - **no impact** |
| UNKNOWN-005 | External | R2 credentials - **no impact** |
| UNKNOWN-006 | External | Key Vault - **no impact** |
| UNKNOWN-007 | External | PostgreSQL - **blocks prod D1 removal** |
| UNKNOWN-008 | External | Containers - **blocks prod D1 removal** |
| UNKNOWN-011 | Deferred | E2E coverage - **no impact** |

### Existing Actions (Unchanged)

| ID | Status | Notes |
|----|--------|-------|
| ACTION-037 | Done | D1 deprecation report created |
| ACTION-036 | Done | Feature table migrations |
| ACTION-035 | Done | Frontend API client |

### New Action Required

| ID | Description | Status | Type |
|----|-------------|--------|------|
| ACTION-038 | Remove D1 scripts from package.json | ⏳ Not Started | Implementation |

---

## Validation Status

| Check | Result |
|-------|--------|
| D1 deprecation report complete | ✅ |
| All D1 files inventoried | ⚠️ Updated (3 additions) |
| Postgres migrations created | ✅ 33 tables |
| Backend tests passing | ✅ 35/35 |
| No new decisions required | ✅ |

---

## Phase Gate Updates

### Phase 18: Feature Routes Implementation

**Status:** ✅ **Ready**

| Prerequisite | Status |
|--------------|--------|
| Postgres schema created | ✅ 33 tables |
| API client ready | ✅ |
| D1 deprecation planned | ✅ |
| Feature porting playbook | ✅ |

**No blockers for Phase 18.**

### Phase 23: Infrastructure

**Status:** 🔴 **Blocked**

| Blocker | Type |
|---------|------|
| LATER-001 | PostgreSQL provisioning (External) |
| LATER-002 | Azure Key Vault (External) |
| LATER-003 | R2 credentials (External) |
| LATER-004 | OAuth redirect URIs (External) |
| LATER-005 | Container platform (External) |

### Phase 26: Cutover (D1 Removal)

**Status:** 🔴 **Blocked**

| Blocker | Type |
|---------|------|
| All feature routes implemented | Implementation |
| All frontend swapped | Implementation |
| External provisioning complete | External |
| ACTION-038 | Implementation |

---

## Documentation Dependencies

### docs/next-migration/ (Legacy Docs)

The following docs reference D1 but are historical/planning docs:

| Doc | Status |
|-----|--------|
| `DEPLOYMENT_TARGET.md` | Historical, keep reference |
| `DATA_MODEL_MAP.md` | Historical, keep reference |
| `TRANSLATION_MAP.md` | Historical, keep reference |

**Action:** No change needed. These document the migration source, not active code.

### README.md

Contains D1 setup instructions that will need updating at cutover:

```markdown
wrangler d1 create passion_os
```

**Action:** Update at Phase 26 (cutover)

---

## Recommended Next Steps

### Immediate (Phase 18)

1. **Implement gamification routes** - Use new Postgres schema
2. **Implement focus routes** - Use new Postgres schema
3. **Swap frontend calls** - Use `@ignition/api-client`

### At Feature Parity

4. **Execute ACTION-038** - Remove D1 scripts from package.json
5. **Move D1 scripts to deprecated/** - reset-local-db.sh, reset-remote-db.sh
6. **Update README.md** - Remove D1 setup instructions

### At Cutover (Phase 26)

7. **Remove D1 binding from wrangler.toml**
8. **Remove @auth/d1-adapter from package.json**
9. **Move all D1 code to deprecated/**
10. **Verify zero D1 references in src/**

---

## Checklist Cross-Reference

### d1_deprecation_report.md Alignment

| Section | Report | This Doc | Aligned |
|---------|--------|----------|---------|
| Config files | 3 | 3 + 11 scripts | ⚠️ Updated |
| Core DB layer | 4 files | 4 files | ✅ |
| Repositories | 15 files | 15 files | ✅ |
| API routes | 51 | 55 | ⚠️ Updated |
| Shell scripts | 0 | 2 | ⚠️ Updated |

---

## Files Updated This Checkpoint

| File | Action |
|------|--------|
| `gaps_checkpoint_after_d1_removal.md` | Created |
| `gaps.md` | Updated (ACTION-038 added) |
| `d1_deprecation_report.md` | Update needed (scripts) |

---

## References

- [d1_deprecation_report.md](./d1_deprecation_report.md) - D1 inventory
- [feature_parity_checklist.md](./feature_parity_checklist.md) - Route tracking
- [PHASE_GATE.md](./PHASE_GATE.md) - Phase status
- [NOW.md](./NOW.md) - Current work items
- [LATER.md](./LATER.md) - External blockers

