-- Migration: 0010_habits_activities_infobase.sql
-- Add habits, activity events (for automatic quest progress), and migrate infobase to D1

-- Activity Events table (append-only for event-driven quest/XP progress)
CREATE TABLE IF NOT EXISTS activity_events (
    id TEXT PRIMARY KEY,
    user_id TEXT NOT NULL,
    event_type TEXT NOT NULL, -- 'focus_complete', 'workout_complete', 'lesson_complete', 'review_complete', 'habit_complete', 'quest_complete'
    entity_type TEXT, -- 'focus_session', 'workout_session', 'lesson', 'review', 'habit'
    entity_id TEXT,
    xp_earned INTEGER DEFAULT 0,
    coins_earned INTEGER DEFAULT 0,
    metadata TEXT, -- JSON for additional data
    created_at TEXT NOT NULL,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_activity_events_user ON activity_events(user_id);
CREATE INDEX IF NOT EXISTS idx_activity_events_type ON activity_events(event_type);
CREATE INDEX IF NOT EXISTS idx_activity_events_date ON activity_events(created_at);

-- Habits table
CREATE TABLE IF NOT EXISTS habits (
    id TEXT PRIMARY KEY,
    user_id TEXT NOT NULL,
    title TEXT NOT NULL,
    description TEXT,
    frequency TEXT NOT NULL DEFAULT 'daily', -- 'daily', 'weekly'
    target_count INTEGER NOT NULL DEFAULT 1, -- how many times per frequency period
    category TEXT DEFAULT 'general', -- 'focus', 'exercise', 'learning', 'journal', 'general'
    xp_reward INTEGER DEFAULT 10,
    coin_reward INTEGER DEFAULT 5,
    skill_id TEXT,
    is_active INTEGER NOT NULL DEFAULT 1,
    created_at TEXT NOT NULL,
    updated_at TEXT NOT NULL,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_habits_user ON habits(user_id);
CREATE INDEX IF NOT EXISTS idx_habits_active ON habits(is_active);

-- Habit Logs table
CREATE TABLE IF NOT EXISTS habit_logs (
    id TEXT PRIMARY KEY,
    habit_id TEXT NOT NULL,
    user_id TEXT NOT NULL,
    completed_at TEXT NOT NULL,
    notes TEXT,
    FOREIGN KEY (habit_id) REFERENCES habits(id) ON DELETE CASCADE,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_habit_logs_habit ON habit_logs(habit_id);
CREATE INDEX IF NOT EXISTS idx_habit_logs_user ON habit_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_habit_logs_date ON habit_logs(completed_at);

-- User Streaks table
CREATE TABLE IF NOT EXISTS user_streaks (
    id TEXT PRIMARY KEY,
    user_id TEXT NOT NULL,
    streak_type TEXT NOT NULL, -- 'daily_login', 'focus', 'workout', 'habit_{habit_id}'
    current_streak INTEGER NOT NULL DEFAULT 0,
    longest_streak INTEGER NOT NULL DEFAULT 0,
    last_activity_date TEXT,
    streak_shields INTEGER NOT NULL DEFAULT 0, -- purchased from market
    created_at TEXT NOT NULL,
    updated_at TEXT NOT NULL,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    UNIQUE(user_id, streak_type)
);

CREATE INDEX IF NOT EXISTS idx_user_streaks_user ON user_streaks(user_id);

-- Infobase Entries table (migrate from localStorage)
CREATE TABLE IF NOT EXISTS infobase_entries (
    id TEXT PRIMARY KEY,
    user_id TEXT NOT NULL,
    title TEXT NOT NULL,
    content TEXT NOT NULL,
    category TEXT NOT NULL DEFAULT 'Tips',
    tags TEXT, -- JSON array
    created_at TEXT NOT NULL,
    updated_at TEXT NOT NULL,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_infobase_user ON infobase_entries(user_id);
CREATE INDEX IF NOT EXISTS idx_infobase_category ON infobase_entries(category);

-- Workout Sections table (for workout builder with named sections)
CREATE TABLE IF NOT EXISTS workout_sections (
    id TEXT PRIMARY KEY,
    workout_id TEXT NOT NULL,
    name TEXT NOT NULL,
    order_index INTEGER NOT NULL DEFAULT 0,
    section_type TEXT DEFAULT 'main', -- 'warmup', 'main', 'cooldown', 'superset', 'circuit'
    notes TEXT,
    created_at TEXT NOT NULL,
    FOREIGN KEY (workout_id) REFERENCES workouts(id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_workout_sections_workout ON workout_sections(workout_id);

-- Update workout_exercises to support sections
-- Add section_id column to workout_exercises if not exists
-- SQLite doesn't support ADD COLUMN IF NOT EXISTS, so we check first

-- Training Programs table
CREATE TABLE IF NOT EXISTS training_programs (
    id TEXT PRIMARY KEY,
    user_id TEXT NOT NULL,
    name TEXT NOT NULL,
    description TEXT,
    duration_weeks INTEGER NOT NULL DEFAULT 4,
    goal TEXT, -- 'strength', 'hypertrophy', 'endurance', 'weight_loss'
    difficulty TEXT DEFAULT 'intermediate', -- 'beginner', 'intermediate', 'advanced'
    is_active INTEGER NOT NULL DEFAULT 0,
    started_at TEXT,
    completed_at TEXT,
    created_at TEXT NOT NULL,
    updated_at TEXT NOT NULL,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_programs_user ON training_programs(user_id);
CREATE INDEX IF NOT EXISTS idx_programs_active ON training_programs(is_active);

-- Program Weeks table
CREATE TABLE IF NOT EXISTS program_weeks (
    id TEXT PRIMARY KEY,
    program_id TEXT NOT NULL,
    week_number INTEGER NOT NULL,
    name TEXT,
    is_deload INTEGER NOT NULL DEFAULT 0,
    notes TEXT,
    FOREIGN KEY (program_id) REFERENCES training_programs(id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_program_weeks_program ON program_weeks(program_id);

-- Program Workouts table (links weeks to workout templates)
CREATE TABLE IF NOT EXISTS program_workouts (
    id TEXT PRIMARY KEY,
    program_week_id TEXT NOT NULL,
    workout_id TEXT NOT NULL,
    day_of_week INTEGER, -- 0-6 for Sunday-Saturday
    order_index INTEGER NOT NULL DEFAULT 0,
    intensity_modifier REAL DEFAULT 1.0, -- for deload weeks, reduce by 0.6-0.8
    FOREIGN KEY (program_week_id) REFERENCES program_weeks(id) ON DELETE CASCADE,
    FOREIGN KEY (workout_id) REFERENCES workouts(id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_program_workouts_week ON program_workouts(program_week_id);

-- Daily Plan table (generated plans)
CREATE TABLE IF NOT EXISTS daily_plans (
    id TEXT PRIMARY KEY,
    user_id TEXT NOT NULL,
    plan_date TEXT NOT NULL,
    items TEXT NOT NULL, -- JSON array of plan items
    completed_count INTEGER NOT NULL DEFAULT 0,
    total_count INTEGER NOT NULL DEFAULT 0,
    created_at TEXT NOT NULL,
    updated_at TEXT NOT NULL,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    UNIQUE(user_id, plan_date)
);

CREATE INDEX IF NOT EXISTS idx_daily_plans_user ON daily_plans(user_id);
CREATE INDEX IF NOT EXISTS idx_daily_plans_date ON daily_plans(plan_date);

-- Notifications table
CREATE TABLE IF NOT EXISTS notifications (
    id TEXT PRIMARY KEY,
    user_id TEXT NOT NULL,
    type TEXT NOT NULL, -- 'focus_reminder', 'break_reminder', 'quest_due', 'workout_scheduled', 'review_due', 'streak_warning'
    title TEXT NOT NULL,
    body TEXT,
    action_url TEXT,
    is_read INTEGER NOT NULL DEFAULT 0,
    scheduled_for TEXT,
    sent_at TEXT,
    created_at TEXT NOT NULL,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_notifications_user ON notifications(user_id);
CREATE INDEX IF NOT EXISTS idx_notifications_read ON notifications(is_read);
CREATE INDEX IF NOT EXISTS idx_notifications_scheduled ON notifications(scheduled_for);

