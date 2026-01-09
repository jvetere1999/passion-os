-- ============================================================================
-- MASTER MIGRATION 0100: Complete Database Schema (Consolidated)
-- Created: January 6, 2026
-- Last Updated: January 6, 2026
-- Purpose: Single source of truth for complete database schema + seed data
--
-- This is the ONLY migration file needed for fresh deployments.
-- All previous migrations (0001-0027, 0101-0102) have been deprecated and
-- moved to migrations/deprecated/
--
-- Tables included:
-- - Auth (users, accounts, sessions, verification_tokens, authenticators)
-- - User Settings & Personalization (user_settings, user_interests, user_ui_modules)
-- - Onboarding (onboarding_flows, onboarding_steps, user_onboarding_state)
-- - Gamification (skill_definitions, user_skills, achievement_definitions,
--   user_achievements, user_wallet, points_ledger, user_streaks, activity_events)
-- - Market (market_items, user_purchases)
-- - Focus (focus_sessions, focus_pause_state)
-- - Quests (quests, universal_quests, user_quest_progress)
-- - Habits (habits, habit_logs)
-- - Goals (goals, goal_milestones)
-- - Exercise/Fitness (exercises, workouts, workout_sections, workout_exercises,
--   workout_sessions, exercise_sets, personal_records, training_programs,
--   program_weeks, program_workouts)
-- - Books (books, reading_sessions)
-- - Learn (learn_topics, learn_lessons, learn_drills, user_lesson_progress,
--   user_drill_stats, flashcard_decks, flashcards)
-- - Journal (journal_entries)
-- - Planning (calendar_events, daily_plans, plan_templates)
-- - Content (ignition_packs, daw_shortcuts, glossary_terms, recipe_templates,
--   infobase_entries, ideas)
-- - Reference/Audio (reference_tracks, track_analysis_cache)
-- - System (feedback, notifications, admin_audit_log, access_requests, db_metadata)
-- ============================================================================

-- Disable foreign key checks during rebuild
PRAGMA foreign_keys = OFF;

-- ============================================================================
-- SECTION 1: DROP ALL EXISTING TABLES
-- ============================================================================

-- Auth tables
DROP TABLE IF EXISTS authenticators;
DROP TABLE IF EXISTS verification_tokens;
DROP TABLE IF EXISTS sessions;
DROP TABLE IF EXISTS accounts;

-- User-related tables (drop children first)
DROP TABLE IF EXISTS user_achievements;
DROP TABLE IF EXISTS user_skills;
DROP TABLE IF EXISTS user_streaks;
DROP TABLE IF EXISTS user_wallet;
DROP TABLE IF EXISTS user_purchases;
DROP TABLE IF EXISTS user_interests;
DROP TABLE IF EXISTS user_ui_modules;
DROP TABLE IF EXISTS user_settings;
DROP TABLE IF EXISTS user_onboarding_state;
DROP TABLE IF EXISTS user_lesson_progress;
DROP TABLE IF EXISTS user_drill_stats;
DROP TABLE IF EXISTS user_quest_progress;
DROP TABLE IF EXISTS user_progress;
DROP TABLE IF EXISTS user_feedback;

-- Activity and events
DROP TABLE IF EXISTS activity_events;
DROP TABLE IF EXISTS points_ledger;

-- Focus
DROP TABLE IF EXISTS focus_sessions;
DROP TABLE IF EXISTS focus_pause_state;

-- Quests
DROP TABLE IF EXISTS quests;

-- Habits
DROP TABLE IF EXISTS habit_logs;
DROP TABLE IF EXISTS habits;

-- Goals
DROP TABLE IF EXISTS goal_milestones;
DROP TABLE IF EXISTS goals;

-- Exercise/Fitness
DROP TABLE IF EXISTS personal_records;
DROP TABLE IF EXISTS exercise_sets;
DROP TABLE IF EXISTS workout_exercises;
DROP TABLE IF EXISTS workout_sections;
DROP TABLE IF EXISTS workout_sessions;
DROP TABLE IF EXISTS program_workouts;
DROP TABLE IF EXISTS program_weeks;
DROP TABLE IF EXISTS training_programs;
DROP TABLE IF EXISTS workouts;
DROP TABLE IF EXISTS exercises;

-- Books
DROP TABLE IF EXISTS reading_sessions;
DROP TABLE IF EXISTS books;

-- Learn
DROP TABLE IF EXISTS learn_drills;
DROP TABLE IF EXISTS learn_lessons;
DROP TABLE IF EXISTS learn_exercises;
DROP TABLE IF EXISTS learn_modules;
DROP TABLE IF EXISTS learn_projects;
DROP TABLE IF EXISTS learn_topics;
DROP TABLE IF EXISTS flashcards;
DROP TABLE IF EXISTS flashcard_decks;
DROP TABLE IF EXISTS journal_entries;
DROP TABLE IF EXISTS courses;
DROP TABLE IF EXISTS lessons;

-- Planning
DROP TABLE IF EXISTS calendar_events;
DROP TABLE IF EXISTS daily_plans;
DROP TABLE IF EXISTS plan_templates;

-- Market
DROP TABLE IF EXISTS reward_purchases;
DROP TABLE IF EXISTS rewards;
DROP TABLE IF EXISTS user_purchases;
DROP TABLE IF EXISTS market_items;

-- Gamification
DROP TABLE IF EXISTS achievement_definitions;
DROP TABLE IF EXISTS skill_definitions;

-- Content
DROP TABLE IF EXISTS ignition_packs;
DROP TABLE IF EXISTS daw_shortcuts;
DROP TABLE IF EXISTS glossary_terms;
DROP TABLE IF EXISTS recipe_templates;
DROP TABLE IF EXISTS infobase_entries;
DROP TABLE IF EXISTS ideas;

-- Reference/Audio
DROP TABLE IF EXISTS track_analysis_cache;
DROP TABLE IF EXISTS reference_tracks;

-- Onboarding
DROP TABLE IF EXISTS onboarding_steps;
DROP TABLE IF EXISTS onboarding_flows;

-- System
DROP TABLE IF EXISTS notifications;
DROP TABLE IF EXISTS feedback;
DROP TABLE IF EXISTS admin_audit_log;
DROP TABLE IF EXISTS access_requests;
DROP TABLE IF EXISTS db_metadata;

-- Finally drop users table
DROP TABLE IF EXISTS users;

-- ============================================================================
-- SECTION 2: CREATE AUTH TABLES (NextAuth.js)
-- ============================================================================

CREATE TABLE users (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL DEFAULT 'User',
    email TEXT NOT NULL UNIQUE,
    emailVerified INTEGER,
    image TEXT,
    role TEXT NOT NULL DEFAULT 'user',
    approved INTEGER NOT NULL DEFAULT 1,
    age_verified INTEGER NOT NULL DEFAULT 1,
    tos_accepted INTEGER NOT NULL DEFAULT 0,
    tos_accepted_at TEXT,
    tos_version TEXT,
    last_activity_at TEXT,
    created_at TEXT NOT NULL DEFAULT (datetime('now')),
    updated_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE TABLE accounts (
    id TEXT PRIMARY KEY,
    userId TEXT NOT NULL,
    type TEXT NOT NULL,
    provider TEXT NOT NULL,
    providerAccountId TEXT NOT NULL,
    refresh_token TEXT,
    access_token TEXT,
    expires_at INTEGER,
    token_type TEXT,
    scope TEXT,
    id_token TEXT,
    session_state TEXT,
    FOREIGN KEY (userId) REFERENCES users(id) ON DELETE CASCADE
);

CREATE TABLE sessions (
    id TEXT PRIMARY KEY,
    sessionToken TEXT NOT NULL UNIQUE,
    userId TEXT NOT NULL,
    expires TEXT NOT NULL,
    FOREIGN KEY (userId) REFERENCES users(id) ON DELETE CASCADE
);

CREATE TABLE verification_tokens (
    identifier TEXT NOT NULL,
    token TEXT NOT NULL UNIQUE,
    expires TEXT NOT NULL,
    PRIMARY KEY (identifier, token)
);

CREATE TABLE authenticators (
    credentialID TEXT PRIMARY KEY,
    userId TEXT NOT NULL,
    providerAccountId TEXT NOT NULL,
    credentialPublicKey TEXT NOT NULL,
    counter INTEGER NOT NULL,
    credentialDeviceType TEXT NOT NULL,
    credentialBackedUp INTEGER NOT NULL,
    transports TEXT,
    FOREIGN KEY (userId) REFERENCES users(id) ON DELETE CASCADE
);

-- ============================================================================
-- SECTION 3: CREATE USER SETTINGS & PERSONALIZATION
-- ============================================================================

CREATE TABLE user_settings (
    id TEXT PRIMARY KEY,
    user_id TEXT NOT NULL UNIQUE,
    nudge_intensity TEXT DEFAULT 'standard',
    default_focus_duration INTEGER DEFAULT 300,
    gamification_visible TEXT DEFAULT 'always',
    planner_mode TEXT DEFAULT 'collapsed',
    theme TEXT DEFAULT 'system',
    notifications_enabled INTEGER DEFAULT 1,
    created_at TEXT NOT NULL DEFAULT (datetime('now')),
    updated_at TEXT NOT NULL DEFAULT (datetime('now')),
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

CREATE TABLE user_interests (
    id TEXT PRIMARY KEY,
    user_id TEXT NOT NULL,
    interest_key TEXT NOT NULL,
    priority INTEGER NOT NULL DEFAULT 1,
    created_at TEXT NOT NULL DEFAULT (datetime('now')),
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    UNIQUE(user_id, interest_key)
);

CREATE TABLE user_ui_modules (
    id TEXT PRIMARY KEY,
    user_id TEXT NOT NULL,
    module_key TEXT NOT NULL,
    weight INTEGER NOT NULL DEFAULT 50,
    enabled INTEGER NOT NULL DEFAULT 1,
    last_shown_at TEXT,
    created_at TEXT NOT NULL DEFAULT (datetime('now')),
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    UNIQUE(user_id, module_key)
);

-- ============================================================================
-- SECTION 4: CREATE ONBOARDING TABLES
-- ============================================================================

CREATE TABLE onboarding_flows (
    id TEXT PRIMARY KEY,
    version INTEGER NOT NULL,
    name TEXT NOT NULL,
    description TEXT,
    is_active INTEGER NOT NULL DEFAULT 0,
    total_steps INTEGER NOT NULL,
    created_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE TABLE onboarding_steps (
    id TEXT PRIMARY KEY,
    flow_id TEXT NOT NULL,
    step_order INTEGER NOT NULL,
    step_type TEXT NOT NULL,
    title TEXT NOT NULL,
    description TEXT,
    target_selector TEXT,
    target_route TEXT,
    fallback_content TEXT,
    options_json TEXT,
    allows_multiple INTEGER NOT NULL DEFAULT 0,
    required INTEGER NOT NULL DEFAULT 0,
    action_type TEXT,
    action_config_json TEXT,
    FOREIGN KEY (flow_id) REFERENCES onboarding_flows(id) ON DELETE CASCADE
);

CREATE TABLE user_onboarding_state (
    id TEXT PRIMARY KEY,
    user_id TEXT NOT NULL UNIQUE,
    flow_id TEXT NOT NULL,
    current_step_id TEXT,
    status TEXT NOT NULL DEFAULT 'not_started',
    started_at TEXT,
    completed_at TEXT,
    skipped_at TEXT,
    last_step_completed_at TEXT,
    responses_json TEXT,
    can_resume INTEGER NOT NULL DEFAULT 1,
    created_at TEXT NOT NULL DEFAULT (datetime('now')),
    updated_at TEXT NOT NULL DEFAULT (datetime('now')),
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (flow_id) REFERENCES onboarding_flows(id)
);

-- ============================================================================
-- SECTION 5: CREATE GAMIFICATION TABLES
-- ============================================================================

CREATE TABLE skill_definitions (
    id TEXT PRIMARY KEY,
    key TEXT NOT NULL UNIQUE,
    name TEXT NOT NULL,
    description TEXT,
    category TEXT NOT NULL,
    icon TEXT,
    max_level INTEGER NOT NULL DEFAULT 10,
    stars_per_level INTEGER NOT NULL DEFAULT 10,
    sort_order INTEGER NOT NULL DEFAULT 0,
    created_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE TABLE user_skills (
    id TEXT PRIMARY KEY,
    user_id TEXT NOT NULL,
    skill_key TEXT NOT NULL,
    current_stars INTEGER NOT NULL DEFAULT 0,
    current_level INTEGER NOT NULL DEFAULT 0,
    updated_at TEXT NOT NULL DEFAULT (datetime('now')),
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (skill_key) REFERENCES skill_definitions(key),
    UNIQUE(user_id, skill_key)
);

CREATE TABLE achievement_definitions (
    id TEXT PRIMARY KEY,
    key TEXT NOT NULL UNIQUE,
    name TEXT NOT NULL,
    description TEXT,
    category TEXT NOT NULL,
    icon TEXT,
    trigger_type TEXT NOT NULL,
    trigger_config_json TEXT,
    reward_coins INTEGER NOT NULL DEFAULT 0,
    reward_xp INTEGER NOT NULL DEFAULT 0,
    is_hidden INTEGER NOT NULL DEFAULT 0,
    sort_order INTEGER NOT NULL DEFAULT 0,
    created_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE TABLE user_achievements (
    id TEXT PRIMARY KEY,
    user_id TEXT NOT NULL,
    achievement_key TEXT NOT NULL,
    earned_at TEXT NOT NULL,
    notified INTEGER NOT NULL DEFAULT 0,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (achievement_key) REFERENCES achievement_definitions(key),
    UNIQUE(user_id, achievement_key)
);

CREATE TABLE user_wallet (
    id TEXT PRIMARY KEY,
    user_id TEXT NOT NULL UNIQUE,
    coins INTEGER NOT NULL DEFAULT 0,
    xp INTEGER NOT NULL DEFAULT 0,
    level INTEGER NOT NULL DEFAULT 1,
    xp_to_next_level INTEGER NOT NULL DEFAULT 100,
    total_skill_stars INTEGER NOT NULL DEFAULT 0,
    updated_at TEXT NOT NULL DEFAULT (datetime('now')),
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

CREATE TABLE points_ledger (
    id TEXT PRIMARY KEY,
    user_id TEXT NOT NULL,
    event_type TEXT NOT NULL,
    event_id TEXT,
    coins INTEGER NOT NULL DEFAULT 0,
    xp INTEGER NOT NULL DEFAULT 0,
    skill_stars INTEGER NOT NULL DEFAULT 0,
    skill_key TEXT,
    reason TEXT,
    idempotency_key TEXT UNIQUE,
    created_at TEXT NOT NULL DEFAULT (datetime('now')),
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

CREATE TABLE user_streaks (
    id TEXT PRIMARY KEY,
    user_id TEXT NOT NULL,
    streak_type TEXT NOT NULL,
    current_streak INTEGER NOT NULL DEFAULT 0,
    longest_streak INTEGER NOT NULL DEFAULT 0,
    last_activity_date TEXT,
    updated_at TEXT NOT NULL DEFAULT (datetime('now')),
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    UNIQUE(user_id, streak_type)
);

CREATE TABLE activity_events (
    id TEXT PRIMARY KEY,
    user_id TEXT NOT NULL,
    event_type TEXT NOT NULL,
    metadata_json TEXT,
    created_at TEXT NOT NULL DEFAULT (datetime('now')),
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

CREATE INDEX idx_activity_events_user ON activity_events(user_id);
CREATE INDEX idx_activity_events_type ON activity_events(event_type);
CREATE INDEX idx_activity_events_created ON activity_events(created_at);

-- ============================================================================
-- SECTION 6: CREATE MARKET TABLES
-- ============================================================================

CREATE TABLE market_items (
    id TEXT PRIMARY KEY,
    key TEXT NOT NULL UNIQUE,
    name TEXT NOT NULL,
    description TEXT,
    category TEXT NOT NULL,
    cost_coins INTEGER NOT NULL,
    icon TEXT,
    is_global INTEGER NOT NULL DEFAULT 1,
    is_available INTEGER NOT NULL DEFAULT 1,
    is_active INTEGER NOT NULL DEFAULT 1,
    is_consumable INTEGER NOT NULL DEFAULT 1,
    sort_order INTEGER NOT NULL DEFAULT 0,
    created_by_user_id TEXT,
    created_at TEXT NOT NULL DEFAULT (datetime('now')),
    FOREIGN KEY (created_by_user_id) REFERENCES users(id) ON DELETE SET NULL
);

CREATE TABLE user_purchases (
    id TEXT PRIMARY KEY,
    user_id TEXT NOT NULL,
    item_id TEXT NOT NULL,
    cost_coins INTEGER NOT NULL,
    purchased_at TEXT NOT NULL DEFAULT (datetime('now')),
    redeemed_at TEXT,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (item_id) REFERENCES market_items(id)
);

-- ============================================================================
-- SECTION 7: CREATE FOCUS TABLES
-- ============================================================================

CREATE TABLE focus_sessions (
    id TEXT PRIMARY KEY,
    user_id TEXT NOT NULL,
    mode TEXT NOT NULL DEFAULT 'focus',
    duration INTEGER NOT NULL,
    started_at TEXT NOT NULL,
    completed_at TEXT,
    abandoned_at TEXT,
    paused_at TEXT,
    paused_remaining INTEGER,
    expires_at TEXT,
    status TEXT NOT NULL DEFAULT 'active',
    xp_awarded INTEGER NOT NULL DEFAULT 0,
    coins_awarded INTEGER NOT NULL DEFAULT 0,
    created_at TEXT NOT NULL DEFAULT (datetime('now')),
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

CREATE INDEX idx_focus_sessions_user ON focus_sessions(user_id);
CREATE INDEX idx_focus_sessions_status ON focus_sessions(status);

CREATE TABLE focus_pause_state (
    id TEXT PRIMARY KEY,
    user_id TEXT NOT NULL,
    mode TEXT NOT NULL DEFAULT 'focus',
    time_remaining INTEGER NOT NULL DEFAULT 0,
    paused_at TEXT NOT NULL,
    created_at TEXT NOT NULL DEFAULT (datetime('now')),
    updated_at TEXT NOT NULL DEFAULT (datetime('now')),
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

CREATE INDEX idx_focus_pause_user ON focus_pause_state(user_id);

-- ============================================================================
-- SECTION 8: CREATE QUESTS TABLES
-- ============================================================================

CREATE TABLE quests (
    id TEXT PRIMARY KEY,
    user_id TEXT,
    title TEXT NOT NULL,
    description TEXT,
    category TEXT NOT NULL,
    difficulty TEXT NOT NULL DEFAULT 'starter',
    xp_reward INTEGER NOT NULL DEFAULT 10,
    coin_reward INTEGER NOT NULL DEFAULT 5,
    is_universal INTEGER NOT NULL DEFAULT 0,
    is_active INTEGER NOT NULL DEFAULT 1,
    status TEXT NOT NULL DEFAULT 'available',
    accepted_at TEXT,
    completed_at TEXT,
    expires_at TEXT,
    is_repeatable INTEGER NOT NULL DEFAULT 0,
    repeat_frequency TEXT,
    last_completed_date TEXT,
    streak_count INTEGER NOT NULL DEFAULT 0,
    created_at TEXT NOT NULL DEFAULT (datetime('now')),
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

CREATE INDEX idx_quests_user ON quests(user_id);
CREATE INDEX idx_quests_universal ON quests(is_universal);

-- Universal quests (shared across all users, referenced by API)
CREATE TABLE universal_quests (
    id TEXT PRIMARY KEY,
    title TEXT NOT NULL,
    description TEXT,
    type TEXT NOT NULL DEFAULT 'daily',
    xp_reward INTEGER NOT NULL DEFAULT 10,
    coin_reward INTEGER NOT NULL DEFAULT 5,
    target INTEGER NOT NULL DEFAULT 1,
    skill_id TEXT,
    is_active INTEGER NOT NULL DEFAULT 1,
    created_by TEXT,
    created_at TEXT NOT NULL DEFAULT (datetime('now')),
    updated_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE INDEX idx_universal_quests_type ON universal_quests(type);
CREATE INDEX idx_universal_quests_active ON universal_quests(is_active);

CREATE TABLE user_quest_progress (
    id TEXT PRIMARY KEY,
    user_id TEXT NOT NULL,
    quest_id TEXT NOT NULL,
    status TEXT NOT NULL DEFAULT 'available',
    progress INTEGER NOT NULL DEFAULT 0,
    completed INTEGER NOT NULL DEFAULT 0,
    accepted_at TEXT,
    completed_at TEXT,
    created_at TEXT NOT NULL DEFAULT (datetime('now')),
    updated_at TEXT NOT NULL DEFAULT (datetime('now')),
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    UNIQUE(user_id, quest_id)
);

-- ============================================================================
-- SECTION 9: CREATE HABITS TABLES
-- ============================================================================

CREATE TABLE habits (
    id TEXT PRIMARY KEY,
    user_id TEXT NOT NULL,
    name TEXT NOT NULL,
    description TEXT,
    frequency TEXT NOT NULL DEFAULT 'daily',
    target_count INTEGER NOT NULL DEFAULT 1,
    icon TEXT,
    color TEXT,
    is_active INTEGER NOT NULL DEFAULT 1,
    created_at TEXT NOT NULL DEFAULT (datetime('now')),
    updated_at TEXT NOT NULL DEFAULT (datetime('now')),
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

CREATE TABLE habit_logs (
    id TEXT PRIMARY KEY,
    habit_id TEXT NOT NULL,
    user_id TEXT NOT NULL,
    completed_at TEXT NOT NULL,
    notes TEXT,
    FOREIGN KEY (habit_id) REFERENCES habits(id) ON DELETE CASCADE,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

CREATE INDEX idx_habit_logs_habit ON habit_logs(habit_id);
CREATE INDEX idx_habit_logs_user ON habit_logs(user_id);

-- ============================================================================
-- SECTION 10: CREATE GOALS TABLES
-- ============================================================================

CREATE TABLE goals (
    id TEXT PRIMARY KEY,
    user_id TEXT NOT NULL,
    title TEXT NOT NULL,
    description TEXT,
    category TEXT,
    target_date TEXT,
    status TEXT NOT NULL DEFAULT 'active',
    progress INTEGER NOT NULL DEFAULT 0,
    created_at TEXT NOT NULL DEFAULT (datetime('now')),
    updated_at TEXT NOT NULL DEFAULT (datetime('now')),
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

CREATE TABLE goal_milestones (
    id TEXT PRIMARY KEY,
    goal_id TEXT NOT NULL,
    title TEXT NOT NULL,
    is_completed INTEGER NOT NULL DEFAULT 0,
    completed_at TEXT,
    sort_order INTEGER NOT NULL DEFAULT 0,
    FOREIGN KEY (goal_id) REFERENCES goals(id) ON DELETE CASCADE
);

-- ============================================================================
-- SECTION 11: CREATE EXERCISE/FITNESS TABLES
-- ============================================================================

CREATE TABLE exercises (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    description TEXT,
    category TEXT NOT NULL,
    muscle_groups TEXT,
    equipment TEXT,
    is_custom INTEGER NOT NULL DEFAULT 0,
    is_builtin INTEGER NOT NULL DEFAULT 0,
    user_id TEXT,
    created_at TEXT NOT NULL DEFAULT (datetime('now')),
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

CREATE TABLE workouts (
    id TEXT PRIMARY KEY,
    user_id TEXT NOT NULL,
    name TEXT NOT NULL,
    description TEXT,
    estimated_duration INTEGER,
    is_template INTEGER NOT NULL DEFAULT 0,
    created_at TEXT NOT NULL DEFAULT (datetime('now')),
    updated_at TEXT NOT NULL DEFAULT (datetime('now')),
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

CREATE TABLE workout_sections (
    id TEXT PRIMARY KEY,
    workout_id TEXT NOT NULL,
    name TEXT NOT NULL,
    sort_order INTEGER NOT NULL DEFAULT 0,
    FOREIGN KEY (workout_id) REFERENCES workouts(id) ON DELETE CASCADE
);

CREATE TABLE workout_exercises (
    id TEXT PRIMARY KEY,
    workout_id TEXT NOT NULL,
    section_id TEXT,
    exercise_id TEXT NOT NULL,
    sets INTEGER NOT NULL DEFAULT 3,
    reps TEXT,
    weight TEXT,
    duration INTEGER,
    rest_seconds INTEGER,
    notes TEXT,
    sort_order INTEGER NOT NULL DEFAULT 0,
    FOREIGN KEY (workout_id) REFERENCES workouts(id) ON DELETE CASCADE,
    FOREIGN KEY (section_id) REFERENCES workout_sections(id) ON DELETE SET NULL,
    FOREIGN KEY (exercise_id) REFERENCES exercises(id) ON DELETE CASCADE
);

CREATE TABLE workout_sessions (
    id TEXT PRIMARY KEY,
    user_id TEXT NOT NULL,
    workout_id TEXT,
    started_at TEXT NOT NULL,
    completed_at TEXT,
    notes TEXT,
    rating INTEGER,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (workout_id) REFERENCES workouts(id) ON DELETE SET NULL
);

CREATE TABLE exercise_sets (
    id TEXT PRIMARY KEY,
    session_id TEXT NOT NULL,
    exercise_id TEXT NOT NULL,
    set_number INTEGER NOT NULL,
    reps INTEGER,
    weight REAL,
    duration INTEGER,
    is_warmup INTEGER NOT NULL DEFAULT 0,
    is_dropset INTEGER NOT NULL DEFAULT 0,
    rpe INTEGER,
    notes TEXT,
    completed_at TEXT,
    FOREIGN KEY (session_id) REFERENCES workout_sessions(id) ON DELETE CASCADE,
    FOREIGN KEY (exercise_id) REFERENCES exercises(id) ON DELETE CASCADE
);

CREATE TABLE personal_records (
    id TEXT PRIMARY KEY,
    user_id TEXT NOT NULL,
    exercise_id TEXT NOT NULL,
    record_type TEXT NOT NULL,
    value REAL NOT NULL,
    reps INTEGER,
    achieved_at TEXT NOT NULL,
    exercise_set_id TEXT,
    previous_value REAL,
    created_at TEXT NOT NULL DEFAULT (datetime('now')),
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (exercise_id) REFERENCES exercises(id) ON DELETE CASCADE,
    FOREIGN KEY (exercise_set_id) REFERENCES exercise_sets(id) ON DELETE SET NULL
);

CREATE TABLE training_programs (
    id TEXT PRIMARY KEY,
    user_id TEXT NOT NULL,
    name TEXT NOT NULL,
    description TEXT,
    duration_weeks INTEGER NOT NULL DEFAULT 4,
    goal TEXT,
    difficulty TEXT DEFAULT 'intermediate',
    is_active INTEGER NOT NULL DEFAULT 0,
    started_at TEXT,
    completed_at TEXT,
    created_at TEXT NOT NULL DEFAULT (datetime('now')),
    updated_at TEXT NOT NULL DEFAULT (datetime('now')),
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

CREATE TABLE program_weeks (
    id TEXT PRIMARY KEY,
    program_id TEXT NOT NULL,
    week_number INTEGER NOT NULL,
    name TEXT,
    is_deload INTEGER NOT NULL DEFAULT 0,
    notes TEXT,
    FOREIGN KEY (program_id) REFERENCES training_programs(id) ON DELETE CASCADE
);

CREATE TABLE program_workouts (
    id TEXT PRIMARY KEY,
    program_week_id TEXT NOT NULL,
    workout_id TEXT NOT NULL,
    day_of_week INTEGER,
    order_index INTEGER NOT NULL DEFAULT 0,
    intensity_modifier REAL DEFAULT 1.0,
    FOREIGN KEY (program_week_id) REFERENCES program_weeks(id) ON DELETE CASCADE,
    FOREIGN KEY (workout_id) REFERENCES workouts(id) ON DELETE CASCADE
);

CREATE INDEX idx_personal_records_user ON personal_records(user_id);
CREATE INDEX idx_personal_records_exercise ON personal_records(exercise_id);

-- ============================================================================
-- SECTION 12: CREATE BOOKS TABLES
-- ============================================================================

CREATE TABLE books (
    id TEXT PRIMARY KEY,
    user_id TEXT NOT NULL,
    title TEXT NOT NULL,
    author TEXT,
    total_pages INTEGER,
    current_page INTEGER NOT NULL DEFAULT 0,
    status TEXT NOT NULL DEFAULT 'reading',
    started_at TEXT,
    completed_at TEXT,
    rating INTEGER,
    notes TEXT,
    created_at TEXT NOT NULL DEFAULT (datetime('now')),
    updated_at TEXT NOT NULL DEFAULT (datetime('now')),
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

CREATE TABLE reading_sessions (
    id TEXT PRIMARY KEY,
    book_id TEXT NOT NULL,
    user_id TEXT NOT NULL,
    pages_read INTEGER NOT NULL,
    duration_minutes INTEGER,
    started_at TEXT NOT NULL,
    notes TEXT,
    FOREIGN KEY (book_id) REFERENCES books(id) ON DELETE CASCADE,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- ============================================================================
-- SECTION 13: CREATE LEARN TABLES
-- ============================================================================

CREATE TABLE learn_topics (
    id TEXT PRIMARY KEY,
    key TEXT NOT NULL UNIQUE,
    name TEXT NOT NULL,
    description TEXT,
    category TEXT NOT NULL,
    icon TEXT,
    sort_order INTEGER NOT NULL DEFAULT 0,
    created_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE TABLE learn_lessons (
    id TEXT PRIMARY KEY,
    topic_id TEXT NOT NULL,
    key TEXT NOT NULL UNIQUE,
    title TEXT NOT NULL,
    description TEXT,
    content_markdown TEXT,
    duration_minutes INTEGER NOT NULL DEFAULT 5,
    difficulty TEXT NOT NULL DEFAULT 'beginner',
    quiz_json TEXT,
    xp_reward INTEGER NOT NULL DEFAULT 15,
    coin_reward INTEGER NOT NULL DEFAULT 5,
    skill_key TEXT,
    skill_star_reward INTEGER DEFAULT 1,
    audio_r2_key TEXT,
    sort_order INTEGER NOT NULL DEFAULT 0,
    created_at TEXT NOT NULL DEFAULT (datetime('now')),
    FOREIGN KEY (topic_id) REFERENCES learn_topics(id) ON DELETE CASCADE
);

CREATE TABLE learn_drills (
    id TEXT PRIMARY KEY,
    topic_id TEXT NOT NULL,
    key TEXT NOT NULL UNIQUE,
    title TEXT NOT NULL,
    description TEXT,
    drill_type TEXT NOT NULL,
    config_json TEXT NOT NULL,
    difficulty TEXT NOT NULL DEFAULT 'beginner',
    duration_seconds INTEGER NOT NULL DEFAULT 120,
    xp_reward INTEGER NOT NULL DEFAULT 5,
    sort_order INTEGER NOT NULL DEFAULT 0,
    created_at TEXT NOT NULL DEFAULT (datetime('now')),
    FOREIGN KEY (topic_id) REFERENCES learn_topics(id) ON DELETE CASCADE
);

CREATE TABLE user_lesson_progress (
    id TEXT PRIMARY KEY,
    user_id TEXT NOT NULL,
    lesson_id TEXT NOT NULL,
    status TEXT NOT NULL DEFAULT 'not_started',
    started_at TEXT,
    completed_at TEXT,
    quiz_score INTEGER,
    attempts INTEGER NOT NULL DEFAULT 0,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (lesson_id) REFERENCES learn_lessons(id) ON DELETE CASCADE,
    UNIQUE(user_id, lesson_id)
);

CREATE TABLE user_drill_stats (
    id TEXT PRIMARY KEY,
    user_id TEXT NOT NULL,
    drill_id TEXT NOT NULL,
    attempts INTEGER NOT NULL DEFAULT 0,
    correct INTEGER NOT NULL DEFAULT 0,
    streak INTEGER NOT NULL DEFAULT 0,
    best_streak INTEGER NOT NULL DEFAULT 0,
    last_attempted_at TEXT,
    next_due_at TEXT,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (drill_id) REFERENCES learn_drills(id) ON DELETE CASCADE,
    UNIQUE(user_id, drill_id)
);

CREATE TABLE flashcard_decks (
    id TEXT PRIMARY KEY,
    user_id TEXT NOT NULL,
    name TEXT NOT NULL,
    description TEXT,
    category TEXT,
    card_count INTEGER NOT NULL DEFAULT 0,
    created_at TEXT NOT NULL DEFAULT (datetime('now')),
    updated_at TEXT NOT NULL DEFAULT (datetime('now')),
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

CREATE TABLE flashcards (
    id TEXT PRIMARY KEY,
    deck_id TEXT NOT NULL,
    front TEXT NOT NULL,
    back TEXT NOT NULL,
    ease_factor REAL NOT NULL DEFAULT 2.5,
    interval INTEGER NOT NULL DEFAULT 0,
    next_review TEXT,
    review_count INTEGER NOT NULL DEFAULT 0,
    created_at TEXT NOT NULL DEFAULT (datetime('now')),
    FOREIGN KEY (deck_id) REFERENCES flashcard_decks(id) ON DELETE CASCADE
);

CREATE TABLE journal_entries (
    id TEXT PRIMARY KEY,
    user_id TEXT NOT NULL,
    title TEXT,
    content TEXT NOT NULL,
    mood TEXT,
    tags_json TEXT,
    created_at TEXT NOT NULL DEFAULT (datetime('now')),
    updated_at TEXT NOT NULL DEFAULT (datetime('now')),
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- ============================================================================
-- SECTION 14: CREATE PLANNING TABLES
-- ============================================================================

CREATE TABLE calendar_events (
    id TEXT PRIMARY KEY,
    user_id TEXT NOT NULL,
    title TEXT NOT NULL,
    description TEXT,
    event_type TEXT NOT NULL DEFAULT 'general',
    start_time TEXT NOT NULL,
    end_time TEXT,
    all_day INTEGER NOT NULL DEFAULT 0,
    location TEXT,
    workout_id TEXT,
    recurrence_rule TEXT,
    recurrence_end TEXT,
    parent_event_id TEXT,
    color TEXT,
    reminder_minutes INTEGER,
    metadata TEXT,
    created_at TEXT NOT NULL DEFAULT (datetime('now')),
    updated_at TEXT NOT NULL DEFAULT (datetime('now')),
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (workout_id) REFERENCES workouts(id) ON DELETE SET NULL
);

CREATE INDEX idx_calendar_user ON calendar_events(user_id);
CREATE INDEX idx_calendar_start ON calendar_events(start_time);

CREATE TABLE daily_plans (
    id TEXT PRIMARY KEY,
    user_id TEXT NOT NULL,
    date TEXT NOT NULL,
    items_json TEXT NOT NULL DEFAULT '[]',
    notes TEXT,
    created_at TEXT NOT NULL DEFAULT (datetime('now')),
    updated_at TEXT NOT NULL DEFAULT (datetime('now')),
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    UNIQUE(user_id, date)
);

CREATE TABLE plan_templates (
    id TEXT PRIMARY KEY,
    user_id TEXT,
    name TEXT NOT NULL,
    description TEXT,
    items_json TEXT NOT NULL DEFAULT '[]',
    is_public INTEGER NOT NULL DEFAULT 0,
    category TEXT,
    created_at TEXT NOT NULL DEFAULT (datetime('now')),
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- ============================================================================
-- SECTION 15: CREATE CONTENT TABLES
-- ============================================================================

CREATE TABLE ignition_packs (
    id TEXT PRIMARY KEY,
    key TEXT NOT NULL UNIQUE,
    name TEXT NOT NULL,
    description TEXT,
    category TEXT NOT NULL,
    items_json TEXT NOT NULL,
    icon TEXT,
    sort_order INTEGER NOT NULL DEFAULT 0,
    created_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE TABLE daw_shortcuts (
    id TEXT PRIMARY KEY,
    daw TEXT NOT NULL,
    category TEXT NOT NULL,
    action TEXT NOT NULL,
    shortcut_mac TEXT,
    shortcut_win TEXT,
    description TEXT,
    sort_order INTEGER NOT NULL DEFAULT 0
);

CREATE TABLE glossary_terms (
    id TEXT PRIMARY KEY,
    term TEXT NOT NULL UNIQUE,
    definition TEXT NOT NULL,
    category TEXT,
    related_terms TEXT,
    created_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE TABLE recipe_templates (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    description TEXT,
    category TEXT NOT NULL,
    genre TEXT,
    steps_json TEXT NOT NULL,
    tips TEXT,
    created_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE TABLE infobase_entries (
    id TEXT PRIMARY KEY,
    user_id TEXT,
    title TEXT NOT NULL,
    content TEXT NOT NULL,
    category TEXT,
    tags_json TEXT,
    is_public INTEGER NOT NULL DEFAULT 0,
    created_at TEXT NOT NULL DEFAULT (datetime('now')),
    updated_at TEXT NOT NULL DEFAULT (datetime('now')),
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

CREATE TABLE ideas (
    id TEXT PRIMARY KEY,
    user_id TEXT NOT NULL,
    content TEXT NOT NULL,
    category TEXT,
    tags_json TEXT,
    is_favorite INTEGER NOT NULL DEFAULT 0,
    created_at TEXT NOT NULL DEFAULT (datetime('now')),
    updated_at TEXT NOT NULL DEFAULT (datetime('now')),
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- ============================================================================
-- SECTION 16: CREATE REFERENCE/AUDIO TABLES
-- ============================================================================

CREATE TABLE reference_tracks (
    id TEXT PRIMARY KEY,
    user_id TEXT NOT NULL,
    title TEXT NOT NULL,
    artist TEXT,
    r2_key TEXT NOT NULL,
    mime_type TEXT NOT NULL,
    bytes INTEGER NOT NULL,
    sha256 TEXT,
    duration_seconds REAL,
    tags_json TEXT,
    visibility TEXT NOT NULL DEFAULT 'private',
    created_at TEXT NOT NULL DEFAULT (datetime('now')),
    updated_at TEXT NOT NULL DEFAULT (datetime('now')),
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

CREATE INDEX idx_reference_tracks_user ON reference_tracks(user_id);

CREATE TABLE track_analysis_cache (
    id TEXT PRIMARY KEY,
    track_id TEXT NOT NULL UNIQUE,
    bpm REAL,
    key TEXT,
    energy REAL,
    danceability REAL,
    sections_json TEXT,
    waveform_json TEXT,
    analyzer_version TEXT,
    analyzed_at TEXT NOT NULL,
    created_at TEXT NOT NULL DEFAULT (datetime('now')),
    FOREIGN KEY (track_id) REFERENCES reference_tracks(id) ON DELETE CASCADE
);

-- ============================================================================
-- SECTION 17: CREATE SYSTEM TABLES
-- ============================================================================

CREATE TABLE feedback (
    id TEXT PRIMARY KEY,
    user_id TEXT,
    type TEXT NOT NULL,
    message TEXT NOT NULL,
    page_url TEXT,
    user_agent TEXT,
    status TEXT NOT NULL DEFAULT 'new',
    created_at TEXT NOT NULL DEFAULT (datetime('now')),
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE SET NULL
);

CREATE TABLE notifications (
    id TEXT PRIMARY KEY,
    user_id TEXT NOT NULL,
    type TEXT NOT NULL,
    title TEXT NOT NULL,
    message TEXT,
    data_json TEXT,
    is_read INTEGER NOT NULL DEFAULT 0,
    created_at TEXT NOT NULL DEFAULT (datetime('now')),
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

CREATE TABLE admin_audit_log (
    id TEXT PRIMARY KEY,
    admin_id TEXT NOT NULL,
    action TEXT NOT NULL,
    target_type TEXT,
    target_id TEXT,
    details_json TEXT,
    created_at TEXT NOT NULL DEFAULT (datetime('now')),
    FOREIGN KEY (admin_id) REFERENCES users(id) ON DELETE CASCADE
);

CREATE TABLE access_requests (
    id TEXT PRIMARY KEY,
    email TEXT NOT NULL,
    name TEXT,
    reason TEXT,
    status TEXT NOT NULL DEFAULT 'pending',
    reviewed_by TEXT,
    reviewed_at TEXT,
    created_at TEXT NOT NULL DEFAULT (datetime('now')),
    FOREIGN KEY (reviewed_by) REFERENCES users(id) ON DELETE SET NULL
);

CREATE TABLE db_metadata (
    key TEXT PRIMARY KEY,
    value TEXT NOT NULL,
    updated_at TEXT NOT NULL DEFAULT (datetime('now'))
);

-- Re-enable foreign key checks
PRAGMA foreign_keys = ON;

-- ============================================================================
-- SECTION 18: SEED DATA
-- ============================================================================

-- Database metadata
INSERT INTO db_metadata (key, value, updated_at) VALUES
    ('db_version', '100', datetime('now')),
    ('db_version_name', '0100_master_reset_consolidated', datetime('now')),
    ('schema_created_at', datetime('now'), datetime('now')),
    ('consolidation_date', '2026-01-06', datetime('now'));

-- Skill definitions
INSERT INTO skill_definitions (id, key, name, description, category, icon, max_level, stars_per_level, sort_order) VALUES
    ('skill_focus', 'focus', 'Focus', 'Deep work and concentration', 'productivity', 'target', 10, 10, 1),
    ('skill_learning', 'learning', 'Learning', 'Acquiring new knowledge', 'growth', 'book', 10, 10, 2),
    ('skill_fitness', 'fitness', 'Fitness', 'Physical health and exercise', 'health', 'heart', 10, 10, 3),
    ('skill_creativity', 'creativity', 'Creativity', 'Creative expression and ideation', 'creative', 'palette', 10, 10, 4),
    ('skill_planning', 'planning', 'Planning', 'Organization and preparation', 'productivity', 'calendar', 10, 10, 5),
    ('skill_production', 'production', 'Production', 'Music production skills', 'creative', 'music', 10, 10, 6);

-- Achievement definitions
INSERT INTO achievement_definitions (id, key, name, description, category, trigger_type, trigger_config_json, reward_coins, reward_xp, sort_order) VALUES
    ('ach_first_focus', 'first_focus', 'First Focus', 'Complete your first focus session', 'focus', 'count', '{"event":"focus_complete","count":1}', 10, 25, 1),
    ('ach_focus_streak_3', 'focus_streak_3', 'Focus Streak', 'Complete 3 focus sessions in a row', 'focus', 'streak', '{"event":"focus_complete","count":3}', 25, 50, 2),
    ('ach_focus_streak_7', 'focus_streak_7', 'Focus Master', 'Complete 7 focus sessions in a row', 'focus', 'streak', '{"event":"focus_complete","count":7}', 50, 100, 3),
    ('ach_first_quest', 'first_quest', 'Quest Beginner', 'Complete your first quest', 'quests', 'count', '{"event":"quest_complete","count":1}', 10, 25, 4),
    ('ach_quest_master', 'quest_master', 'Quest Master', 'Complete 10 quests', 'quests', 'count', '{"event":"quest_complete","count":10}', 50, 100, 5),
    ('ach_first_workout', 'first_workout', 'Fitness Start', 'Complete your first workout', 'fitness', 'count', '{"event":"workout_complete","count":1}', 15, 30, 6),
    ('ach_bookworm', 'bookworm', 'Bookworm', 'Finish reading your first book', 'learning', 'count', '{"event":"book_complete","count":1}', 25, 50, 7);

-- Market items
INSERT INTO market_items (id, key, name, description, category, cost_coins, icon, is_consumable, sort_order) VALUES
    ('item_theme_dark', 'theme_dark_pro', 'Dark Pro Theme', 'A premium dark theme', 'themes', 100, 'moon', 0, 1),
    ('item_theme_ocean', 'theme_ocean', 'Ocean Theme', 'Calm ocean-inspired colors', 'themes', 100, 'waves', 0, 2),
    ('item_boost_xp', 'boost_xp_2x', '2x XP Boost', 'Double XP for 1 hour', 'boosts', 50, 'zap', 1, 3),
    ('item_boost_coins', 'boost_coins_2x', '2x Coins Boost', 'Double coins for 1 hour', 'boosts', 50, 'coins', 1, 4),
    ('item_treat_coffee', 'treat_coffee', 'Virtual Coffee', 'Treat yourself to a virtual coffee', 'treats', 25, 'coffee', 1, 5),
    ('item_badge_early', 'badge_early_adopter', 'Early Adopter Badge', 'Show your early supporter status', 'badges', 200, 'star', 0, 6);

-- Onboarding flow
INSERT INTO onboarding_flows (id, version, name, description, is_active, total_steps) VALUES
    ('flow_main_v1', 1, 'Main Onboarding', 'Primary onboarding flow for new users', 1, 10);

-- Onboarding steps
INSERT INTO onboarding_steps (id, flow_id, step_order, step_type, title, description, target_route, options_json, allows_multiple, required) VALUES
    ('step_1_welcome', 'flow_main_v1', 1, 'explain', 'Welcome to Ignition', 'A starter engine to help you begin with minimal friction.', '/today', NULL, 0, 0),
    ('step_2_interests', 'flow_main_v1', 2, 'choice', 'What interests you?', 'Select up to 3 areas you want to focus on.', NULL, '["focus","fitness","learning","music","habits","creativity"]', 1, 1),
    ('step_3_intensity', 'flow_main_v1', 3, 'preference', 'How should we nudge you?', 'Choose your preferred intensity level.', NULL, '{"options":["gentle","standard","energetic"],"default":"standard"}', 0, 1),
    ('step_4_focus_intro', 'flow_main_v1', 4, 'tour', 'Focus Sessions', 'Start a timed focus session to build momentum.', '/focus', NULL, 0, 0),
    ('step_5_quests_intro', 'flow_main_v1', 5, 'tour', 'Quests', 'Small, completable tasks to keep you moving.', '/quests', NULL, 0, 0),
    ('step_6_ignitions', 'flow_main_v1', 6, 'tour', 'Ignitions', 'Quick starters when you need a spark.', '/ignitions', NULL, 0, 0),
    ('step_7_progress', 'flow_main_v1', 7, 'tour', 'Your Progress', 'See your skills grow over time.', '/progress', NULL, 0, 0),
    ('step_8_focus_duration', 'flow_main_v1', 8, 'preference', 'Default Focus Duration', 'How long should focus sessions be by default?', NULL, '{"options":[300,600,1500,1800],"default":300,"labels":["5 min","10 min","25 min","30 min"]}', 0, 0),
    ('step_9_gamification', 'flow_main_v1', 9, 'preference', 'Rewards Visibility', 'How visible should points and rewards be?', NULL, '{"options":["always","subtle","hidden"],"default":"always"}', 0, 0),
    ('step_10_complete', 'flow_main_v1', 10, 'action', 'Ready to Begin', 'Start your first focus session or explore.', '/today', '{"action_type":"complete_onboarding"}', 0, 0);

-- Learn topics (Music Theory & Ear Training)
INSERT INTO learn_topics (id, key, name, description, category, icon, sort_order) VALUES
    ('topic_intervals', 'intervals', 'Intervals', 'Learn to identify and understand musical intervals', 'ear_training', 'music', 1),
    ('topic_chords', 'chords', 'Chords', 'Understand chord types and progressions', 'ear_training', 'layers', 2),
    ('topic_scales', 'scales', 'Scales & Modes', 'Major, minor, and modal scales', 'theory', 'sliders', 3),
    ('topic_rhythm', 'rhythm', 'Rhythm', 'Time signatures, subdivisions, and feel', 'theory', 'clock', 4),
    ('topic_harmony', 'harmony', 'Harmony', 'Chord functions and voice leading', 'theory', 'git-merge', 5),
    ('topic_production', 'production', 'Production Basics', 'DAW fundamentals and workflow', 'production', 'sliders', 6);

-- Learn drills (Ear Training)
INSERT INTO learn_drills (id, topic_id, key, title, description, drill_type, config_json, difficulty, duration_seconds, xp_reward, sort_order) VALUES
    ('drill_intervals_asc', 'topic_intervals', 'intervals_ascending', 'Ascending Intervals', 'Identify intervals played ascending', 'interval', '{"direction":"ascending","range":["m2","M2","m3","M3","P4","P5"]}', 'beginner', 120, 10, 1),
    ('drill_intervals_desc', 'topic_intervals', 'intervals_descending', 'Descending Intervals', 'Identify intervals played descending', 'interval', '{"direction":"descending","range":["m2","M2","m3","M3","P4","P5"]}', 'beginner', 120, 10, 2),
    ('drill_intervals_harm', 'topic_intervals', 'intervals_harmonic', 'Harmonic Intervals', 'Identify intervals played together', 'interval', '{"direction":"harmonic","range":["m2","M2","m3","M3","P4","P5","m6","M6","m7","M7","P8"]}', 'intermediate', 120, 15, 3),
    ('drill_chords_triads', 'topic_chords', 'chord_triads', 'Triad Types', 'Identify major, minor, diminished, augmented', 'chord', '{"types":["major","minor","diminished","augmented"]}', 'beginner', 120, 10, 1),
    ('drill_chords_7th', 'topic_chords', 'chord_sevenths', 'Seventh Chords', 'Identify 7th chord types', 'chord', '{"types":["maj7","min7","dom7","dim7","m7b5"]}', 'intermediate', 120, 15, 2),
    ('drill_rhythm_basic', 'topic_rhythm', 'rhythm_basic', 'Basic Rhythms', 'Tap along with simple rhythms', 'rhythm', '{"subdivisions":["quarter","eighth"],"tempo":100}', 'beginner', 90, 10, 1),
    ('drill_note_id', 'topic_intervals', 'note_identification', 'Note Identification', 'Identify notes by ear', 'note', '{"range":["C3","C5"],"chromatic":false}', 'beginner', 120, 10, 4);

-- Universal quests
INSERT INTO quests (id, user_id, title, description, category, difficulty, xp_reward, coin_reward, is_universal, is_active, status) VALUES
    ('quest_first_focus', NULL, 'Complete a Focus Session', 'Start and complete a 5-minute focus session', 'focus', 'starter', 25, 10, 1, 1, 'available'),
    ('quest_explore_app', NULL, 'Explore the App', 'Visit 3 different sections of the app', 'exploration', 'starter', 15, 5, 1, 1, 'available'),
    ('quest_set_goal', NULL, 'Set a Goal', 'Create your first goal', 'planning', 'starter', 20, 10, 1, 1, 'available'),
    ('quest_try_ignition', NULL, 'Try an Ignition', 'Use an ignition pack to get started', 'starter', 'starter', 15, 5, 1, 1, 'available'),
    ('quest_ear_training', NULL, 'Train Your Ears', 'Complete an ear training drill', 'learning', 'starter', 20, 10, 1, 1, 'available');

-- Universal quests (new table for API - daily/weekly format)
INSERT INTO universal_quests (id, title, description, type, xp_reward, coin_reward, target, skill_id, created_at, updated_at) VALUES
    ('uq_focus_1', 'Complete a Focus Session', 'Finish one focus session today', 'daily', 25, 10, 1, NULL, datetime('now'), datetime('now')),
    ('uq_focus_3', 'Focus Hat Trick', 'Complete 3 focus sessions today', 'daily', 50, 20, 3, NULL, datetime('now'), datetime('now')),
    ('uq_habit_1', 'Check In', 'Log at least one habit today', 'daily', 15, 5, 1, NULL, datetime('now'), datetime('now')),
    ('uq_learn_1', 'Learn Something New', 'Complete a lesson or drill', 'daily', 20, 10, 1, NULL, datetime('now'), datetime('now')),
    ('uq_workout_1', 'Get Moving', 'Complete a workout session', 'daily', 30, 15, 1, NULL, datetime('now'), datetime('now')),
    ('uq_weekly_focus', 'Focus Master', 'Complete 10 focus sessions this week', 'weekly', 100, 50, 10, NULL, datetime('now'), datetime('now')),
    ('uq_weekly_habits', 'Habit Champion', 'Log habits 5 days this week', 'weekly', 75, 35, 5, NULL, datetime('now'), datetime('now')),
    ('uq_weekly_learn', 'Knowledge Seeker', 'Complete 5 lessons this week', 'weekly', 80, 40, 5, NULL, datetime('now'), datetime('now'));

-- Ignition packs
INSERT INTO ignition_packs (id, key, name, description, category, items_json, icon, sort_order) VALUES
    ('pack_5min_reset', '5min_reset', '5-Minute Reset', 'Quick activities to reset your mind', 'starter', '["Stand up and stretch","Take 5 deep breaths","Drink a glass of water","Look out a window","Clear your desk"]', 'refresh', 1),
    ('pack_creative_spark', 'creative_spark', 'Creative Spark', 'Get your creative juices flowing', 'creative', '["Open your DAW and load a new project","Play random chords for 2 minutes","Hum a melody and record it","Listen to a song you love","Sketch an idea on paper"]', 'lightbulb', 2),
    ('pack_movement', 'movement', 'Movement Break', 'Get your body moving', 'fitness', '["Do 10 jumping jacks","Walk around for 2 minutes","Stretch your neck and shoulders","Do 5 squats","Take the stairs"]', 'activity', 3),
    ('pack_focus_prep', 'focus_prep', 'Focus Prep', 'Prepare for deep work', 'focus', '["Close unnecessary tabs","Put phone on DND","Get water ready","Set your intention","Start a timer"]', 'target', 4);

-- DAW shortcuts (sample - Ableton)
INSERT INTO daw_shortcuts (id, daw, category, action, shortcut_mac, shortcut_win, description, sort_order) VALUES
    ('abl_play', 'ableton', 'transport', 'Play/Stop', 'Space', 'Space', 'Toggle playback', 1),
    ('abl_record', 'ableton', 'transport', 'Record', 'F9', 'F9', 'Start recording', 2),
    ('abl_undo', 'ableton', 'edit', 'Undo', 'Cmd+Z', 'Ctrl+Z', 'Undo last action', 3),
    ('abl_duplicate', 'ableton', 'edit', 'Duplicate', 'Cmd+D', 'Ctrl+D', 'Duplicate selection', 4),
    ('abl_split', 'ableton', 'edit', 'Split Clip', 'Cmd+E', 'Ctrl+E', 'Split clip at playhead', 5);

-- Glossary terms (sample)
INSERT INTO glossary_terms (id, term, definition, category, related_terms) VALUES
    ('gloss_bpm', 'BPM', 'Beats Per Minute - the tempo of a song', 'production', 'tempo,rhythm'),
    ('gloss_eq', 'EQ', 'Equalization - adjusting frequency balance', 'mixing', 'frequency,mixing'),
    ('gloss_compression', 'Compression', 'Dynamic range reduction', 'mixing', 'dynamics,loudness'),
    ('gloss_reverb', 'Reverb', 'Simulated room reflections', 'effects', 'delay,space'),
    ('gloss_sidechain', 'Sidechain', 'Using one signal to control another', 'production', 'compression,ducking');

-- NOTE: Exercises are seeded from resources/exercises.json via the seed script
-- Run: npm run db:seed after applying this migration

-- ============================================================================
-- DONE
-- ============================================================================

