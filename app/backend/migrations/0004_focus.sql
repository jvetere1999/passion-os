-- Migration 0004: Focus
-- Focus timer sessions and libraries
-- Tables: focus_sessions, focus_pause_state, focus_libraries, focus_library_tracks

-- =============================================================================
-- FOCUS_SESSIONS
-- =============================================================================
CREATE TABLE focus_sessions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    mode TEXT NOT NULL,
    duration_seconds INTEGER NOT NULL,
    started_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    completed_at TIMESTAMPTZ,
    abandoned_at TIMESTAMPTZ,
    expires_at TIMESTAMPTZ,
    paused_at TIMESTAMPTZ,
    paused_remaining_seconds INTEGER,
    status TEXT NOT NULL DEFAULT 'active',
    xp_awarded INTEGER NOT NULL DEFAULT 0,
    coins_awarded INTEGER NOT NULL DEFAULT 0,
    task_id UUID,
    task_title TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX focus_sessions_user_id_idx ON focus_sessions(user_id);
CREATE INDEX focus_sessions_status_idx ON focus_sessions(status) WHERE status = 'active';
CREATE INDEX focus_sessions_started_at_idx ON focus_sessions(started_at DESC);

-- =============================================================================
-- FOCUS_PAUSE_STATE (Cross-device sync)
-- =============================================================================
CREATE TABLE focus_pause_state (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    session_id UUID NOT NULL REFERENCES focus_sessions(id) ON DELETE CASCADE,
    mode TEXT,
    is_paused BOOLEAN NOT NULL DEFAULT false,
    time_remaining_seconds INTEGER,
    paused_at TIMESTAMPTZ,
    resumed_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UNIQUE(session_id)
);

CREATE INDEX focus_pause_state_user_idx ON focus_pause_state(user_id);

CREATE TRIGGER update_focus_pause_state_updated_at
    BEFORE UPDATE ON focus_pause_state
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- =============================================================================
-- FOCUS_LIBRARIES
-- =============================================================================
CREATE TABLE focus_libraries (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    description TEXT,
    library_type TEXT NOT NULL DEFAULT 'playlist',
    tracks_count INTEGER NOT NULL DEFAULT 0,
    is_favorite BOOLEAN NOT NULL DEFAULT false,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX focus_libraries_user_idx ON focus_libraries(user_id);

CREATE TRIGGER update_focus_libraries_updated_at
    BEFORE UPDATE ON focus_libraries
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- =============================================================================
-- FOCUS_LIBRARY_TRACKS
-- =============================================================================
CREATE TABLE focus_library_tracks (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    library_id UUID NOT NULL REFERENCES focus_libraries(id) ON DELETE CASCADE,
    track_id TEXT,
    track_title TEXT NOT NULL,
    track_url TEXT,
    duration_seconds INTEGER,
    sort_order INTEGER NOT NULL DEFAULT 0,
    added_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX focus_library_tracks_library_idx ON focus_library_tracks(library_id);
