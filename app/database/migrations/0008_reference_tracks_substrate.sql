-- Migration: 0008_reference_tracks_substrate
-- Created: January 7, 2026
-- Purpose: Reference Track Critical Listening domain tables
-- Branch: refactor/stack-split

-- =============================================================================
-- Reference Tracks Table
-- Stores metadata for uploaded audio reference tracks
-- =============================================================================

CREATE TABLE IF NOT EXISTS reference_tracks (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,

    -- Track metadata
    name TEXT NOT NULL,
    description TEXT,

    -- Audio file reference (R2 key)
    r2_key TEXT NOT NULL,
    file_size_bytes BIGINT NOT NULL,
    mime_type TEXT NOT NULL DEFAULT 'audio/mpeg',
    duration_seconds REAL,

    -- Optional metadata
    artist TEXT,
    album TEXT,
    genre TEXT,
    bpm REAL,
    key_signature TEXT,

    -- Tags for organization (stored as JSONB array)
    tags JSONB DEFAULT '[]'::jsonb,

    -- Status
    status TEXT NOT NULL DEFAULT 'ready' CHECK (status IN ('uploading', 'processing', 'ready', 'error')),
    error_message TEXT,

    -- Timestamps
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Indexes for reference_tracks
CREATE INDEX idx_reference_tracks_user_id ON reference_tracks(user_id);
CREATE INDEX idx_reference_tracks_status ON reference_tracks(status);
CREATE INDEX idx_reference_tracks_created_at ON reference_tracks(created_at DESC);

-- Trigger for updated_at
CREATE TRIGGER update_reference_tracks_updated_at
    BEFORE UPDATE ON reference_tracks
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- =============================================================================
-- Track Analyses Table
-- Stores analysis manifests/results for reference tracks
-- =============================================================================

CREATE TABLE IF NOT EXISTS track_analyses (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    track_id UUID NOT NULL REFERENCES reference_tracks(id) ON DELETE CASCADE,

    -- Analysis metadata
    analysis_type TEXT NOT NULL DEFAULT 'full' CHECK (analysis_type IN ('full', 'quick', 'spectral', 'loudness')),
    version TEXT NOT NULL DEFAULT '1.0',

    -- Status
    status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'running', 'completed', 'failed')),
    started_at TIMESTAMPTZ,
    completed_at TIMESTAMPTZ,
    error_message TEXT,

    -- Summary results (quick access without loading full data)
    summary JSONB DEFAULT '{}'::jsonb,

    -- Full analysis manifest (structure depends on analysis_type)
    -- Contains: loudness curves, frequency analysis, transients, etc.
    manifest JSONB DEFAULT '{}'::jsonb,

    -- Timestamps
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Indexes for track_analyses
CREATE INDEX idx_track_analyses_track_id ON track_analyses(track_id);
CREATE INDEX idx_track_analyses_status ON track_analyses(status);
CREATE UNIQUE INDEX idx_track_analyses_latest ON track_analyses(track_id, analysis_type)
    WHERE status = 'completed';

-- Trigger for updated_at
CREATE TRIGGER update_track_analyses_updated_at
    BEFORE UPDATE ON track_analyses
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- =============================================================================
-- Analysis Frames Chunks Table
-- Stores large frame-by-frame data in chunks (for very large analyses)
-- This avoids storing huge JSONB blobs in track_analyses.manifest
-- =============================================================================

CREATE TABLE IF NOT EXISTS analysis_frame_chunks (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    analysis_id UUID NOT NULL REFERENCES track_analyses(id) ON DELETE CASCADE,

    -- Chunk metadata
    chunk_index INTEGER NOT NULL,
    start_time_ms INTEGER NOT NULL,
    end_time_ms INTEGER NOT NULL,

    -- Frame data (array of frame objects)
    frames JSONB NOT NULL,

    -- Timestamps
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Indexes for analysis_frame_chunks
CREATE INDEX idx_analysis_frame_chunks_analysis_id ON analysis_frame_chunks(analysis_id);
CREATE UNIQUE INDEX idx_analysis_frame_chunks_order ON analysis_frame_chunks(analysis_id, chunk_index);

-- =============================================================================
-- Annotations Table
-- User annotations on specific points or ranges in a track
-- =============================================================================

CREATE TABLE IF NOT EXISTS track_annotations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    track_id UUID NOT NULL REFERENCES reference_tracks(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,

    -- Position (in milliseconds)
    start_time_ms INTEGER NOT NULL,
    end_time_ms INTEGER,  -- NULL for point annotations, set for range annotations

    -- Content
    title TEXT NOT NULL,
    content TEXT,

    -- Categorization
    category TEXT DEFAULT 'general' CHECK (category IN ('general', 'technique', 'mix', 'mastering', 'arrangement', 'production')),
    color TEXT DEFAULT '#3b82f6',  -- Hex color for UI display

    -- Visibility
    is_private BOOLEAN NOT NULL DEFAULT true,

    -- Timestamps
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Indexes for track_annotations
CREATE INDEX idx_track_annotations_track_id ON track_annotations(track_id);
CREATE INDEX idx_track_annotations_user_id ON track_annotations(user_id);
CREATE INDEX idx_track_annotations_time ON track_annotations(track_id, start_time_ms);

-- Trigger for updated_at
CREATE TRIGGER update_track_annotations_updated_at
    BEFORE UPDATE ON track_annotations
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- =============================================================================
-- Regions Table
-- Named regions/sections in a track for structural analysis
-- =============================================================================

CREATE TABLE IF NOT EXISTS track_regions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    track_id UUID NOT NULL REFERENCES reference_tracks(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,

    -- Region bounds (in milliseconds)
    start_time_ms INTEGER NOT NULL,
    end_time_ms INTEGER NOT NULL,

    -- Metadata
    name TEXT NOT NULL,
    description TEXT,

    -- Section type for music structure
    section_type TEXT DEFAULT 'custom' CHECK (section_type IN (
        'intro', 'verse', 'chorus', 'bridge', 'breakdown',
        'buildup', 'drop', 'outro', 'custom'
    )),

    -- Display
    color TEXT DEFAULT '#10b981',

    -- Ordering (for display)
    display_order INTEGER DEFAULT 0,

    -- Timestamps
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

    -- Constraint: end must be after start
    CONSTRAINT check_region_times CHECK (end_time_ms > start_time_ms)
);

-- Indexes for track_regions
CREATE INDEX idx_track_regions_track_id ON track_regions(track_id);
CREATE INDEX idx_track_regions_user_id ON track_regions(user_id);
CREATE INDEX idx_track_regions_time ON track_regions(track_id, start_time_ms, end_time_ms);

-- Trigger for updated_at
CREATE TRIGGER update_track_regions_updated_at
    BEFORE UPDATE ON track_regions
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- =============================================================================
-- DEFERRED: Listening Prompts System
-- These tables are designed but not implemented in v1:
--   - listening_prompts: Guided listening exercise definitions
--   - prompt_instances: User progress through prompts
-- See docs/backend/migration/reference_tracks_domain.md for schema design
-- =============================================================================

-- =============================================================================
-- Views for common queries
-- =============================================================================

-- View: Latest analysis per track
CREATE OR REPLACE VIEW v_track_latest_analysis AS
SELECT DISTINCT ON (ta.track_id, ta.analysis_type)
    ta.id,
    ta.track_id,
    ta.analysis_type,
    ta.version,
    ta.status,
    ta.summary,
    ta.completed_at
FROM track_analyses ta
WHERE ta.status = 'completed'
ORDER BY ta.track_id, ta.analysis_type, ta.completed_at DESC;

-- View: Track with annotation/region counts
CREATE OR REPLACE VIEW v_track_summary AS
SELECT
    rt.id,
    rt.user_id,
    rt.name,
    rt.status,
    rt.duration_seconds,
    rt.created_at,
    COUNT(DISTINCT ta.id) FILTER (WHERE ta.id IS NOT NULL) AS annotation_count,
    COUNT(DISTINCT tr.id) FILTER (WHERE tr.id IS NOT NULL) AS region_count,
    EXISTS(
        SELECT 1 FROM track_analyses an
        WHERE an.track_id = rt.id AND an.status = 'completed'
    ) AS has_analysis
FROM reference_tracks rt
LEFT JOIN track_annotations ta ON ta.track_id = rt.id
LEFT JOIN track_regions tr ON tr.track_id = rt.id
GROUP BY rt.id;

-- =============================================================================
-- Comments for documentation
-- =============================================================================

COMMENT ON TABLE reference_tracks IS 'Reference audio tracks uploaded by users for critical listening analysis';
COMMENT ON TABLE track_analyses IS 'Analysis results/manifests for reference tracks';
COMMENT ON TABLE analysis_frame_chunks IS 'Large frame-by-frame analysis data stored in chunks';
COMMENT ON TABLE track_annotations IS 'User annotations on specific points or ranges in tracks';
COMMENT ON TABLE track_regions IS 'Named sections/regions within tracks for structural analysis';

