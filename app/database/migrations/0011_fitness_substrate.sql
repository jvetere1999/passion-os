-- ============================================================================
-- Migration: 0011_fitness_substrate
-- Created: January 7, 2026
-- Purpose: Exercise, workouts, training programs tables
--
-- This migration implements:
--   - exercises: Exercise definitions
--   - workouts: Workout templates
--   - workout_sections: Workout sections
--   - workout_exercises: Exercises in workouts
--   - workout_sessions: Completed workout sessions
--   - exercise_sets: Sets logged during sessions
--   - personal_records: Personal best records
--   - training_programs: Multi-week programs
--   - program_weeks: Weeks in programs
--   - program_workouts: Workouts in program weeks
--
-- D1 → Postgres Changes:
--   - TEXT PRIMARY KEY → UUID with gen_random_uuid()
--   - INTEGER (boolean) → BOOLEAN
--   - TEXT timestamps → TIMESTAMPTZ
--   - Added proper indexes and constraints
--
-- References:
--   - d1_usage_inventory.md: D1 exercise tables
--   - feature_porting_playbook.md: Wave 3.1
-- ============================================================================

-- ============================================================================
-- SECTION 1: EXERCISES
-- ============================================================================

CREATE TABLE exercises (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    
    -- Exercise info
    name TEXT NOT NULL,
    description TEXT,
    category TEXT NOT NULL,
    muscle_groups TEXT[],  -- Array of muscle groups
    equipment TEXT[],      -- Array of equipment needed
    
    -- Built-in vs custom
    is_custom BOOLEAN NOT NULL DEFAULT false,
    is_builtin BOOLEAN NOT NULL DEFAULT false,
    
    -- Owner for custom exercises
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    
    -- Timestamps
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Indexes
CREATE INDEX idx_exercises_category ON exercises(category);
CREATE INDEX idx_exercises_user ON exercises(user_id) WHERE user_id IS NOT NULL;
CREATE INDEX idx_exercises_builtin ON exercises(is_builtin) WHERE is_builtin = true;

-- ============================================================================
-- SECTION 2: WORKOUTS
-- ============================================================================

CREATE TABLE workouts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    
    -- Workout info
    name TEXT NOT NULL,
    description TEXT,
    estimated_duration INTEGER,  -- minutes
    
    -- Template for reuse
    is_template BOOLEAN NOT NULL DEFAULT false,
    
    -- Timestamps
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Indexes
CREATE INDEX idx_workouts_user ON workouts(user_id);
CREATE INDEX idx_workouts_template ON workouts(user_id, is_template) WHERE is_template = true;

-- Auto-update updated_at
CREATE TRIGGER update_workouts_updated_at
    BEFORE UPDATE ON workouts
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- ============================================================================
-- SECTION 3: WORKOUT SECTIONS
-- ============================================================================

CREATE TABLE workout_sections (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    workout_id UUID NOT NULL REFERENCES workouts(id) ON DELETE CASCADE,
    
    -- Section info
    name TEXT NOT NULL,
    sort_order INTEGER NOT NULL DEFAULT 0
);

-- Indexes
CREATE INDEX idx_workout_sections_workout ON workout_sections(workout_id);

-- ============================================================================
-- SECTION 4: WORKOUT EXERCISES
-- ============================================================================

CREATE TABLE workout_exercises (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    workout_id UUID NOT NULL REFERENCES workouts(id) ON DELETE CASCADE,
    section_id UUID REFERENCES workout_sections(id) ON DELETE SET NULL,
    exercise_id UUID NOT NULL REFERENCES exercises(id) ON DELETE CASCADE,
    
    -- Prescription
    sets INTEGER NOT NULL DEFAULT 3,
    reps TEXT,       -- e.g., "8-12", "10"
    weight TEXT,     -- e.g., "135lbs", "RPE 8"
    duration INTEGER, -- seconds for timed exercises
    rest_seconds INTEGER,
    
    -- Notes
    notes TEXT,
    
    -- Ordering
    sort_order INTEGER NOT NULL DEFAULT 0
);

-- Indexes
CREATE INDEX idx_workout_exercises_workout ON workout_exercises(workout_id);
CREATE INDEX idx_workout_exercises_exercise ON workout_exercises(exercise_id);

-- ============================================================================
-- SECTION 5: WORKOUT SESSIONS
-- ============================================================================

CREATE TABLE workout_sessions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    workout_id UUID REFERENCES workouts(id) ON DELETE SET NULL,
    
    -- Timing
    started_at TIMESTAMPTZ NOT NULL,
    completed_at TIMESTAMPTZ,
    
    -- Summary
    notes TEXT,
    rating INTEGER CHECK (rating IS NULL OR (rating >= 1 AND rating <= 5)),
    
    -- XP/coins awarded
    xp_awarded INTEGER NOT NULL DEFAULT 0,
    coins_awarded INTEGER NOT NULL DEFAULT 0
);

-- Indexes
CREATE INDEX idx_workout_sessions_user ON workout_sessions(user_id);
CREATE INDEX idx_workout_sessions_workout ON workout_sessions(workout_id) WHERE workout_id IS NOT NULL;
CREATE INDEX idx_workout_sessions_date ON workout_sessions(user_id, started_at);

-- ============================================================================
-- SECTION 6: EXERCISE SETS
-- ============================================================================

CREATE TABLE exercise_sets (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    session_id UUID NOT NULL REFERENCES workout_sessions(id) ON DELETE CASCADE,
    exercise_id UUID NOT NULL REFERENCES exercises(id) ON DELETE CASCADE,
    
    -- Set details
    set_number INTEGER NOT NULL,
    reps INTEGER,
    weight REAL,
    duration INTEGER,  -- seconds
    
    -- Set type flags
    is_warmup BOOLEAN NOT NULL DEFAULT false,
    is_dropset BOOLEAN NOT NULL DEFAULT false,
    
    -- Effort tracking
    rpe INTEGER CHECK (rpe IS NULL OR (rpe >= 1 AND rpe <= 10)),
    
    -- Notes
    notes TEXT,
    
    -- When completed
    completed_at TIMESTAMPTZ
);

-- Indexes
CREATE INDEX idx_exercise_sets_session ON exercise_sets(session_id);
CREATE INDEX idx_exercise_sets_exercise ON exercise_sets(exercise_id);

-- ============================================================================
-- SECTION 7: PERSONAL RECORDS
-- ============================================================================

CREATE TABLE personal_records (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    exercise_id UUID NOT NULL REFERENCES exercises(id) ON DELETE CASCADE,
    
    -- Record details
    record_type TEXT NOT NULL,  -- 'weight', 'reps', 'volume', 'duration'
    value REAL NOT NULL,
    reps INTEGER,  -- For weight records
    
    -- When achieved
    achieved_at TIMESTAMPTZ NOT NULL,
    exercise_set_id UUID REFERENCES exercise_sets(id) ON DELETE SET NULL,
    
    -- Previous record for comparison
    previous_value REAL,
    
    -- Timestamps
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Indexes
CREATE INDEX idx_personal_records_user ON personal_records(user_id);
CREATE INDEX idx_personal_records_exercise ON personal_records(exercise_id);
CREATE UNIQUE INDEX idx_personal_records_user_exercise_type 
    ON personal_records(user_id, exercise_id, record_type);

-- ============================================================================
-- SECTION 8: TRAINING PROGRAMS
-- ============================================================================

CREATE TABLE training_programs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    
    -- Program info
    name TEXT NOT NULL,
    description TEXT,
    duration_weeks INTEGER NOT NULL DEFAULT 4,
    goal TEXT,
    difficulty TEXT DEFAULT 'intermediate' CHECK (difficulty IN ('beginner', 'intermediate', 'advanced')),
    
    -- Status
    is_active BOOLEAN NOT NULL DEFAULT false,
    started_at TIMESTAMPTZ,
    completed_at TIMESTAMPTZ,
    
    -- Timestamps
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Indexes
CREATE INDEX idx_training_programs_user ON training_programs(user_id);
CREATE INDEX idx_training_programs_active ON training_programs(user_id) WHERE is_active = true;

-- Auto-update updated_at
CREATE TRIGGER update_training_programs_updated_at
    BEFORE UPDATE ON training_programs
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- ============================================================================
-- SECTION 9: PROGRAM WEEKS
-- ============================================================================

CREATE TABLE program_weeks (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    program_id UUID NOT NULL REFERENCES training_programs(id) ON DELETE CASCADE,
    
    -- Week info
    week_number INTEGER NOT NULL,
    name TEXT,
    is_deload BOOLEAN NOT NULL DEFAULT false,
    notes TEXT
);

-- Indexes
CREATE INDEX idx_program_weeks_program ON program_weeks(program_id);
CREATE UNIQUE INDEX idx_program_weeks_number ON program_weeks(program_id, week_number);

-- ============================================================================
-- SECTION 10: PROGRAM WORKOUTS
-- ============================================================================

CREATE TABLE program_workouts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    program_week_id UUID NOT NULL REFERENCES program_weeks(id) ON DELETE CASCADE,
    workout_id UUID NOT NULL REFERENCES workouts(id) ON DELETE CASCADE,
    
    -- Scheduling
    day_of_week INTEGER CHECK (day_of_week IS NULL OR (day_of_week >= 0 AND day_of_week <= 6)),
    order_index INTEGER NOT NULL DEFAULT 0,
    
    -- Intensity scaling
    intensity_modifier REAL DEFAULT 1.0
);

-- Indexes
CREATE INDEX idx_program_workouts_week ON program_workouts(program_week_id);
CREATE INDEX idx_program_workouts_workout ON program_workouts(workout_id);

-- ============================================================================
-- SECTION 11: HELPER VIEWS
-- ============================================================================

-- User exercise history summary
CREATE VIEW user_exercise_summary AS
SELECT 
    es.exercise_id,
    ws.user_id,
    e.name AS exercise_name,
    COUNT(DISTINCT ws.id) AS session_count,
    MAX(es.weight) AS max_weight,
    MAX(es.reps) AS max_reps,
    MAX(ws.started_at) AS last_performed
FROM exercise_sets es
JOIN workout_sessions ws ON es.session_id = ws.id
JOIN exercises e ON es.exercise_id = e.id
WHERE ws.completed_at IS NOT NULL
GROUP BY es.exercise_id, ws.user_id, e.name;

-- ============================================================================
-- SECTION 12: COMMENTS
-- ============================================================================

COMMENT ON TABLE exercises IS 'Exercise definitions (built-in and custom)';
COMMENT ON TABLE workouts IS 'Workout templates and instances';
COMMENT ON TABLE workout_sessions IS 'Completed workout sessions with XP/coins';
COMMENT ON TABLE exercise_sets IS 'Individual sets logged during workout sessions';
COMMENT ON TABLE personal_records IS 'Personal best records per exercise';
COMMENT ON TABLE training_programs IS 'Multi-week training programs';
