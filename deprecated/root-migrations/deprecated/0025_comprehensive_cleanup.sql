-- ============================================================================
-- MIGRATION 0025: Comprehensive orphan table cleanup
-- Removes all tables that reference non-existent tables
-- ============================================================================

-- Drop tables that reference non-existent 'lessons' table
DROP TABLE IF EXISTS learn_posts;
DROP TABLE IF EXISTS learn_reports;
DROP TABLE IF EXISTS learn_mod_actions;

-- Drop other potential orphan tables
DROP TABLE IF EXISTS log_events;
DROP TABLE IF EXISTS schedule_rules;
DROP TABLE IF EXISTS projects;
DROP TABLE IF EXISTS reference_libraries;
DROP TABLE IF EXISTS lane_templates;
DROP TABLE IF EXISTS personal_records;
DROP TABLE IF EXISTS user_stats;
DROP TABLE IF EXISTS learn_user_settings;
DROP TABLE IF EXISTS learn_progress;
DROP TABLE IF EXISTS review_cards;
DROP TABLE IF EXISTS review_history;
DROP TABLE IF EXISTS saved_recipes;
DROP TABLE IF EXISTS patch_journal;
DROP TABLE IF EXISTS training_programs;
DROP TABLE IF EXISTS notifications;
DROP TABLE IF EXISTS synth_mappings;
DROP TABLE IF EXISTS quiz_attempts;
DROP TABLE IF EXISTS learn_threads;
DROP TABLE IF EXISTS concepts;

-- Drop FTS tables that might be orphaned
DROP TABLE IF EXISTS concepts_fts;
DROP TABLE IF EXISTS concepts_fts_config;
DROP TABLE IF EXISTS concepts_fts_data;
DROP TABLE IF EXISTS concepts_fts_docsize;
DROP TABLE IF EXISTS concepts_fts_idx;
DROP TABLE IF EXISTS lessons_fts;
DROP TABLE IF EXISTS lessons_fts_config;
DROP TABLE IF EXISTS lessons_fts_data;
DROP TABLE IF EXISTS lessons_fts_docsize;
DROP TABLE IF EXISTS lessons_fts_idx;

-- Update db_metadata version
UPDATE db_metadata SET value = '25', updated_at = datetime('now') WHERE key = 'db_version';
UPDATE db_metadata SET value = '0025_comprehensive_cleanup', updated_at = datetime('now') WHERE key = 'db_version_name';

