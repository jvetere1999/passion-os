-- Migration: 0013_add_users_last_activity.sql
-- Add last_activity_at column to users table for efficient activity tracking
--
-- Purpose: Enables O(1) lookup for reduced mode check instead of
--          scanning activity_events table per request.
--
-- Type: TEXT (ISO 8601 timestamp string)
-- Nullable: YES (backward compatible with existing rows)
-- Updated by: logActivityEvent() in activity-events.ts via touchUserActivity()

-- Add column
ALTER TABLE users ADD COLUMN last_activity_at TEXT;

-- Add index for efficient queries
CREATE INDEX IF NOT EXISTS idx_users_last_activity ON users(last_activity_at);

-- Backfill from activity_events (most recent per user)
UPDATE users
SET last_activity_at = (
    SELECT MAX(created_at)
    FROM activity_events
    WHERE activity_events.user_id = users.id
)
WHERE EXISTS (
    SELECT 1 FROM activity_events WHERE activity_events.user_id = users.id
);

