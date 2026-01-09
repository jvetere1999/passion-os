-- Down migration: 0009_analysis_frames_bytea
-- Rollback enhanced frame storage tables

-- Drop function first
DROP FUNCTION IF EXISTS get_frame_chunks_for_range(UUID, INTEGER, INTEGER);

-- Drop tables in reverse dependency order
DROP TABLE IF EXISTS analysis_events;
DROP TABLE IF EXISTS analysis_frame_data;
DROP TABLE IF EXISTS analysis_frame_manifests;

