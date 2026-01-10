-- Emergency fix: Ensure accounts.type column exists
-- This migration runs because 0015 may not have executed properly
ALTER TABLE accounts
ADD COLUMN IF NOT EXISTS type TEXT NOT NULL DEFAULT 'oauth';
