-- Down migration: 0008_reference_tracks_substrate
-- Rollback reference tracks domain tables

-- Drop views first
DROP VIEW IF EXISTS v_track_summary;
DROP VIEW IF EXISTS v_track_latest_analysis;

-- Drop triggers
DROP TRIGGER IF EXISTS update_track_regions_updated_at ON track_regions;
DROP TRIGGER IF EXISTS update_track_annotations_updated_at ON track_annotations;
DROP TRIGGER IF EXISTS update_track_analyses_updated_at ON track_analyses;
DROP TRIGGER IF EXISTS update_reference_tracks_updated_at ON reference_tracks;

-- Drop tables in reverse dependency order
DROP TABLE IF EXISTS track_regions;
DROP TABLE IF EXISTS track_annotations;
DROP TABLE IF EXISTS analysis_frame_chunks;
DROP TABLE IF EXISTS track_analyses;
DROP TABLE IF EXISTS reference_tracks;

