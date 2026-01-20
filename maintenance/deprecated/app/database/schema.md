# Database Schema Documentation

**Updated:** January 10, 2026  
**Schema Version:** 14  
**Database:** PostgreSQL 17+ (Neon)  
**Tables:** 75 total

---

## Migration Overview

| Migration | Domain | Tables |
|-----------|--------|--------|
| `0001_auth.sql` | Auth | users, accounts, sessions, oauth_states |
| `0002_rbac.sql` | RBAC | roles, entitlements, role_entitlements, user_roles, audit_log |
| `0003_gamification.sql` | Gamification | user_progress, user_wallet, points_ledger, skill_definitions, user_skills, user_achievements, achievement_definitions, streaks |
| `0004_focus.sql` | Focus | focus_sessions, focus_pause_state, focus_stats, focus_music_libraries, focus_library_tracks |
| `0005_habits_goals.sql` | Habits & Goals | habits, habit_completions, goals, goal_milestones |
| `0006_quests.sql` | Quests | universal_quests, user_quests |
| `0007_planning.sql` | Planning | daily_plans, daily_plan_items, calendar_events, tasks |
| `0008_market.sql` | Market | market_items, user_purchases, user_inventory |
| `0009_books.sql` | Books | books, user_books, reading_sessions, book_notes |
| `0010_fitness.sql` | Fitness | exercises, workouts, workout_exercises, workout_sessions, training_programs, program_workouts |
| `0011_learn.sql` | Learn | learn_categories, learn_topics, learn_lessons, learn_drills, user_lesson_progress, user_drill_stats |
| `0012_reference.sql` | Reference | reference_tracks, track_analyses, track_annotations, track_regions, analysis_frame_manifests, analysis_frame_data, analysis_events, listening_prompt_templates, listening_prompt_presets |
| `0013_platform.sql` | Platform | inbox_items, feedback, activity_events, ideas, infobase_entries, user_settings, onboarding_steps, user_onboarding_state, user_onboarding_responses, user_interests, user_references |
| `0014_seeds.sql` | Seeds | Initial data for skills, achievements, market items, onboarding |

---

## 0001_auth - Authentication

### `users`
Core user identity.

| Column | Type | Nullable | Default | Description |
|--------|------|----------|---------|-------------|
| `id` | UUID | NO | gen_random_uuid() | Primary key |
| `name` | TEXT | YES | - | Display name |
| `email` | TEXT | NO | - | Unique email address |
| `email_verified` | TIMESTAMPTZ | YES | - | When email was verified |
| `image` | TEXT | YES | - | Profile image URL |
| `role` | TEXT | NO | 'user' | user/admin/moderator |
| `approved` | BOOLEAN | NO | false | Account approved |
| `age_verified` | BOOLEAN | NO | false | Age verified |
| `tos_accepted` | BOOLEAN | NO | false | TOS accepted |
| `tos_accepted_at` | TIMESTAMPTZ | YES | - | When TOS accepted |
| `tos_version` | TEXT | YES | - | TOS version |
| `last_activity_at` | TIMESTAMPTZ | YES | - | Last activity |
| `created_at` | TIMESTAMPTZ | NO | NOW() | Created |
| `updated_at` | TIMESTAMPTZ | NO | NOW() | Updated |

### `accounts`
OAuth provider links.

| Column | Type | Nullable | Default |
|--------|------|----------|---------|
| `id` | UUID | NO | gen_random_uuid() |
| `user_id` | UUID | NO | FK users |
| `type` | TEXT | NO | - |
| `provider` | TEXT | NO | - |
| `provider_account_id` | TEXT | NO | - |
| `refresh_token` | TEXT | YES | - |
| `access_token` | TEXT | YES | - |
| `expires_at` | BIGINT | YES | - |
| `token_type` | TEXT | YES | - |
| `scope` | TEXT | YES | - |
| `id_token` | TEXT | YES | - |
| `session_state` | TEXT | YES | - |
| `created_at` | TIMESTAMPTZ | NO | NOW() |
| `updated_at` | TIMESTAMPTZ | NO | NOW() |

### `sessions`
Active user sessions.

| Column | Type | Nullable | Default |
|--------|------|----------|---------|
| `id` | UUID | NO | gen_random_uuid() |
| `user_id` | UUID | NO | FK users |
| `token` | TEXT | NO | Unique |
| `expires_at` | TIMESTAMPTZ | NO | - |
| `created_at` | TIMESTAMPTZ | NO | NOW() |
| `last_activity_at` | TIMESTAMPTZ | YES | NOW() |
| `user_agent` | TEXT | YES | - |
| `ip_address` | TEXT | YES | - |
| `rotated_from` | UUID | YES | - |

### `oauth_states`
CSRF protection for OAuth flows.

| Column | Type | Nullable | Default |
|--------|------|----------|---------|
| `state_key` | TEXT | NO | Primary key |
| `pkce_verifier` | TEXT | NO | - |
| `redirect_uri` | TEXT | YES | - |
| `created_at` | TIMESTAMPTZ | NO | NOW() |
| `expires_at` | TIMESTAMPTZ | NO | - |

---

## 0002_rbac - Role-Based Access Control

### `roles`
| Column | Type | Nullable | Default |
|--------|------|----------|---------|
| `id` | UUID | NO | gen_random_uuid() |
| `name` | TEXT | NO | Unique |
| `description` | TEXT | YES | - |
| `parent_role_id` | UUID | YES | FK roles |
| `created_at` | TIMESTAMPTZ | NO | NOW() |

### `entitlements`
| Column | Type | Nullable | Default |
|--------|------|----------|---------|
| `id` | UUID | NO | gen_random_uuid() |
| `name` | TEXT | NO | Unique |
| `description` | TEXT | YES | - |
| `resource` | TEXT | NO | - |
| `action` | TEXT | NO | - |
| `created_at` | TIMESTAMPTZ | NO | NOW() |

### `role_entitlements`
Junction: roles → entitlements. PK: (role_id, entitlement_id)

### `user_roles`
Junction: users → roles. PK: (user_id, role_id). Has `granted_by`, `granted_at`, `expires_at`.

### `audit_log`
Security audit events with user_id, event_type, resource_type, resource_id, action, status, details (JSONB), ip_address, user_agent, request_id.

---

## 0003_gamification - XP, Coins, Skills

### `user_progress`
| Column | Type | Default |
|--------|------|---------|
| `user_id` | UUID | PK, FK users |
| `level` | INTEGER | 1 |
| `total_xp` | INTEGER | 0 |
| `current_level_xp` | INTEGER | 0 |
| `xp_to_next_level` | INTEGER | 100 |

### `user_wallet`
| Column | Type | Default |
|--------|------|---------|
| `user_id` | UUID | PK, FK users |
| `coins` | INTEGER | 0 |
| `total_earned` | INTEGER | 0 |
| `total_spent` | INTEGER | 0 |

### `points_ledger`
Tracks all XP/coin transactions: user_id, amount, source_type, source_id, balance_after, metadata (JSONB).

### `skill_definitions`
Skill catalog: id, key (unique), name, description, category, icon, color, max_stars, is_active, sort_order.

### `user_skills`
User skill progress: user_id, skill_key, current_stars, total_stars, progress_percent.

### `achievement_definitions`
Achievement catalog: id, key, name, description, category, icon, xp_reward, coin_reward, criteria (JSONB), is_secret, is_active.

### `user_achievements`
User achievement unlocks: user_id, achievement_key, progress, is_complete, completed_at.

### `streaks`
Activity streaks: user_id, streak_type, current_count, longest_count, last_activity_date.

---

## 0004_focus - Focus Sessions

### `focus_sessions`
| Column | Type | Nullable | Default |
|--------|------|----------|---------|
| `id` | UUID | NO | gen_random_uuid() |
| `user_id` | UUID | NO | FK users |
| `mode` | TEXT | NO | - |
| `duration_seconds` | INTEGER | NO | - |
| `started_at` | TIMESTAMPTZ | NO | NOW() |
| `completed_at` | TIMESTAMPTZ | YES | - |
| `abandoned_at` | TIMESTAMPTZ | YES | - |
| `expires_at` | TIMESTAMPTZ | YES | - |
| `status` | TEXT | NO | 'active' |
| `xp_awarded` | INTEGER | NO | 0 |
| `coins_awarded` | INTEGER | NO | 0 |
| `task_id` | UUID | YES | - |
| `task_title` | TEXT | YES | - |

### `focus_pause_state`
| Column | Type | Default |
|--------|------|---------|
| `id` | UUID | gen_random_uuid() |
| `user_id` | UUID | FK users |
| `session_id` | UUID | FK focus_sessions |
| `is_paused` | BOOLEAN | false |
| `time_remaining_seconds` | INTEGER | nullable |
| `paused_at` | TIMESTAMPTZ | nullable |
| `resumed_at` | TIMESTAMPTZ | nullable |

Unique on session_id.

### `focus_stats`
Aggregated stats: user_id (PK), total_sessions, total_focus_time_seconds, sessions_completed, sessions_abandoned, current_streak, longest_streak, total_xp_earned, total_coins_earned, last_session_at.

### `focus_music_libraries` / `focus_library_tracks`
User music preferences for focus.

---

## 0005_habits_goals

### `habits`
| Column | Type | Default |
|--------|------|---------|
| `id` | UUID | gen_random_uuid() |
| `user_id` | UUID | FK users |
| `name` | TEXT | required |
| `description` | TEXT | nullable |
| `frequency` | TEXT | 'daily' |
| `custom_days` | INTEGER[] | nullable |
| `target_count` | INTEGER | 1 |
| `current_streak` | INTEGER | 0 |
| `longest_streak` | INTEGER | 0 |
| `is_active` | BOOLEAN | true |
| `skill_key` | TEXT | nullable |

### `habit_completions`
| Column | Type |
|--------|------|
| `id` | UUID |
| `habit_id` | UUID FK habits |
| `user_id` | UUID FK users |
| `completed_at` | TIMESTAMPTZ |
| `count` | INTEGER default 1 |
| `notes` | TEXT nullable |

### `goals`
| Column | Type | Default |
|--------|------|---------|
| `id` | UUID | gen_random_uuid() |
| `user_id` | UUID | FK users |
| `title` | TEXT | required |
| `description` | TEXT | nullable |
| `category` | TEXT | nullable |
| `target_date` | DATE | nullable |
| `status` | TEXT | 'active' |
| `progress` | INTEGER | 0 |
| `target_value` | INTEGER | 100 |
| `skill_key` | TEXT | nullable |

### `goal_milestones`
Milestones for goals with target_value, is_complete, completed_at.

---

## 0006_quests

### `universal_quests`
System-defined quests.

| Column | Type | Default |
|--------|------|---------|
| `id` | UUID | gen_random_uuid() |
| `key` | TEXT | Unique |
| `name` | TEXT | required |
| `description` | TEXT | nullable |
| `quest_type` | TEXT | required |
| `category` | TEXT | nullable |
| `requirements` | JSONB | nullable |
| `xp_reward` | INTEGER | 0 |
| `coin_reward` | INTEGER | 0 |
| `skill_key` | TEXT | nullable |
| `skill_star_reward` | INTEGER | 0 |
| `is_recurring` | BOOLEAN | false |
| `recurrence_period` | TEXT | nullable |
| `is_active` | BOOLEAN | true |
| `sort_order` | INTEGER | 0 |

### `user_quests`
User quest progress.

| Column | Type | Default |
|--------|------|---------|
| `id` | UUID | gen_random_uuid() |
| `user_id` | UUID | FK users |
| `quest_id` | UUID | FK universal_quests |
| `status` | TEXT | 'in_progress' |
| `progress` | INTEGER | 0 |
| `target` | INTEGER | 1 |
| `accepted_at` | TIMESTAMPTZ | NOW() |
| `completed_at` | TIMESTAMPTZ | nullable |
| `claimed_at` | TIMESTAMPTZ | nullable |

---

## 0007_planning

### `daily_plans`
| Column | Type |
|--------|------|
| `id` | UUID |
| `user_id` | UUID FK users |
| `date` | DATE |
| `status` | TEXT default 'draft' |
| `notes` | TEXT nullable |
| `reflection` | TEXT nullable |

Unique on (user_id, date).

### `daily_plan_items`
Items in daily plans: plan_id, item_type, reference_id, title, duration_minutes, priority, sort_order, is_completed, completed_at.

### `calendar_events`
| Column | Type |
|--------|------|
| `id` | UUID |
| `user_id` | UUID |
| `title` | TEXT |
| `description` | TEXT |
| `start_time` | TIMESTAMPTZ |
| `end_time` | TIMESTAMPTZ |
| `is_all_day` | BOOLEAN |
| `recurrence_rule` | TEXT |
| `category` | TEXT |
| `color` | TEXT |

### `tasks`
| Column | Type |
|--------|------|
| `id` | UUID |
| `user_id` | UUID |
| `title` | TEXT |
| `description` | TEXT |
| `status` | TEXT default 'pending' |
| `priority` | TEXT |
| `due_date` | TIMESTAMPTZ |
| `completed_at` | TIMESTAMPTZ |
| `parent_task_id` | UUID nullable |
| `tags` | TEXT[] |

---

## 0008_market

### `market_items`
| Column | Type | Default |
|--------|------|---------|
| `id` | UUID | gen_random_uuid() |
| `key` | TEXT | Unique |
| `name` | TEXT | required |
| `description` | TEXT | nullable |
| `category` | TEXT | required |
| `item_type` | TEXT | required |
| `cost_coins` | INTEGER | 0 |
| `rarity` | TEXT | 'common' |
| `icon_url` | TEXT | nullable |
| `effect_config` | JSONB | nullable |
| `is_consumable` | BOOLEAN | false |
| `uses_per_purchase` | INTEGER | 1 |
| `max_per_user` | INTEGER | nullable |
| `required_level` | INTEGER | 1 |
| `is_available` | BOOLEAN | true |
| `available_from` | TIMESTAMPTZ | nullable |
| `available_until` | TIMESTAMPTZ | nullable |
| `sort_order` | INTEGER | 0 |

### `user_purchases`
Purchase history: user_id, item_id, purchased_at, coins_spent, status.

### `user_inventory`
Current inventory: user_id, item_id, quantity, uses_remaining, acquired_at, last_used_at.

---

## 0009_books

### `books`
| Column | Type |
|--------|------|
| `id` | UUID |
| `user_id` | UUID FK users |
| `title` | TEXT required |
| `author` | TEXT nullable |
| `isbn` | TEXT nullable |
| `genre` | TEXT nullable |
| `cover_url` | TEXT nullable |
| `total_pages` | INTEGER nullable |
| `current_page` | INTEGER default 0 |
| `status` | TEXT default 'to_read' |
| `rating` | INTEGER nullable |
| `started_at` | TIMESTAMPTZ |
| `finished_at` | TIMESTAMPTZ |
| `notes` | TEXT |

### `user_books`
User-book relationship with additional metadata.

### `reading_sessions`
Reading session tracking: book_id, user_id, started_at, ended_at, pages_read, duration_minutes.

### `book_notes`
Notes on books: book_id, user_id, page_number, content, note_type.

---

## 0010_fitness

### `exercises`
| Column | Type | Default |
|--------|------|---------|
| `id` | UUID | gen_random_uuid() |
| `key` | TEXT | Unique |
| `name` | TEXT | required |
| `description` | TEXT | nullable |
| `category` | TEXT | required |
| `muscle_groups` | TEXT[] | nullable |
| `equipment` | TEXT[] | nullable |
| `difficulty` | TEXT | 'intermediate' |
| `instructions` | TEXT | nullable |
| `tips` | TEXT | nullable |
| `video_url` | TEXT | nullable |
| `is_compound` | BOOLEAN | false |
| `is_custom` | BOOLEAN | false |
| `is_builtin` | BOOLEAN | true |
| `user_id` | UUID | nullable |

### `workouts`
| Column | Type |
|--------|------|
| `id` | UUID |
| `user_id` | UUID |
| `name` | TEXT |
| `description` | TEXT |
| `difficulty` | TEXT |
| `category` | TEXT |
| `estimated_duration` | INTEGER |
| `is_public` | BOOLEAN default false |
| `is_template` | BOOLEAN default false |

### `workout_exercises`
Junction: workout → exercises with sets, reps (INTEGER), weight (REAL), duration, rest_seconds, sort_order.

### `workout_sessions`
| Column | Type |
|--------|------|
| `id` | UUID |
| `user_id` | UUID |
| `workout_id` | UUID |
| `started_at` | TIMESTAMPTZ |
| `completed_at` | TIMESTAMPTZ |
| `duration_seconds` | INTEGER |
| `status` | TEXT |
| `notes` | TEXT |

### `training_programs`
Multi-week programs: name, description, duration_weeks, current_week, status.

### `program_workouts`
Workouts scheduled in programs: program_id, workout_id, week, day, sort_order.

---

## 0011_learn

### `learn_categories` / `learn_topics` / `learn_lessons` / `learn_drills`
Hierarchical learning content with user progress tracking.

### `user_lesson_progress`
User progress on lessons: user_id, lesson_id, status, progress_percent, started_at, completed_at, time_spent_seconds.

### `user_drill_stats`
Drill performance: user_id, drill_id, attempts, best_score, average_score, last_attempt_at.

---

## 0012_reference - Reference Tracks & Analysis

### `reference_tracks`
| Column | Type |
|--------|------|
| `id` | UUID |
| `user_id` | UUID |
| `title` | TEXT |
| `artist` | TEXT |
| `album` | TEXT |
| `genre` | TEXT |
| `bpm` | REAL |
| `key` | TEXT |
| `duration_seconds` | REAL |
| `r2_key` | TEXT required |
| `waveform_r2_key` | TEXT |
| `thumbnail_r2_key` | TEXT |
| `file_format` | TEXT |
| `sample_rate` | INTEGER |
| `bit_depth` | INTEGER |
| `channels` | INTEGER |
| `is_reference` | BOOLEAN default true |
| `is_user_upload` | BOOLEAN default false |
| `source` | TEXT |
| `source_url` | TEXT |
| `metadata` | JSONB |

### `track_analyses`
Analysis jobs: track_id, analysis_type, status, parameters (JSONB), results (JSONB), error_message, started_at, completed_at.

### `track_annotations`
User annotations: track_id, user_id, start_time_seconds, end_time_seconds, annotation_type, title, content, color, tags.

### `track_regions`
Loop/section regions: track_id, user_id, name, start_time_seconds, end_time_seconds, region_type, loop_count, is_favorite, color.

### `analysis_frame_manifests` / `analysis_frame_data` / `analysis_events`
Frame-level audio analysis storage.

### `listening_prompt_templates` / `listening_prompt_presets`
Guided listening templates and user presets.

---

## 0013_platform - Platform Features

### `inbox_items`
User notifications.

| Column | Type |
|--------|------|
| `id` | UUID |
| `user_id` | UUID |
| `notification_type` | TEXT |
| `title` | TEXT |
| `message` | TEXT |
| `action_url` | TEXT |
| `action_data` | JSONB |
| `priority` | TEXT default 'normal' |
| `is_read` | BOOLEAN default false |
| `read_at` | TIMESTAMPTZ |
| `expires_at` | TIMESTAMPTZ |

### `feedback`
User feedback: user_id, feedback_type, category, title, content, rating, page_url, user_agent, metadata (JSONB), status, response, responded_at.

### `activity_events`
Activity tracking: user_id, event_type, category, metadata (JSONB), xp_earned, coins_earned.

### `ideas`
User ideas: user_id, title, description, category, tags (TEXT[]), status, priority, is_pinned, is_archived, related_track_id.

### `infobase_entries`
Knowledge base: user_id, entry_type, title, content_markdown, summary, tags (TEXT[]), source_url, source_type, is_favorite, is_archived.

### `user_settings`
| Column | Type | Default |
|--------|------|---------|
| `user_id` | UUID | PK |
| `theme` | TEXT | 'dark' |
| `language` | TEXT | 'en' |
| `timezone` | TEXT | 'UTC' |
| `notifications_enabled` | BOOLEAN | true |
| `email_notifications` | JSONB | nullable |
| `push_notifications` | JSONB | nullable |
| `privacy_settings` | JSONB | nullable |
| `display_settings` | JSONB | nullable |
| `focus_settings` | JSONB | nullable |
| `workout_settings` | JSONB | nullable |
| `sync_settings` | JSONB | nullable |

### `onboarding_steps` / `user_onboarding_state` / `user_onboarding_responses`
Onboarding flow configuration and user progress.

### `user_interests`
User interests: user_id, interest_type, interest_key, interest_value, score, source.

### `user_references`
User reference library: user_id, track_id, collection_name, notes, tags, is_favorite, sort_order.

---

## Known Model Mismatches (To Fix)

The following backend models need updates to match the schema:

### Critical
- `focus_models.rs`: FocusSession has paused_at/paused_remaining_seconds not in table
- `focus_models.rs`: FocusPauseState missing is_paused, resumed_at; has mode not in table
- `quests_models.rs`: UniversalQuest uses title instead of name
- `habits_goals_models.rs`: custom_days should be Vec<i32> not String
- `reference_models.rs`: ReferenceTrack has different columns (name vs title, key_signature vs key)
- `platform_models.rs`: UserSettings, Feedback, Ideas all have structural mismatches

### Minor (Type Width)
- `gamification_models.rs`: UserProgress.total_xp is i64, should be i32
- `gamification_models.rs`: UserWallet coins/totals are i64, should be i32

---

## Cleanup Functions

```sql
-- Remove expired sessions
SELECT cleanup_expired_sessions();

-- Remove expired OAuth states  
SELECT cleanup_expired_oauth_states();
```

---

## Indexes

All foreign key columns are indexed. Additional indexes on:
- users.email (unique)
- sessions.token (unique)
- sessions.expires_at (cleanup queries)
- All `*_key` columns (unique lookups)
- All `user_id` columns (user data queries)
- Timestamp columns for temporal queries
