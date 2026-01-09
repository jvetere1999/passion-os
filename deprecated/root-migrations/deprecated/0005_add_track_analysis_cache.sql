-- Track analysis cache
-- Stores computed audio analysis data keyed by content hash
-- This allows sharing analysis across machines and sessions

CREATE TABLE IF NOT EXISTS track_analysis_cache (
  id TEXT PRIMARY KEY,
  content_hash TEXT NOT NULL UNIQUE,
  name TEXT NOT NULL,
  duration_ms INTEGER,
  bpm REAL,
  key TEXT,
  peak_db REAL,
  rms_db REAL,
  lufs REAL,
  frequency_profile TEXT,
  waveform_data TEXT,
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE INDEX IF NOT EXISTS idx_track_analysis_content_hash ON track_analysis_cache(content_hash);

