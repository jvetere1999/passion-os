-- ============================================================================
-- MIGRATION 0026: Fix reference_tracks schema
-- Drop and recreate with correct schema (no reference_libraries dependency)
-- ============================================================================

-- First, drop the old reference_tracks table with bad FK
DROP TABLE IF EXISTS reference_tracks;

-- Create the correct reference_tracks table
CREATE TABLE reference_tracks (
    id TEXT PRIMARY KEY,
    user_id TEXT NOT NULL,
    title TEXT NOT NULL,
    artist TEXT,
    r2_key TEXT NOT NULL,
    mime_type TEXT NOT NULL,
    bytes INTEGER NOT NULL,
    sha256 TEXT,
    duration_seconds REAL,
    tags_json TEXT,
    visibility TEXT NOT NULL DEFAULT 'private',
    created_at TEXT NOT NULL DEFAULT (datetime('now')),
    updated_at TEXT NOT NULL DEFAULT (datetime('now')),
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- Create indices
CREATE INDEX IF NOT EXISTS idx_reference_tracks_user ON reference_tracks(user_id);
CREATE INDEX IF NOT EXISTS idx_reference_tracks_r2_key ON reference_tracks(r2_key);

-- Update db_metadata version
UPDATE db_metadata SET value = '26', updated_at = datetime('now') WHERE key = 'db_version';
UPDATE db_metadata SET value = '0026_fix_reference_tracks', updated_at = datetime('now') WHERE key = 'db_version_name';

