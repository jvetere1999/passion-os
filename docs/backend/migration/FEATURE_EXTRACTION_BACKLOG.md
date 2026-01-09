"Prioritized extraction tasks for feature migration. Each EXTRACT task has affected paths and validations."

# Feature Extraction Backlog

**Date:** January 7, 2026  
**Branch:** `refactor/stack-split`  
**Purpose:** Prioritized extraction tasks for migrating features from Next.js to Rust backend

---

## Extraction Principles

1. **Backend First:** Extract business logic to Rust before swapping frontend
2. **Test First:** Write backend tests before implementation
3. **Swap Last:** Update frontend API client only after backend validated
4. **Deprecate After:** Move legacy to `deprecated/` only after validation passes

---

## Priority Legend

| Priority | Meaning |
|----------|---------|
| P0 | Blocking other work, do immediately |
| P1 | Foundation feature, needed by others |
| P2 | Core feature, high user value |
| P3 | Complex feature, significant effort |
| P4 | Specialized feature, lower urgency |
| P5 | Admin/utility, can do last |

---

## Extraction Queue

### Wave 1: Foundation (P1)

#### EXTRACT-001: Gamification Core ✅

| Field | Value |
|-------|-------|
| **Priority** | P1.1 |
| **Status** | ✅ **Done** |
| **Description** | XP/coins/wallet/achievements/skills - foundation for all XP-awarding features |
| **Dependencies** | Auth ✅, Postgres schema ✅ |
| **Blocks** | Focus, Habits, Goals, Quests, Exercise, Books, Learn, Market |
| **Completed** | January 7, 2026 |

**Deliverables Created:**
- `app/backend/crates/api/src/db/gamification_models.rs` - Models (210 lines)
- `app/backend/crates/api/src/db/gamification_repos.rs` - Repositories (550 lines)
- `app/backend/crates/api/src/routes/gamification.rs` - Routes (65 lines)
- `app/backend/crates/api/src/tests/gamification_tests.rs` - Tests (350 lines, 18 tests)
- `docs/backend/migration/validation_wave1_gamification_backend_post20G.md` - Validation

**Backend Tests:** 18 tests covering:
- XP award + level-up
- Idempotency with idempotency_key
- Coin award + spend with balance check
- Streak tracking
- Achievement unlock (idempotent)
- Gamification summary

**Affected Paths (Source):**
- `src/lib/db/repositories/gamification.ts`
- `src/lib/db/repositories/activity-events.ts`
- `src/app/api/gamification/teaser/route.ts`

**Target Paths (Backend):**
- `app/backend/crates/api/src/db/gamification_models.rs`
- `app/backend/crates/api/src/db/gamification_repos.rs`
- `app/backend/crates/api/src/routes/gamification.rs`

**Tables:**
- `user_progress`, `user_wallet`, `points_ledger`, `user_achievements`, `achievement_definitions`, `user_skills`, `skill_definitions`, `user_streaks`

**API Routes:**
| Old Route | New Route | Methods | Status |
|-----------|-----------|---------|--------|
| `/api/gamification/teaser` | `/gamification/teaser` | GET | ✅ Done |
| (new) | `/gamification/summary` | GET | ✅ Done |

**Validation:**
- [x] Backend routes respond correctly
- [x] XP calculations match legacy
- [x] Frontend displays correctly via API client (pending FE swap)

---

#### EXTRACT-002: Focus Sessions

| Field | Value |
|-------|-------|
| **Priority** | P1.2 |
| **Description** | Focus timer sessions with pause, complete, abandon, XP award |
| **Dependencies** | EXTRACT-001 (Gamification) |
| **Blocks** | None directly |

**Affected Paths (Source):**
- `src/lib/db/repositories/focusSessions.ts`
- `src/app/api/focus/route.ts`
- `src/app/api/focus/active/route.ts`
- `src/app/api/focus/pause/route.ts`
- `src/app/api/focus/[id]/complete/route.ts`
- `src/app/api/focus/[id]/abandon/route.ts`

**Target Paths (Backend):**
- `app/backend/crates/api/src/db/focus.rs`
- `app/backend/crates/api/src/routes/focus.rs`

**Tables:**
- `focus_sessions`, `focus_pause_state`

**API Routes:**
| Old Route | New Route | Methods |
|-----------|-----------|---------|
| `/api/focus` | `/focus` | GET, POST |
| `/api/focus/active` | `/focus/active` | GET |
| `/api/focus/pause` | `/focus/pause` | GET, POST, DELETE |
| `/api/focus/[id]/complete` | `/focus/:id/complete` | POST |
| `/api/focus/[id]/abandon` | `/focus/:id/abandon` | POST |

**Backend Tests:**
- Session start creates record
- Pause stores remaining time
- Complete awards XP (uses gamification)
- Abandon does not award XP

**Validation:**
- [ ] Timer lifecycle works end-to-end
- [ ] XP awarded on completion
- [ ] Pause/resume preserves state

---

#### EXTRACT-003: Habits

| Field | Value |
|-------|-------|
| **Priority** | P1.3 |
| **Description** | Habit tracking with streak calculation |
| **Dependencies** | EXTRACT-001 (Gamification for streaks) |
| **Blocks** | None |

**Affected Paths (Source):**
- `src/lib/db/repositories/habits.ts` (UNKNOWN exact path)
- `src/app/api/habits/route.ts`

**Target Paths (Backend):**
- `app/backend/crates/api/src/db/habits.rs`
- `app/backend/crates/api/src/routes/habits.rs`

**Tables:**
- `habits`, `habit_logs`, `user_streaks`

**API Routes:**
| Old Route | New Route | Methods |
|-----------|-----------|---------|
| `/api/habits` | `/habits` | GET, POST |

**Backend Tests:**
- Habit CRUD
- Logging completion
- Streak calculation

---

#### EXTRACT-004: Goals

| Field | Value |
|-------|-------|
| **Priority** | P1.4 |
| **Description** | Goal tracking with milestones |
| **Dependencies** | None |
| **Blocks** | None |

**Affected Paths (Source):**
- `src/app/api/goals/route.ts`

**Target Paths (Backend):**
- `app/backend/crates/api/src/db/goals.rs`
- `app/backend/crates/api/src/routes/goals.rs`

**Tables:**
- `goals`, `goal_milestones`

**API Routes:**
| Old Route | New Route | Methods |
|-----------|-----------|---------|
| `/api/goals` | `/goals` | GET, POST |

**Backend Tests:**
- Goal CRUD
- Milestone management
- Completion status

---

### Wave 2: Core Features (P2)

#### EXTRACT-005: Quests

| Field | Value |
|-------|-------|
| **Priority** | P2.1 |
| **Description** | Quest system with universal quests and user progress |
| **Dependencies** | EXTRACT-001 (Gamification) |
| **Blocks** | None |

**Affected Paths (Source):**
- `src/lib/db/repositories/quests.ts`
- `src/app/api/quests/route.ts`

**Target Paths (Backend):**
- `app/backend/crates/api/src/db/quests.rs`
- `app/backend/crates/api/src/routes/quests.rs`

**Tables:**
- `quests`, `universal_quests`, `user_quest_progress`

**API Routes:**
| Old Route | New Route | Methods |
|-----------|-----------|---------|
| `/api/quests` | `/quests` | GET, POST |

---

#### EXTRACT-006: Calendar

| Field | Value |
|-------|-------|
| **Priority** | P2.2 |
| **Description** | Calendar event management |
| **Dependencies** | None |
| **Blocks** | None |

**Affected Paths (Source):**
- `src/lib/db/repositories/calendarEvents.ts`
- `src/app/api/calendar/route.ts`

**Target Paths (Backend):**
- `app/backend/crates/api/src/db/calendar.rs`
- `app/backend/crates/api/src/routes/calendar.rs`

**Tables:**
- `calendar_events`

**API Routes:**
| Old Route | New Route | Methods |
|-----------|-----------|---------|
| `/api/calendar` | `/calendar` | GET, POST, PUT, DELETE |

---

#### EXTRACT-007: Daily Plan

| Field | Value |
|-------|-------|
| **Priority** | P2.3 |
| **Description** | Daily planning |
| **Dependencies** | None |
| **Blocks** | None |

**Affected Paths (Source):**
- `src/lib/db/repositories/dailyPlans.ts`
- `src/app/api/daily-plan/route.ts`

**Target Paths (Backend):**
- `app/backend/crates/api/src/db/daily_plan.rs`
- `app/backend/crates/api/src/routes/daily_plan.rs`

**Tables:**
- `daily_plans`

---

#### EXTRACT-008: Feedback

| Field | Value |
|-------|-------|
| **Priority** | P2.4 |
| **Description** | User feedback submission |
| **Dependencies** | None |
| **Blocks** | None |

**Affected Paths (Source):**
- `src/app/api/feedback/route.ts`

**Tables:**
- `feedback`

---

### Wave 3: Complex Features (P3)

#### EXTRACT-009: Exercise

| Field | Value |
|-------|-------|
| **Priority** | P3.1 |
| **Description** | Exercise tracking with workouts, sessions, PRs |
| **Dependencies** | EXTRACT-001 (Gamification) |
| **Blocks** | EXTRACT-010 (Programs) |
| **Complexity** | High (~500 line route) |

**Affected Paths (Source):**
- `src/app/api/exercise/route.ts` (~500 lines)
- `src/app/api/exercise/seed/route.ts`

**Target Paths (Backend):**
- `app/backend/crates/api/src/db/exercise.rs`
- `app/backend/crates/api/src/routes/exercise.rs`

**Tables:**
- `exercises`, `workouts`, `workout_sections`, `workout_exercises`, `workout_sessions`, `exercise_sets`, `personal_records`

---

#### EXTRACT-010: Programs

| Field | Value |
|-------|-------|
| **Priority** | P3.2 |
| **Description** | Training programs |
| **Dependencies** | EXTRACT-009 (Exercise) |

**Tables:**
- `training_programs`, `program_weeks`, `program_workouts`

---

#### EXTRACT-011: Books

| Field | Value |
|-------|-------|
| **Priority** | P3.3 |
| **Description** | Book tracking and reading sessions |
| **Dependencies** | EXTRACT-001 (Gamification) |

**Tables:**
- `books`, `reading_sessions`

---

#### EXTRACT-012: Market

| Field | Value |
|-------|-------|
| **Priority** | P3.4 |
| **Description** | Market with purchases, wallet, redemption |
| **Dependencies** | EXTRACT-001 (Gamification/Wallet) |

**Affected Paths (Source):**
- `src/lib/db/repositories/market.ts`
- `src/app/api/market/route.ts`
- `src/app/api/market/items/route.ts`
- `src/app/api/market/purchase/route.ts`
- `src/app/api/market/redeem/route.ts`

**Tables:**
- `market_items`, `user_purchases`, `user_wallet`, `points_ledger`

---

### Wave 4: Specialized Features (P4)

#### EXTRACT-013: Learn

| Field | Value |
|-------|-------|
| **Priority** | P4.1 |
| **Description** | Learning module with topics, lessons, drills, flashcards |
| **Dependencies** | EXTRACT-001 (Gamification) |
| **Complexity** | High (SRS algorithm for flashcards) |

**Tables:**
- `learn_topics`, `learn_lessons`, `learn_drills`, `user_lesson_progress`, `user_drill_stats`, `flashcard_decks`, `flashcards`

---

#### EXTRACT-014: Reference Tracks

| Field | Value |
|-------|-------|
| **Priority** | P4.2 |
| **Description** | Reference track upload, streaming, analysis |
| **Dependencies** | Storage ✅ |

**Affected Paths (Source):**
- `src/lib/db/repositories/referenceTracks.ts`
- `src/lib/db/repositories/track-analysis.ts`
- `src/app/api/reference/tracks/route.ts`
- `src/app/api/reference/tracks/[id]/route.ts`
- `src/app/api/reference/tracks/[id]/analysis/route.ts`
- `src/app/api/reference/tracks/[id]/play/route.ts`
- `src/app/api/reference/tracks/[id]/stream/route.ts`
- `src/app/api/reference/upload/route.ts`

**Target Paths (Backend):**
- `app/backend/crates/api/src/db/reference.rs`
- `app/backend/crates/api/src/routes/reference.rs`

**Tables:**
- `reference_tracks`, `track_analysis_cache`

**R2 Integration:**
- Stream audio via signed URLs
- Delete audio on track delete

---

#### EXTRACT-015: Critical Listening Loop

| Field | Value |
|-------|-------|
| **Priority** | P4.3 |
| **Description** | Extended reference track analysis, annotations, comparison |
| **Dependencies** | EXTRACT-014 (Reference Tracks) |
| **Status** | UNKNOWN scope - needs product spec |

**UNKNOWN:**
- Annotation storage location (in `track_analysis_cache.analysis_json`?)
- Comparison feature implementation
- "Loop" functionality specifics

**Files Needed to Clarify:**
- `src/components/player/*.tsx` (audio player components)
- `src/app/(desktop)/reference/*.tsx` (reference pages)
- Product specification if available

---

#### EXTRACT-016: Onboarding

| Field | Value |
|-------|-------|
| **Priority** | P4.4 |
| **Description** | Onboarding flow state machine |
| **Dependencies** | None |

**Affected Paths (Source):**
- `src/lib/db/repositories/onboarding.ts`
- `src/app/api/onboarding/*.ts`

**Tables:**
- `user_onboarding_state`, `onboarding_flows`, `onboarding_steps`, `user_settings`, `user_interests`

---

#### EXTRACT-017: Infobase

| Field | Value |
|-------|-------|
| **Priority** | P4.5 |
| **Description** | Knowledge base entries |
| **Dependencies** | None |

**Tables:**
- `infobase_entries`

---

#### EXTRACT-018: Ideas

| Field | Value |
|-------|-------|
| **Priority** | P4.6 |
| **Description** | Ideas capture |
| **Dependencies** | None |

**Tables:**
- `ideas`

---

#### EXTRACT-019: Analysis

| Field | Value |
|-------|-------|
| **Priority** | P4.7 |
| **Description** | Track analysis caching |
| **Dependencies** | EXTRACT-014 |

**Tables:**
- `track_analysis_cache`

---

### Wave 5: User & Admin (P5)

#### EXTRACT-020: User Export/Delete

| Field | Value |
|-------|-------|
| **Priority** | P5.1 |
| **Description** | User data export and account deletion |
| **Dependencies** | All features (accesses all tables) |

**Tables:**
- All user tables

**R2:**
- Export ZIP storage

---

#### EXTRACT-021: Auth Extensions

| Field | Value |
|-------|-------|
| **Priority** | P5.2 |
| **Description** | ToS acceptance, age verification |
| **Dependencies** | Auth ✅ |

**Affected Paths (Source):**
- `src/app/api/auth/accept-tos/route.ts`
- `src/app/api/auth/verify-age/route.ts`

---

#### EXTRACT-022: Admin Routes

| Field | Value |
|-------|-------|
| **Priority** | P5.3 |
| **Description** | All admin functionality |
| **Dependencies** | All features |

**Affected Paths (Source):**
- `src/app/api/admin/*.ts` (10 files)

**Admin Routes:**
- backup, restore, users, cleanup-users, stats, feedback, quests, skills, content, db-health

---

## Extraction Status Summary

| ID | Feature | Priority | Status |
|----|---------|----------|--------|
| EXTRACT-001 | Gamification | P1.1 | ⏳ Not Started |
| EXTRACT-002 | Focus | P1.2 | ⏳ Not Started |
| EXTRACT-003 | Habits | P1.3 | ⏳ Not Started |
| EXTRACT-004 | Goals | P1.4 | ⏳ Not Started |
| EXTRACT-005 | Quests | P2.1 | ⏳ Not Started |
| EXTRACT-006 | Calendar | P2.2 | ⏳ Not Started |
| EXTRACT-007 | Daily Plan | P2.3 | ⏳ Not Started |
| EXTRACT-008 | Feedback | P2.4 | ⏳ Not Started |
| EXTRACT-009 | Exercise | P3.1 | ⏳ Not Started |
| EXTRACT-010 | Programs | P3.2 | ⏳ Not Started |
| EXTRACT-011 | Books | P3.3 | ⏳ Not Started |
| EXTRACT-012 | Market | P3.4 | ⏳ Not Started |
| EXTRACT-013 | Learn | P4.1 | ⏳ Not Started |
| EXTRACT-014 | Reference Tracks | P4.2 | ⏳ Not Started |
| EXTRACT-015 | Critical Listening | P4.3 | ❓ UNKNOWN scope |
| EXTRACT-016 | Onboarding | P4.4 | ⏳ Not Started |
| EXTRACT-017 | Infobase | P4.5 | ⏳ Not Started |
| EXTRACT-018 | Ideas | P4.6 | ⏳ Not Started |
| EXTRACT-019 | Analysis | P4.7 | ⏳ Not Started |
| EXTRACT-020 | User Export/Delete | P5.1 | ⏳ Not Started |
| EXTRACT-021 | Auth Extensions | P5.2 | ⏳ Not Started |
| EXTRACT-022 | Admin Routes | P5.3 | ⏳ Not Started |

---

## Deprecation Path

After each EXTRACT completes:

1. Verify all tests pass
2. Verify frontend uses new API
3. Move source to `deprecated/`:
   - `src/app/api/X/` → `deprecated/src/app/api/X/`
   - `src/lib/db/repositories/X.ts` → `deprecated/src/lib/db/repositories/X.ts`

---

## References

- [FEATURE_OWNERSHIP_MAP.md](./FEATURE_OWNERSHIP_MAP.md) - Ownership definitions
- [feature_parity_checklist.md](./feature_parity_checklist.md) - Implementation status
- [feature_porting_playbook.md](./feature_porting_playbook.md) - Porting process
- [api_endpoint_inventory.md](./api_endpoint_inventory.md) - All endpoints

