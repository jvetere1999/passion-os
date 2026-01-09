# Gap Checkpoint: Post Wave Plan (20G)

**Date:** January 7, 2026  
**Branch:** `refactor/stack-split`  
**Phase:** Post-20G Wave Plan Completion  
**Purpose:** Confirm readiness for feature route implementation (Phase 18)

---

## Checkpoint Status: ✅ PASSED

All wave planning deliverables complete. Phase 18 (Feature Routes) is unblocked.

---

## Deliverables Verified

| Deliverable | Status | Evidence |
|-------------|--------|----------|
| `WAVE_PLAN_POST20G.md` | ✅ Complete | 71 PARITY items enumerated with wave assignments |
| `METRICS_POST20G.md` | ✅ Complete | 6 metric definitions with explicit formulas |
| `FEATURE_GAP_REGISTER.md` | ✅ Updated | FGAP-008 closed, 7 open gaps tracked |
| `feature_parity_checklist.md` | ✅ Updated | Reference Tracks status corrected, link to WAVE_PLAN added |
| `PHASE_GATE.md` | ✅ Updated | Phases 20F/20G added, status current |
| `NOW.md` | ✅ Updated | Next actions reflect current state |

---

## Document Consistency Check

### Route Count Reconciliation

| Source | Count | Status |
|--------|-------|--------|
| `WAVE_PLAN_POST20G.md` (authoritative) | 71 routes | ✅ |
| `feature_parity_checklist.md` | 64 routes (base) + 7 backend-only = 71 | ✅ Consistent |
| `checkpoint_20F.md` | 64 routes (outdated) | ⚠️ Note added to reference WAVE_PLAN |

**Resolution:** `WAVE_PLAN_POST20G.md` is the authoritative source for route counts. Other documents reference it.

### Metric Consistency

| Metric | WAVE_PLAN Value | METRICS Value | Status |
|--------|-----------------|---------------|--------|
| Backend Routes | 25/71 (35%) | 35.2% | ✅ Consistent |
| Frontend UI-Only | 12/54 (22%) | 22.2% | ✅ Consistent |
| Admin UI | 1/11 (9%) | 9.1% | ✅ Consistent |
| Overall Go-Live | - | 28.0% | ✅ Calculated |

---

## Gaps Status

### Open Gaps (7)

| FGAP-ID | Status | Blocks |
|---------|--------|--------|
| FGAP-001 | Open | Gamification not implemented |
| FGAP-002 | Open | Feature routes W1-3 not started |
| FGAP-003 | Open | Reference tracks FE swap pending |
| FGAP-004 | Open | W4-5 specialized features not started |
| FGAP-005 | Open | Admin routes mostly stubs |
| FGAP-006 | Open | Postgres schema incomplete (10 tables) |
| FGAP-007 | Open | E2E test coverage unknown |

### Closed Gaps (1)

| FGAP-ID | Resolution |
|---------|------------|
| FGAP-008 | Metric drift resolved via authoritative docs |

---

## Blockers for Phase 18 (Feature Routes)

| Category | Blocker | Status |
|----------|---------|--------|
| Decision | DEC-001-004 | ✅ All CHOSEN |
| External | None | ✅ N/A for local dev |
| Repo-auditable | None | ✅ All resolved |
| Implementation | None | ✅ Ready to start |

**Phase 18 is UNBLOCKED.**

---

## Next Actions (Priority Order)

1. **ACTION-040:** Implement gamification routes (EXTRACT-001)
   - Unblocks 8+ downstream features
   - Priority: P1.1

2. **ACTION-041:** Reference tracks frontend API swap
   - Backend complete, FE swap pending
   - Priority: P1 (parallel with gamification)

3. **EXTRACT-002-004:** Focus/Habits/Goals routes
   - After gamification complete
   - Priority: P1.2-1.4

---

## Phase Gate Update

| Phase | Previous Status | New Status |
|-------|-----------------|------------|
| 20F | Ready | ✅ Complete |
| 20G | Ready | ✅ Complete |
| 18 | Ready | ✅ Ready (confirmed unblocked) |

---

## References

- [WAVE_PLAN_POST20G.md](./WAVE_PLAN_POST20G.md) - Authoritative parity table
- [METRICS_POST20G.md](./METRICS_POST20G.md) - Metric definitions
- [FEATURE_GAP_REGISTER.md](./FEATURE_GAP_REGISTER.md) - Gap tracking
- [PHASE_GATE.md](./PHASE_GATE.md) - Phase status
- [gaps.md](./gaps.md) - Action items

