-- Migration: 0014_add_performance_indexes.sql
-- Add indexes for high-frequency queries introduced in Phases 1-2
--
-- Purpose: Optimize Today page server-side state queries
--
-- Indexes added:
-- 1. daily_plans(user_id, plan_date) - Plan lookup by user and date
-- 2. activity_events(user_id, created_at) - Activity timeline queries
-- 3. activity_events(user_id, event_type) - Event type aggregation
-- 4. focus_sessions(user_id, status) - Active session lookup
--
-- Note: Some indexes may already exist; IF NOT EXISTS ensures safety.

-- Index for daily_plans lookup by user and date (most common query)
CREATE INDEX IF NOT EXISTS idx_daily_plans_user_date
ON daily_plans(user_id, plan_date);

-- Index for activity_events by user and creation time
-- Used by: getDynamicUIData (last 14 days), isFirstDay, getResumeLast
CREATE INDEX IF NOT EXISTS idx_activity_events_user_created
ON activity_events(user_id, created_at);

-- Index for activity_events by user and event type
-- Used by: getQuickPicks (aggregation by event_type)
CREATE INDEX IF NOT EXISTS idx_activity_events_user_type
ON activity_events(user_id, event_type);

-- Index for focus_sessions by user and status
-- Used by: hasFocusActive (active session check)
CREATE INDEX IF NOT EXISTS idx_focus_sessions_user_status
ON focus_sessions(user_id, status);

-- Index for user_streaks by user
-- Used by: hasActiveStreak
-- Note: This may already exist, but ensuring it does
CREATE INDEX IF NOT EXISTS idx_user_streaks_user
ON user_streaks(user_id);

