-- ============================================================================
-- Migration: 0014_platform_substrate (DOWN)
-- Purpose: Rollback platform tables
-- ============================================================================

-- Drop tables in reverse order of creation (respecting foreign keys)
DROP TABLE IF EXISTS user_interests CASCADE;
DROP TABLE IF EXISTS user_settings CASCADE;
DROP TABLE IF EXISTS user_onboarding_responses CASCADE;
DROP TABLE IF EXISTS user_onboarding_state CASCADE;
DROP TABLE IF EXISTS onboarding_steps CASCADE;
DROP TABLE IF EXISTS onboarding_flows CASCADE;
DROP TABLE IF EXISTS ideas CASCADE;
DROP TABLE IF EXISTS infobase_entries CASCADE;
DROP TABLE IF EXISTS feedback CASCADE;
