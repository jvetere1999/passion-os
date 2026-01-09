-- Migration: 0012_tos_db_version.sql
-- Add TOS acceptance tracking and database version metadata

-- TOS acceptance tracking
ALTER TABLE users ADD COLUMN tos_accepted INTEGER NOT NULL DEFAULT 0;
ALTER TABLE users ADD COLUMN tos_accepted_at TEXT;
ALTER TABLE users ADD COLUMN tos_version TEXT;

-- Database version metadata table
CREATE TABLE IF NOT EXISTS db_metadata (
    key TEXT PRIMARY KEY,
    value TEXT NOT NULL,
    updated_at TEXT NOT NULL
);

-- Insert current database version
INSERT OR REPLACE INTO db_metadata (key, value, updated_at) VALUES ('db_version', '12', datetime('now'));
INSERT OR REPLACE INTO db_metadata (key, value, updated_at) VALUES ('db_version_name', '0012_tos_db_version', datetime('now'));

-- Create index for TOS queries
CREATE INDEX IF NOT EXISTS idx_users_tos ON users(tos_accepted);

