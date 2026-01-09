-- ============================================================================
-- Migration: 0012_books_substrate
-- Created: January 7, 2026
-- Purpose: Books and reading sessions tables
--
-- This migration implements:
--   - books: User book library
--   - reading_sessions: Reading session logs
--
-- D1 → Postgres Changes:
--   - TEXT PRIMARY KEY → UUID with gen_random_uuid()
--   - INTEGER (boolean) → BOOLEAN
--   - TEXT timestamps → TIMESTAMPTZ
--   - Added proper indexes and constraints
--
-- References:
--   - d1_usage_inventory.md: D1 books tables
--   - feature_porting_playbook.md: Wave 3.2
-- ============================================================================

-- ============================================================================
-- SECTION 1: BOOKS
-- ============================================================================

CREATE TABLE books (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    
    -- Book info
    title TEXT NOT NULL,
    author TEXT,
    total_pages INTEGER,
    current_page INTEGER NOT NULL DEFAULT 0,
    
    -- Status
    status TEXT NOT NULL DEFAULT 'reading' CHECK (status IN ('want_to_read', 'reading', 'completed', 'abandoned')),
    
    -- Dates
    started_at TIMESTAMPTZ,
    completed_at TIMESTAMPTZ,
    
    -- Review
    rating INTEGER CHECK (rating IS NULL OR (rating >= 1 AND rating <= 5)),
    notes TEXT,
    
    -- Cover image (R2 blob key)
    cover_blob_id UUID,
    
    -- Timestamps
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Indexes
CREATE INDEX idx_books_user ON books(user_id);
CREATE INDEX idx_books_status ON books(user_id, status);
CREATE INDEX idx_books_reading ON books(user_id) WHERE status = 'reading';

-- Auto-update updated_at
CREATE TRIGGER update_books_updated_at
    BEFORE UPDATE ON books
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- ============================================================================
-- SECTION 2: READING SESSIONS
-- ============================================================================

CREATE TABLE reading_sessions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    book_id UUID NOT NULL REFERENCES books(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    
    -- Session details
    pages_read INTEGER NOT NULL,
    duration_minutes INTEGER,
    
    -- Timing
    started_at TIMESTAMPTZ NOT NULL,
    
    -- Notes
    notes TEXT,
    
    -- XP/coins awarded
    xp_awarded INTEGER NOT NULL DEFAULT 0,
    coins_awarded INTEGER NOT NULL DEFAULT 0
);

-- Indexes
CREATE INDEX idx_reading_sessions_book ON reading_sessions(book_id);
CREATE INDEX idx_reading_sessions_user ON reading_sessions(user_id);
CREATE INDEX idx_reading_sessions_date ON reading_sessions(user_id, started_at);

-- ============================================================================
-- SECTION 3: HELPER FUNCTIONS
-- ============================================================================

-- Function to log a reading session and update book progress
CREATE OR REPLACE FUNCTION log_reading_session(
    p_user_id UUID,
    p_book_id UUID,
    p_pages_read INTEGER,
    p_duration_minutes INTEGER DEFAULT NULL,
    p_notes TEXT DEFAULT NULL
)
RETURNS TABLE(
    session_id UUID,
    new_page INTEGER,
    is_completed BOOLEAN,
    xp_awarded INTEGER,
    coins_awarded INTEGER
) AS $$
DECLARE
    v_book books%ROWTYPE;
    v_session_id UUID;
    v_new_page INTEGER;
    v_is_completed BOOLEAN;
    v_xp INTEGER;
    v_coins INTEGER;
BEGIN
    -- Get and lock book
    SELECT * INTO v_book FROM books 
    WHERE id = p_book_id AND user_id = p_user_id 
    FOR UPDATE;
    
    IF NOT FOUND THEN
        RAISE EXCEPTION 'Book not found';
    END IF;
    
    -- Calculate new page
    v_new_page := LEAST(v_book.current_page + p_pages_read, COALESCE(v_book.total_pages, v_book.current_page + p_pages_read));
    v_is_completed := v_book.total_pages IS NOT NULL AND v_new_page >= v_book.total_pages;
    
    -- Calculate rewards (1 XP per 5 pages, 1 coin per 10 pages)
    v_xp := GREATEST(1, p_pages_read / 5);
    v_coins := GREATEST(0, p_pages_read / 10);
    
    -- Create reading session
    INSERT INTO reading_sessions (book_id, user_id, pages_read, duration_minutes, started_at, notes, xp_awarded, coins_awarded)
    VALUES (p_book_id, p_user_id, p_pages_read, p_duration_minutes, NOW(), p_notes, v_xp, v_coins)
    RETURNING id INTO v_session_id;
    
    -- Update book progress
    UPDATE books SET 
        current_page = v_new_page,
        status = CASE WHEN v_is_completed THEN 'completed' ELSE status END,
        completed_at = CASE WHEN v_is_completed THEN NOW() ELSE completed_at END,
        started_at = COALESCE(started_at, NOW())
    WHERE id = p_book_id;
    
    RETURN QUERY SELECT v_session_id, v_new_page, v_is_completed, v_xp, v_coins;
END;
$$ LANGUAGE plpgsql;

-- ============================================================================
-- SECTION 4: HELPER VIEWS
-- ============================================================================

-- Reading statistics by user
CREATE VIEW user_reading_stats AS
SELECT 
    user_id,
    COUNT(DISTINCT id) FILTER (WHERE status = 'completed') AS books_completed,
    COUNT(DISTINCT id) FILTER (WHERE status = 'reading') AS books_reading,
    SUM(current_page) AS total_pages_read,
    COUNT(DISTINCT id) AS total_books
FROM books
GROUP BY user_id;

-- ============================================================================
-- SECTION 5: COMMENTS
-- ============================================================================

COMMENT ON TABLE books IS 'User book library with reading progress';
COMMENT ON TABLE reading_sessions IS 'Reading session logs with XP/coins';
COMMENT ON FUNCTION log_reading_session IS 'Log reading session and update book progress with rewards';
