-- ============================================================================
-- Migration: 0013_learn_substrate (DOWN)
-- Created: January 7, 2026
-- Purpose: Rollback learn substrate tables
-- ============================================================================

-- Drop views
DROP VIEW IF EXISTS user_srs_due;
DROP VIEW IF EXISTS user_learn_summary;

-- Drop functions
DROP FUNCTION IF EXISTS complete_lesson;

-- Drop tables in reverse dependency order
DROP TABLE IF EXISTS user_learn_srs;
DROP TABLE IF EXISTS user_drill_stats;
DROP TABLE IF EXISTS user_lesson_progress;
DROP TABLE IF EXISTS learn_drills;
DROP TABLE IF EXISTS learn_lessons;
DROP TABLE IF EXISTS learn_topics;
