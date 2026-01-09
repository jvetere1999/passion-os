-- ============================================================================
-- Migration: 0012_books_substrate (DOWN)
-- Created: January 7, 2026
-- Purpose: Rollback books substrate tables
-- ============================================================================

-- Drop views
DROP VIEW IF EXISTS user_reading_stats;

-- Drop functions
DROP FUNCTION IF EXISTS log_reading_session;

-- Drop tables
DROP TABLE IF EXISTS reading_sessions;
DROP TABLE IF EXISTS books;
