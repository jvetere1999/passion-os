-- ============================================================================
-- MIGRATION 0024: Clean up orphan tables referencing non-existent 'lessons' table
-- ============================================================================

-- Drop orphan tables that reference non-existent 'lessons' table
DROP TABLE IF EXISTS synth_mappings;
DROP TABLE IF EXISTS quiz_attempts;
DROP TABLE IF EXISTS learn_threads;

-- Drop orphan FTS tables
DROP TABLE IF EXISTS lessons_fts;
DROP TABLE IF EXISTS lessons_fts_data;
DROP TABLE IF EXISTS lessons_fts_idx;
DROP TABLE IF EXISTS lessons_fts_docsize;
DROP TABLE IF EXISTS lessons_fts_config;

-- Update db_metadata version
UPDATE db_metadata SET value = '24', updated_at = datetime('now') WHERE key = 'db_version';
UPDATE db_metadata SET value = '0024_cleanup_orphan_tables', updated_at = datetime('now') WHERE key = 'db_version_name';

