-- ============================================================================
-- IGNITION DATABASE RESET - DROP ALL TABLES
-- Run this BEFORE 0020_schema_reset_v2.sql
-- WARNING: This will DELETE ALL DATA
-- ============================================================================

-- Disable foreign key checks temporarily for clean drops
PRAGMA foreign_keys = OFF;

-- Drop all tables in reverse dependency order
DROP TABLE IF EXISTS access_requests;
DROP TABLE IF EXISTS db_metadata;
DROP TABLE IF EXISTS track_analysis_cache;
DROP TABLE IF EXISTS glossary_terms;
DROP TABLE IF EXISTS daw_shortcuts;
DROP TABLE IF EXISTS ignition_packs;
DROP TABLE IF EXISTS infobase_entries;
DROP TABLE IF EXISTS ideas;
DROP TABLE IF EXISTS reading_sessions;
DROP TABLE IF EXISTS books;
DROP TABLE IF EXISTS workout_sessions;
DROP TABLE IF EXISTS workouts;
DROP TABLE IF EXISTS exercises;
DROP TABLE IF EXISTS plan_templates;
DROP TABLE IF EXISTS daily_plans;
DROP TABLE IF EXISTS user_drill_stats;
DROP TABLE IF EXISTS user_lesson_progress;
DROP TABLE IF EXISTS learn_drills;
DROP TABLE IF EXISTS learn_lessons;
DROP TABLE IF EXISTS learn_topics;
DROP TABLE IF EXISTS goals;
DROP TABLE IF EXISTS habit_logs;
DROP TABLE IF EXISTS habits;
DROP TABLE IF EXISTS quests;
DROP TABLE IF EXISTS focus_sessions;
DROP TABLE IF EXISTS user_purchases;
DROP TABLE IF EXISTS market_items;
DROP TABLE IF EXISTS activity_events;
DROP TABLE IF EXISTS user_streaks;
DROP TABLE IF EXISTS user_achievements;
DROP TABLE IF EXISTS achievement_definitions;
DROP TABLE IF EXISTS user_skills;
DROP TABLE IF EXISTS skill_definitions;
DROP TABLE IF EXISTS user_wallet;
DROP TABLE IF EXISTS points_ledger;
DROP TABLE IF EXISTS user_onboarding_state;
DROP TABLE IF EXISTS onboarding_steps;
DROP TABLE IF EXISTS onboarding_flows;
DROP TABLE IF EXISTS user_ui_modules;
DROP TABLE IF EXISTS user_interests;
DROP TABLE IF EXISTS user_settings;
DROP TABLE IF EXISTS authenticators;
DROP TABLE IF EXISTS verification_tokens;
DROP TABLE IF EXISTS sessions;
DROP TABLE IF EXISTS accounts;
DROP TABLE IF EXISTS users;

-- Legacy tables from older migrations
DROP TABLE IF EXISTS focus_pause_state;
DROP TABLE IF EXISTS user_progress;
DROP TABLE IF EXISTS skill_trees;
DROP TABLE IF EXISTS reward_ledger;
DROP TABLE IF EXISTS universal_quests;
DROP TABLE IF EXISTS user_quest_progress;
DROP TABLE IF EXISTS calendar_events;
DROP TABLE IF EXISTS goal_milestones;
DROP TABLE IF EXISTS lesson_progress;
DROP TABLE IF EXISTS lessons;
DROP TABLE IF EXISTS courses;
DROP TABLE IF EXISTS user_feedback;

-- Re-enable foreign key checks
PRAGMA foreign_keys = ON;

