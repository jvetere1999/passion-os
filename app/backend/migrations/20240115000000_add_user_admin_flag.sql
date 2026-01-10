-- Add is_admin column to users table
-- This migration adds admin role capability to users

ALTER TABLE users ADD COLUMN IF NOT EXISTS is_admin BOOLEAN NOT NULL DEFAULT FALSE;

-- Create index for fast admin lookups
CREATE INDEX IF NOT EXISTS idx_users_is_admin ON users(is_admin) WHERE is_admin = TRUE;

-- Add comment for documentation
COMMENT ON COLUMN users.is_admin IS 'Indicates if user has administrator privileges';
