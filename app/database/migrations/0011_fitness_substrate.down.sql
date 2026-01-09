-- ============================================================================
-- Migration: 0011_fitness_substrate (DOWN)
-- Created: January 7, 2026
-- Purpose: Rollback fitness substrate tables
-- ============================================================================

-- Drop views first
DROP VIEW IF EXISTS user_exercise_summary;

-- Drop tables in reverse dependency order
DROP TABLE IF EXISTS program_workouts;
DROP TABLE IF EXISTS program_weeks;
DROP TABLE IF EXISTS training_programs;
DROP TABLE IF EXISTS personal_records;
DROP TABLE IF EXISTS exercise_sets;
DROP TABLE IF EXISTS workout_sessions;
DROP TABLE IF EXISTS workout_exercises;
DROP TABLE IF EXISTS workout_sections;
DROP TABLE IF EXISTS workouts;
DROP TABLE IF EXISTS exercises;
