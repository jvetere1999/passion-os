-- Migration: 0003_add_planner_exercise.sql
-- Adds Planner (calendar events) and Exercise tracking tables
-- Quests remain as one-time/repeatable tasks
-- Planner is for time-targeted calendar events

-- ============================================
-- Planner Calendar Tables
-- ============================================

-- Calendar events (time-targeted)
CREATE TABLE IF NOT EXISTS calendar_events (
    id TEXT PRIMARY KEY,
    user_id TEXT NOT NULL,
    title TEXT NOT NULL,
    description TEXT,
    event_type TEXT NOT NULL, -- 'meeting', 'appointment', 'workout', 'other'
    start_time TEXT NOT NULL, -- ISO timestamp
    end_time TEXT NOT NULL, -- ISO timestamp
    all_day INTEGER NOT NULL DEFAULT 0,
    location TEXT,
    -- For recurring events
    recurrence_rule TEXT, -- iCal RRULE format or null for one-time
    recurrence_end TEXT, -- End date for recurring events
    parent_event_id TEXT, -- For recurring event instances
    -- Workout link
    workout_id TEXT, -- Links to workouts table if event_type = 'workout'
    -- Metadata
    color TEXT,
    reminder_minutes INTEGER, -- Minutes before event to remind
    metadata TEXT, -- JSON for additional data
    created_at TEXT NOT NULL,
    updated_at TEXT NOT NULL,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (parent_event_id) REFERENCES calendar_events(id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_calendar_events_user ON calendar_events(user_id);
CREATE INDEX IF NOT EXISTS idx_calendar_events_start ON calendar_events(start_time);
CREATE INDEX IF NOT EXISTS idx_calendar_events_end ON calendar_events(end_time);
CREATE INDEX IF NOT EXISTS idx_calendar_events_type ON calendar_events(event_type);
CREATE INDEX IF NOT EXISTS idx_calendar_events_parent ON calendar_events(parent_event_id);

-- ============================================
-- Exercise Domain Tables
-- ============================================

-- Exercise definitions (the exercises themselves)
CREATE TABLE IF NOT EXISTS exercises (
    id TEXT PRIMARY KEY,
    user_id TEXT, -- NULL for built-in exercises
    name TEXT NOT NULL,
    description TEXT,
    category TEXT NOT NULL, -- 'strength', 'cardio', 'flexibility', 'other'
    muscle_groups TEXT, -- JSON array of muscle groups
    equipment TEXT, -- JSON array of equipment needed
    instructions TEXT,
    is_builtin INTEGER NOT NULL DEFAULT 0,
    created_at TEXT NOT NULL,
    updated_at TEXT NOT NULL,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_exercises_user ON exercises(user_id);
CREATE INDEX IF NOT EXISTS idx_exercises_category ON exercises(category);
CREATE INDEX IF NOT EXISTS idx_exercises_builtin ON exercises(is_builtin);

-- Workouts (a collection of exercises for a session)
CREATE TABLE IF NOT EXISTS workouts (
    id TEXT PRIMARY KEY,
    user_id TEXT NOT NULL,
    name TEXT NOT NULL,
    description TEXT,
    workout_type TEXT NOT NULL, -- 'strength', 'cardio', 'hiit', 'flexibility', 'mixed'
    estimated_duration INTEGER, -- minutes
    tags TEXT, -- JSON array
    created_at TEXT NOT NULL,
    updated_at TEXT NOT NULL,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_workouts_user ON workouts(user_id);
CREATE INDEX IF NOT EXISTS idx_workouts_type ON workouts(workout_type);

-- Workout exercises (exercises within a workout template)
CREATE TABLE IF NOT EXISTS workout_exercises (
    id TEXT PRIMARY KEY,
    workout_id TEXT NOT NULL,
    exercise_id TEXT NOT NULL,
    order_index INTEGER NOT NULL,
    target_sets INTEGER,
    target_reps TEXT, -- Can be "8-12" or "10"
    target_weight REAL, -- Optional target weight
    target_duration INTEGER, -- For timed exercises (seconds)
    rest_seconds INTEGER,
    notes TEXT,
    FOREIGN KEY (workout_id) REFERENCES workouts(id) ON DELETE CASCADE,
    FOREIGN KEY (exercise_id) REFERENCES exercises(id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_workout_exercises_workout ON workout_exercises(workout_id);
CREATE INDEX IF NOT EXISTS idx_workout_exercises_exercise ON workout_exercises(exercise_id);

-- Workout sessions (actual performed workout)
CREATE TABLE IF NOT EXISTS workout_sessions (
    id TEXT PRIMARY KEY,
    user_id TEXT NOT NULL,
    workout_id TEXT, -- Can be NULL for ad-hoc workouts
    calendar_event_id TEXT, -- Links back to calendar event
    started_at TEXT NOT NULL,
    ended_at TEXT,
    status TEXT NOT NULL DEFAULT 'in-progress', -- 'in-progress', 'completed', 'abandoned'
    notes TEXT,
    rating INTEGER, -- 1-5 how the workout felt
    created_at TEXT NOT NULL,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (workout_id) REFERENCES workouts(id) ON DELETE SET NULL,
    FOREIGN KEY (calendar_event_id) REFERENCES calendar_events(id) ON DELETE SET NULL
);

CREATE INDEX IF NOT EXISTS idx_workout_sessions_user ON workout_sessions(user_id);
CREATE INDEX IF NOT EXISTS idx_workout_sessions_workout ON workout_sessions(workout_id);
CREATE INDEX IF NOT EXISTS idx_workout_sessions_started ON workout_sessions(started_at);

-- Exercise sets (individual sets within a workout session)
CREATE TABLE IF NOT EXISTS exercise_sets (
    id TEXT PRIMARY KEY,
    workout_session_id TEXT NOT NULL,
    exercise_id TEXT NOT NULL,
    set_number INTEGER NOT NULL,
    reps INTEGER,
    weight REAL, -- In user's preferred unit (kg/lbs)
    duration INTEGER, -- For timed exercises (seconds)
    distance REAL, -- For cardio (in meters)
    rpe INTEGER, -- Rate of Perceived Exertion (1-10), optional
    is_warmup INTEGER NOT NULL DEFAULT 0,
    is_dropset INTEGER NOT NULL DEFAULT 0,
    is_failure INTEGER NOT NULL DEFAULT 0, -- Did they go to failure
    notes TEXT,
    completed_at TEXT NOT NULL,
    FOREIGN KEY (workout_session_id) REFERENCES workout_sessions(id) ON DELETE CASCADE,
    FOREIGN KEY (exercise_id) REFERENCES exercises(id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_exercise_sets_session ON exercise_sets(workout_session_id);
CREATE INDEX IF NOT EXISTS idx_exercise_sets_exercise ON exercise_sets(exercise_id);
CREATE INDEX IF NOT EXISTS idx_exercise_sets_completed ON exercise_sets(completed_at);

-- Personal records (max weight/reps tracking)
CREATE TABLE IF NOT EXISTS personal_records (
    id TEXT PRIMARY KEY,
    user_id TEXT NOT NULL,
    exercise_id TEXT NOT NULL,
    record_type TEXT NOT NULL, -- 'max_weight', 'max_reps', 'max_volume', 'max_duration'
    value REAL NOT NULL,
    reps INTEGER, -- For max_weight, how many reps at that weight
    achieved_at TEXT NOT NULL,
    exercise_set_id TEXT, -- Link to the set where PR was achieved
    previous_value REAL, -- What the previous record was
    created_at TEXT NOT NULL,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (exercise_id) REFERENCES exercises(id) ON DELETE CASCADE,
    FOREIGN KEY (exercise_set_id) REFERENCES exercise_sets(id) ON DELETE SET NULL
);

CREATE INDEX IF NOT EXISTS idx_personal_records_user ON personal_records(user_id);
CREATE INDEX IF NOT EXISTS idx_personal_records_exercise ON personal_records(exercise_id);
CREATE INDEX IF NOT EXISTS idx_personal_records_type ON personal_records(record_type);

-- ============================================
-- Quest Updates - Add repeatability
-- ============================================

-- Add columns for quest repeatability
ALTER TABLE quests ADD COLUMN is_repeatable INTEGER NOT NULL DEFAULT 0;
ALTER TABLE quests ADD COLUMN repeat_frequency TEXT; -- 'daily', 'weekly', 'monthly', or NULL
ALTER TABLE quests ADD COLUMN last_completed_date TEXT; -- For tracking daily completions
ALTER TABLE quests ADD COLUMN streak_count INTEGER NOT NULL DEFAULT 0;

