"Definitive mapping of feature ownership: backend vs frontend/admin responsibilities."

# Feature Ownership Map

**Date:** January 7, 2026  
**Branch:** `refactor/stack-split`  
**Purpose:** Definitive mapping of backend vs frontend/admin responsibilities per feature

---

## Ownership Principles

Per copilot-instructions (non-negotiable):
- **Backend:** ALL business logic, OAuth, sessions, RBAC, and API routes at `api.ecent.online`
- **Frontend:** UI-only (SSR/RSC allowed), 0% auth logic beyond storing/forwarding cookies
- **Admin Console:** Separate UI at `admin.ignition.ecent.online`, uses same backend under `/admin/*`
- **Storage:** Postgres only (D1 removed), R2 backend-only access

---

## Feature Ownership Table

| Feature/Suite | Backend Responsibilities | Frontend Responsibilities | Admin Responsibilities | Data Objects | API Surface | Old → New Route Mapping | Tests Required | Status |
|---------------|--------------------------|---------------------------|------------------------|--------------|-------------|-------------------------|----------------|--------|
| **Auth/Session** | OAuth flows (Google, Azure), session management, token rotation, CSRF validation, cookie issuance | Sign-in page UI, redirect handling, session provider context | User list, cleanup | Postgres: `users`, `accounts`, `sessions`, `verification_tokens`, `authenticators` | `/auth/*` | `/api/auth/[...nextauth]` → `/auth/*` | OAuth E2E (Playwright), session rotation (integration), CSRF tests | ✅ Done |
| **ToS/Age Verification** | Accept ToS timestamp, verify age flag, update user record | Consent modal UI, form submission | View ToS acceptance stats | Postgres: `users` (tos_accepted_at, age_verified) | `/auth/accept-tos`, `/auth/verify-age` | Same path | E2E flow, validation tests | ⏳ Not Started |
| **RBAC** | Role check middleware, entitlement verification, admin gate | Role-based UI gating (conditional rendering) | Role management, promote/demote users | Postgres: `users` (role column) | N/A (middleware) | N/A | Admin access tests, role denial tests | ✅ Done |
| **Blob Storage** | R2 upload/download, signed URL generation, prefix isolation, MIME validation, size limits | Upload dropzone UI, file preview, progress | Storage stats view | R2: `{userId}/{category}/{uuid}.{ext}`; Postgres metadata if needed | `/blobs/*` | `/api/blobs/*` → `/blobs/*` | Upload/download E2E, IDOR tests | ✅ Done |
| **Gamification** | XP/coins ledger, level calculation, wallet management, achievement triggers, skill updates | XP display, level badge, achievement toasts | Achievement/skill definitions | Postgres: `user_progress`, `user_wallet`, `points_ledger`, `user_achievements`, `achievement_definitions`, `user_skills`, `skill_definitions`, `user_streaks`, `activity_events` | `/gamification/*` | `/api/gamification/*` → `/gamification/*` | Point award tests, level-up tests | ⏳ Not Started |
| **Focus Sessions** | Session CRUD, pause state, completion with XP award, abandon logic | Focus timer UI, pause/resume buttons, session history | Focus stats aggregate | Postgres: `focus_sessions`, `focus_pause_state` | `/focus/*` | `/api/focus/*` → `/focus/*` | Session lifecycle tests, XP award tests | ⏳ Not Started |
| **Habits** | Habit CRUD, log completion, streak calculation | Habit list UI, completion toggles, streak display | Habit stats aggregate | Postgres: `habits`, `habit_logs`, `user_streaks` | `/habits/*` | `/api/habits/*` → `/habits/*` | Streak logic tests, CRUD tests | ⏳ Not Started |
| **Goals** | Goal CRUD, milestone management, completion tracking | Goal list UI, milestone checklist | Goal stats aggregate | Postgres: `goals`, `goal_milestones` | `/goals/*` | `/api/goals/*` → `/goals/*` | CRUD tests, milestone tests | ⏳ Not Started |
| **Quests** | Quest assignment, progress tracking, reward calculation, universal quest management | Quest list UI, progress bars, reward display | Quest definition CRUD | Postgres: `quests`, `universal_quests`, `user_quest_progress` | `/quests/*` | `/api/quests/*` → `/quests/*` | Progress update tests, reward tests | ⏳ Not Started |
| **Calendar** | Event CRUD, recurrence logic (if any), conflict detection | Calendar UI component, event form | N/A | Postgres: `calendar_events` | `/calendar/*` | `/api/calendar/*` → `/calendar/*` | CRUD tests, date range tests | ⏳ Not Started |
| **Daily Plan** | Plan CRUD, template application | Daily plan editor UI | N/A | Postgres: `daily_plans`, `plan_templates` | `/daily-plan/*` | `/api/daily-plan/*` → `/daily-plan/*` | CRUD tests | ⏳ Not Started |
| **Exercise** | Exercise catalog, workout CRUD, session logging, PR tracking | Workout builder UI, exercise selector, PR display | Exercise seed, catalog management | Postgres: `exercises`, `workouts`, `workout_sections`, `workout_exercises`, `workout_sessions`, `exercise_sets`, `personal_records` | `/exercise/*` | `/api/exercise/*` → `/exercise/*` | Complex CRUD tests, PR calculation tests | ⏳ Not Started |
| **Programs** | Training program CRUD, week/workout scheduling | Program viewer UI, progress tracking | N/A | Postgres: `training_programs`, `program_weeks`, `program_workouts` | `/programs/*` | `/api/programs/*` → `/programs/*` | CRUD tests, schedule tests | ⏳ Not Started |
| **Books** | Book CRUD, reading session logging | Book list UI, reading timer | N/A | Postgres: `books`, `reading_sessions` | `/books/*` | `/api/books/*` → `/books/*` | CRUD tests | ⏳ Not Started |
| **Learn** | Topic/lesson serving, progress tracking, drill stats, flashcard SRS | Lesson viewer UI, drill interface, flashcard UI | Topic/lesson management | Postgres: `learn_topics`, `learn_lessons`, `learn_drills`, `user_lesson_progress`, `user_drill_stats`, `flashcard_decks`, `flashcards` | `/learn/*` | `/api/learn/*` → `/learn/*` | SRS algorithm tests, progress tests | ⏳ Not Started |
| **Market** | Item catalog, purchase logic, wallet deduction, redemption | Market browse UI, purchase flow, inventory | Item management, pricing | Postgres: `market_items`, `user_purchases`, `user_wallet`, `points_ledger` | `/market/*` | `/api/market/*` → `/market/*` | Purchase tests, balance tests | ⏳ Not Started |
| **Reference Tracks** | Track metadata CRUD, R2 upload, streaming (signed URLs), analysis caching | Track list UI, audio player, waveform | N/A | Postgres: `reference_tracks`, `track_analysis_cache`; R2: audio files | `/reference/*` | `/api/reference/*` → `/reference/*` | Upload E2E, stream tests, analysis tests | ⏳ Not Started |
| **Critical Listening Loop** | Analysis storage, annotations, comparison metadata | Analysis overlay UI, annotation tools, comparison UI | N/A | Postgres: `track_analysis_cache`, UNKNOWN (annotations); R2: audio | `/reference/tracks/:id/analysis` | New feature if extended | Annotation CRUD, comparison tests | ⏳ Not Started (UNKNOWN scope) |
| **Onboarding** | Flow state machine, step completion, settings injection | Onboarding modal UI, step rendering | Flow/step definition | Postgres: `user_onboarding_state`, `onboarding_flows`, `onboarding_steps`, `user_settings`, `user_interests` | `/onboarding/*` | `/api/onboarding/*` → `/onboarding/*` | Flow completion tests, state tests | ⏳ Not Started |
| **User Settings** | Settings CRUD, interest management, UI module config | Settings form UI | N/A | Postgres: `user_settings`, `user_interests`, `user_ui_modules` | `/user/settings` | Implicit via onboarding | Settings persistence tests | ⏳ Not Started |
| **User Data Export** | Full data export (JSON/ZIP), deletion | Export trigger UI, download | User data admin view | Postgres: All user tables; R2: export ZIP | `/user/export`, `/user/delete` | `/api/user/*` → `/user/*` | Export completeness tests, deletion cascade tests | ⏳ Not Started |
| **Feedback** | Feedback CRUD, status management | Feedback form UI | Feedback moderation | Postgres: `feedback` | `/feedback/*` | `/api/feedback/*` → `/feedback/*` | CRUD tests, moderation tests | ⏳ Not Started |
| **Infobase** | Entry CRUD, search/filter | Infobase viewer UI, editor | N/A | Postgres: `infobase_entries` | `/infobase/*` | `/api/infobase/*` → `/infobase/*` | CRUD tests | ⏳ Not Started |
| **Ideas** | Idea CRUD, status transitions | Ideas capture UI, list | N/A | Postgres: `ideas` | `/ideas/*` | `/api/ideas/*` → `/ideas/*` | CRUD tests | ⏳ Not Started |
| **Track Analysis** | Audio analysis processing/caching | Analysis display UI | N/A | Postgres: `track_analysis_cache` | `/analysis/*` | `/api/analysis/*` → `/analysis/*` | Cache tests | ⏳ Not Started |
| **Admin: Backup/Restore** | Full DB backup, restore logic | N/A | Backup/restore UI | Postgres: All tables | `/admin/backup`, `/admin/restore` | Same | Backup integrity tests | ⏳ Not Started |
| **Admin: User Management** | User list, deletion, cleanup | N/A | User list UI, actions | Postgres: All user tables | `/admin/users`, `/admin/cleanup-users` | Same | Admin access tests, deletion cascade tests | ⏳ Not Started |
| **Admin: Stats** | Aggregate queries | N/A | Dashboard UI | Postgres: Various (aggregates) | `/admin/stats` | Same | Query accuracy tests | ⏳ Not Started |
| **Admin: Content Management** | Content CRUD for system content | N/A | Content editor UI | Postgres: `ignition_packs`, `daw_shortcuts`, `glossary_terms`, `recipe_templates` | `/admin/content` | Same | CRUD tests | ⏳ Not Started |
| **Admin: Quest/Skill Defs** | Definition CRUD | N/A | Definition editor UI | Postgres: `universal_quests`, `skill_definitions` | `/admin/quests`, `/admin/skills` | Same | Definition tests | ⏳ Not Started |
| **Admin: Feedback Review** | Status updates | N/A | Moderation UI | Postgres: `feedback` | `/admin/feedback` | Same | Status transition tests | ⏳ Not Started |
| **Admin: DB Health** | Health check, cleanup | N/A | Health dashboard | Postgres: `db_metadata` | `/admin/db-health` | Same | Health query tests | ⏳ Not Started |
| **Audit Logging** | Event capture, query | N/A | Audit log viewer | Postgres: `admin_audit_log` (currently UNUSED) | N/A (implicit on all admin ops) | New implementation | Audit trail tests | ⏳ Not Started |

---

## Reference Track Critical Listening Loop (Special Feature)

### Overview

The "Reference Track Critical Listening" feature provides audio analysis, comparison, and annotation capabilities for music production training.

### Current Scope (from inventories)

| Component | Evidence | Status |
|-----------|----------|--------|
| Track upload/storage | `/api/reference/upload`, R2 | ✅ Mapped |
| Track streaming | `/api/reference/tracks/[id]/stream` | ✅ Mapped |
| Track analysis | `/api/reference/tracks/[id]/analysis` | ✅ Mapped |
| Track metadata CRUD | `/api/reference/tracks/[id]` | ✅ Mapped |
| `track_analysis_cache` table | d1_usage_inventory.md | ✅ Mapped |
| `reference_tracks` table | d1_usage_inventory.md | ✅ Mapped |

### UNKNOWN Scope

| Component | UNKNOWN | Files Needed |
|-----------|---------|--------------|
| Annotation storage | No `annotations` table found | Check if annotations are part of `track_analysis_cache.analysis_json` |
| Comparison feature | No dedicated comparison table | May be frontend-only or use analysis cache |
| Critical listening "loop" specifics | Feature spec not in inventories | Requires product spec or existing UI code |

### Ownership (Based on Known Scope)

| Responsibility | Owner |
|----------------|-------|
| Audio file storage | Backend (R2) |
| Audio streaming | Backend (signed URLs) |
| Analysis compute/cache | Backend |
| Track metadata CRUD | Backend |
| Audio player UI | Frontend |
| Waveform visualization | Frontend |
| Analysis overlay UI | Frontend |
| Annotation UI | Frontend |
| Comparison UI | Frontend |

---

## Data Object Summary

### Postgres Tables (from d1_usage_inventory.md)

| Domain | Tables |
|--------|--------|
| Auth | users, accounts, sessions, verification_tokens, authenticators |
| Settings | user_settings, user_interests, user_ui_modules |
| Onboarding | onboarding_flows, onboarding_steps, user_onboarding_state |
| Gamification | skill_definitions, user_skills, achievement_definitions, user_achievements, user_wallet, user_progress, points_ledger, user_streaks, activity_events |
| Market | market_items, user_purchases |
| Focus | focus_sessions, focus_pause_state |
| Quests | quests, universal_quests, user_quest_progress |
| Habits | habits, habit_logs |
| Goals | goals, goal_milestones |
| Exercise | exercises, workouts, workout_sections, workout_exercises, workout_sessions, exercise_sets, personal_records, training_programs, program_weeks, program_workouts |
| Books | books, reading_sessions |
| Learn | learn_topics, learn_lessons, learn_drills, user_lesson_progress, user_drill_stats, flashcard_decks, flashcards |
| Planning | calendar_events, daily_plans, plan_templates |
| Content | ignition_packs, daw_shortcuts, glossary_terms, recipe_templates, infobase_entries, ideas |
| Reference | reference_tracks, track_analysis_cache |
| System | feedback, notifications, admin_audit_log, access_requests, db_metadata |

### R2 Storage

| Category | Use Case |
|----------|----------|
| `audio/` | Reference tracks |
| `images/` | User avatars, content images |
| `exports/` | User data exports |
| `other/` | Documents, misc |

---

## API Surface Summary

### Backend Routes by Domain

| Domain | Route Prefix | Route Count | Status |
|--------|--------------|-------------|--------|
| Auth | `/auth/*` | 6 | ✅ 4 Done, 2 Not Started |
| Blobs | `/blobs/*` | 7 | ✅ Done |
| Gamification | `/gamification/*` | 2 | ⏳ Not Started |
| Focus | `/focus/*` | 5 | ⏳ Not Started |
| Habits | `/habits/*` | 1 | ⏳ Not Started |
| Goals | `/goals/*` | 1 | ⏳ Not Started |
| Quests | `/quests/*` | 1 | ⏳ Not Started |
| Calendar | `/calendar/*` | 1 | ⏳ Not Started |
| Daily Plan | `/daily-plan/*` | 1 | ⏳ Not Started |
| Exercise | `/exercise/*` | 2 | ⏳ Not Started |
| Programs | `/programs/*` | 1 | ⏳ Not Started |
| Books | `/books/*` | 1 | ⏳ Not Started |
| Learn | `/learn/*` | 3 | ⏳ Not Started |
| Market | `/market/*` | 4 | ⏳ Not Started |
| Reference | `/reference/*` | 6 | ⏳ Not Started |
| Onboarding | `/onboarding/*` | 5 | ⏳ Not Started |
| User | `/user/*` | 2 | ⏳ Not Started |
| Feedback | `/feedback/*` | 1 | ⏳ Not Started |
| Infobase | `/infobase/*` | 1 | ⏳ Not Started |
| Ideas | `/ideas/*` | 1 | ⏳ Not Started |
| Analysis | `/analysis/*` | 1 | ⏳ Not Started |
| Admin | `/admin/*` | 10 | ⏳ Not Started |
| **Total** | | **64** | 12 Done / 52 Not Started |

---

## Test Requirements Summary

### Backend Integration Tests

| Category | Tests |
|----------|-------|
| Auth | OAuth flow, session rotation, CSRF rejection, RBAC |
| Storage | Upload, download, delete, IDOR prevention, signed URLs |
| Gamification | XP award, level-up, achievement trigger |
| Focus | Session lifecycle, pause/resume, XP on complete |
| Market | Purchase, wallet deduction, redemption |
| Admin | Role gate, backup/restore |

### Frontend E2E (Playwright)

| Category | Tests |
|----------|-------|
| OAuth Login | Google + Azure complete flows |
| Session | Persistence across refresh |
| RBAC | Admin console access gate |
| Focus | Start → pause → complete flow |
| Storage | Upload → view → delete flow |
| Reference | Upload → play → analyze flow |

---

## References

- [api_endpoint_inventory.md](./api_endpoint_inventory.md) - Complete endpoint list
- [d1_usage_inventory.md](./d1_usage_inventory.md) - Database tables
- [r2_usage_inventory.md](./r2_usage_inventory.md) - Storage patterns
- [feature_parity_checklist.md](./feature_parity_checklist.md) - Implementation status
- [auth_inventory.md](./auth_inventory.md) - Auth implementation

