# Parity Audit Validation Report

**Date:** January 8, 2026  
**Phase:** Cutover-grade ground-truth baseline audit  
**Branch:** `refactor/stack-split`  
**Role:** Claude Opus 4.5 acting as parity auditor  

---

## Objective

Create a cutover-grade, ground-truth feature parity baseline and feature gap register to drive tests and final extraction work before go-live.

---

## Audit Summary

| Metric | Before Audit | After Audit | Delta |
|--------|--------------|-------------|-------|
| PARITY items tracked | ~70 | 119 | +49 |
| FGAP items | 8 (all closed) | 10 (2 open) | +2 |
| RISK items | 16 | 19 | +3 |
| ACTION items | 52 | 54 | +2 |
| DECISION items pending | 1 | 2 | +1 |

---

## Key Findings

### 1. Documentation Drift Corrected

**Issue:** Checklist claimed auth routes `accept-tos` and `verify-age` were "Not Started" but code shows full implementation.

**Evidence:**
- `auth.rs:340-363` - `verify_age()` fully implemented, calls `UserRepo::verify_age()`
- `auth.rs:370-396` - `accept_tos()` fully implemented, calls `UserRepo::accept_tos()`

**Resolution:** Updated checklist to show ✅ Done (PARITY-006, PARITY-007)

---

### 2. Reference Router Not Wired (FGAP-009)

**Issue:** Full 816-line reference tracks implementation exists but api.rs uses stub instead of wiring actual router.

**Evidence:**
- `reference.rs` - 816 lines with full tracks, annotations, regions, streaming implementation
- `api.rs:100-105`:
  ```rust
  fn reference_routes() -> Router<Arc<AppState>> {
      // TODO: Wire up super::reference::router() when frontend swap is ready
      Router::new()
          .route("/tracks", get(stub_list))
          .route("/upload", post(stub_create))
  }
  ```

**Impact:** 9 reference track routes (PARITY-080 to PARITY-088) serve stubs instead of real functionality.

**Resolution Required:** ACTION-053 created - Wire `super::reference::router()` in api.rs

---

### 3. Analysis Route Ambiguity (FGAP-010)

**Issue:** `/api/analysis` exists as stub with unclear purpose. Reference tracks already have analysis endpoints.

**Evidence:**
- `api.rs:107-109` - Stub returns empty JSON
- No `analysis.rs` module exists
- Reference has `GET/POST /api/reference/tracks/:id/analysis`

**Resolution Required:** DECISION-006 created - Determine if standalone or part of reference

---

## Files Updated

### Primary Deliverables

| File | Changes |
|------|---------|
| [feature_parity_checklist.md](./feature_parity_checklist.md) | Added PARITY-001 to PARITY-119; corrected auth status; added evidence columns |
| [FEATURE_GAP_REGISTER.md](./FEATURE_GAP_REGISTER.md) | Added FGAP-009, FGAP-010; updated summary |
| [risk_register.md](./risk_register.md) | Added RISK-017, RISK-018, RISK-019; updated counts |

### Supporting Updates

| File | Changes |
|------|---------|
| [gaps.md](./gaps.md) | Added ACTION-053, ACTION-054; added Phase 2.6 section |
| [NOW.md](./NOW.md) | Added RISK-018 to resolved; added parity audit findings |
| [DECISIONS_REQUIRED.md](./DECISIONS_REQUIRED.md) | Added DECISION-006 (Analysis Route Architecture) |

---

## Route Count Breakdown

| Wave | Category | Routes | Status |
|------|----------|--------|--------|
| 0 | Auth | 7 | ✅ All Done |
| 0 | Storage | 7 | ✅ All Done |
| 0 | API Client | 2 | ✅ All Done |
| 1 | Gamification | 2 | ✅ All Done |
| 1 | Focus | 5 | ✅ All Done |
| 1 | Habits | 2 | ✅ All Done |
| 1 | Goals | 4 | ✅ All Done |
| 2 | Quests | 5 | ✅ All Done |
| 2 | Calendar | 4 | ✅ All Done |
| 2 | Daily Plan | 4 | ✅ All Done |
| 2 | Feedback | 2 | ✅ All Done |
| 3 | Exercise | 13 | ✅ All Done |
| 3 | Books | 4 | ✅ All Done |
| 3 | Programs | 1 | ✅ (merged into Exercise) |
| 3 | Market | 7 | ✅ All Done |
| 4 | Learn | 10 | ✅ All Done |
| 4 | Reference | 9 | 🔧 Backend Done, Router Not Wired |
| 4 | Analysis | 1 | ⏳ Stub Only |
| 4 | Onboarding | 5 | ✅ All Done |
| 4 | Infobase | 5 | ✅ All Done |
| 4 | Ideas | 5 | ✅ All Done |
| 5 | User | 4 | ✅ All Done |
| 5 | Admin | 11 | ✅ 9 Done + 2 Intentional Stubs |
| **Total** | | **119** | **98 Done + 9 Backend + 2 Stub + 1 Not Started** |

---

## Blocking Issues

### Immediate (Can Do Now)

| ID | Description | Priority |
|----|-------------|----------|
| ACTION-053 | Wire reference router in api.rs | HIGH |

### Requires Decision

| ID | Description | Decision |
|----|-------------|----------|
| ACTION-054 | Analysis route architecture | DECISION-006 |

---

## Validation Criteria Met

| Criterion | Status |
|-----------|--------|
| All routes have PARITY-XXX ID | ✅ |
| All gaps have FGAP-XXX ID | ✅ |
| Code archaeology performed | ✅ |
| Stale documentation corrected | ✅ |
| New risks documented | ✅ |
| ACTION items created for gaps | ✅ |
| Decisions logged for unknowns | ✅ |

---

## Next Steps

1. **Owner Decision:** Resolve DECISION-006 (Analysis route)
2. **Implementation:** Execute ACTION-053 (Wire reference router)
3. **Validation:** Run reference track E2E tests after wiring
4. **Proceed:** Continue to Phase 24 (Legacy Deprecation) after gaps closed

---

## References

- [feature_parity_checklist.md](./feature_parity_checklist.md) - Complete PARITY index
- [FEATURE_GAP_REGISTER.md](./FEATURE_GAP_REGISTER.md) - Gap tracking
- [risk_register.md](./risk_register.md) - Risk assessment
- [gaps.md](./gaps.md) - Action items
- [DECISIONS_REQUIRED.md](./DECISIONS_REQUIRED.md) - Pending decisions
