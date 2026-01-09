-- ============================================================================
-- MIGRATION 0023: Add Reference Tracks Table for R2 Integration
-- ============================================================================

-- Reference tracks table (metadata for R2-backed audio files)
CREATE TABLE IF NOT EXISTS reference_tracks (
    id TEXT PRIMARY KEY,
    user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
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
    updated_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE INDEX IF NOT EXISTS idx_reference_tracks_user ON reference_tracks(user_id);
CREATE INDEX IF NOT EXISTS idx_reference_tracks_r2_key ON reference_tracks(r2_key);

-- Update track_analysis_cache to reference the new table
-- (existing table, just adding FK if not exists)
-- Note: SQLite doesn't support adding FK to existing table, so this is informational

-- Learn journal entries table
CREATE TABLE IF NOT EXISTS learn_journal_entries (
    id TEXT PRIMARY KEY,
    user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    content TEXT NOT NULL,
    tags_json TEXT,
    created_at TEXT NOT NULL DEFAULT (datetime('now')),
    updated_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE INDEX IF NOT EXISTS idx_learn_journal_user ON learn_journal_entries(user_id);
CREATE INDEX IF NOT EXISTS idx_learn_journal_created ON learn_journal_entries(created_at);

-- User track libraries table (for organizing focus tracks)
CREATE TABLE IF NOT EXISTS user_track_libraries (
    id TEXT PRIMARY KEY,
    user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    description TEXT,
    is_default INTEGER NOT NULL DEFAULT 0,
    sort_order INTEGER NOT NULL DEFAULT 0,
    created_at TEXT NOT NULL DEFAULT (datetime('now')),
    updated_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE INDEX IF NOT EXISTS idx_user_track_libraries_user ON user_track_libraries(user_id);

-- Library track associations
CREATE TABLE IF NOT EXISTS library_tracks (
    id TEXT PRIMARY KEY,
    library_id TEXT NOT NULL REFERENCES user_track_libraries(id) ON DELETE CASCADE,
    track_id TEXT NOT NULL REFERENCES reference_tracks(id) ON DELETE CASCADE,
    sort_order INTEGER NOT NULL DEFAULT 0,
    added_at TEXT NOT NULL DEFAULT (datetime('now')),
    UNIQUE(library_id, track_id)
);

CREATE INDEX IF NOT EXISTS idx_library_tracks_library ON library_tracks(library_id);
CREATE INDEX IF NOT EXISTS idx_library_tracks_track ON library_tracks(track_id);

-- Update db_metadata version
UPDATE db_metadata SET value = '23', updated_at = datetime('now') WHERE key = 'db_version';
UPDATE db_metadata SET value = '0023_reference_tracks', updated_at = datetime('now') WHERE key = 'db_version_name';

