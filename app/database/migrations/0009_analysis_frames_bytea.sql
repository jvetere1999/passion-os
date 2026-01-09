-- Migration: 0009_analysis_frames_bytea
-- Created: January 7, 2026
-- Purpose: Enhanced frame storage with bytea for performance + frame manifest
-- Branch: refactor/stack-split

-- =============================================================================
-- Analysis Frame Manifest Table
-- Stores the overall manifest for frame data including timeline definition
-- =============================================================================

CREATE TABLE IF NOT EXISTS analysis_frame_manifests (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    analysis_id UUID NOT NULL REFERENCES track_analyses(id) ON DELETE CASCADE,

    -- Manifest version for schema evolution
    manifest_version TEXT NOT NULL DEFAULT '1.0',

    -- Timeline definition (immutable once created)
    hop_ms INTEGER NOT NULL,           -- Time between frames (e.g., 10ms = 100fps)
    frame_count INTEGER NOT NULL,      -- Total number of frames
    duration_ms INTEGER NOT NULL,      -- Total track duration in ms
    sample_rate INTEGER NOT NULL DEFAULT 44100,

    -- Frame structure definition
    bands JSONB NOT NULL DEFAULT '[]'::jsonb,  -- Array of band definitions
    -- Example: [{"name": "loudness", "type": "float32", "size": 1},
    --           {"name": "spectrum", "type": "float32", "size": 128}]

    -- Byte layout info (for binary parsing)
    bytes_per_frame INTEGER NOT NULL,  -- Total bytes per frame
    frame_layout JSONB NOT NULL DEFAULT '[]'::jsonb,  -- Byte offsets for each band

    -- Events (transients, beats, etc.) stored separately
    events JSONB DEFAULT '[]'::jsonb,
    -- Example: [{"type": "transient", "time_ms": 1234, "strength": 0.8}, ...]

    -- Determinism fingerprint for cache validation
    fingerprint TEXT,                  -- SHA256 of source audio + analyzer version
    analyzer_version TEXT NOT NULL DEFAULT '1.0.0',

    -- Chunk info
    chunk_size_frames INTEGER NOT NULL DEFAULT 1000,  -- Frames per chunk
    total_chunks INTEGER NOT NULL,

    -- Timestamps
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Indexes
CREATE UNIQUE INDEX idx_analysis_frame_manifests_analysis
    ON analysis_frame_manifests(analysis_id);

-- =============================================================================
-- Analysis Frame Data Table
-- Stores frame data as binary chunks (bytea) for efficient retrieval
-- =============================================================================

CREATE TABLE IF NOT EXISTS analysis_frame_data (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    manifest_id UUID NOT NULL REFERENCES analysis_frame_manifests(id) ON DELETE CASCADE,

    -- Chunk position
    chunk_index INTEGER NOT NULL,
    start_frame INTEGER NOT NULL,
    end_frame INTEGER NOT NULL,          -- Exclusive (like Python ranges)
    start_time_ms INTEGER NOT NULL,
    end_time_ms INTEGER NOT NULL,

    -- Binary frame data (packed floats)
    frame_data BYTEA NOT NULL,

    -- Metadata
    frame_count INTEGER NOT NULL,        -- Actual frames in this chunk
    compressed BOOLEAN NOT NULL DEFAULT false,
    compression_type TEXT,               -- 'gzip', 'lz4', etc. (future)

    -- Timestamps
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Indexes for efficient range queries
CREATE INDEX idx_analysis_frame_data_manifest ON analysis_frame_data(manifest_id);
CREATE INDEX idx_analysis_frame_data_time_range ON analysis_frame_data(manifest_id, start_time_ms, end_time_ms);
CREATE UNIQUE INDEX idx_analysis_frame_data_chunk ON analysis_frame_data(manifest_id, chunk_index);

-- =============================================================================
-- Analysis Events Table
-- Stores discrete events (transients, beats, sections) for quick lookup
-- Separate from frames for efficient event-only queries
-- =============================================================================

CREATE TABLE IF NOT EXISTS analysis_events (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    analysis_id UUID NOT NULL REFERENCES track_analyses(id) ON DELETE CASCADE,

    -- Event timing
    time_ms INTEGER NOT NULL,
    duration_ms INTEGER,                 -- NULL for point events

    -- Event type and data
    event_type TEXT NOT NULL,            -- 'transient', 'beat', 'section_start', etc.
    event_data JSONB DEFAULT '{}'::jsonb,

    -- Confidence/strength for detected events
    confidence REAL,

    -- Timestamps
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Indexes for event queries
CREATE INDEX idx_analysis_events_analysis ON analysis_events(analysis_id);
CREATE INDEX idx_analysis_events_time ON analysis_events(analysis_id, time_ms);
CREATE INDEX idx_analysis_events_type ON analysis_events(analysis_id, event_type);

-- =============================================================================
-- Helper function: Get chunks for time range
-- =============================================================================

CREATE OR REPLACE FUNCTION get_frame_chunks_for_range(
    p_manifest_id UUID,
    p_from_ms INTEGER,
    p_to_ms INTEGER
)
RETURNS TABLE (
    chunk_index INTEGER,
    start_frame INTEGER,
    end_frame INTEGER,
    start_time_ms INTEGER,
    end_time_ms INTEGER,
    frame_data BYTEA,
    frame_count INTEGER
) AS $$
BEGIN
    RETURN QUERY
    SELECT
        afd.chunk_index,
        afd.start_frame,
        afd.end_frame,
        afd.start_time_ms,
        afd.end_time_ms,
        afd.frame_data,
        afd.frame_count
    FROM analysis_frame_data afd
    WHERE afd.manifest_id = p_manifest_id
      AND afd.end_time_ms > p_from_ms
      AND afd.start_time_ms < p_to_ms
    ORDER BY afd.chunk_index;
END;
$$ LANGUAGE plpgsql STABLE;

-- =============================================================================
-- Comments for documentation
-- =============================================================================

COMMENT ON TABLE analysis_frame_manifests IS 'Manifest defining frame structure, timeline, and chunk layout for analysis data';
COMMENT ON TABLE analysis_frame_data IS 'Binary chunks of frame data (packed floats) for efficient retrieval';
COMMENT ON TABLE analysis_events IS 'Discrete analysis events (transients, beats, sections) with timestamps';
COMMENT ON COLUMN analysis_frame_manifests.hop_ms IS 'Time between consecutive frames in milliseconds';
COMMENT ON COLUMN analysis_frame_manifests.bands IS 'JSON array defining the data bands in each frame';
COMMENT ON COLUMN analysis_frame_manifests.fingerprint IS 'SHA256 fingerprint for determinism verification';
COMMENT ON COLUMN analysis_frame_data.frame_data IS 'Binary packed frame data (float32 values)';

