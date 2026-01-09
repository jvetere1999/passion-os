-- Migration: 0010_listening_prompt_templates (DOWN)
-- Created: January 7, 2026
-- Purpose: Rollback listening prompt templates

-- Drop views first
DROP VIEW IF EXISTS v_listening_templates_summary;

-- Drop triggers
DROP TRIGGER IF EXISTS update_listening_prompt_presets_updated_at ON listening_prompt_presets;
DROP TRIGGER IF EXISTS update_listening_prompt_templates_updated_at ON listening_prompt_templates;

-- Drop tables (order matters due to FK constraints)
DROP TABLE IF EXISTS listening_prompt_presets;
DROP TABLE IF EXISTS listening_prompt_templates;

