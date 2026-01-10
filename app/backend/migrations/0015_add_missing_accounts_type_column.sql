-- Migration: 0015_add_missing_accounts_type_column.sql
-- Purpose: Add the `type` column to `accounts` table if it's missing
-- Reason: The `type` column was defined in 0001_auth_substrate.sql but may not have been applied in production
-- Safety: Non-breaking; adds NOT NULL column with DEFAULT 'oauth'
-- Audit Trail: See agent/db_schema_audit.md for full analysis

-- Add the type column to accounts table if missing
ALTER TABLE accounts
ADD COLUMN IF NOT EXISTS type TEXT NOT NULL DEFAULT 'oauth';

-- Audit: This migration is a safety net for the case where migration 0001
-- was never applied or was partially applied in production. It ensures the
-- `type` column exists with the correct definition, allowing AccountRepo
-- queries to succeed without errors.
--
-- Code expecting this column:
-- - [app/backend/crates/api/src/db/models.rs#L72] - Account struct field
-- - [app/backend/crates/api/src/db/repos.rs#L143] - find_by_provider query
-- - [app/backend/crates/api/src/db/repos.rs#L165] - find_by_user_id query
-- - [app/backend/crates/api/src/db/repos.rs#L192] - upsert query
--
-- Failing handlers:
-- - [app/backend/crates/api/src/routes/auth.rs#L147] - callback_google
-- - [app/backend/crates/api/src/routes/auth.rs#L202] - callback_azure
