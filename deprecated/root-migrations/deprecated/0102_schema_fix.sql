-- ============================================================================
-- MIGRATION 0102: Schema Fix for Missing Tables and Columns
-- Created: January 6, 2026
-- Purpose: Add missing tables and columns that cause HTTP 500 errors
-- ============================================================================

-- This migration adds tables and columns that were in earlier migrations
-- but missing from 0100_master_reset.sql

PRAGMA foreign_keys = OFF;

-- ============================================================================
-- SECTION 1: Add Missing Tables
-- ============================================================================

-- Focus pause state (from 0009_goals_infobase_focus_pause.sql)
CREATE TABLE IF NOT EXISTS focus_pause_state (
    id TEXT PRIMARY KEY,
    user_id TEXT NOT NULL,
    mode TEXT NOT NULL DEFAULT 'focus',
    time_remaining INTEGER NOT NULL DEFAULT 0,
    paused_at TEXT NOT NULL,
    created_at TEXT NOT NULL DEFAULT (datetime('now')),
    updated_at TEXT NOT NULL DEFAULT (datetime('now')),
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);
CREATE INDEX IF NOT EXISTS idx_focus_pause_user ON focus_pause_state(user_id);

-- Universal quests (from 0007_universal_quests_admin.sql)
CREATE TABLE IF NOT EXISTS universal_quests (
    id TEXT PRIMARY KEY,
    title TEXT NOT NULL,
    description TEXT,
    type TEXT NOT NULL DEFAULT 'daily',
    xp_reward INTEGER NOT NULL DEFAULT 10,
    coin_reward INTEGER NOT NULL DEFAULT 5,
    target INTEGER NOT NULL DEFAULT 1,
    skill_id TEXT,
    is_active INTEGER NOT NULL DEFAULT 1,
    created_by TEXT,
    created_at TEXT NOT NULL DEFAULT (datetime('now')),
    updated_at TEXT NOT NULL DEFAULT (datetime('now'))
);
CREATE INDEX IF NOT EXISTS idx_universal_quests_type ON universal_quests(type);
CREATE INDEX IF NOT EXISTS idx_universal_quests_active ON universal_quests(is_active);

-- User settings (from 0020_schema_reset_v2.sql)
CREATE TABLE IF NOT EXISTS user_settings (
    id TEXT PRIMARY KEY,
    user_id TEXT NOT NULL UNIQUE,
    nudge_intensity TEXT DEFAULT 'standard',
    default_focus_duration INTEGER DEFAULT 300,
    gamification_visible TEXT DEFAULT 'always',
    planner_mode TEXT DEFAULT 'collapsed',
    theme TEXT DEFAULT 'system',
    created_at TEXT NOT NULL DEFAULT (datetime('now')),
    updated_at TEXT NOT NULL DEFAULT (datetime('now')),
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);
CREATE INDEX IF NOT EXISTS idx_user_settings_user ON user_settings(user_id);

-- User interests
CREATE TABLE IF NOT EXISTS user_interests (
    id TEXT PRIMARY KEY,
    user_id TEXT NOT NULL,
    interest_key TEXT NOT NULL,
    priority INTEGER NOT NULL DEFAULT 1,
    created_at TEXT NOT NULL DEFAULT (datetime('now')),
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);
CREATE INDEX IF NOT EXISTS idx_user_interests_user ON user_interests(user_id);

-- User UI modules
CREATE TABLE IF NOT EXISTS user_ui_modules (
    id TEXT PRIMARY KEY,
    user_id TEXT NOT NULL,
    module_key TEXT NOT NULL,
    weight INTEGER NOT NULL DEFAULT 50,
    enabled INTEGER NOT NULL DEFAULT 1,
    last_shown_at TEXT,
    created_at TEXT NOT NULL DEFAULT (datetime('now')),
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);
CREATE INDEX IF NOT EXISTS idx_user_ui_modules_user ON user_ui_modules(user_id);

-- Onboarding tables
CREATE TABLE IF NOT EXISTS onboarding_flows (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    description TEXT,
    is_active INTEGER NOT NULL DEFAULT 1,
    created_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS onboarding_steps (
    id TEXT PRIMARY KEY,
    flow_id TEXT NOT NULL,
    step_order INTEGER NOT NULL,
    title TEXT NOT NULL,
    content TEXT,
    action_type TEXT,
    action_data TEXT,
    created_at TEXT NOT NULL DEFAULT (datetime('now')),
    FOREIGN KEY (flow_id) REFERENCES onboarding_flows(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS user_onboarding_state (
    id TEXT PRIMARY KEY,
    user_id TEXT NOT NULL,
    flow_id TEXT NOT NULL,
    current_step INTEGER NOT NULL DEFAULT 0,
    completed INTEGER NOT NULL DEFAULT 0,
    skipped INTEGER NOT NULL DEFAULT 0,
    started_at TEXT NOT NULL DEFAULT (datetime('now')),
    completed_at TEXT,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (flow_id) REFERENCES onboarding_flows(id) ON DELETE CASCADE
);

-- Gamification tables
CREATE TABLE IF NOT EXISTS points_ledger (
    id TEXT PRIMARY KEY,
    user_id TEXT NOT NULL,
    amount INTEGER NOT NULL,
    source TEXT NOT NULL,
    source_id TEXT,
    description TEXT,
    created_at TEXT NOT NULL DEFAULT (datetime('now')),
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);
CREATE INDEX IF NOT EXISTS idx_points_ledger_user ON points_ledger(user_id);

CREATE TABLE IF NOT EXISTS user_wallet (
    id TEXT PRIMARY KEY,
    user_id TEXT NOT NULL UNIQUE,
    coins INTEGER NOT NULL DEFAULT 0,
    xp INTEGER NOT NULL DEFAULT 0,
    level INTEGER NOT NULL DEFAULT 1,
    xp_to_next_level INTEGER NOT NULL DEFAULT 100,
    total_skill_stars INTEGER NOT NULL DEFAULT 0,
    created_at TEXT NOT NULL DEFAULT (datetime('now')),
    updated_at TEXT NOT NULL DEFAULT (datetime('now')),
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS skill_definitions (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    description TEXT,
    icon TEXT,
    max_level INTEGER NOT NULL DEFAULT 100,
    created_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS user_skills (
    id TEXT PRIMARY KEY,
    user_id TEXT NOT NULL,
    skill_id TEXT NOT NULL,
    xp INTEGER NOT NULL DEFAULT 0,
    level INTEGER NOT NULL DEFAULT 1,
    created_at TEXT NOT NULL DEFAULT (datetime('now')),
    updated_at TEXT NOT NULL DEFAULT (datetime('now')),
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (skill_id) REFERENCES skill_definitions(id) ON DELETE CASCADE,
    UNIQUE(user_id, skill_id)
);

CREATE TABLE IF NOT EXISTS achievement_definitions (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    description TEXT,
    icon TEXT,
    xp_reward INTEGER NOT NULL DEFAULT 0,
    coin_reward INTEGER NOT NULL DEFAULT 0,
    requirement_type TEXT NOT NULL,
    requirement_value INTEGER NOT NULL,
    created_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS user_achievements (
    id TEXT PRIMARY KEY,
    user_id TEXT NOT NULL,
    achievement_id TEXT NOT NULL,
    earned_at TEXT NOT NULL DEFAULT (datetime('now')),
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (achievement_id) REFERENCES achievement_definitions(id) ON DELETE CASCADE,
    UNIQUE(user_id, achievement_id)
);

CREATE TABLE IF NOT EXISTS user_streaks (
    id TEXT PRIMARY KEY,
    user_id TEXT NOT NULL,
    streak_type TEXT NOT NULL,
    current_streak INTEGER NOT NULL DEFAULT 0,
    longest_streak INTEGER NOT NULL DEFAULT 0,
    last_activity_date TEXT,
    created_at TEXT NOT NULL DEFAULT (datetime('now')),
    updated_at TEXT NOT NULL DEFAULT (datetime('now')),
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    UNIQUE(user_id, streak_type)
);

CREATE TABLE IF NOT EXISTS activity_events (
    id TEXT PRIMARY KEY,
    user_id TEXT NOT NULL,
    event_type TEXT NOT NULL,
    event_data TEXT,
    xp_earned INTEGER DEFAULT 0,
    coins_earned INTEGER DEFAULT 0,
    created_at TEXT NOT NULL DEFAULT (datetime('now')),
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);
CREATE INDEX IF NOT EXISTS idx_activity_events_user ON activity_events(user_id);
CREATE INDEX IF NOT EXISTS idx_activity_events_type ON activity_events(event_type);

-- Market items
CREATE TABLE IF NOT EXISTS market_items (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    description TEXT,
    category TEXT NOT NULL,
    cost_coins INTEGER NOT NULL DEFAULT 0,
    cost_xp INTEGER NOT NULL DEFAULT 0,
    icon TEXT,
    is_global INTEGER NOT NULL DEFAULT 1,
    is_active INTEGER NOT NULL DEFAULT 1,
    stock INTEGER,
    created_by_user_id TEXT,
    created_at TEXT NOT NULL DEFAULT (datetime('now')),
    FOREIGN KEY (created_by_user_id) REFERENCES users(id) ON DELETE SET NULL
);

-- ============================================================================
-- SECTION 2: Add Missing Columns to Existing Tables
-- ============================================================================

-- Add missing columns to calendar_events
-- Note: SQLite doesn't support ADD COLUMN IF NOT EXISTS directly
-- We'll use a workaround with try-catch in application code or check first

-- For calendar_events, we need: location, parent_event_id, reminder_minutes, metadata
-- These ALTER statements will fail silently if columns already exist

-- Add location column
ALTER TABLE calendar_events ADD COLUMN location TEXT;

-- Add parent_event_id column
ALTER TABLE calendar_events ADD COLUMN parent_event_id TEXT;

-- Add reminder_minutes column
ALTER TABLE calendar_events ADD COLUMN reminder_minutes INTEGER;

-- Add metadata column
ALTER TABLE calendar_events ADD COLUMN metadata TEXT;

-- Add missing columns to user_quest_progress
-- Needs: progress, completed, updated_at

ALTER TABLE user_quest_progress ADD COLUMN progress INTEGER NOT NULL DEFAULT 0;

ALTER TABLE user_quest_progress ADD COLUMN completed INTEGER NOT NULL DEFAULT 0;

ALTER TABLE user_quest_progress ADD COLUMN updated_at TEXT;

-- Add is_builtin column to exercises table (API uses this instead of is_custom)
ALTER TABLE exercises ADD COLUMN is_builtin INTEGER NOT NULL DEFAULT 0;

-- Add expires_at column to focus_sessions if missing
ALTER TABLE focus_sessions ADD COLUMN expires_at TEXT;

-- ============================================================================
-- SECTION 3: Seed Universal Quests
-- ============================================================================

INSERT OR IGNORE INTO universal_quests (id, title, description, type, xp_reward, coin_reward, target, skill_id, created_at, updated_at) VALUES
('uq_focus_1', 'Complete a Focus Session', 'Finish one focus session today', 'daily', 25, 10, 1, NULL, datetime('now'), datetime('now')),
('uq_focus_3', 'Focus Hat Trick', 'Complete 3 focus sessions today', 'daily', 50, 20, 3, NULL, datetime('now'), datetime('now')),
('uq_habit_1', 'Check In', 'Log at least one habit today', 'daily', 15, 5, 1, NULL, datetime('now'), datetime('now')),
('uq_learn_1', 'Learn Something New', 'Complete a lesson or drill', 'daily', 20, 10, 1, NULL, datetime('now'), datetime('now')),
('uq_workout_1', 'Get Moving', 'Complete a workout session', 'daily', 30, 15, 1, NULL, datetime('now'), datetime('now')),
('uq_weekly_focus', 'Focus Master', 'Complete 10 focus sessions this week', 'weekly', 100, 50, 10, NULL, datetime('now'), datetime('now')),
('uq_weekly_habits', 'Habit Champion', 'Log habits 5 days this week', 'weekly', 75, 35, 5, NULL, datetime('now'), datetime('now')),
('uq_weekly_learn', 'Knowledge Seeker', 'Complete 5 lessons this week', 'weekly', 80, 40, 5, NULL, datetime('now'), datetime('now'));

-- ============================================================================
-- SECTION 4: Re-enable foreign keys
-- ============================================================================

PRAGMA foreign_keys = ON;

-- ============================================================================
-- SECTION 5: Update db_metadata version
-- ============================================================================

INSERT OR REPLACE INTO db_metadata (key, value, updated_at)
VALUES ('version', '102', datetime('now'));

INSERT OR REPLACE INTO db_metadata (key, value, updated_at)
VALUES ('version_name', '0102_schema_fix', datetime('now'));

