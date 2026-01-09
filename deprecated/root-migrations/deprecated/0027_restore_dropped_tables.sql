-- ============================================================================
-- MIGRATION 0027: Restore accidentally dropped tables
-- Restores training_programs, program_weeks, personal_records
-- These were dropped in 0025 but are actually used by the codebase
-- ============================================================================

-- Restore personal_records table (used by /api/exercise)
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

-- Restore training_programs table (used by /api/programs)
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

-- Update db_metadata version
UPDATE db_metadata SET value = '27', updated_at = datetime('now') WHERE key = 'db_version';
UPDATE db_metadata SET value = '0027_restore_dropped_tables', updated_at = datetime('now') WHERE key = 'db_version_name';

