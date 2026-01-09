-- Add expires_at field to focus_sessions for session expiry
-- Also add linked_library_id for focus music integration

ALTER TABLE focus_sessions ADD COLUMN expires_at TEXT;
ALTER TABLE focus_sessions ADD COLUMN linked_library_id TEXT;

-- Create index for finding active non-expired sessions
CREATE INDEX IF NOT EXISTS idx_focus_sessions_expires ON focus_sessions(user_id, status, expires_at);

