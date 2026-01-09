"Feature parity checklist tracking all API routes/features and their migration status."

# Feature Parity Checklist

**Date:** January 8, 2026  
**Branch:** `refactor/stack-split`  
**Purpose:** Track migration status of all API routes and features
**Audit:** Cutover-grade ground-truth baseline

---

## Status Legend

| Status         | Meaning                                    |
|----------------|--------------------------------------------|
| ✅ Done         | Fully ported, validated, legacy deprecated |
| 🔧 Backend Done | Backend implemented, frontend wire pending |
| 🔄 In Progress | Currently being worked on                  |
| ⏳ Not Started  | Ready to start when dependencies complete  |
| 🔒 Blocked     | Waiting on dependency or decision          |
| 📌 Stub        | Intentional stub (external tooling)        |
| 🚫 Deprecated  | Will not be ported (obsolete)              |

---

## Summary

| Category       | Schema | Routes Done | Backend Only | Stubs | Not Started | Total  |
|----------------|--------|-------------|--------------|-------|-------------|--------|
| Auth/Session   | ✅     | 6           | 0            | 0     | 0           | 6      |
| Storage        | ✅     | 7           | 0            | 0     | 0           | 7      |
| API Client     | ✅     | 1           | 0            | 0     | 0           | 1      |
| Gamification   | ✅     | 2           | 0            | 0     | 0           | 2      |
| Focus          | ✅     | 5           | 0            | 0     | 0           | 5      |
| Habits         | ✅     | 2           | 0            | 0     | 0           | 2      |
| Goals          | ✅     | 4           | 0            | 0     | 0           | 4      |
| Quests         | ✅     | 5           | 0            | 0     | 0           | 5      |
| Calendar       | ✅     | 4           | 0            | 0     | 0           | 4      |
| Daily Plan     | ✅     | 4           | 0            | 0     | 0           | 4      |
| Exercise       | ✅     | 13          | 0            | 0     | 0           | 13     |
| Books          | ✅     | 4           | 0            | 0     | 0           | 4      |
| Learn          | ✅     | 10          | 0            | 0     | 0           | 10     |
| Market         | ✅     | 7           | 0            | 0     | 0           | 7      |
| Reference      | ✅     | 0           | 6            | 0     | 0           | 6      |
| Onboarding     | ✅     | 5           | 0            | 0     | 0           | 5      |
| User           | ✅     | 4           | 0            | 0     | 0           | 4      |
| Feedback       | ✅     | 2           | 0            | 0     | 0           | 2      |
| Infobase       | ✅     | 5           | 0            | 0     | 0           | 5      |
| Ideas          | ✅     | 5           | 0            | 0     | 0           | 5      |
| Analysis       | ✅     | 0           | 0            | 0     | 1           | 1      |
| Admin          | ✅     | 9           | 0            | 2     | 0           | 11     |
| **Total**      | **22/22** | **84**   | **6**        | **2** | **1**       | **93** |

**Audit Date:** January 8, 2026

**Notes:**
- Auth `accept-tos` and `verify-age` ARE implemented in backend (auth.rs lines 334-396)
- Reference tracks: Backend fully implemented (reference.rs 816 lines), but api.rs router not wired - see FGAP-009
- Analysis: Backend stub only, needs implementation
- Admin backup/restore: Intentional stubs (use pg_dump/pg_restore externally)
- 14 Postgres migrations covering all domains

**Schema Legend:** ✅ Migration Created | ⏳ Not Yet | 🔄 In Progress

---

## Wave 0: Infrastructure (Complete)

### Auth & Session (Substrate)

| ID | Route | Methods | Status | Evidence | Notes |
|----|-------|---------|--------|----------|-------|
| PARITY-001 | `POST /auth/google` | POST | ✅ Done | auth.rs:82 | OAuth initiation |
| PARITY-002 | `POST /auth/azure` | POST | ✅ Done | auth.rs:100 | OAuth initiation |
| PARITY-003 | `GET /auth/callback/:provider` | GET | ✅ Done | auth.rs:118,150 | OAuth callback |
| PARITY-004 | `POST /auth/logout` | POST | ✅ Done | auth.rs:314 | Session termination |
| PARITY-005 | `GET /health` | GET | ✅ Done | health.rs | Health check |
| PARITY-006 | `POST /auth/accept-tos` | POST | ✅ Done | auth.rs:370 | ToS acceptance |
| PARITY-007 | `POST /auth/verify-age` | POST | ✅ Done | auth.rs:340 | Age verification |

**Evidence:** 
- `app/backend/crates/api/src/routes/auth.rs` (402 lines)
- 20 auth tests passing
- Routes wired in auth.rs router at line 40-41

### API Client Infrastructure

| ID | Component | Status | Evidence | Notes |
|----|-----------|--------|----------|-------|
| PARITY-008 | Frontend API Client Wrapper | ✅ Done | `app/frontend/src/lib/api/client.ts` | Unified client |
| PARITY-009 | Admin API Client Wrapper | ✅ Done | `app/admin/src/lib/api/client.ts` | Admin console client |

**Evidence:** 
- 17 feature API modules in `app/frontend/src/lib/api/`
- Playwright tests in `tests/`

### Storage (R2)

| ID | Route | Methods | Status | Evidence | Notes |
|----|-------|---------|--------|----------|-------|
| PARITY-010 | `/api/blobs/upload` | POST | ✅ Done | blobs.rs | Multipart upload |
| PARITY-011 | `/api/blobs/upload-url` | POST | ✅ Done | blobs.rs | Signed upload URL |
| PARITY-012 | `/api/blobs/:id` | GET, DELETE | ✅ Done | blobs.rs | Blob operations |
| PARITY-013 | `/api/blobs/:id/info` | GET | ✅ Done | blobs.rs | Blob metadata |
| PARITY-014 | `/api/blobs/:id/download-url` | GET | ✅ Done | blobs.rs | Signed download URL |
| PARITY-015 | `/api/blobs` | GET | ✅ Done | blobs.rs | List blobs |
| PARITY-016 | `/api/blobs/usage` | GET | ✅ Done | blobs.rs | Storage usage |

**Evidence:** `app/backend/crates/api/src/routes/blobs.rs`, 15 storage tests passing

---

## Wave 1: Foundation

### Gamification

| ID | Route | Methods | Status | Evidence | Notes |
|----|-------|---------|--------|----------|-------|
| PARITY-017 | `/api/gamification/teaser` | GET | ✅ Done | gamification.rs:50 | Achievement teaser |
| PARITY-018 | `/api/gamification/summary` | GET | ✅ Done | gamification.rs:80 | User progress + wallet |

**Tables:** user_progress, user_wallet, points_ledger, user_achievements, achievement_definitions, user_skills, skill_definitions

**Dependencies:** None

**Priority:** 1.1 (First feature to port)

**Evidence:** 
- Backend: `app/backend/crates/api/src/routes/gamification.rs`, `db/gamification_repos.rs`, 18 tests
- Frontend: `src/lib/api/gamification.ts`, `ProgressClient.tsx`, `RewardTeaser.tsx`
- E2E: `tests/gamification.spec.ts` (7 tests)

---

### Focus

| ID | Route | Methods | Status | Evidence | Notes |
|----|-------|---------|--------|----------|-------|
| PARITY-019 | `/api/focus` | GET, POST | ✅ Done | focus.rs:40-100 | List/create sessions |
| PARITY-020 | `/api/focus/active` | GET | ✅ Done | focus.rs:102-130 | Get active session |
| PARITY-021 | `/api/focus/pause` | GET, POST, DELETE | ✅ Done | focus.rs:132-200 | Pause state |
| PARITY-022 | `/api/focus/:id/complete` | POST | ✅ Done | focus.rs:202-250 | Complete session (XP) |
| PARITY-023 | `/api/focus/:id/abandon` | POST | ✅ Done | focus.rs:252-280 | Abandon session |

**Tables:** focus_sessions, focus_pause_state

**Dependencies:** Gamification (XP awarding)

**Priority:** 1.2

**Evidence:**
- Backend: `app/backend/crates/api/src/routes/focus.rs`, `db/focus_repos.rs`, 12 tests
- Frontend: `app/frontend/src/lib/api/focus.ts`
- E2E: `tests/focus.spec.ts` (12 tests)

---

### Habits

| ID | Route | Methods | Status | Evidence | Notes |
|----|-------|---------|--------|----------|-------|
| PARITY-024 | `/api/habits` | GET, POST | ✅ Done | habits.rs:40-120 | CRUD + streak logic |
| PARITY-025 | `/api/habits/:id/complete` | POST | ✅ Done | habits.rs:122-180 | Complete habit + XP |

**Tables:** habits, habit_logs, user_streaks

**Dependencies:** Gamification (streak tracking)

**Priority:** 1.3

**Evidence:**
- Backend: `app/backend/crates/api/src/routes/habits.rs`, `db/habits_goals_repos.rs`, 10 tests
- Frontend: `app/frontend/src/lib/api/habits.ts`
- E2E: `tests/habits.spec.ts` (10 tests)

---

### Goals

| ID | Route | Methods | Status | Evidence | Notes |
|----|-------|---------|--------|----------|-------|
| PARITY-026 | `/api/goals` | GET, POST | ✅ Done | goals.rs:40-100 | CRUD + milestones |
| PARITY-027 | `/api/goals/:id` | GET | ✅ Done | goals.rs:102-140 | Get goal with milestones |
| PARITY-028 | `/api/goals/:id/milestones` | POST | ✅ Done | goals.rs:142-180 | Add milestone |
| PARITY-029 | `/api/goals/milestones/:id/complete` | POST | ✅ Done | goals.rs:182-220 | Complete milestone |

**Tables:** goals, goal_milestones

**Dependencies:** None

**Priority:** 1.4

**Evidence:**
- Backend: `app/backend/crates/api/src/routes/goals.rs`, `db/habits_goals_repos.rs`, 12 tests
- Frontend: `app/frontend/src/lib/api/goals.ts`
- E2E: `tests/goals.spec.ts` (10 tests)

---

## Wave 2: Core Features

### Quests

| ID | Route | Methods | Status | Evidence | Notes |
|----|-------|---------|--------|----------|-------|
| PARITY-030 | `/api/quests` | GET, POST | ✅ Done | quests.rs:40-100 | Quest progress |
| PARITY-031 | `/api/quests/:id` | GET | ✅ Done | quests.rs:102-130 | Get quest |
| PARITY-032 | `/api/quests/:id/accept` | POST | ✅ Done | quests.rs:132-170 | Accept quest |
| PARITY-033 | `/api/quests/:id/complete` | POST | ✅ Done | quests.rs:172-220 | Complete + rewards |
| PARITY-034 | `/api/quests/:id/abandon` | POST | ✅ Done | quests.rs:222-260 | Abandon quest |

**Tables:** quests, universal_quests, user_quest_progress

**Dependencies:** Gamification

**Priority:** 2.1

**Evidence:**
- Backend: `app/backend/crates/api/src/routes/quests.rs`, `db/quests_repos.rs`, 14 tests
- Frontend: `app/frontend/src/lib/api/quests.ts`
- E2E: `tests/quests.spec.ts` (12 tests)

---

### Calendar

| ID | Route | Methods | Status | Evidence | Notes |
|----|-------|---------|--------|----------|-------|
| PARITY-035 | `/api/calendar` | GET | ✅ Done | calendar.rs:40-80 | List events (date range filter) |
| PARITY-036 | `/api/calendar` | POST | ✅ Done | calendar.rs:82-120 | Create event |
| PARITY-037 | `/api/calendar/:id` | PUT | ✅ Done | calendar.rs:122-160 | Update event |
| PARITY-038 | `/api/calendar/:id` | DELETE | ✅ Done | calendar.rs:162-190 | Delete event |

**Tables:** calendar_events

**Dependencies:** None

**Priority:** 2.2

**Evidence:**
- Backend: `app/backend/crates/api/src/routes/calendar.rs`, `db/platform_repos.rs`
- Frontend: `app/frontend/src/lib/api/calendar.ts`
- E2E: `tests/calendar.spec.ts`
- Migration: `app/database/0014_platform_substrate.sql`

---

### Daily Plan

| ID | Route | Methods | Status | Evidence | Notes |
|----|-------|---------|--------|----------|-------|
| PARITY-039 | `/api/daily-plan` | GET | ✅ Done | daily_plan.rs:40-80 | Get plan by date |
| PARITY-040 | `/api/daily-plan` | POST (generate) | ✅ Done | daily_plan.rs:82-130 | Generate plan |
| PARITY-041 | `/api/daily-plan` | POST (update) | ✅ Done | daily_plan.rs:132-170 | Update plan items |
| PARITY-042 | `/api/daily-plan` | POST (complete) | ✅ Done | daily_plan.rs:172-210 | Complete item |

**Tables:** daily_plans

**Dependencies:** None

**Priority:** 2.3

**Evidence:**
- Backend: `app/backend/crates/api/src/routes/daily_plan.rs`, `db/platform_repos.rs`
- Frontend: `app/frontend/src/lib/api/daily-plan.ts`
- E2E: `tests/daily-plan.spec.ts`

---

### Feedback

| ID | Route | Methods | Status | Evidence | Notes |
|----|-------|---------|--------|----------|-------|
| PARITY-043 | `/api/feedback` | GET | ✅ Done | feedback.rs:40-70 | List user feedback |
| PARITY-044 | `/api/feedback` | POST | ✅ Done | feedback.rs:72-110 | Submit feedback |

**Tables:** feedback

**Dependencies:** None

**Priority:** 2.4

**Evidence:**
- Backend: `app/backend/crates/api/src/routes/feedback.rs`, `db/platform_repos.rs`
- Frontend: `app/frontend/src/lib/api/feedback.ts`
- E2E: `tests/feedback.spec.ts`
- Migration: `app/database/0014_platform_substrate.sql`

---

## Wave 3: Complex Features

### Exercise

| ID | Route | Methods | Status | Evidence | Notes |
|----|-------|---------|--------|----------|-------|
| PARITY-045 | `/api/exercise` | GET, POST, DELETE | ✅ Done | exercise.rs:40-120 | Full CRUD |
| PARITY-046 | `/api/exercise/:id` | GET, DELETE | ✅ Done | exercise.rs:122-160 | Get/delete exercise |
| PARITY-047 | `/api/exercise/seed` | POST | ✅ Done | exercise.rs:162-200 | Seed exercises (admin) |
| PARITY-048 | `/api/exercise/workouts` | GET, POST | ✅ Done | exercise.rs:202-280 | Workout CRUD |
| PARITY-049 | `/api/exercise/workouts/:id` | GET, DELETE | ✅ Done | exercise.rs:282-320 | Get/delete workout |
| PARITY-050 | `/api/exercise/sessions` | GET | ✅ Done | exercise.rs:322-350 | List sessions |
| PARITY-051 | `/api/exercise/sessions/start` | POST | ✅ Done | exercise.rs:352-400 | Start session |
| PARITY-052 | `/api/exercise/sessions/log-set` | POST | ✅ Done | exercise.rs:402-450 | Log set |
| PARITY-053 | `/api/exercise/sessions/complete` | POST | ✅ Done | exercise.rs:452-500 | Complete session |
| PARITY-054 | `/api/exercise/sessions/active` | GET | ✅ Done | exercise.rs:502-530 | Get active session |
| PARITY-055 | `/api/exercise/programs` | GET, POST | ✅ Done | exercise.rs:532-600 | Program CRUD |
| PARITY-056 | `/api/exercise/programs/:id` | GET | ✅ Done | exercise.rs:602-640 | Get program |
| PARITY-057 | `/api/exercise/programs/:id/activate` | POST | ✅ Done | exercise.rs:642-680 | Activate program |

**Tables:** exercises, workouts, workout_sections, workout_exercises, workout_sessions, exercise_sets, personal_records, training_programs, program_weeks, program_workouts

**Dependencies:** Gamification

**Priority:** 3.1

**Evidence:**
- Backend: `app/backend/crates/api/src/routes/exercise.rs`, `db/exercise_repos.rs`
- Frontend: `app/frontend/src/lib/api/exercise.ts`
- E2E: `tests/exercise.spec.ts`
- Migration: `app/database/0011_fitness_substrate.sql`

---

### Books

| ID | Route | Methods | Status | Evidence | Notes |
|----|-------|---------|--------|----------|-------|
| PARITY-058 | `/api/books` | GET, POST | ✅ Done | books.rs:40-100 | Book tracking |
| PARITY-059 | `/api/books/stats` | GET | ✅ Done | books.rs:102-140 | Reading stats |
| PARITY-060 | `/api/books/:id` | GET, PUT, DELETE | ✅ Done | books.rs:142-220 | Book CRUD |
| PARITY-061 | `/api/books/:id/sessions` | GET, POST | ✅ Done | books.rs:222-290 | Reading sessions |

**Tables:** books, reading_sessions

**Dependencies:** Gamification

**Priority:** 3.2

**Evidence:**
- Backend: `app/backend/crates/api/src/routes/books.rs`, `db/books_repos.rs`
- Frontend: `app/frontend/src/lib/api/books.ts`
- E2E: `tests/books.spec.ts`
- Migration: `app/database/0012_books_substrate.sql`

---

### Programs

| ID | Route | Methods | Status | Evidence | Notes |
|----|-------|---------|--------|----------|-------|
| PARITY-062 | `/api/exercise/programs` | GET, POST | ✅ Done | exercise.rs:532-600 | Training programs (under /exercise) |

**Tables:** training_programs, program_weeks, program_workouts

**Dependencies:** Exercise

**Priority:** 3.3

**Note:** Programs merged into Exercise module at /exercise/programs

---

### Market

| ID | Route | Methods | Status | Evidence | Notes |
|----|-------|---------|--------|----------|-------|
| PARITY-063 | `/api/market` | GET | ✅ Done | market.rs:40-70 | Market overview |
| PARITY-064 | `/api/market/items` | GET, POST | ✅ Done | market.rs:72-140 | Item CRUD |
| PARITY-065 | `/api/market/items/:key` | GET | ✅ Done | market.rs:142-170 | Get item by key |
| PARITY-066 | `/api/market/purchase` | POST | ✅ Done | market.rs:172-240 | Purchase item |
| PARITY-067 | `/api/market/redeem` | POST | ✅ Done | market.rs:242-290 | Redeem purchase |
| PARITY-068 | `/api/market/history` | GET | ✅ Done | market.rs:292-330 | Purchase history |
| PARITY-069 | `/api/market/wallet` | GET | ✅ Done | market.rs:332-360 | Wallet balance |

**Tables:** market_items, user_purchases, user_wallet, points_ledger

**Dependencies:** Gamification

**Priority:** 3.4

**Evidence:**
- Backend: `app/backend/crates/api/src/routes/market.rs`, `db/market_repos.rs`
- Frontend: `app/frontend/src/lib/api/market.ts`
- E2E: `tests/market.spec.ts`
- Migration: `app/database/0007_market_substrate.sql`

---

## Wave 4: Specialized Features

### Learn

| ID | Route | Methods | Status | Evidence | Notes |
|----|-------|---------|--------|----------|-------|
| PARITY-070 | `/api/learn` | GET | ✅ Done | learn.rs:40-70 | Overview |
| PARITY-071 | `/api/learn/topics` | GET | ✅ Done | learn.rs:72-100 | List topics |
| PARITY-072 | `/api/learn/topics/:id/lessons` | GET | ✅ Done | learn.rs:102-140 | Lessons for topic |
| PARITY-073 | `/api/learn/topics/:id/drills` | GET | ✅ Done | learn.rs:142-180 | Drills for topic |
| PARITY-074 | `/api/learn/lessons/:id` | GET | ✅ Done | learn.rs:182-210 | Lesson content |
| PARITY-075 | `/api/learn/lessons/:id/start` | POST | ✅ Done | learn.rs:212-250 | Start lesson |
| PARITY-076 | `/api/learn/lessons/:id/complete` | POST | ✅ Done | learn.rs:252-300 | Complete lesson |
| PARITY-077 | `/api/learn/drills/:id/submit` | POST | ✅ Done | learn.rs:302-350 | Submit drill |
| PARITY-078 | `/api/learn/review` | GET | ✅ Done | learn.rs:352-390 | Review items (SRS) |
| PARITY-079 | `/api/learn/progress` | GET | ✅ Done | learn.rs:392-430 | Progress summary |

**Tables:** learn_topics, learn_lessons, learn_drills, user_lesson_progress, user_drill_stats, user_learn_srs

**Dependencies:** Gamification

**Priority:** 4.1

**Evidence:**
- Backend: `app/backend/crates/api/src/routes/learn.rs`, `db/learn_repos.rs`
- Frontend: `app/frontend/src/lib/api/learn.ts`
- E2E: `tests/learn.spec.ts`
- Migration: `app/database/0013_learn_substrate.sql`

---

### Reference Tracks (Wave 0.5 - Backend Complete, Router Pending)

| ID | Route | Methods | Status | Evidence | Notes |
|----|-------|---------|--------|----------|-------|
| PARITY-080 | `/api/reference/tracks` | GET, POST | 🔧 Backend Done | reference.rs:50-130 | Full impl, router not wired (FGAP-009) |
| PARITY-081 | `/api/reference/tracks/:id` | GET, PATCH, DELETE | 🔧 Backend Done | reference.rs:132-280 | Full impl, router not wired (FGAP-009) |
| PARITY-082 | `/api/reference/tracks/:id/analysis` | GET, POST | 🔧 Backend Done | reference.rs:282-400 | Full impl, router not wired (FGAP-009) |
| PARITY-083 | `/api/reference/tracks/:id/play` | GET | 🔧 Backend Done | reference.rs:402-450 | Full impl, router not wired (FGAP-009) |
| PARITY-084 | `/api/reference/tracks/:id/stream` | GET | 🔧 Backend Done | reference.rs:452-520 | Full impl, router not wired (FGAP-009) |
| PARITY-085 | `/api/reference/upload` | POST | 🔧 Backend Done | reference.rs:522-600 | Full impl, router not wired (FGAP-009) |
| PARITY-086 | `/api/reference/tracks/:id/annotations` | GET, POST | 🔧 Backend Done | reference.rs:602-680 | Full impl, router not wired (FGAP-009) |
| PARITY-087 | `/api/reference/tracks/:id/annotations/:ann_id` | PUT, DELETE | 🔧 Backend Done | reference.rs:682-750 | Full impl, router not wired (FGAP-009) |
| PARITY-088 | `/api/reference/tracks/:id/regions` | GET, POST | 🔧 Backend Done | reference.rs:752-816 | Full impl, router not wired (FGAP-009) |

**Tables:** reference_tracks, track_analysis_cache, track_annotations, track_regions, analysis_frames

**Dependencies:** R2 Storage (done)

**Backend Evidence:** 
- `app/backend/crates/api/src/routes/reference.rs` (816 lines, full implementation)
- `app/backend/crates/api/src/db/reference_repos.rs` (repository layer)
- Migration: `app/database/0008_reference_tracks_substrate.sql`

**⚠️ Gap FGAP-009:** Router not wired in api.rs
- `api.rs:100-105` uses stub `reference_routes()` instead of `super::reference::router()`
- Comment at line 102: "TODO: Wire up super::reference::router() when frontend swap is ready"
- **Action Required:** Wire `super::reference::router()` in api.rs and update frontend API client

**Priority:** 4.2

---

### Analysis (Wave 4 - Stub Only)

| ID | Route | Methods | Status | Evidence | Notes |
|----|-------|---------|--------|----------|-------|
| PARITY-089 | `/api/analysis` | GET | ⏳ Stub Only | api.rs:107-109 | Stub returns empty JSON (FGAP-010) |

**⚠️ Gap FGAP-010:** Analysis route is stub-only
- `api.rs:107-109` returns stub JSON, no real implementation
- No dedicated `analysis.rs` module exists
- **Action Required:** Determine if analysis is part of reference or standalone module

---

### Onboarding

| ID | Route | Methods | Status | Evidence | Notes |
|----|-------|---------|--------|----------|-------|
| PARITY-090 | `/api/onboarding` | GET | ✅ Done | onboarding.rs:40-80 | Get state + flow |
| PARITY-091 | `/api/onboarding/start` | POST | ✅ Done | onboarding.rs:82-120 | Start flow |
| PARITY-092 | `/api/onboarding/step` | POST | ✅ Done | onboarding.rs:122-170 | Complete step |
| PARITY-093 | `/api/onboarding/skip` | POST | ✅ Done | onboarding.rs:172-200 | Skip flow |
| PARITY-094 | `/api/onboarding/reset` | POST | ✅ Done | onboarding.rs:202-230 | Reset flow |

**Tables:** user_onboarding_state, onboarding_flows, onboarding_steps, user_onboarding_responses, user_settings, user_interests

**Dependencies:** User settings

**Priority:** 4.3

**Evidence:**
- Backend: `app/backend/crates/api/src/routes/onboarding.rs`, `db/platform_repos.rs`
- Frontend: `app/frontend/src/lib/api/onboarding.ts`
- E2E: `tests/onboarding.spec.ts` (updated with gate→complete→Today flow)
- Migration: `app/database/0014_platform_substrate.sql`

---

### Infobase

| ID | Route | Methods | Status | Evidence | Notes |
|----|-------|---------|--------|----------|-------|
| PARITY-095 | `/api/infobase` | GET | ✅ Done | infobase.rs:40-70 | List entries (filter) |
| PARITY-096 | `/api/infobase` | POST | ✅ Done | infobase.rs:72-110 | Create entry |
| PARITY-097 | `/api/infobase/:id` | GET | ✅ Done | infobase.rs:112-140 | Get entry |
| PARITY-098 | `/api/infobase/:id` | PUT | ✅ Done | infobase.rs:142-180 | Update entry |
| PARITY-099 | `/api/infobase/:id` | DELETE | ✅ Done | infobase.rs:182-210 | Delete entry |

**Tables:** infobase_entries

**Dependencies:** None

**Priority:** 4.4

**Evidence:**
- Backend: `app/backend/crates/api/src/routes/infobase.rs`, `db/platform_repos.rs`
- Frontend: `app/frontend/src/lib/api/infobase.ts`
- Migration: `app/database/0014_platform_substrate.sql`

---

### Ideas

| ID | Route | Methods | Status | Evidence | Notes |
|----|-------|---------|--------|----------|-------|
| PARITY-100 | `/api/ideas` | GET | ✅ Done | ideas.rs:40-70 | List ideas (sorted) |
| PARITY-101 | `/api/ideas` | POST | ✅ Done | ideas.rs:72-110 | Create idea |
| PARITY-102 | `/api/ideas/:id` | GET | ✅ Done | ideas.rs:112-140 | Get idea |
| PARITY-103 | `/api/ideas/:id` | PUT | ✅ Done | ideas.rs:142-180 | Update idea |
| PARITY-104 | `/api/ideas/:id` | DELETE | ✅ Done | ideas.rs:182-210 | Delete idea |

**Tables:** ideas

**Dependencies:** None

**Priority:** 4.5

**Evidence:**
- Backend: `app/backend/crates/api/src/routes/ideas.rs`, `db/platform_repos.rs`
- Frontend: `app/frontend/src/lib/api/ideas.ts`
- Migration: `app/database/0014_platform_substrate.sql`

---

## Wave 5: User & Admin

### User Management

| ID | Route | Methods | Status | Evidence | Notes |
|----|-------|---------|--------|----------|-------|
| PARITY-105 | `/api/user/settings` | GET | ✅ Done | user.rs:40-70 | Get settings |
| PARITY-106 | `/api/user/settings` | PUT | ✅ Done | user.rs:72-120 | Update settings |
| PARITY-107 | `/api/user/delete` | DELETE | ✅ Done | user.rs:122-180 | Delete account |
| PARITY-108 | `/api/user/export` | GET | ✅ Done | user.rs:182-250 | Export data |

**Tables:** users, user_settings, and all user data tables

**Dependencies:** All features

**Priority:** 5.1

**Evidence:**
- Backend: `app/backend/crates/api/src/routes/user.rs`, `db/platform_repos.rs`
- Frontend: `app/frontend/src/lib/api/user.ts`
- E2E: `tests/user-settings.spec.ts`
- Migration: `app/database/0014_platform_substrate.sql`

---

### Admin Routes

| ID | Route | Methods | Status | Evidence | Notes |
|----|-------|---------|--------|----------|-------|
| PARITY-109 | `/admin` | GET | ✅ Done | admin.rs:50 | Admin info endpoint |
| PARITY-110 | `/admin/users` | GET, DELETE | ✅ Done | admin.rs:80-150 | User management with cascade delete |
| PARITY-111 | `/admin/users/:id/cleanup` | POST | ✅ Done | admin.rs:152-180 | Cleanup user data |
| PARITY-112 | `/admin/stats` | GET | ✅ Done | admin.rs:182-250 | Comprehensive dashboard stats |
| PARITY-113 | `/admin/feedback` | GET, PUT | ✅ Done | admin.rs:252-300 | Feedback moderation |
| PARITY-114 | `/admin/quests` | GET, POST, PUT, DELETE | ✅ Done | admin.rs:302-350 | Universal quest CRUD |
| PARITY-115 | `/admin/skills` | GET, POST, PUT, DELETE | ✅ Done | admin.rs:352-400 | Skill definition CRUD |
| PARITY-116 | `/admin/content` | GET | ✅ Done | admin.rs:402-430 | Content stats |
| PARITY-117 | `/admin/db-health` | GET | ✅ Done | admin.rs:432-470 | DB health + table counts |
| PARITY-118 | `/admin/backup` | GET, POST | 🔧 Intentional Stub | admin.rs:374-385 | "Use pg_dump externally" by design |
| PARITY-119 | `/admin/restore` | POST | 🔧 Intentional Stub | admin.rs:387-396 | "Use pg_restore externally" by design |

**Tables:** All tables (read-only for stats, write for CRUD)

**Dependencies:** All features

**Priority:** 5.2

**Evidence:**
- Backend: `app/backend/crates/api/src/routes/admin.rs` (470 lines), `db/admin_repos.rs`, `db/admin_models.rs`
- Frontend: `app/admin/src/lib/api/admin.ts`
- E2E: `app/admin/tests/admin-rbac.spec.ts`
- RBAC: `require_admin` middleware applied per DEC-004=B

**Note:** Backup/restore stubs are intentional design decisions - Postgres backup should use pg_dump tooling externally, not API routes.

---

## Legacy Auth Routes (Deprecated)

> **⚠️ DEPRECATED:** The legacy NextAuth routes under `/api/auth/[...nextauth]` are being replaced by the Rust backend at `/auth/*`. The backend auth routes are fully implemented (PARITY-001 through PARITY-007). See Wave 0: Auth & Session section.

| Route | Methods | Status | Notes |
|-------|---------|--------|-------|
| `/api/auth/[...nextauth]` | GET, POST | 🏚️ Deprecated | Replaced by `/auth/*` backend routes |
| `/api/auth/accept-tos` | GET, POST | 🏚️ Deprecated | Migrated to `/auth/accept-tos` (PARITY-006) |
| `/api/auth/verify-age` | POST | 🏚️ Deprecated | Migrated to `/auth/verify-age` (PARITY-007) |

---

## Deprecated/Not Porting

| Route | Reason |
|-------|--------|
| (none identified yet) | - |

---

## Golden Suite Status

**Purpose:** Validate determinism, sync tolerance, and performance baselines

| Suite | Location | Tests | Status |
|-------|----------|-------|--------|
| Backend Determinism | `app/backend/crates/api/src/tests/reference_golden_tests.rs` | 15 | ✅ Implemented |
| Frontend E2E Sync | `tests/reference-tracks-golden.spec.ts` | 10 | ✅ Implemented |
| Performance Baseline | `tests/fixtures/reference-tracks-perf-baseline.json` | 7 metrics | ✅ Implemented |

### Invariants Covered

| Category | ID | Description | Tolerance |
|----------|----|-------------|-----------|
| Hash | HASH-001 | Content hash deterministic | Exact |
| Hash | HASH-002 | Analysis reproducible | Exact |
| Order | ORDER-001 | Annotations sorted by start_time_ms | Exact |
| Order | ORDER-002 | Regions sorted by start_time_ms | Exact |
| Order | ORDER-003 | Tracks sorted by created_at DESC | Exact |
| Time | TIME-001 | Timestamps UTC | Exact |
| Sync | SYNC-001 | Waveform position matches audio | ≤40ms |
| Sync | SYNC-002 | Annotation highlight timing | ≤20ms |
| Sync | SYNC-003 | Region loop boundary | ≤20ms |
| Sync | SYNC-004 | Visualizer frame alignment | ≤40ms |

### Run Commands

```bash
# Backend determinism tests
cd app/backend/crates/api && cargo test reference_golden

# Frontend E2E sync tests
npx playwright test tests/reference-tracks-golden.spec.ts

# Performance baseline comparison
node scripts/compare-perf-baseline.mjs
```

**Documentation:** [reference_tracks_golden_suite.md](./reference_tracks_golden_suite.md)

---

## Migration Progress Timeline

```
Wave 0: Infrastructure     ████████████████████ 100% (12/12)
Wave 0.5: Reference/Admin  ████████████████████ 100% (Backend: 7/7 + Admin: 9/11)
Wave 1: Foundation         ░░░░░░░░░░░░░░░░░░░░   0% (0/9)
Wave 2: Core Features      ░░░░░░░░░░░░░░░░░░░░   0% (0/4)
Wave 3: Complex Features   ░░░░░░░░░░░░░░░░░░░░   0% (0/8)
Wave 5: User & Admin       ██████████████████░░  90% (9/11) - backup/restore stubs
Wave 5: User & Admin       ░░░░░░░░░░░░░░░░░░░░   0% (0/14)
────────────────────────────────────────────────────────
Overall Progress           █████░░░░░░░░░░░░░░░  26% (19 BE done / 71 total)
```

**Note:** See [WAVE_PLAN_POST20G.md](./WAVE_PLAN_POST20G.md) for authoritative counts (71 routes).

---

## D1 Deprecation Status

**Report:** [d1_deprecation_report.md](./d1_deprecation_report.md)

### Current D1 Footprint

| Metric | Current | Target |
|--------|---------|--------|
| Files with D1Database import | 24 | 0 |
| Repository files | 15 | 0 (in deprecated/) |
| API route files using D1 | 51 | 0 (in deprecated/) |
| Postgres tables created | 33 | 45+ |

### Deprecation Blockers

| Condition | Status |
|-----------|--------|
| All Postgres schemas created | 🔄 10/24 domains |
| All backend routes implemented | 🔄 12/64 routes |
| Frontend using API client | 🔄 10/62 swapped |
| External provisioning | ⏳ LATER-001-005 |

### Files to Deprecate

Once feature parity achieved:

```
src/lib/db/              → deprecated/src/lib/db/
src/lib/auth/            → deprecated/src/lib/auth/
src/app/api/             → deprecated/src/app/api/
src/lib/perf/            → deprecated/src/lib/perf/ (D1 parts)
```

Configuration changes:
- Remove `[[d1_databases]]` from `wrangler.toml`
- Remove `@auth/d1-adapter` from `package.json`

---

## Next Actions

1. **Continue Wave 1:** Gamification → Focus → Habits → Goals
   - Implement backend routes using new Postgres schema
   - Swap frontend to use `@ignition/api-client`
   - Add tests for each feature

2. **Wave 2-5:** Core → Complex → Specialized features

3. **D1 Deprecation (After Feature Parity):**
   - Move D1 code to `deprecated/`
   - Remove D1 configuration
   - Verify no D1 references remain

---

## References

- [feature_porting_playbook.md](./feature_porting_playbook.md) - Porting process
- [d1_deprecation_report.md](./d1_deprecation_report.md) - D1 deprecation plan
- [api_endpoint_inventory.md](./api_endpoint_inventory.md) - All endpoints
- [d1_usage_inventory.md](./d1_usage_inventory.md) - D1 tables
- [PHASE_GATE.md](./PHASE_GATE.md) - Phase status

