-- ============================================================================
-- Migration: 0013_learn_substrate
-- Created: January 7, 2026
-- Purpose: Learning system tables (topics, lessons, drills, progress)
--
-- This migration implements:
--   - learn_topics: Learning topic categories
--   - learn_lessons: Individual lessons
--   - learn_drills: Practice drills
--   - user_lesson_progress: User progress on lessons
--   - user_drill_stats: User drill statistics
--
-- D1 → Postgres Changes:
--   - TEXT PRIMARY KEY → UUID with gen_random_uuid()
--   - INTEGER (boolean) → BOOLEAN
--   - TEXT timestamps → TIMESTAMPTZ
--   - TEXT JSON → JSONB
--   - Added proper indexes and constraints
--
-- References:
--   - d1_usage_inventory.md: D1 learn tables
--   - feature_porting_playbook.md: Wave 3.3
-- ============================================================================

-- ============================================================================
-- SECTION 1: LEARN TOPICS
-- ============================================================================

CREATE TABLE learn_topics (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    
    -- Unique identifier
    key TEXT NOT NULL UNIQUE,
    
    -- Topic info
    name TEXT NOT NULL,
    description TEXT,
    category TEXT NOT NULL,
    
    -- Display
    icon TEXT,
    
    -- Ordering
    sort_order INTEGER NOT NULL DEFAULT 0,
    
    -- Timestamps
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Indexes
CREATE INDEX idx_learn_topics_category ON learn_topics(category);

-- ============================================================================
-- SECTION 2: LEARN LESSONS
-- ============================================================================

CREATE TABLE learn_lessons (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    topic_id UUID NOT NULL REFERENCES learn_topics(id) ON DELETE CASCADE,
    
    -- Unique identifier
    key TEXT NOT NULL UNIQUE,
    
    -- Lesson info
    title TEXT NOT NULL,
    description TEXT,
    content_markdown TEXT,
    
    -- Duration estimate
    duration_minutes INTEGER NOT NULL DEFAULT 5,
    difficulty TEXT NOT NULL DEFAULT 'beginner' CHECK (difficulty IN ('beginner', 'intermediate', 'advanced')),
    
    -- Quiz (stored as JSON)
    quiz_json JSONB,
    
    -- Rewards
    xp_reward INTEGER NOT NULL DEFAULT 15,
    coin_reward INTEGER NOT NULL DEFAULT 5,
    
    -- Skill integration
    skill_key TEXT,
    skill_star_reward INTEGER DEFAULT 1,
    
    -- Audio content (R2 blob key)
    audio_r2_key TEXT,
    
    -- Ordering
    sort_order INTEGER NOT NULL DEFAULT 0,
    
    -- Timestamps
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Indexes
CREATE INDEX idx_learn_lessons_topic ON learn_lessons(topic_id);
CREATE INDEX idx_learn_lessons_difficulty ON learn_lessons(difficulty);

-- ============================================================================
-- SECTION 3: LEARN DRILLS
-- ============================================================================

CREATE TABLE learn_drills (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    topic_id UUID NOT NULL REFERENCES learn_topics(id) ON DELETE CASCADE,
    
    -- Unique identifier
    key TEXT NOT NULL UNIQUE,
    
    -- Drill info
    title TEXT NOT NULL,
    description TEXT,
    drill_type TEXT NOT NULL,  -- 'ear_training', 'interval', 'chord', etc.
    
    -- Configuration (stored as JSON)
    config_json JSONB NOT NULL,
    
    -- Difficulty and duration
    difficulty TEXT NOT NULL DEFAULT 'beginner' CHECK (difficulty IN ('beginner', 'intermediate', 'advanced')),
    duration_seconds INTEGER NOT NULL DEFAULT 120,
    
    -- Rewards
    xp_reward INTEGER NOT NULL DEFAULT 5,
    
    -- Ordering
    sort_order INTEGER NOT NULL DEFAULT 0,
    
    -- Timestamps
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Indexes
CREATE INDEX idx_learn_drills_topic ON learn_drills(topic_id);
CREATE INDEX idx_learn_drills_type ON learn_drills(drill_type);

-- ============================================================================
-- SECTION 4: USER LESSON PROGRESS
-- ============================================================================

CREATE TABLE user_lesson_progress (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    lesson_id UUID NOT NULL REFERENCES learn_lessons(id) ON DELETE CASCADE,
    
    -- Status
    status TEXT NOT NULL DEFAULT 'not_started' CHECK (status IN ('not_started', 'in_progress', 'completed')),
    
    -- Dates
    started_at TIMESTAMPTZ,
    completed_at TIMESTAMPTZ,
    
    -- Quiz results
    quiz_score INTEGER,
    
    -- Attempts count
    attempts INTEGER NOT NULL DEFAULT 0,
    
    -- Unique per user-lesson
    UNIQUE(user_id, lesson_id)
);

-- Indexes
CREATE INDEX idx_user_lesson_progress_user ON user_lesson_progress(user_id);
CREATE INDEX idx_user_lesson_progress_lesson ON user_lesson_progress(lesson_id);
CREATE INDEX idx_user_lesson_progress_status ON user_lesson_progress(user_id, status);

-- ============================================================================
-- SECTION 5: USER DRILL STATS
-- ============================================================================

CREATE TABLE user_drill_stats (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    drill_id UUID NOT NULL REFERENCES learn_drills(id) ON DELETE CASCADE,
    
    -- Statistics
    total_attempts INTEGER NOT NULL DEFAULT 0,
    correct_answers INTEGER NOT NULL DEFAULT 0,
    best_score INTEGER,
    average_score REAL,
    
    -- Streaks
    current_streak INTEGER NOT NULL DEFAULT 0,
    best_streak INTEGER NOT NULL DEFAULT 0,
    
    -- Timing
    last_attempt_at TIMESTAMPTZ,
    total_time_seconds INTEGER NOT NULL DEFAULT 0,
    
    -- Unique per user-drill
    UNIQUE(user_id, drill_id)
);

-- Indexes
CREATE INDEX idx_user_drill_stats_user ON user_drill_stats(user_id);
CREATE INDEX idx_user_drill_stats_drill ON user_drill_stats(drill_id);

-- ============================================================================
-- SECTION 6: SPACED REPETITION
-- ============================================================================

CREATE TABLE user_learn_srs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    
    -- What's being reviewed
    item_type TEXT NOT NULL CHECK (item_type IN ('lesson', 'drill')),
    item_id UUID NOT NULL,  -- References lesson or drill
    
    -- Spaced repetition data
    ease_factor REAL NOT NULL DEFAULT 2.5,
    interval_days INTEGER NOT NULL DEFAULT 1,
    repetitions INTEGER NOT NULL DEFAULT 0,
    
    -- Next review date
    next_review_at TIMESTAMPTZ NOT NULL,
    last_review_at TIMESTAMPTZ,
    
    -- Quality of last review (0-5)
    last_quality INTEGER,
    
    -- Unique per user-item
    UNIQUE(user_id, item_type, item_id)
);

-- Indexes
CREATE INDEX idx_user_learn_srs_user ON user_learn_srs(user_id);
CREATE INDEX idx_user_learn_srs_review ON user_learn_srs(user_id, next_review_at);

-- ============================================================================
-- SECTION 7: HELPER FUNCTIONS
-- ============================================================================

-- Function to complete a lesson and award XP/coins
CREATE OR REPLACE FUNCTION complete_lesson(
    p_user_id UUID,
    p_lesson_id UUID,
    p_quiz_score INTEGER DEFAULT NULL
)
RETURNS TABLE(
    progress_id UUID,
    xp_awarded INTEGER,
    coins_awarded INTEGER,
    is_first_completion BOOLEAN
) AS $$
DECLARE
    v_lesson learn_lessons%ROWTYPE;
    v_progress user_lesson_progress%ROWTYPE;
    v_progress_id UUID;
    v_is_first BOOLEAN;
BEGIN
    -- Get lesson
    SELECT * INTO v_lesson FROM learn_lessons WHERE id = p_lesson_id;
    IF NOT FOUND THEN
        RAISE EXCEPTION 'Lesson not found';
    END IF;
    
    -- Get or create progress
    SELECT * INTO v_progress FROM user_lesson_progress 
    WHERE user_id = p_user_id AND lesson_id = p_lesson_id;
    
    IF FOUND THEN
        v_is_first := v_progress.completed_at IS NULL;
        UPDATE user_lesson_progress SET
            status = 'completed',
            completed_at = COALESCE(completed_at, NOW()),
            quiz_score = COALESCE(p_quiz_score, quiz_score),
            attempts = attempts + 1
        WHERE id = v_progress.id
        RETURNING id INTO v_progress_id;
    ELSE
        v_is_first := true;
        INSERT INTO user_lesson_progress (user_id, lesson_id, status, started_at, completed_at, quiz_score, attempts)
        VALUES (p_user_id, p_lesson_id, 'completed', NOW(), NOW(), p_quiz_score, 1)
        RETURNING id INTO v_progress_id;
    END IF;
    
    -- Return results
    RETURN QUERY SELECT 
        v_progress_id,
        CASE WHEN v_is_first THEN v_lesson.xp_reward ELSE 0 END,
        CASE WHEN v_is_first THEN v_lesson.coin_reward ELSE 0 END,
        v_is_first;
END;
$$ LANGUAGE plpgsql;

-- ============================================================================
-- SECTION 8: HELPER VIEWS
-- ============================================================================

-- User learning progress summary
CREATE VIEW user_learn_summary AS
SELECT 
    ulp.user_id,
    COUNT(DISTINCT ulp.lesson_id) FILTER (WHERE ulp.status = 'completed') AS lessons_completed,
    COUNT(DISTINCT ll.topic_id) AS topics_touched,
    SUM(ll.xp_reward) FILTER (WHERE ulp.status = 'completed') AS total_xp_earned,
    MAX(ulp.completed_at) AS last_lesson_completed
FROM user_lesson_progress ulp
JOIN learn_lessons ll ON ulp.lesson_id = ll.id
GROUP BY ulp.user_id;

-- Items due for review
CREATE VIEW user_srs_due AS
SELECT 
    user_id,
    item_type,
    item_id,
    next_review_at,
    interval_days,
    repetitions
FROM user_learn_srs
WHERE next_review_at <= NOW()
ORDER BY next_review_at;

-- ============================================================================
-- SECTION 9: COMMENTS
-- ============================================================================

COMMENT ON TABLE learn_topics IS 'Learning topic categories';
COMMENT ON TABLE learn_lessons IS 'Individual lessons with content and quizzes';
COMMENT ON TABLE learn_drills IS 'Practice drills for skill development';
COMMENT ON TABLE user_lesson_progress IS 'User progress on lessons';
COMMENT ON TABLE user_drill_stats IS 'User statistics on drills';
COMMENT ON TABLE user_learn_srs IS 'Spaced repetition scheduling for reviews';
COMMENT ON FUNCTION complete_lesson IS 'Complete a lesson and award XP/coins';
