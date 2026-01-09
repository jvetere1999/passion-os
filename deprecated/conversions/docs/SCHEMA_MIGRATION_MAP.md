# Schema Migration Map: D1 (SQLite) to Postgres

**Generated:** January 6, 2026  
**Source:** `migrations/0100_master_reset.sql`

This document maps every D1 table to its Postgres equivalent, including type conversions and migration notes.

---

## Type Conversion Reference

| SQLite Type | Postgres Type | Conversion Notes |
|-------------|---------------|------------------|
| `TEXT PRIMARY KEY` | `UUID PRIMARY KEY DEFAULT gen_random_uuid()` | Parse existing UUIDs |
| `TEXT NOT NULL` | `TEXT NOT NULL` | Direct copy |
| `TEXT` (nullable) | `TEXT` | Direct copy |
| `INTEGER` (boolean 0/1) | `BOOLEAN` | `0 -> false`, `1 -> true` |
| `INTEGER` | `INTEGER` | Direct copy |
| `INTEGER` (auto) | `SERIAL` or `BIGSERIAL` | For numeric IDs |
| `REAL` | `DOUBLE PRECISION` | Direct copy |
| `TEXT` (datetime) | `TIMESTAMPTZ` | Parse ISO 8601 string |
| `TEXT` (JSON) | `JSONB` | Parse and validate |
| `datetime('now')` | `now()` | Function replacement |

---

## Table-by-Table Migration

### Section 1: Auth Tables

#### users

**D1 Schema:**
```sql
CREATE TABLE users (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL DEFAULT 'User',
    email TEXT NOT NULL UNIQUE,
    emailVerified INTEGER,
    image TEXT,
    role TEXT NOT NULL DEFAULT 'user',
    approved INTEGER NOT NULL DEFAULT 1,
    age_verified INTEGER NOT NULL DEFAULT 1,
    tos_accepted INTEGER NOT NULL DEFAULT 0,
    tos_accepted_at TEXT,
    tos_version TEXT,
    last_activity_at TEXT,
    created_at TEXT NOT NULL DEFAULT (datetime('now')),
    updated_at TEXT NOT NULL DEFAULT (datetime('now'))
);
```

**Postgres Schema:**
```sql
CREATE TABLE users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL DEFAULT 'User',
    email TEXT NOT NULL UNIQUE,
    email_verified TIMESTAMPTZ,
    image TEXT,
    role TEXT NOT NULL DEFAULT 'user',
    approved BOOLEAN NOT NULL DEFAULT true,
    age_verified BOOLEAN NOT NULL DEFAULT true,
    tos_accepted BOOLEAN NOT NULL DEFAULT false,
    tos_accepted_at TIMESTAMPTZ,
    tos_version TEXT,
    last_activity_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_users_role ON users(role);
```

**Migration Notes:**
- `emailVerified`: INTEGER (unix timestamp?) -> TIMESTAMPTZ
- `approved`, `age_verified`, `tos_accepted`: INTEGER -> BOOLEAN
- All TEXT datetime columns -> TIMESTAMPTZ

---

#### accounts

**D1 Schema:**
```sql
CREATE TABLE accounts (
    id TEXT PRIMARY KEY,
    userId TEXT NOT NULL,
    type TEXT NOT NULL,
    provider TEXT NOT NULL,
    providerAccountId TEXT NOT NULL,
    refresh_token TEXT,
    access_token TEXT,
    expires_at INTEGER,
    token_type TEXT,
    scope TEXT,
    id_token TEXT,
    session_state TEXT,
    FOREIGN KEY (userId) REFERENCES users(id) ON DELETE CASCADE
);
```

**Postgres Schema:**
```sql
CREATE TABLE accounts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    type TEXT NOT NULL,
    provider TEXT NOT NULL,
    provider_account_id TEXT NOT NULL,
    refresh_token TEXT,
    access_token TEXT,
    expires_at BIGINT,
    token_type TEXT,
    scope TEXT,
    id_token TEXT,
    session_state TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    
    UNIQUE(provider, provider_account_id)
);

CREATE INDEX idx_accounts_user ON accounts(user_id);
```

**Migration Notes:**
- Column name changes: `userId` -> `user_id`, `providerAccountId` -> `provider_account_id`
- Add `created_at` column
- Add unique constraint on (provider, provider_account_id)

---

#### sessions

**D1 Schema:**
```sql
CREATE TABLE sessions (
    id TEXT PRIMARY KEY,
    sessionToken TEXT NOT NULL UNIQUE,
    userId TEXT NOT NULL,
    expires TEXT NOT NULL,
    FOREIGN KEY (userId) REFERENCES users(id) ON DELETE CASCADE
);
```

**Postgres Schema:**
```sql
CREATE TABLE sessions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    token_hash BYTEA NOT NULL UNIQUE,  -- Store hash, not token
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    expires_at TIMESTAMPTZ NOT NULL,
    ip_address INET,
    user_agent TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    last_active_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    
    CONSTRAINT sessions_not_expired CHECK (expires_at > created_at)
);

CREATE INDEX idx_sessions_user ON sessions(user_id);
CREATE INDEX idx_sessions_expires ON sessions(expires_at);
```

**Migration Notes:**
- **BREAKING:** Change from storing raw token to token hash for security
- Add audit columns: `ip_address`, `user_agent`, `last_active_at`
- Rename: `sessionToken` -> `token_hash`, `expires` -> `expires_at`

---

### Section 2: User Settings & Personalization

#### user_settings

**D1 Schema:**
```sql
CREATE TABLE user_settings (
    id TEXT PRIMARY KEY,
    user_id TEXT NOT NULL UNIQUE,
    nudge_intensity TEXT DEFAULT 'standard',
    default_focus_duration INTEGER DEFAULT 300,
    gamification_visible TEXT DEFAULT 'always',
    planner_mode TEXT DEFAULT 'collapsed',
    theme TEXT DEFAULT 'system',
    notifications_enabled INTEGER DEFAULT 1,
    created_at TEXT NOT NULL DEFAULT (datetime('now')),
    updated_at TEXT NOT NULL DEFAULT (datetime('now')),
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);
```

**Postgres Schema:**
```sql
CREATE TYPE nudge_intensity AS ENUM ('gentle', 'standard', 'energetic');
CREATE TYPE gamification_visibility AS ENUM ('always', 'subtle', 'hidden');
CREATE TYPE theme_preference AS ENUM ('light', 'dark', 'system');
CREATE TYPE planner_mode AS ENUM ('collapsed', 'expanded');

CREATE TABLE user_settings (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL UNIQUE REFERENCES users(id) ON DELETE CASCADE,
    nudge_intensity nudge_intensity DEFAULT 'standard',
    default_focus_duration INTEGER DEFAULT 300,
    gamification_visible gamification_visibility DEFAULT 'always',
    planner_mode planner_mode DEFAULT 'collapsed',
    theme theme_preference DEFAULT 'system',
    notifications_enabled BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
```

**Migration Notes:**
- Convert TEXT enums to Postgres ENUM types
- `notifications_enabled`: INTEGER -> BOOLEAN

---

#### user_interests

**D1 Schema:**
```sql
CREATE TABLE user_interests (
    id TEXT PRIMARY KEY,
    user_id TEXT NOT NULL,
    interest_key TEXT NOT NULL,
    priority INTEGER NOT NULL DEFAULT 1,
    created_at TEXT NOT NULL DEFAULT (datetime('now')),
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    UNIQUE(user_id, interest_key)
);
```

**Postgres Schema:**
```sql
CREATE TABLE user_interests (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    interest_key TEXT NOT NULL,
    priority INTEGER NOT NULL DEFAULT 1,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    
    UNIQUE(user_id, interest_key)
);

CREATE INDEX idx_user_interests_user ON user_interests(user_id);
```

---

### Section 3: Gamification Tables

#### user_wallet

**D1 Schema:**
```sql
CREATE TABLE user_wallet (
    id TEXT PRIMARY KEY,
    user_id TEXT NOT NULL UNIQUE,
    coins INTEGER NOT NULL DEFAULT 0,
    xp INTEGER NOT NULL DEFAULT 0,
    level INTEGER NOT NULL DEFAULT 1,
    xp_to_next_level INTEGER NOT NULL DEFAULT 100,
    total_skill_stars INTEGER NOT NULL DEFAULT 0,
    updated_at TEXT NOT NULL DEFAULT (datetime('now')),
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);
```

**Postgres Schema:**
```sql
CREATE TABLE user_wallet (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL UNIQUE REFERENCES users(id) ON DELETE CASCADE,
    coins INTEGER NOT NULL DEFAULT 0 CHECK (coins >= 0),
    xp INTEGER NOT NULL DEFAULT 0 CHECK (xp >= 0),
    level INTEGER NOT NULL DEFAULT 1 CHECK (level >= 1),
    xp_to_next_level INTEGER NOT NULL DEFAULT 100,
    total_skill_stars INTEGER NOT NULL DEFAULT 0,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
```

**Migration Notes:**
- Add CHECK constraints for non-negative values
- Add `created_at` column

---

#### points_ledger

**D1 Schema:**
```sql
CREATE TABLE points_ledger (
    id TEXT PRIMARY KEY,
    user_id TEXT NOT NULL,
    event_type TEXT NOT NULL,
    event_id TEXT,
    coins INTEGER NOT NULL DEFAULT 0,
    xp INTEGER NOT NULL DEFAULT 0,
    skill_stars INTEGER NOT NULL DEFAULT 0,
    skill_key TEXT,
    reason TEXT,
    idempotency_key TEXT UNIQUE,
    created_at TEXT NOT NULL DEFAULT (datetime('now')),
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);
```

**Postgres Schema:**
```sql
CREATE TABLE points_ledger (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    event_type TEXT NOT NULL,
    event_id UUID,
    coins INTEGER NOT NULL DEFAULT 0,
    xp INTEGER NOT NULL DEFAULT 0,
    skill_stars INTEGER NOT NULL DEFAULT 0,
    skill_key TEXT,
    reason TEXT,
    idempotency_key TEXT UNIQUE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_points_ledger_user ON points_ledger(user_id);
CREATE INDEX idx_points_ledger_event ON points_ledger(event_type, event_id);
CREATE INDEX idx_points_ledger_created ON points_ledger(created_at);
```

---

#### activity_events

**D1 Schema:**
```sql
CREATE TABLE activity_events (
    id TEXT PRIMARY KEY,
    user_id TEXT NOT NULL,
    event_type TEXT NOT NULL,
    metadata_json TEXT,
    created_at TEXT NOT NULL DEFAULT (datetime('now')),
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);
```

**Postgres Schema:**
```sql
CREATE TABLE activity_events (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    event_type TEXT NOT NULL,
    metadata JSONB,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_activity_events_user ON activity_events(user_id);
CREATE INDEX idx_activity_events_type ON activity_events(event_type);
CREATE INDEX idx_activity_events_created ON activity_events(created_at);
CREATE INDEX idx_activity_events_metadata ON activity_events USING gin(metadata);
```

**Migration Notes:**
- `metadata_json` TEXT -> `metadata` JSONB
- Add GIN index for JSONB queries

---

### Section 4: Focus Tables

#### focus_sessions

**D1 Schema:**
```sql
CREATE TABLE focus_sessions (
    id TEXT PRIMARY KEY,
    user_id TEXT NOT NULL,
    mode TEXT NOT NULL DEFAULT 'focus',
    duration INTEGER NOT NULL,
    started_at TEXT NOT NULL,
    completed_at TEXT,
    abandoned_at TEXT,
    paused_at TEXT,
    paused_remaining INTEGER,
    expires_at TEXT,
    status TEXT NOT NULL DEFAULT 'active',
    xp_awarded INTEGER NOT NULL DEFAULT 0,
    coins_awarded INTEGER NOT NULL DEFAULT 0,
    created_at TEXT NOT NULL DEFAULT (datetime('now')),
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);
```

**Postgres Schema:**
```sql
CREATE TYPE focus_mode AS ENUM ('focus', 'break', 'long_break');
CREATE TYPE focus_status AS ENUM ('active', 'completed', 'abandoned', 'paused');

CREATE TABLE focus_sessions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    mode focus_mode NOT NULL DEFAULT 'focus',
    duration INTEGER NOT NULL CHECK (duration > 0),
    started_at TIMESTAMPTZ NOT NULL,
    completed_at TIMESTAMPTZ,
    abandoned_at TIMESTAMPTZ,
    paused_at TIMESTAMPTZ,
    paused_remaining INTEGER,
    expires_at TIMESTAMPTZ,
    status focus_status NOT NULL DEFAULT 'active',
    xp_awarded INTEGER NOT NULL DEFAULT 0,
    coins_awarded INTEGER NOT NULL DEFAULT 0,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_focus_sessions_user ON focus_sessions(user_id);
CREATE INDEX idx_focus_sessions_status ON focus_sessions(status);
CREATE INDEX idx_focus_sessions_started ON focus_sessions(started_at);
```

---

### Section 5: Quest Tables

#### quests

**D1 Schema:**
```sql
CREATE TABLE quests (
    id TEXT PRIMARY KEY,
    user_id TEXT,
    title TEXT NOT NULL,
    description TEXT,
    category TEXT NOT NULL,
    difficulty TEXT NOT NULL DEFAULT 'starter',
    xp_reward INTEGER NOT NULL DEFAULT 10,
    coin_reward INTEGER NOT NULL DEFAULT 5,
    is_universal INTEGER NOT NULL DEFAULT 0,
    is_active INTEGER NOT NULL DEFAULT 1,
    status TEXT NOT NULL DEFAULT 'available',
    accepted_at TEXT,
    completed_at TEXT,
    expires_at TEXT,
    is_repeatable INTEGER NOT NULL DEFAULT 0,
    repeat_frequency TEXT,
    last_completed_date TEXT,
    streak_count INTEGER NOT NULL DEFAULT 0,
    created_at TEXT NOT NULL DEFAULT (datetime('now')),
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);
```

**Postgres Schema:**
```sql
CREATE TYPE quest_difficulty AS ENUM ('starter', 'easy', 'medium', 'hard', 'epic');
CREATE TYPE quest_status AS ENUM ('available', 'accepted', 'in_progress', 'completed', 'expired');

CREATE TABLE quests (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    description TEXT,
    category TEXT NOT NULL,
    difficulty quest_difficulty NOT NULL DEFAULT 'starter',
    xp_reward INTEGER NOT NULL DEFAULT 10 CHECK (xp_reward >= 0),
    coin_reward INTEGER NOT NULL DEFAULT 5 CHECK (coin_reward >= 0),
    is_universal BOOLEAN NOT NULL DEFAULT false,
    is_active BOOLEAN NOT NULL DEFAULT true,
    status quest_status NOT NULL DEFAULT 'available',
    accepted_at TIMESTAMPTZ,
    completed_at TIMESTAMPTZ,
    expires_at TIMESTAMPTZ,
    is_repeatable BOOLEAN NOT NULL DEFAULT false,
    repeat_frequency TEXT,
    last_completed_date DATE,
    streak_count INTEGER NOT NULL DEFAULT 0,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_quests_user ON quests(user_id);
CREATE INDEX idx_quests_universal ON quests(is_universal) WHERE is_universal = true;
CREATE INDEX idx_quests_status ON quests(status);
```

---

### Section 6: Habit Tables

#### habits

**D1 Schema:**
```sql
CREATE TABLE habits (
    id TEXT PRIMARY KEY,
    user_id TEXT NOT NULL,
    name TEXT NOT NULL,
    description TEXT,
    frequency TEXT NOT NULL DEFAULT 'daily',
    target_count INTEGER NOT NULL DEFAULT 1,
    icon TEXT,
    color TEXT,
    is_active INTEGER NOT NULL DEFAULT 1,
    created_at TEXT NOT NULL DEFAULT (datetime('now')),
    updated_at TEXT NOT NULL DEFAULT (datetime('now')),
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);
```

**Postgres Schema:**
```sql
CREATE TYPE habit_frequency AS ENUM ('daily', 'weekly', 'monthly', 'custom');

CREATE TABLE habits (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    description TEXT,
    frequency habit_frequency NOT NULL DEFAULT 'daily',
    target_count INTEGER NOT NULL DEFAULT 1 CHECK (target_count >= 1),
    icon TEXT,
    color TEXT,
    is_active BOOLEAN NOT NULL DEFAULT true,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_habits_user ON habits(user_id);
CREATE INDEX idx_habits_active ON habits(user_id) WHERE is_active = true;
```

---

### Section 7: Calendar Tables

#### calendar_events

**D1 Schema:**
```sql
CREATE TABLE calendar_events (
    id TEXT PRIMARY KEY,
    user_id TEXT NOT NULL,
    title TEXT NOT NULL,
    description TEXT,
    event_type TEXT NOT NULL DEFAULT 'general',
    start_time TEXT NOT NULL,
    end_time TEXT,
    all_day INTEGER NOT NULL DEFAULT 0,
    location TEXT,
    workout_id TEXT,
    recurrence_rule TEXT,
    recurrence_end TEXT,
    parent_event_id TEXT,
    color TEXT,
    reminder_minutes INTEGER,
    metadata TEXT,
    created_at TEXT NOT NULL DEFAULT (datetime('now')),
    updated_at TEXT NOT NULL DEFAULT (datetime('now')),
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (workout_id) REFERENCES workouts(id) ON DELETE SET NULL
);
```

**Postgres Schema:**
```sql
CREATE TYPE calendar_event_type AS ENUM ('general', 'meeting', 'workout', 'reminder', 'focus', 'learning');

CREATE TABLE calendar_events (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    description TEXT,
    event_type calendar_event_type NOT NULL DEFAULT 'general',
    start_time TIMESTAMPTZ NOT NULL,
    end_time TIMESTAMPTZ,
    all_day BOOLEAN NOT NULL DEFAULT false,
    location TEXT,
    workout_id UUID REFERENCES workouts(id) ON DELETE SET NULL,
    recurrence_rule TEXT,  -- RFC 5545 RRULE
    recurrence_end TIMESTAMPTZ,
    parent_event_id UUID REFERENCES calendar_events(id) ON DELETE CASCADE,
    color TEXT,
    reminder_minutes INTEGER,
    metadata JSONB,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_calendar_user ON calendar_events(user_id);
CREATE INDEX idx_calendar_start ON calendar_events(start_time);
CREATE INDEX idx_calendar_range ON calendar_events(user_id, start_time, end_time);
```

---

### Section 8: Exercise Tables

#### exercises

**D1 Schema:**
```sql
CREATE TABLE exercises (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    description TEXT,
    category TEXT NOT NULL,
    muscle_groups TEXT,
    equipment TEXT,
    is_custom INTEGER NOT NULL DEFAULT 0,
    is_builtin INTEGER NOT NULL DEFAULT 0,
    user_id TEXT,
    created_at TEXT NOT NULL DEFAULT (datetime('now')),
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);
```

**Postgres Schema:**
```sql
CREATE TYPE exercise_category AS ENUM ('strength', 'cardio', 'flexibility', 'balance', 'plyometric', 'other');

CREATE TABLE exercises (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    description TEXT,
    category exercise_category NOT NULL,
    muscle_groups TEXT[],  -- Array of muscle groups
    equipment TEXT[],      -- Array of equipment
    is_custom BOOLEAN NOT NULL DEFAULT false,
    is_builtin BOOLEAN NOT NULL DEFAULT false,
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    instructions TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    
    CONSTRAINT exercises_ownership CHECK (
        (is_builtin = true AND user_id IS NULL) OR
        (is_custom = true AND user_id IS NOT NULL) OR
        (is_builtin = false AND is_custom = false)
    )
);

CREATE INDEX idx_exercises_category ON exercises(category);
CREATE INDEX idx_exercises_user ON exercises(user_id);
CREATE INDEX idx_exercises_builtin ON exercises(is_builtin) WHERE is_builtin = true;
```

**Migration Notes:**
- `muscle_groups` TEXT -> TEXT[] (parse JSON array)
- `equipment` TEXT -> TEXT[] (parse JSON array)
- Add CHECK constraint for ownership logic

---

### Section 9: Reference/Audio Tables

#### reference_tracks

**D1 Schema:**
```sql
CREATE TABLE reference_tracks (
    id TEXT PRIMARY KEY,
    user_id TEXT NOT NULL,
    title TEXT NOT NULL,
    artist TEXT,
    r2_key TEXT NOT NULL,
    mime_type TEXT NOT NULL,
    bytes INTEGER NOT NULL,
    sha256 TEXT,
    duration_seconds REAL,
    tags_json TEXT,
    visibility TEXT NOT NULL DEFAULT 'private',
    created_at TEXT NOT NULL DEFAULT (datetime('now')),
    updated_at TEXT NOT NULL DEFAULT (datetime('now')),
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);
```

**Postgres Schema:**
```sql
CREATE TYPE track_visibility AS ENUM ('private', 'shared', 'public');

CREATE TABLE reference_tracks (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    artist TEXT,
    r2_key TEXT NOT NULL,
    mime_type TEXT NOT NULL,
    bytes BIGINT NOT NULL CHECK (bytes > 0),
    sha256 BYTEA,
    duration_seconds DOUBLE PRECISION,
    tags TEXT[],
    visibility track_visibility NOT NULL DEFAULT 'private',
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_reference_tracks_user ON reference_tracks(user_id);
CREATE INDEX idx_reference_tracks_r2 ON reference_tracks(r2_key);
```

**Migration Notes:**
- `bytes` INTEGER -> BIGINT (for >2GB files)
- `sha256` TEXT -> BYTEA (decode hex)
- `tags_json` TEXT -> `tags` TEXT[]

---

### Section 10: Market Tables

#### market_items

**D1 Schema:**
```sql
CREATE TABLE market_items (
    id TEXT PRIMARY KEY,
    key TEXT NOT NULL UNIQUE,
    name TEXT NOT NULL,
    description TEXT,
    category TEXT NOT NULL,
    cost_coins INTEGER NOT NULL,
    icon TEXT,
    is_global INTEGER NOT NULL DEFAULT 1,
    is_available INTEGER NOT NULL DEFAULT 1,
    is_active INTEGER NOT NULL DEFAULT 1,
    is_consumable INTEGER NOT NULL DEFAULT 1,
    sort_order INTEGER NOT NULL DEFAULT 0,
    created_by_user_id TEXT,
    created_at TEXT NOT NULL DEFAULT (datetime('now')),
    FOREIGN KEY (created_by_user_id) REFERENCES users(id) ON DELETE SET NULL
);
```

**Postgres Schema:**
```sql
CREATE TYPE market_category AS ENUM ('themes', 'boosts', 'treats', 'badges', 'cosmetics');

CREATE TABLE market_items (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    key TEXT NOT NULL UNIQUE,
    name TEXT NOT NULL,
    description TEXT,
    category market_category NOT NULL,
    cost_coins INTEGER NOT NULL CHECK (cost_coins >= 0),
    icon TEXT,
    is_global BOOLEAN NOT NULL DEFAULT true,
    is_available BOOLEAN NOT NULL DEFAULT true,
    is_active BOOLEAN NOT NULL DEFAULT true,
    is_consumable BOOLEAN NOT NULL DEFAULT true,
    sort_order INTEGER NOT NULL DEFAULT 0,
    created_by_user_id UUID REFERENCES users(id) ON DELETE SET NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_market_items_category ON market_items(category);
CREATE INDEX idx_market_items_active ON market_items(is_active) WHERE is_active = true;
```

---

## Full Table Count

| Section | Tables | Notes |
|---------|--------|-------|
| Auth | 4 | users, accounts, sessions, verification_tokens |
| User Settings | 3 | user_settings, user_interests, user_ui_modules |
| Onboarding | 3 | onboarding_flows, onboarding_steps, user_onboarding_state |
| Gamification | 8 | skill_definitions, user_skills, achievement_definitions, user_achievements, user_wallet, points_ledger, user_streaks, activity_events |
| Market | 2 | market_items, user_purchases |
| Focus | 2 | focus_sessions, focus_pause_state |
| Quests | 3 | quests, universal_quests, user_quest_progress |
| Habits | 2 | habits, habit_logs |
| Goals | 2 | goals, goal_milestones |
| Exercise | 9 | exercises, workouts, workout_sections, workout_exercises, workout_sessions, exercise_sets, personal_records, training_programs, program_weeks, program_workouts |
| Books | 2 | books, reading_sessions |
| Learn | 7 | learn_topics, learn_lessons, learn_drills, user_lesson_progress, user_drill_stats, flashcard_decks, flashcards |
| Journal | 1 | journal_entries |
| Planning | 3 | calendar_events, daily_plans, plan_templates |
| Content | 5 | ignition_packs, daw_shortcuts, glossary_terms, recipe_templates, infobase_entries |
| Ideas | 1 | ideas |
| Reference | 2 | reference_tracks, track_analysis_cache |
| System | 5 | feedback, notifications, admin_audit_log, access_requests, db_metadata |

**Total: ~60 tables**

---

## Problematic Conversions

### 1. UUID Primary Keys

**Issue:** D1 uses TEXT primary keys with app-generated UUIDs.

**Solution:** 
```sql
-- Validate existing IDs are valid UUIDs
SELECT id FROM users WHERE id !~ '^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$';

-- If any invalid, generate new UUIDs and update FKs
```

### 2. Boolean Columns

**Issue:** D1 uses INTEGER (0/1), Postgres has native BOOLEAN.

**Solution:**
```sql
-- Transform during COPY
CASE WHEN is_active = 1 THEN true ELSE false END
```

### 3. Datetime Columns

**Issue:** D1 stores as TEXT in ISO 8601 format, Postgres uses TIMESTAMPTZ.

**Solution:**
```sql
-- Parse during import
TO_TIMESTAMP(created_at, 'YYYY-MM-DD"T"HH24:MI:SS.MS"Z"')
```

### 4. JSON Columns

**Issue:** D1 stores as TEXT, Postgres uses JSONB for validation and indexing.

**Solution:**
```sql
-- Validate JSON before import
SELECT id, metadata_json FROM table WHERE NOT is_valid_json(metadata_json);

-- Cast during import
metadata_json::jsonb
```

### 5. Array Columns

**Issue:** D1 stores arrays as JSON TEXT (e.g., `["a","b"]`).

**Solution:**
```sql
-- Convert JSON array to Postgres array
SELECT (SELECT array_agg(elem) FROM json_array_elements_text(tags_json::json) elem)
```

---

## Data Verification Queries

### Row Count Comparison

```sql
-- Run on both D1 (via SQLite) and Postgres
SELECT 'users' as table_name, COUNT(*) as row_count FROM users
UNION ALL
SELECT 'accounts', COUNT(*) FROM accounts
UNION ALL
SELECT 'sessions', COUNT(*) FROM sessions
-- ... for all tables
ORDER BY table_name;
```

### Foreign Key Integrity

```sql
-- Find orphaned records
SELECT a.id FROM accounts a
LEFT JOIN users u ON a.user_id = u.id
WHERE u.id IS NULL;

-- Repeat for all FK relationships
```

### Data Consistency

```sql
-- Check wallet totals match ledger
SELECT 
    w.user_id,
    w.coins as wallet_coins,
    COALESCE(SUM(l.coins), 0) as ledger_coins,
    w.xp as wallet_xp,
    COALESCE(SUM(l.xp), 0) as ledger_xp
FROM user_wallet w
LEFT JOIN points_ledger l ON w.user_id = l.user_id
GROUP BY w.user_id, w.coins, w.xp
HAVING w.coins != COALESCE(SUM(l.coins), 0) 
    OR w.xp != COALESCE(SUM(l.xp), 0);
```

---

*End of Schema Migration Map*

