# Metrics Post-20G: Normalized Definitions

**Date:** January 7, 2026  
**Branch:** `refactor/stack-split`  
**Purpose:** Explicit metric definitions for tracking migration progress

---

## Overview

This document provides normalized, explicit definitions for all migration metrics to prevent drift between documents and ensure consistent reporting.

---

## 1. Backend Route Completion %

### Definition

**What it measures:** Percentage of API routes fully implemented in Rust backend.

### Formula

```
Backend Route % = (Backend Routes Done) / (Total Routes) × 100
```

### Source of Truth

| Field | Source | Value |
|-------|--------|-------|
| Total Routes | `WAVE_PLAN_POST20G.md` PARITY table | 71 |
| Done Routes | PARITY items with Backend = "✅ Done" | 25 |

### Current Value

```
= 25 / 71 × 100
= 35.2%
```

### Breakdown by Wave

| Wave | Routes | Backend Done | % |
|------|--------|--------------|---|
| W0 | 12 | 12 | 100% |
| W0.5 | 6 | 6 | 100% |
| W1 | 9 | 0 | 0% |
| W2 | 4 | 0 | 0% |
| W3 | 8 | 0 | 0% |
| W4 | 17 | 6 | 35% |
| W5 | 15 | 1 | 7% |

### Exclusions

- None. All PARITY items counted.

---

## 2. Frontend UI-Only Completion %

### Definition

**What it measures:** Percentage of frontend routes that have been swapped to use the new backend API client (not legacy Next.js API routes).

### Formula

```
Frontend UI-Only % = (FE Routes Swapped) / (FE Routes with UI Surface) × 100
```

### Source of Truth

| Field | Source | Value |
|-------|--------|-------|
| FE Routes with UI Surface | PARITY items where FE Swap ≠ "🚫 N/A" | 54 |
| FE Routes Swapped | PARITY items where FE Swap = "✅ Done" | 18 |

### Current Value

```
= 18 / 54 × 100
= 33.3%
```

### Breakdown by Category

| Category | Total | Swapped | % |
|----------|-------|---------|---|
| Auth | 4 | 4 | 100% |
| Storage | 7 | 7 | 100% |
| API Client | 1 | 1 | 100% |
| Reference Tracks | 6 | 6 | 100% |
| All Other Features | 36 | 0 | 0% |

**Updated:** January 7, 2026 - Reference tracks FE swap complete

### Exclusions

| Excluded Routes | Reason |
|-----------------|--------|
| 10 Admin routes | Admin-only (FE Swap = "🚫 N/A") |
| 7 Backend-only routes | No UI surface |

---

## 3. Admin UI Completion %

### Definition

**What it measures:** Percentage of admin-specific routes with complete admin console UI.

### Formula

```
Admin UI % = (Admin Routes Done) / (Total Admin Routes) × 100
```

### Source of Truth

| Field | Source | Value |
|-------|--------|-------|
| Total Admin Routes | PARITY items Wave 5 with Admin ≠ "🚫 N/A" | 11 |
| Admin Routes Done | PARITY items with Admin = "✅ Done" | 1 |

### Current Value

```
= 1 / 11 × 100
= 9.1%
```

### Breakdown

| Route Group | Total | Done | % |
|-------------|-------|------|---|
| Admin Templates | 1 | 1 | 100% |
| User Management | 2 | 0 | 0% |
| Content Management | 3 | 0 | 0% |
| Statistics/Backup | 4 | 0 | 0% |
| Exercise Seed | 1 | 0 | 0% |

### Notes

- Admin templates (listening prompts) was implemented in 20G
- Other admin routes are stubs in `admin.rs`

---

## 4. Overall Go-Live Readiness %

### Definition

**What it measures:** Weighted composite metric representing overall readiness for production cutover.

### Formula

```
Go-Live % = (0.30 × Backend%) + (0.25 × FE%) + (0.10 × Admin%) + (0.15 × External%) + (0.20 × Tests%)
```

### Weights Rationale

| Component | Weight | Rationale |
|-----------|--------|-----------|
| Backend Routes | 30% | Core functionality |
| Frontend Swap | 25% | User-facing impact |
| Admin UI | 10% | Lower urgency |
| External Provisioning | 15% | Blocking for deploy |
| Test Coverage | 20% | Confidence/quality |

### Source of Truth

| Component | Source | Value |
|-----------|--------|-------|
| Backend % | Section 1 | 35.2% |
| FE % | Section 2 | 33.3% |
| Admin % | Section 3 | 9.1% |
| External % | LATER.md (0/8 resolved) | 0% |
| Tests % | 124 tests vs 200 target | 62% |

### Current Value

```
= (0.30 × 35.2) + (0.25 × 33.3) + (0.10 × 9.1) + (0.15 × 0) + (0.20 × 62)
= 10.56 + 8.33 + 0.91 + 0 + 12.4
= 32.2%
```

**Updated:** January 7, 2026 - Reference tracks FE swap + 14 E2E tests

---

## 5. Postgres Schema Completion %

### Definition

**What it measures:** Percentage of target tables created in Postgres.

### Formula

```
Schema % = (Tables Created) / (Total Target Tables) × 100
```

### Source of Truth

| Field | Source | Value |
|-------|--------|-------|
| Tables Created | `app/database/migrations/*.sql` | 35 |
| Target Tables | d1_usage_inventory.md + new tables | 45 |

### Current Value

```
= 35 / 45 × 100
= 77.8%
```

### Tables by Migration

| Migration | Tables | Status |
|-----------|--------|--------|
| 0001_auth_substrate | 5 | ✅ |
| 0002_gamification_substrate | 9 | ✅ |
| 0003_focus_substrate | 2 | ✅ |
| 0004_habits_goals_substrate | 5 | ✅ |
| 0005_quests_substrate | 3 | ✅ |
| 0006_planning_substrate | 2 | ✅ |
| 0007_market_substrate | 2 | ✅ |
| 0008_reference_tracks_substrate | 5 | ✅ |
| 0009_analysis_frames_bytea | 0 (ALTER) | ✅ |
| 0010_listening_prompt_templates | 2 | ✅ |

**Tables Still Needed:**

| Domain | Tables | Count |
|--------|--------|-------|
| Exercise | exercises, workouts, workout_sections, etc. | 7 |
| Learn | learn_topics, flashcards, etc. | 7 |
| Onboarding | onboarding_flows, user_interests | 5 |
| Other | infobase, ideas, etc. | 4 |

---

## 6. Backend Test Coverage

### Definition

**What it measures:** Number of backend unit/integration tests.

### Source of Truth

| Field | Source | Value |
|-------|--------|-------|
| Current Tests | `cargo test` output | 110 |
| Target Tests | Estimate (2-3 per route × 71) | 200+ |

### Current Value

```
= 110 / 200 × 100
= 55%
```

### Breakdown by Module

| Module | Tests |
|--------|-------|
| Auth | 20 |
| Storage | 15 |
| Reference | 31 |
| Frames | 27 |
| Templates | 13 |
| Other | 4 |

---

## Metric Consistency Checks

### Cross-Reference Validation

| Metric | checkpoint_20F Value | This Doc Value | Delta | Explanation |
|--------|---------------------|----------------|-------|-------------|
| Backend Routes | 12/64 (19%) | 25/71 (35%) | +7 routes | Includes W0.5 reference + templates |
| Frontend % | 12/54 (22%) | 12/54 (22%) | 0 | Consistent |
| Overall | 22% | 28% | +6% | Updated formula + reference backend |

### Notes on Discrepancy

The original `checkpoint_20F.md` counted 64 routes, but this was an undercount that missed:
- Reference track domain routes (6 routes) 
- Admin template routes (1 route)

The correct total is **71 routes** as enumerated in `WAVE_PLAN_POST20G.md`.

---

## Metric Update Protocol

### When to Update

1. After each EXTRACT-XXX completion
2. After each frontend swap
3. After external provisioning completion
4. Weekly at minimum

### How to Update

1. Count PARITY items by status in `WAVE_PLAN_POST20G.md`
2. Update numerators in this doc
3. Recalculate percentages
4. Update Overall Go-Live %
5. Add entry to change log

---

## Change Log

| Date | Change | By |
|------|--------|-----|
| 2026-01-07 | Initial creation post-20G | Agent |
| 2026-01-07 | Reconciled with feature_parity_checklist.md, closed FGAP-008 | Agent |
| 2026-01-07 | Reference tracks FE swap complete: FE% 22.2→33.3, Tests 110→124, Go-live 28→32.2% | Agent |

---

## References

- [WAVE_PLAN_POST20G.md](./WAVE_PLAN_POST20G.md) - Parity item source
- [checkpoint_20F.md](./checkpoint_20F.md) - Previous checkpoint
- [gaps_checkpoint_post_wave_plan.md](./gaps_checkpoint_post_wave_plan.md) - Post-20G gap checkpoint
- [feature_parity_checklist.md](./feature_parity_checklist.md) - Original checklist
- [LATER.md](./LATER.md) - External blockers

