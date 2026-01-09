-- ============================================================================
-- IGNITION DATABASE SCHEMA v2.0
-- Full reset migration - consolidates all tables with proper constraints
-- Generated: 2026-01-05
-- ============================================================================

-- ============================================================================
-- SECTION 1: AUTH TABLES (Auth.js D1 Adapter compatible)
-- ============================================================================

CREATE TABLE users (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,                    -- CHANGED: Now NOT NULL
    email TEXT NOT NULL UNIQUE,            -- CHANGED: Now NOT NULL
    emailVerified INTEGER,
    image TEXT,

    -- User status
    role TEXT NOT NULL DEFAULT 'user',     -- 'user', 'admin'
    approved INTEGER NOT NULL DEFAULT 1,   -- Auto-approved
    age_verified INTEGER NOT NULL DEFAULT 1,

    -- TOS
    tos_accepted INTEGER NOT NULL DEFAULT 0,
    tos_accepted_at TEXT,
    tos_version TEXT,

    -- Activity tracking
    last_activity_at TEXT,
    created_at TEXT NOT NULL DEFAULT (datetime('now')),
    updated_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_users_role ON users(role);

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
    created_at TEXT NOT NULL DEFAULT (datetime('now')),
    FOREIGN KEY (userId) REFERENCES users(id) ON DELETE CASCADE,
    UNIQUE(provider, providerAccountId)
);

CREATE INDEX idx_accounts_userId ON accounts(userId);
CREATE INDEX idx_accounts_provider_email ON accounts(provider, providerAccountId);

CREATE TABLE sessions (
    id TEXT PRIMARY KEY,
    sessionToken TEXT UNIQUE NOT NULL,
    userId TEXT NOT NULL,
    expires TEXT NOT NULL,
    created_at TEXT NOT NULL DEFAULT (datetime('now')),
    FOREIGN KEY (userId) REFERENCES users(id) ON DELETE CASCADE
);

CREATE INDEX idx_sessions_userId ON sessions(userId);
CREATE INDEX idx_sessions_sessionToken ON sessions(sessionToken);
CREATE INDEX idx_sessions_expires ON sessions(expires);

CREATE TABLE verification_tokens (
    identifier TEXT NOT NULL,
    token TEXT NOT NULL,
    expires TEXT NOT NULL,
    PRIMARY KEY(identifier, token)
);

CREATE TABLE authenticators (
    id TEXT PRIMARY KEY,
    credentialID TEXT UNIQUE NOT NULL,
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
-- SECTION 2: USER SETTINGS & PERSONALIZATION
-- ============================================================================

-- User settings (behavior-affecting preferences)
CREATE TABLE user_settings (
    id TEXT PRIMARY KEY,
    user_id TEXT NOT NULL UNIQUE,

    -- Starter engine preferences
    nudge_intensity TEXT NOT NULL DEFAULT 'standard',  -- 'gentle', 'standard', 'energetic'
    default_focus_duration INTEGER NOT NULL DEFAULT 300, -- seconds (5 min default)
    gamification_visibility TEXT NOT NULL DEFAULT 'always', -- 'always', 'subtle', 'hidden'

    -- Streak settings
    streak_type TEXT NOT NULL DEFAULT 'daily', -- 'daily', 'flexible'

    -- UI preferences (behavior-affecting)
    planner_visible INTEGER NOT NULL DEFAULT 1,  -- Show planner modules
    planner_expanded INTEGER NOT NULL DEFAULT 0, -- Collapsed by default

    -- Soft landing state (cross-device)
    soft_landing_until TEXT,  -- ISO timestamp when soft landing expires

    created_at TEXT NOT NULL DEFAULT (datetime('now')),
    updated_at TEXT NOT NULL DEFAULT (datetime('now')),
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

CREATE INDEX idx_user_settings_user ON user_settings(user_id);

-- User interests (tags for personalization)
CREATE TABLE user_interests (
    id TEXT PRIMARY KEY,
    user_id TEXT NOT NULL,
    interest_key TEXT NOT NULL,  -- 'focus', 'fitness', 'learning', 'music_daw', 'habits', 'creativity'
    priority INTEGER NOT NULL DEFAULT 1,  -- Higher = more important
    created_at TEXT NOT NULL DEFAULT (datetime('now')),
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    UNIQUE(user_id, interest_key)
);

CREATE INDEX idx_user_interests_user ON user_interests(user_id);

-- UI module weights (controls Today appearance)
CREATE TABLE user_ui_modules (
    id TEXT PRIMARY KEY,
    user_id TEXT NOT NULL,
    module_key TEXT NOT NULL,  -- 'focus', 'quests', 'ignitions', 'learn', 'ideas', 'wins', 'plan', 'market'
    enabled INTEGER NOT NULL DEFAULT 1,
    weight INTEGER NOT NULL DEFAULT 50,  -- 0-100, higher = more prominent
    last_shown_at TEXT,
    show_count INTEGER NOT NULL DEFAULT 0,
    created_at TEXT NOT NULL DEFAULT (datetime('now')),
    updated_at TEXT NOT NULL DEFAULT (datetime('now')),
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    UNIQUE(user_id, module_key)
);

CREATE INDEX idx_user_ui_modules_user ON user_ui_modules(user_id);

-- ============================================================================
-- SECTION 3: ONBOARDING SYSTEM
-- ============================================================================

-- Onboarding flow definitions (seeded, versioned)
CREATE TABLE onboarding_flows (
    id TEXT PRIMARY KEY,
    version INTEGER NOT NULL,
    name TEXT NOT NULL,
    description TEXT,
    is_active INTEGER NOT NULL DEFAULT 1,
    total_steps INTEGER NOT NULL,
    created_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE INDEX idx_onboarding_flows_active ON onboarding_flows(is_active);

-- Onboarding step definitions (seeded)
CREATE TABLE onboarding_steps (
    id TEXT PRIMARY KEY,
    flow_id TEXT NOT NULL,
    step_order INTEGER NOT NULL,
    step_type TEXT NOT NULL,  -- 'tour', 'choice', 'preference', 'action', 'explain'
    title TEXT NOT NULL,
    description TEXT,

    -- For tour steps
    target_selector TEXT,      -- CSS selector for spotlight
    target_route TEXT,         -- Route to navigate to
    fallback_content TEXT,     -- Show if selector fails

    -- For choice/preference steps
    options_json TEXT,         -- JSON array of options
    allows_multiple INTEGER NOT NULL DEFAULT 0,
    required INTEGER NOT NULL DEFAULT 0,

    -- For action steps
    action_type TEXT,          -- 'focus', 'quest', 'learn'
    action_config_json TEXT,   -- JSON config for the action

    created_at TEXT NOT NULL DEFAULT (datetime('now')),
    FOREIGN KEY (flow_id) REFERENCES onboarding_flows(id) ON DELETE CASCADE
);

CREATE INDEX idx_onboarding_steps_flow ON onboarding_steps(flow_id);
CREATE INDEX idx_onboarding_steps_order ON onboarding_steps(flow_id, step_order);

-- User onboarding state (per-user progress)
CREATE TABLE user_onboarding_state (
    id TEXT PRIMARY KEY,
    user_id TEXT NOT NULL UNIQUE,
    flow_id TEXT NOT NULL,
    current_step_id TEXT,
    status TEXT NOT NULL DEFAULT 'not_started',  -- 'not_started', 'in_progress', 'skipped', 'completed'
    started_at TEXT,
    completed_at TEXT,
    skipped_at TEXT,
    last_step_completed_at TEXT,
    responses_json TEXT,  -- JSON object of step responses
    can_resume INTEGER NOT NULL DEFAULT 1,
    created_at TEXT NOT NULL DEFAULT (datetime('now')),
    updated_at TEXT NOT NULL DEFAULT (datetime('now')),
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (flow_id) REFERENCES onboarding_flows(id),
    FOREIGN KEY (current_step_id) REFERENCES onboarding_steps(id)
);

CREATE INDEX idx_user_onboarding_user ON user_onboarding_state(user_id);
CREATE INDEX idx_user_onboarding_status ON user_onboarding_state(status);

-- ============================================================================
-- SECTION 4: GAMIFICATION SYSTEM (3-Currency)
-- ============================================================================

-- Points ledger (append-only, source of truth for all currencies)
CREATE TABLE points_ledger (
    id TEXT PRIMARY KEY,
    user_id TEXT NOT NULL,
    currency TEXT NOT NULL,  -- 'coins', 'xp', 'skill_stars'
    amount INTEGER NOT NULL, -- Positive for gain, negative for spend
    reason TEXT NOT NULL,
    source_type TEXT,        -- 'focus', 'quest', 'habit', 'achievement', 'purchase', 'learn'
    source_id TEXT,
    skill_id TEXT,           -- For skill_stars, which skill
    metadata_json TEXT,
    created_at TEXT NOT NULL DEFAULT (datetime('now')),
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

CREATE INDEX idx_points_ledger_user ON points_ledger(user_id);
CREATE INDEX idx_points_ledger_currency ON points_ledger(user_id, currency);
CREATE INDEX idx_points_ledger_created ON points_ledger(created_at);

-- User wallet (materialized view, can be recalculated from ledger)
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

CREATE INDEX idx_user_wallet_user ON user_wallet(user_id);

-- Skill definitions (seeded)
CREATE TABLE skill_definitions (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    description TEXT,
    category TEXT NOT NULL,  -- 'focus', 'fitness', 'music', 'learning', 'productivity'
    icon TEXT,
    max_level INTEGER NOT NULL DEFAULT 10,
    stars_per_level INTEGER NOT NULL DEFAULT 10,
    created_at TEXT NOT NULL DEFAULT (datetime('now'))
);

-- User skill progress
CREATE TABLE user_skills (
    id TEXT PRIMARY KEY,
    user_id TEXT NOT NULL,
    skill_id TEXT NOT NULL,
    current_stars INTEGER NOT NULL DEFAULT 0,
    current_level INTEGER NOT NULL DEFAULT 0,
    updated_at TEXT NOT NULL DEFAULT (datetime('now')),
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (skill_id) REFERENCES skill_definitions(id) ON DELETE CASCADE,
    UNIQUE(user_id, skill_id)
);

CREATE INDEX idx_user_skills_user ON user_skills(user_id);

-- Achievement definitions (seeded)
CREATE TABLE achievement_definitions (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    description TEXT NOT NULL,
    category TEXT NOT NULL,  -- 'focus', 'quests', 'streaks', 'learning', 'special'
    icon TEXT,
    condition_type TEXT NOT NULL,  -- 'count', 'streak', 'milestone', 'first'
    condition_json TEXT NOT NULL,  -- JSON condition config
    reward_coins INTEGER NOT NULL DEFAULT 0,
    reward_xp INTEGER NOT NULL DEFAULT 0,
    reward_skill_stars INTEGER NOT NULL DEFAULT 0,
    reward_skill_id TEXT,
    is_hidden INTEGER NOT NULL DEFAULT 0,  -- Secret achievements
    created_at TEXT NOT NULL DEFAULT (datetime('now')),
    FOREIGN KEY (reward_skill_id) REFERENCES skill_definitions(id)
);

CREATE INDEX idx_achievements_category ON achievement_definitions(category);

-- User achievements (unlocked)
CREATE TABLE user_achievements (
    id TEXT PRIMARY KEY,
    user_id TEXT NOT NULL,
    achievement_id TEXT NOT NULL,
    unlocked_at TEXT NOT NULL,
    notified INTEGER NOT NULL DEFAULT 0,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (achievement_id) REFERENCES achievement_definitions(id) ON DELETE CASCADE,
    UNIQUE(user_id, achievement_id)
);

CREATE INDEX idx_user_achievements_user ON user_achievements(user_id);

-- User streaks
CREATE TABLE user_streaks (
    id TEXT PRIMARY KEY,
    user_id TEXT NOT NULL,
    streak_type TEXT NOT NULL,  -- 'daily_activity', 'focus', 'learn', 'habit_{id}'
    current_streak INTEGER NOT NULL DEFAULT 0,
    longest_streak INTEGER NOT NULL DEFAULT 0,
    last_activity_date TEXT,  -- YYYY-MM-DD format
    streak_shields INTEGER NOT NULL DEFAULT 0,
    created_at TEXT NOT NULL DEFAULT (datetime('now')),
    updated_at TEXT NOT NULL DEFAULT (datetime('now')),
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    UNIQUE(user_id, streak_type)
);

CREATE INDEX idx_user_streaks_user ON user_streaks(user_id);

-- Activity events (append-only event stream)
CREATE TABLE activity_events (
    id TEXT PRIMARY KEY,
    user_id TEXT NOT NULL,
    event_type TEXT NOT NULL,
    entity_type TEXT,
    entity_id TEXT,
    xp_earned INTEGER DEFAULT 0,
    coins_earned INTEGER DEFAULT 0,
    skill_stars_earned INTEGER DEFAULT 0,
    skill_id TEXT,
    metadata_json TEXT,
    created_at TEXT NOT NULL DEFAULT (datetime('now')),
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

CREATE INDEX idx_activity_events_user ON activity_events(user_id);
CREATE INDEX idx_activity_events_type ON activity_events(event_type);
CREATE INDEX idx_activity_events_created ON activity_events(created_at);
CREATE INDEX idx_activity_events_user_date ON activity_events(user_id, created_at);

-- ============================================================================
-- SECTION 5: MARKET SYSTEM (D1-backed)
-- ============================================================================

-- Market items catalog
CREATE TABLE market_items (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    description TEXT,
    category TEXT NOT NULL,  -- 'food', 'entertainment', 'selfcare', 'custom', 'powerup'
    cost_coins INTEGER NOT NULL,
    icon TEXT,
    is_global INTEGER NOT NULL DEFAULT 1,  -- Admin-defined
    created_by_user_id TEXT,  -- NULL for global, user_id for custom
    is_active INTEGER NOT NULL DEFAULT 1,
    created_at TEXT NOT NULL DEFAULT (datetime('now')),
    FOREIGN KEY (created_by_user_id) REFERENCES users(id) ON DELETE CASCADE
);

CREATE INDEX idx_market_items_category ON market_items(category);
CREATE INDEX idx_market_items_user ON market_items(created_by_user_id);

-- User purchases
CREATE TABLE user_purchases (
    id TEXT PRIMARY KEY,
    user_id TEXT NOT NULL,
    item_id TEXT NOT NULL,
    cost_coins INTEGER NOT NULL,
    purchased_at TEXT NOT NULL DEFAULT (datetime('now')),
    redeemed INTEGER NOT NULL DEFAULT 0,
    redeemed_at TEXT,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (item_id) REFERENCES market_items(id) ON DELETE CASCADE
);

CREATE INDEX idx_user_purchases_user ON user_purchases(user_id);
CREATE INDEX idx_user_purchases_redeemed ON user_purchases(user_id, redeemed);

-- ============================================================================
-- SECTION 6: FOCUS SYSTEM
-- ============================================================================

CREATE TABLE focus_sessions (
    id TEXT PRIMARY KEY,
    user_id TEXT NOT NULL,
    started_at TEXT NOT NULL,
    ended_at TEXT,
    planned_duration INTEGER NOT NULL,  -- seconds
    actual_duration INTEGER,
    status TEXT NOT NULL,  -- 'active', 'paused', 'completed', 'abandoned'
    mode TEXT NOT NULL,    -- 'focus', 'break', 'long_break'

    -- Pause support (unified, no separate table needed)
    paused_at TEXT,
    time_remaining INTEGER,  -- seconds remaining when paused

    -- Expiry and linking
    expires_at TEXT,
    linked_library_id TEXT,

    metadata_json TEXT,
    created_at TEXT NOT NULL DEFAULT (datetime('now')),
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

CREATE INDEX idx_focus_sessions_user ON focus_sessions(user_id);
CREATE INDEX idx_focus_sessions_status ON focus_sessions(status);
CREATE INDEX idx_focus_sessions_user_status ON focus_sessions(user_id, status);

-- ============================================================================
-- SECTION 7: QUESTS SYSTEM
-- ============================================================================

CREATE TABLE quests (
    id TEXT PRIMARY KEY,
    user_id TEXT NOT NULL,
    title TEXT NOT NULL,
    description TEXT,
    domain_id TEXT NOT NULL,
    status TEXT NOT NULL DEFAULT 'pending',  -- 'pending', 'in_progress', 'completed', 'abandoned'
    priority INTEGER NOT NULL DEFAULT 50,    -- 0-100, lower = higher priority
    difficulty TEXT DEFAULT 'medium',        -- 'easy', 'medium', 'hard'
    due_date TEXT,
    estimated_minutes INTEGER,

    -- Rewards
    xp_reward INTEGER NOT NULL DEFAULT 10,
    coin_reward INTEGER NOT NULL DEFAULT 5,
    skill_id TEXT,
    skill_star_reward INTEGER DEFAULT 0,

    -- Hierarchy
    parent_id TEXT,

    -- Completion
    completed_at TEXT,

    tags_json TEXT,
    created_at TEXT NOT NULL DEFAULT (datetime('now')),
    updated_at TEXT NOT NULL DEFAULT (datetime('now')),
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (parent_id) REFERENCES quests(id) ON DELETE SET NULL,
    FOREIGN KEY (skill_id) REFERENCES skill_definitions(id)
);

CREATE INDEX idx_quests_user ON quests(user_id);
CREATE INDEX idx_quests_status ON quests(user_id, status);
CREATE INDEX idx_quests_due ON quests(due_date);

-- ============================================================================
-- SECTION 8: HABITS SYSTEM
-- ============================================================================

CREATE TABLE habits (
    id TEXT PRIMARY KEY,
    user_id TEXT NOT NULL,
    title TEXT NOT NULL,
    description TEXT,
    frequency TEXT NOT NULL DEFAULT 'daily',
    target_count INTEGER NOT NULL DEFAULT 1,
    category TEXT DEFAULT 'general',

    -- Rewards
    xp_reward INTEGER NOT NULL DEFAULT 10,
    coin_reward INTEGER NOT NULL DEFAULT 5,
    skill_id TEXT,
    skill_star_reward INTEGER DEFAULT 1,

    is_active INTEGER NOT NULL DEFAULT 1,
    created_at TEXT NOT NULL DEFAULT (datetime('now')),
    updated_at TEXT NOT NULL DEFAULT (datetime('now')),
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (skill_id) REFERENCES skill_definitions(id)
);

CREATE INDEX idx_habits_user ON habits(user_id);
CREATE INDEX idx_habits_active ON habits(user_id, is_active);

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
CREATE INDEX idx_habit_logs_user_date ON habit_logs(user_id, completed_at);

-- ============================================================================
-- SECTION 9: GOALS SYSTEM
-- ============================================================================

CREATE TABLE goals (
    id TEXT PRIMARY KEY,
    user_id TEXT NOT NULL,
    title TEXT NOT NULL,
    description TEXT,
    category TEXT NOT NULL DEFAULT 'personal',
    deadline TEXT,
    milestones_json TEXT,
    completed INTEGER NOT NULL DEFAULT 0,
    completed_at TEXT,
    created_at TEXT NOT NULL DEFAULT (datetime('now')),
    updated_at TEXT NOT NULL DEFAULT (datetime('now')),
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

CREATE INDEX idx_goals_user ON goals(user_id);

-- ============================================================================
-- SECTION 10: LEARN SYSTEM (Music Theory + Ear Training)
-- ============================================================================

-- Learn topics taxonomy (seeded)
CREATE TABLE learn_topics (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    description TEXT,
    category TEXT NOT NULL,  -- 'theory', 'ear_training', 'production'
    parent_id TEXT,
    order_index INTEGER NOT NULL DEFAULT 0,
    icon TEXT,
    estimated_minutes INTEGER,
    difficulty TEXT DEFAULT 'beginner',  -- 'beginner', 'intermediate', 'advanced'
    created_at TEXT NOT NULL DEFAULT (datetime('now')),
    FOREIGN KEY (parent_id) REFERENCES learn_topics(id) ON DELETE SET NULL
);

CREATE INDEX idx_learn_topics_category ON learn_topics(category);
CREATE INDEX idx_learn_topics_parent ON learn_topics(parent_id);

-- Learn lessons (seeded content)
CREATE TABLE learn_lessons (
    id TEXT PRIMARY KEY,
    topic_id TEXT NOT NULL,
    title TEXT NOT NULL,
    description TEXT,
    content_markdown TEXT NOT NULL,  -- Lesson content
    order_index INTEGER NOT NULL DEFAULT 0,
    estimated_minutes INTEGER NOT NULL DEFAULT 3,

    -- Quiz/exercise embedded in lesson
    quiz_json TEXT,  -- JSON array of quiz questions

    -- Rewards
    xp_reward INTEGER NOT NULL DEFAULT 15,
    coin_reward INTEGER NOT NULL DEFAULT 5,
    skill_id TEXT,
    skill_star_reward INTEGER DEFAULT 1,

    -- Audio support (optional, R2)
    audio_r2_key TEXT,

    created_at TEXT NOT NULL DEFAULT (datetime('now')),
    FOREIGN KEY (topic_id) REFERENCES learn_topics(id) ON DELETE CASCADE,
    FOREIGN KEY (skill_id) REFERENCES skill_definitions(id)
);

CREATE INDEX idx_learn_lessons_topic ON learn_lessons(topic_id);

-- Learn drills (repeatable exercises)
CREATE TABLE learn_drills (
    id TEXT PRIMARY KEY,
    topic_id TEXT NOT NULL,
    name TEXT NOT NULL,
    description TEXT,
    drill_type TEXT NOT NULL,  -- 'interval', 'chord', 'scale', 'rhythm', 'melody'
    difficulty TEXT NOT NULL DEFAULT 'beginner',
    config_json TEXT NOT NULL,  -- Drill configuration

    -- Spaced repetition defaults
    initial_interval_hours INTEGER NOT NULL DEFAULT 24,

    -- Audio (optional)
    audio_r2_key TEXT,

    created_at TEXT NOT NULL DEFAULT (datetime('now')),
    FOREIGN KEY (topic_id) REFERENCES learn_topics(id) ON DELETE CASCADE
);

CREATE INDEX idx_learn_drills_topic ON learn_drills(topic_id);
CREATE INDEX idx_learn_drills_type ON learn_drills(drill_type);

-- User lesson progress
CREATE TABLE user_lesson_progress (
    id TEXT PRIMARY KEY,
    user_id TEXT NOT NULL,
    lesson_id TEXT NOT NULL,
    status TEXT NOT NULL DEFAULT 'not_started',  -- 'not_started', 'in_progress', 'completed'
    started_at TEXT,
    completed_at TEXT,
    quiz_score INTEGER,  -- Percentage 0-100
    attempts INTEGER NOT NULL DEFAULT 0,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (lesson_id) REFERENCES learn_lessons(id) ON DELETE CASCADE,
    UNIQUE(user_id, lesson_id)
);

CREATE INDEX idx_user_lesson_progress_user ON user_lesson_progress(user_id);

-- User drill stats (spaced repetition)
CREATE TABLE user_drill_stats (
    id TEXT PRIMARY KEY,
    user_id TEXT NOT NULL,
    drill_id TEXT NOT NULL,
    total_attempts INTEGER NOT NULL DEFAULT 0,
    correct_attempts INTEGER NOT NULL DEFAULT 0,
    current_streak INTEGER NOT NULL DEFAULT 0,
    best_streak INTEGER NOT NULL DEFAULT 0,
    success_rate REAL NOT NULL DEFAULT 0,  -- 0.0 to 1.0
    last_seen_at TEXT,
    next_due_at TEXT,  -- Spaced repetition
    interval_hours INTEGER NOT NULL DEFAULT 24,
    easiness_factor REAL NOT NULL DEFAULT 2.5,  -- SM-2 algorithm
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (drill_id) REFERENCES learn_drills(id) ON DELETE CASCADE,
    UNIQUE(user_id, drill_id)
);

CREATE INDEX idx_user_drill_stats_user ON user_drill_stats(user_id);
CREATE INDEX idx_user_drill_stats_due ON user_drill_stats(user_id, next_due_at);

-- ============================================================================
-- SECTION 11: DAILY PLANS & CALENDAR
-- ============================================================================

CREATE TABLE daily_plans (
    id TEXT PRIMARY KEY,
    user_id TEXT NOT NULL,
    plan_date TEXT NOT NULL,  -- YYYY-MM-DD
    items_json TEXT NOT NULL,  -- JSON array of plan items
    completed_count INTEGER NOT NULL DEFAULT 0,
    total_count INTEGER NOT NULL DEFAULT 0,
    created_at TEXT NOT NULL DEFAULT (datetime('now')),
    updated_at TEXT NOT NULL DEFAULT (datetime('now')),
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    UNIQUE(user_id, plan_date)
);

CREATE INDEX idx_daily_plans_user_date ON daily_plans(user_id, plan_date);

CREATE TABLE plan_templates (
    id TEXT PRIMARY KEY,
    user_id TEXT NOT NULL,
    name TEXT NOT NULL,
    description TEXT,
    items_json TEXT NOT NULL,
    is_global INTEGER NOT NULL DEFAULT 0,
    created_at TEXT NOT NULL DEFAULT (datetime('now')),
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

CREATE INDEX idx_plan_templates_user ON plan_templates(user_id);

-- ============================================================================
-- SECTION 12: EXERCISE/FITNESS
-- ============================================================================

CREATE TABLE exercises (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    description TEXT,
    category TEXT NOT NULL,
    muscle_groups_json TEXT,
    equipment TEXT,
    is_global INTEGER NOT NULL DEFAULT 0,
    created_by_user_id TEXT,
    created_at TEXT NOT NULL DEFAULT (datetime('now')),
    FOREIGN KEY (created_by_user_id) REFERENCES users(id) ON DELETE SET NULL
);

CREATE INDEX idx_exercises_category ON exercises(category);

CREATE TABLE workouts (
    id TEXT PRIMARY KEY,
    user_id TEXT NOT NULL,
    name TEXT NOT NULL,
    description TEXT,
    exercises_json TEXT NOT NULL,
    estimated_duration INTEGER,
    created_at TEXT NOT NULL DEFAULT (datetime('now')),
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

CREATE INDEX idx_workouts_user ON workouts(user_id);

CREATE TABLE workout_sessions (
    id TEXT PRIMARY KEY,
    user_id TEXT NOT NULL,
    workout_id TEXT,
    started_at TEXT NOT NULL,
    ended_at TEXT,
    status TEXT NOT NULL DEFAULT 'in_progress',
    notes TEXT,
    sets_json TEXT,
    created_at TEXT NOT NULL DEFAULT (datetime('now')),
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (workout_id) REFERENCES workouts(id) ON DELETE SET NULL
);

CREATE INDEX idx_workout_sessions_user ON workout_sessions(user_id);

-- ============================================================================
-- SECTION 13: BOOKS & READING
-- ============================================================================

CREATE TABLE books (
    id TEXT PRIMARY KEY,
    user_id TEXT NOT NULL,
    title TEXT NOT NULL,
    author TEXT,
    total_pages INTEGER,
    current_page INTEGER DEFAULT 0,
    status TEXT NOT NULL DEFAULT 'want_to_read',  -- 'want_to_read', 'reading', 'completed', 'abandoned'
    started_at TEXT,
    completed_at TEXT,
    notes TEXT,
    created_at TEXT NOT NULL DEFAULT (datetime('now')),
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

CREATE INDEX idx_books_user ON books(user_id);
CREATE INDEX idx_books_status ON books(user_id, status);

CREATE TABLE reading_sessions (
    id TEXT PRIMARY KEY,
    book_id TEXT NOT NULL,
    user_id TEXT NOT NULL,
    pages_read INTEGER NOT NULL,
    duration_minutes INTEGER,
    notes TEXT,
    created_at TEXT NOT NULL DEFAULT (datetime('now')),
    FOREIGN KEY (book_id) REFERENCES books(id) ON DELETE CASCADE,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

CREATE INDEX idx_reading_sessions_book ON reading_sessions(book_id);

-- ============================================================================
-- SECTION 14: IDEAS & INFOBASE
-- ============================================================================

CREATE TABLE ideas (
    id TEXT PRIMARY KEY,
    user_id TEXT NOT NULL,
    title TEXT NOT NULL,
    content TEXT,
    category TEXT DEFAULT 'general',
    tags_json TEXT,
    is_pinned INTEGER NOT NULL DEFAULT 0,
    created_at TEXT NOT NULL DEFAULT (datetime('now')),
    updated_at TEXT NOT NULL DEFAULT (datetime('now')),
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

CREATE INDEX idx_ideas_user ON ideas(user_id);

CREATE TABLE infobase_entries (
    id TEXT PRIMARY KEY,
    user_id TEXT NOT NULL,
    title TEXT NOT NULL,
    content TEXT NOT NULL,
    category TEXT NOT NULL DEFAULT 'Tips',
    tags_json TEXT,
    created_at TEXT NOT NULL DEFAULT (datetime('now')),
    updated_at TEXT NOT NULL DEFAULT (datetime('now')),
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

CREATE INDEX idx_infobase_user ON infobase_entries(user_id);

-- ============================================================================
-- SECTION 15: REFERENCE CONTENT (Static data seeded)
-- ============================================================================

-- Ignition packs (seeded)
CREATE TABLE ignition_packs (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    description TEXT,
    category TEXT NOT NULL,
    items_json TEXT NOT NULL,  -- JSON array of ignition items
    is_active INTEGER NOT NULL DEFAULT 1,
    created_at TEXT NOT NULL DEFAULT (datetime('now'))
);

-- DAW shortcuts (seeded)
CREATE TABLE daw_shortcuts (
    id TEXT PRIMARY KEY,
    daw_id TEXT NOT NULL,  -- 'ableton', 'logic', 'flstudio', 'protools'
    category TEXT NOT NULL,
    action TEXT NOT NULL,
    shortcut_mac TEXT,
    shortcut_windows TEXT,
    description TEXT,
    created_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE INDEX idx_daw_shortcuts_daw ON daw_shortcuts(daw_id);

-- Glossary terms (seeded)
CREATE TABLE glossary_terms (
    id TEXT PRIMARY KEY,
    term TEXT NOT NULL,
    definition TEXT NOT NULL,
    category TEXT NOT NULL,
    related_terms_json TEXT,
    created_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE INDEX idx_glossary_category ON glossary_terms(category);

-- Track analysis cache (for reference tracks)
CREATE TABLE track_analysis_cache (
    id TEXT PRIMARY KEY,
    track_id TEXT NOT NULL UNIQUE,
    bpm REAL,
    key TEXT,
    energy REAL,
    danceability REAL,
    sections_json TEXT,
    waveform_json TEXT,
    analyzed_at TEXT NOT NULL,
    created_at TEXT NOT NULL DEFAULT (datetime('now'))
);

-- ============================================================================
-- SECTION 16: SYSTEM METADATA
-- ============================================================================

CREATE TABLE db_metadata (
    key TEXT PRIMARY KEY,
    value TEXT NOT NULL,
    updated_at TEXT NOT NULL DEFAULT (datetime('now'))
);

-- Insert initial metadata
INSERT INTO db_metadata (key, value, updated_at) VALUES
    ('db_version', '20', datetime('now')),
    ('db_version_name', '0020_full_reset_v2', datetime('now')),
    ('schema_created_at', datetime('now'), datetime('now'));

-- ============================================================================
-- SECTION 17: ACCESS REQUESTS (for invite system if needed)
-- ============================================================================

CREATE TABLE access_requests (
    id TEXT PRIMARY KEY,
    user_id TEXT NOT NULL UNIQUE,
    email TEXT NOT NULL,
    name TEXT,
    reason TEXT,
    status TEXT NOT NULL DEFAULT 'pending',
    reviewed_by TEXT,
    reviewed_at TEXT,
    review_notes TEXT,
    created_at TEXT NOT NULL DEFAULT (datetime('now')),
    updated_at TEXT NOT NULL DEFAULT (datetime('now')),
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (reviewed_by) REFERENCES users(id) ON DELETE SET NULL
);

CREATE INDEX idx_access_requests_status ON access_requests(status);

