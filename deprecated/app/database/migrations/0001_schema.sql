-- GENERATED FROM schema.json v2.0.0 - DO NOT EDIT
-- Generated: 2026-01-10
--
-- PostgreSQL schema for Passion OS
-- Run with: sqlx migrate run

-- =============================================================================
-- SCHEMA VERSION TRACKING
-- =============================================================================

CREATE TABLE IF NOT EXISTS schema_version (
    version TEXT PRIMARY KEY,
    applied_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    description TEXT
);

INSERT INTO schema_version (version, description)
VALUES ('2.0.0', 'Generated from schema.json')
ON CONFLICT (version) DO NOTHING;


-- =============================================================================
-- AUTHENTICATION & AUTHORIZATION
-- =============================================================================

CREATE TABLE accounts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL,
    type TEXT NOT NULL,
    provider TEXT NOT NULL,
    provider_account_id TEXT NOT NULL,
    refresh_token TEXT,
    access_token TEXT,
    expires_at BIGINT,
    token_type TEXT,
    scope TEXT,
    id_token TEXT,
    session_state TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE authenticators (
    id UUID PRIMARY KEY,
    user_id UUID NOT NULL,
    credential_id TEXT NOT NULL,
    provider_account_id TEXT NOT NULL,
    credential_public_key TEXT NOT NULL,
    counter BIGINT NOT NULL,
    credential_device_type TEXT NOT NULL,
    credential_backed_up BOOLEAN NOT NULL,
    transports TEXT[] NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE entitlements (
    id UUID PRIMARY KEY,
    name TEXT NOT NULL,
    description TEXT,
    resource TEXT NOT NULL,
    action TEXT NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE role_entitlements (
    role_id UUID NOT NULL,
    entitlement_id UUID NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE roles (
    id UUID PRIMARY KEY,
    name TEXT NOT NULL,
    description TEXT,
    parent_role_id UUID,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE sessions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL,
    token TEXT NOT NULL,
    expires_at TIMESTAMPTZ NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    last_activity_at TIMESTAMPTZ,
    user_agent TEXT,
    ip_address TEXT,
    rotated_from UUID
);

CREATE TABLE user_roles (
    user_id UUID NOT NULL,
    role_id UUID NOT NULL,
    granted_by UUID,
    granted_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    expires_at TIMESTAMPTZ
);

CREATE TABLE users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT,
    email TEXT NOT NULL,
    email_verified TIMESTAMPTZ,
    image TEXT,
    role TEXT NOT NULL,
    approved BOOLEAN NOT NULL,
    age_verified BOOLEAN NOT NULL,
    tos_accepted BOOLEAN NOT NULL,
    tos_accepted_at TIMESTAMPTZ,
    tos_version TEXT,
    is_admin BOOLEAN NOT NULL DEFAULT FALSE,
    last_activity_at TIMESTAMPTZ,
    theme TEXT DEFAULT 'dark',
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE verification_tokens (
    identifier TEXT NOT NULL,
    token TEXT NOT NULL,
    expires TIMESTAMPTZ NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- =============================================================================
-- GAMIFICATION & PROGRESS
-- =============================================================================

CREATE TABLE achievement_definitions (
    id UUID PRIMARY KEY,
    key TEXT NOT NULL,
    name TEXT NOT NULL,
    description TEXT,
    category TEXT NOT NULL,
    icon TEXT,
    trigger_type TEXT NOT NULL,
    trigger_config JSONB NOT NULL,
    reward_coins INTEGER NOT NULL,
    reward_xp INTEGER NOT NULL,
    is_hidden BOOLEAN NOT NULL,
    sort_order INTEGER NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE activity_events (
    id UUID PRIMARY KEY,
    user_id UUID NOT NULL,
    event_type TEXT NOT NULL,
    category TEXT,
    metadata JSONB,
    xp_earned INTEGER NOT NULL,
    coins_earned INTEGER NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE skill_definitions (
    id UUID PRIMARY KEY,
    key TEXT NOT NULL,
    name TEXT NOT NULL,
    description TEXT,
    category TEXT NOT NULL,
    icon TEXT,
    max_level INTEGER NOT NULL,
    stars_per_level INTEGER NOT NULL,
    sort_order INTEGER NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE universal_quests (
    id UUID PRIMARY KEY,
    title TEXT NOT NULL,
    description TEXT,
    type TEXT NOT NULL,
    xp_reward INTEGER NOT NULL,
    coin_reward INTEGER NOT NULL,
    target INTEGER NOT NULL,
    target_type TEXT NOT NULL,
    target_config JSONB,
    skill_key TEXT,
    is_active BOOLEAN NOT NULL,
    created_by UUID,
    sort_order INTEGER NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE user_achievements (
    id UUID PRIMARY KEY,
    user_id UUID NOT NULL,
    achievement_key TEXT NOT NULL,
    earned_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    notified BOOLEAN NOT NULL
);

CREATE TABLE user_progress (
    id UUID PRIMARY KEY,
    user_id UUID NOT NULL,
    total_xp INTEGER NOT NULL,
    current_level INTEGER NOT NULL,
    xp_to_next_level INTEGER NOT NULL,
    total_skill_stars INTEGER NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE user_quests (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL,
    source_quest_id UUID,
    title TEXT NOT NULL,
    description TEXT,
    category TEXT,
    difficulty TEXT NOT NULL,
    xp_reward INTEGER NOT NULL,
    coin_reward INTEGER NOT NULL,
    status TEXT NOT NULL,
    progress INTEGER NOT NULL DEFAULT 0,
    target INTEGER NOT NULL,
    is_active BOOLEAN NOT NULL,
    is_repeatable BOOLEAN NOT NULL,
    repeat_frequency TEXT,
    accepted_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    completed_at TIMESTAMPTZ,
    claimed_at TIMESTAMPTZ,
    expires_at TIMESTAMPTZ,
    last_completed_date DATE,
    streak_count INTEGER NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE user_skills (
    id UUID PRIMARY KEY,
    user_id UUID NOT NULL,
    skill_key TEXT NOT NULL,
    current_stars INTEGER NOT NULL,
    current_level INTEGER NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE user_wallet (
    id UUID PRIMARY KEY,
    user_id UUID NOT NULL,
    coins INTEGER NOT NULL,
    total_earned INTEGER NOT NULL,
    total_spent INTEGER NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- =============================================================================
-- FOCUS TIMER & SESSIONS
-- =============================================================================

CREATE TABLE focus_pause_state (
    id UUID PRIMARY KEY,
    user_id UUID NOT NULL,
    session_id UUID NOT NULL,
    mode TEXT,
    is_paused BOOLEAN NOT NULL,
    time_remaining_seconds INTEGER,
    paused_at TIMESTAMPTZ,
    resumed_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE focus_sessions (
    id UUID PRIMARY KEY,
    user_id UUID NOT NULL,
    mode TEXT NOT NULL,
    duration_seconds INTEGER NOT NULL,
    started_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    completed_at TIMESTAMPTZ,
    abandoned_at TIMESTAMPTZ,
    expires_at TIMESTAMPTZ,
    status TEXT NOT NULL,
    xp_awarded INTEGER NOT NULL DEFAULT 0,
    coins_awarded INTEGER NOT NULL DEFAULT 0,
    task_id UUID,
    task_title TEXT,
    paused_at TIMESTAMPTZ,
    paused_remaining_seconds INTEGER,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- =============================================================================
-- HABITS & GOALS
-- =============================================================================

CREATE TABLE goal_milestones (
    id UUID PRIMARY KEY,
    goal_id UUID NOT NULL,
    title TEXT NOT NULL,
    description TEXT,
    is_completed BOOLEAN NOT NULL,
    completed_at TIMESTAMPTZ,
    sort_order INTEGER NOT NULL
);

CREATE TABLE goals (
    id UUID PRIMARY KEY,
    user_id UUID NOT NULL,
    title TEXT NOT NULL,
    description TEXT,
    category TEXT,
    target_date DATE,
    started_at TIMESTAMPTZ,
    completed_at TIMESTAMPTZ,
    status TEXT NOT NULL,
    progress INTEGER NOT NULL,
    priority INTEGER NOT NULL,
    sort_order INTEGER NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE habit_completions (
    id UUID PRIMARY KEY,
    habit_id UUID NOT NULL,
    user_id UUID NOT NULL,
    completed_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    completed_date DATE NOT NULL,
    notes TEXT
);

CREATE TABLE habits (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL,
    name TEXT NOT NULL,
    description TEXT,
    frequency TEXT NOT NULL,
    target_count INTEGER NOT NULL,
    custom_days INTEGER[],
    icon TEXT,
    color TEXT,
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    current_streak INTEGER NOT NULL DEFAULT 0,
    longest_streak INTEGER NOT NULL DEFAULT 0,
    last_completed_at TIMESTAMPTZ,
    sort_order INTEGER NOT NULL DEFAULT 0,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- =============================================================================
-- READING & BOOKS
-- =============================================================================

CREATE TABLE books (
    id UUID PRIMARY KEY,
    user_id UUID NOT NULL,
    title TEXT NOT NULL,
    author TEXT,
    total_pages INTEGER,
    current_page INTEGER NOT NULL,
    status TEXT NOT NULL,
    started_at TIMESTAMPTZ,
    completed_at TIMESTAMPTZ,
    rating INTEGER,
    notes TEXT,
    cover_blob_id UUID,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE reading_sessions (
    id UUID PRIMARY KEY,
    book_id UUID NOT NULL,
    user_id UUID NOT NULL,
    pages_read INTEGER NOT NULL,
    start_page INTEGER,
    end_page INTEGER,
    duration_minutes INTEGER,
    started_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    notes TEXT,
    xp_awarded INTEGER NOT NULL,
    coins_awarded INTEGER NOT NULL
);

-- =============================================================================
-- FITNESS & EXERCISE
-- =============================================================================

CREATE TABLE personal_records (
    id UUID PRIMARY KEY,
    user_id UUID NOT NULL,
    exercise_id UUID NOT NULL,
    record_type TEXT NOT NULL,
    value REAL NOT NULL,
    reps INTEGER,
    achieved_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    exercise_set_id UUID,
    previous_value REAL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE workout_exercises (
    id UUID PRIMARY KEY,
    workout_id UUID NOT NULL,
    section_id UUID,
    exercise_id UUID NOT NULL,
    sets INTEGER,
    reps INTEGER,
    weight REAL,
    duration INTEGER,
    rest_seconds INTEGER,
    notes TEXT,
    sort_order INTEGER NOT NULL
);

CREATE TABLE workout_sessions (
    id UUID PRIMARY KEY,
    user_id UUID NOT NULL,
    workout_id UUID,
    started_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    completed_at TIMESTAMPTZ,
    duration_seconds INTEGER,
    notes TEXT,
    rating INTEGER,
    xp_awarded INTEGER NOT NULL,
    coins_awarded INTEGER NOT NULL
);

-- =============================================================================
-- LEARNING & COURSES
-- =============================================================================

CREATE TABLE learn_lessons (
    id UUID PRIMARY KEY,
    topic_id UUID NOT NULL,
    key TEXT NOT NULL,
    title TEXT NOT NULL,
    description TEXT,
    content_markdown TEXT,
    duration_minutes INTEGER,
    difficulty TEXT NOT NULL,
    quiz_json JSONB,
    xp_reward INTEGER NOT NULL,
    coin_reward INTEGER NOT NULL,
    skill_key TEXT,
    skill_star_reward INTEGER NOT NULL,
    audio_r2_key TEXT,
    video_url TEXT,
    sort_order INTEGER NOT NULL,
    is_active BOOLEAN NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE learn_topics (
    id UUID PRIMARY KEY,
    key TEXT NOT NULL,
    name TEXT NOT NULL,
    description TEXT,
    category TEXT NOT NULL,
    icon TEXT,
    color TEXT,
    sort_order INTEGER NOT NULL,
    is_active BOOLEAN NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE user_lesson_progress (
    id UUID PRIMARY KEY,
    user_id UUID NOT NULL,
    lesson_id UUID NOT NULL,
    status TEXT NOT NULL,
    started_at TIMESTAMPTZ,
    completed_at TIMESTAMPTZ,
    quiz_score INTEGER,
    attempts INTEGER NOT NULL
);

-- =============================================================================
-- SHOP & MARKET
-- =============================================================================

CREATE TABLE market_items (
    id UUID PRIMARY KEY,
    key TEXT NOT NULL,
    name TEXT NOT NULL,
    description TEXT,
    category TEXT NOT NULL,
    cost_coins INTEGER NOT NULL,
    rarity TEXT,
    icon TEXT,
    image_url TEXT,
    is_global BOOLEAN NOT NULL,
    is_available BOOLEAN NOT NULL,
    is_active BOOLEAN NOT NULL,
    is_consumable BOOLEAN NOT NULL,
    uses_per_purchase INTEGER,
    total_stock INTEGER,
    remaining_stock INTEGER,
    created_by_user_id UUID,
    sort_order INTEGER NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE user_purchases (
    id UUID PRIMARY KEY,
    user_id UUID NOT NULL,
    item_id UUID NOT NULL,
    cost_coins INTEGER NOT NULL,
    quantity INTEGER NOT NULL,
    purchased_at TIMESTAMPTZ NOT NULL,
    redeemed_at TIMESTAMPTZ,
    uses_remaining INTEGER,
    status TEXT NOT NULL,
    refunded_at TIMESTAMPTZ,
    refund_reason TEXT
);

-- =============================================================================
-- CALENDAR & PLANNING
-- =============================================================================

CREATE TABLE calendar_events (
    id UUID PRIMARY KEY,
    user_id UUID NOT NULL,
    title TEXT NOT NULL,
    description TEXT,
    event_type TEXT NOT NULL,
    start_time TIMESTAMPTZ NOT NULL,
    end_time TIMESTAMPTZ,
    all_day BOOLEAN NOT NULL,
    timezone TEXT,
    location TEXT,
    workout_id UUID,
    habit_id UUID,
    goal_id UUID,
    recurrence_rule TEXT,
    recurrence_end DATE,
    parent_event_id UUID,
    color TEXT,
    reminder_minutes INTEGER,
    metadata JSONB,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE daily_plans (
    id UUID PRIMARY KEY,
    user_id UUID NOT NULL,
    date DATE NOT NULL,
    items JSONB NOT NULL,
    notes TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- =============================================================================
-- ANALYSIS FRAMES
-- =============================================================================

CREATE TABLE analysis_events (
    id UUID PRIMARY KEY,
    analysis_id UUID NOT NULL,
    time_ms INTEGER NOT NULL,
    duration_ms INTEGER,
    event_type TEXT NOT NULL,
    event_data JSONB,
    confidence REAL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE analysis_frame_data (
    id UUID PRIMARY KEY,
    manifest_id UUID NOT NULL,
    chunk_index INTEGER NOT NULL,
    start_frame INTEGER NOT NULL,
    end_frame INTEGER NOT NULL,
    start_time_ms INTEGER NOT NULL,
    end_time_ms INTEGER NOT NULL,
    frame_data BYTEA NOT NULL,
    frame_count INTEGER NOT NULL,
    compressed BOOLEAN NOT NULL,
    compression_type TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE analysis_frame_manifests (
    id UUID PRIMARY KEY,
    analysis_id UUID NOT NULL,
    manifest_version INTEGER NOT NULL,
    hop_ms INTEGER NOT NULL,
    frame_count INTEGER NOT NULL,
    duration_ms INTEGER NOT NULL,
    sample_rate INTEGER NOT NULL,
    bands INTEGER NOT NULL,
    bytes_per_frame INTEGER NOT NULL,
    frame_layout JSONB NOT NULL,
    events JSONB,
    fingerprint TEXT,
    analyzer_version TEXT NOT NULL,
    chunk_size_frames INTEGER NOT NULL,
    total_chunks INTEGER NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- =============================================================================
-- SYNC & SETTINGS
-- =============================================================================

CREATE TABLE feature_flags (
    id UUID PRIMARY KEY,
    flag_name TEXT NOT NULL,
    enabled BOOLEAN NOT NULL,
    description TEXT,
    metadata JSONB,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE user_settings (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL,
    notifications_enabled BOOLEAN NOT NULL,
    email_notifications BOOLEAN NOT NULL,
    push_notifications BOOLEAN NOT NULL,
    theme TEXT NOT NULL,
    timezone TEXT,
    locale TEXT NOT NULL,
    profile_public BOOLEAN NOT NULL,
    show_activity BOOLEAN NOT NULL,
    daily_reminder_time TEXT,
    soft_landing_until TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- =============================================================================
-- CONTENT & REFERENCES
-- =============================================================================

CREATE TABLE ideas (
    id UUID PRIMARY KEY,
    user_id UUID NOT NULL,
    title TEXT NOT NULL,
    content TEXT,
    category TEXT,
    tags TEXT[],
    is_pinned BOOLEAN NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE inbox_items (
    id UUID PRIMARY KEY,
    user_id UUID NOT NULL,
    title TEXT NOT NULL,
    description TEXT,
    item_type TEXT NOT NULL,
    tags TEXT[],
    is_processed BOOLEAN NOT NULL,
    processed_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- =============================================================================
-- ONBOARDING
-- =============================================================================

CREATE TABLE onboarding_flows (
    id UUID PRIMARY KEY,
    name TEXT NOT NULL,
    description TEXT,
    is_active BOOLEAN NOT NULL,
    total_steps INTEGER NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE onboarding_steps (
    id UUID PRIMARY KEY,
    flow_id UUID NOT NULL,
    step_order INTEGER NOT NULL,
    step_type TEXT NOT NULL,
    title TEXT NOT NULL,
    description TEXT,
    target_selector TEXT,
    target_route TEXT,
    fallback_content TEXT,
    options JSONB,
    allows_multiple BOOLEAN NOT NULL,
    required BOOLEAN NOT NULL,
    action_type TEXT,
    action_config JSONB,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- =============================================================================
-- ADMIN & PLATFORM
-- =============================================================================

CREATE TABLE audit_log (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID,
    session_id UUID,
    event_type TEXT NOT NULL,
    resource_type TEXT,
    resource_id UUID,
    action TEXT,
    status TEXT NOT NULL,
    details JSONB,
    ip_address TEXT,
    user_agent TEXT,
    request_id TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE feedback (
    id UUID PRIMARY KEY,
    user_id UUID NOT NULL,
    feedback_type TEXT NOT NULL,
    title TEXT NOT NULL,
    description TEXT NOT NULL,
    status TEXT NOT NULL,
    priority TEXT,
    admin_response TEXT,
    resolved_at TIMESTAMPTZ,
    metadata JSONB,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- =============================================================================
-- OTHER TABLES
-- =============================================================================

CREATE TABLE exercise_sets (
    id UUID PRIMARY KEY,
    session_id UUID NOT NULL,
    exercise_id UUID NOT NULL,
    set_number INTEGER NOT NULL,
    reps INTEGER,
    weight REAL,
    duration INTEGER,
    is_warmup BOOLEAN NOT NULL,
    is_dropset BOOLEAN NOT NULL,
    rpe INTEGER,
    notes TEXT,
    completed_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE exercises (
    id UUID PRIMARY KEY,
    name TEXT NOT NULL,
    description TEXT,
    category TEXT NOT NULL,
    muscle_groups TEXT[],
    equipment TEXT[],
    instructions TEXT,
    video_url TEXT,
    is_custom BOOLEAN NOT NULL,
    is_builtin BOOLEAN NOT NULL,
    user_id UUID,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE focus_libraries (
    id UUID PRIMARY KEY,
    user_id UUID NOT NULL,
    name TEXT NOT NULL,
    description TEXT,
    library_type TEXT NOT NULL,
    tracks_count INTEGER NOT NULL,
    is_favorite BOOLEAN NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE focus_library_tracks (
    id UUID PRIMARY KEY,
    library_id UUID NOT NULL,
    track_id TEXT,
    track_title TEXT NOT NULL,
    track_url TEXT,
    duration_seconds INTEGER,
    sort_order INTEGER NOT NULL,
    added_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE infobase_entries (
    id UUID PRIMARY KEY,
    user_id UUID NOT NULL,
    title TEXT NOT NULL,
    content TEXT NOT NULL,
    category TEXT,
    tags TEXT[],
    is_pinned BOOLEAN NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE learn_drills (
    id UUID PRIMARY KEY,
    topic_id UUID NOT NULL,
    key TEXT NOT NULL,
    title TEXT NOT NULL,
    description TEXT,
    drill_type TEXT NOT NULL,
    config_json JSONB NOT NULL,
    difficulty TEXT NOT NULL,
    duration_seconds INTEGER,
    xp_reward INTEGER NOT NULL,
    sort_order INTEGER NOT NULL,
    is_active BOOLEAN NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE listening_prompt_presets (
    id UUID PRIMARY KEY,
    name TEXT NOT NULL,
    description TEXT,
    template_id UUID NOT NULL,
    preset_type TEXT NOT NULL,
    config JSONB NOT NULL,
    is_active BOOLEAN NOT NULL,
    created_by UUID,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE listening_prompt_templates (
    id UUID PRIMARY KEY,
    name TEXT NOT NULL,
    description TEXT,
    category TEXT NOT NULL,
    difficulty TEXT NOT NULL,
    prompt_text TEXT NOT NULL,
    hints JSONB,
    expected_observations JSONB,
    tags TEXT[],
    display_order INTEGER NOT NULL,
    is_active BOOLEAN NOT NULL,
    created_by UUID,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE market_recommendations (
    id UUID PRIMARY KEY,
    user_id UUID NOT NULL,
    item_id UUID NOT NULL,
    score REAL NOT NULL,
    reason TEXT,
    computed_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE market_transactions (
    id UUID PRIMARY KEY,
    user_id UUID NOT NULL,
    transaction_type TEXT NOT NULL,
    coins_amount INTEGER NOT NULL,
    item_id UUID,
    reason TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE oauth_states (
    state_key TEXT PRIMARY KEY,
    pkce_verifier TEXT NOT NULL,
    redirect_uri TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    expires_at TIMESTAMPTZ NOT NULL
);

CREATE TABLE plan_templates (
    id UUID PRIMARY KEY,
    user_id UUID NOT NULL,
    name TEXT NOT NULL,
    description TEXT,
    items JSONB NOT NULL,
    is_public BOOLEAN NOT NULL,
    category TEXT,
    use_count INTEGER NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE points_ledger (
    id UUID PRIMARY KEY,
    user_id UUID NOT NULL,
    event_type TEXT NOT NULL,
    event_id UUID,
    coins INTEGER NOT NULL,
    xp INTEGER NOT NULL,
    skill_stars INTEGER NOT NULL DEFAULT 0,
    skill_key TEXT,
    reason TEXT,
    idempotency_key TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE program_weeks (
    id UUID PRIMARY KEY,
    program_id UUID NOT NULL,
    week_number INTEGER NOT NULL,
    name TEXT,
    is_deload BOOLEAN NOT NULL,
    notes TEXT
);

CREATE TABLE program_workouts (
    id UUID PRIMARY KEY,
    program_week_id UUID NOT NULL,
    workout_id UUID NOT NULL,
    day_of_week INTEGER NOT NULL,
    order_index INTEGER NOT NULL,
    intensity_modifier REAL NOT NULL
);

CREATE TABLE reference_tracks (
    id UUID PRIMARY KEY,
    user_id UUID NOT NULL,
    name TEXT NOT NULL,
    description TEXT,
    r2_key TEXT NOT NULL,
    file_size_bytes BIGINT NOT NULL,
    mime_type TEXT NOT NULL,
    duration_seconds REAL,
    artist TEXT,
    album TEXT,
    genre TEXT,
    bpm REAL,
    key_signature TEXT,
    tags TEXT[],
    status TEXT NOT NULL,
    error_message TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE track_analyses (
    id UUID PRIMARY KEY,
    track_id UUID NOT NULL,
    analysis_type TEXT NOT NULL,
    version TEXT NOT NULL,
    status TEXT NOT NULL,
    started_at TIMESTAMPTZ,
    completed_at TIMESTAMPTZ,
    error_message TEXT,
    summary JSONB,
    manifest JSONB,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE track_annotations (
    id UUID PRIMARY KEY,
    track_id UUID NOT NULL,
    user_id UUID NOT NULL,
    start_time_ms INTEGER NOT NULL,
    end_time_ms INTEGER,
    title TEXT NOT NULL,
    content TEXT,
    category TEXT,
    color TEXT,
    is_private BOOLEAN NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE track_regions (
    id UUID PRIMARY KEY,
    track_id UUID NOT NULL,
    user_id UUID NOT NULL,
    start_time_ms INTEGER NOT NULL,
    end_time_ms INTEGER NOT NULL,
    name TEXT NOT NULL,
    description TEXT,
    section_type TEXT,
    color TEXT,
    display_order INTEGER NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE training_programs (
    id UUID PRIMARY KEY,
    user_id UUID NOT NULL,
    name TEXT NOT NULL,
    description TEXT,
    duration_weeks INTEGER NOT NULL,
    goal TEXT,
    difficulty TEXT,
    is_active BOOLEAN NOT NULL,
    current_week INTEGER NOT NULL,
    started_at TIMESTAMPTZ,
    completed_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE user_drill_stats (
    id UUID PRIMARY KEY,
    user_id UUID NOT NULL,
    drill_id UUID NOT NULL,
    total_attempts INTEGER NOT NULL,
    correct_answers INTEGER NOT NULL,
    best_score INTEGER NOT NULL,
    average_score REAL NOT NULL,
    current_streak INTEGER NOT NULL,
    best_streak INTEGER NOT NULL,
    last_attempt_at TIMESTAMPTZ,
    total_time_seconds INTEGER NOT NULL
);

CREATE TABLE user_interests (
    id UUID PRIMARY KEY,
    user_id UUID NOT NULL,
    interest_key TEXT NOT NULL,
    interest_label TEXT NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE user_onboarding_responses (
    id UUID PRIMARY KEY,
    user_id UUID NOT NULL,
    step_id UUID NOT NULL,
    response JSONB NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE user_onboarding_state (
    id UUID PRIMARY KEY,
    user_id UUID NOT NULL,
    flow_id UUID NOT NULL,
    current_step_id UUID,
    status TEXT NOT NULL,
    can_resume BOOLEAN NOT NULL,
    started_at TIMESTAMPTZ,
    completed_at TIMESTAMPTZ,
    skipped_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE user_quest_progress (
    id UUID PRIMARY KEY,
    user_id UUID NOT NULL,
    quest_id UUID NOT NULL,
    status TEXT NOT NULL,
    progress INTEGER NOT NULL,
    accepted_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    completed_at TIMESTAMPTZ,
    claimed_at TIMESTAMPTZ,
    last_reset_at TIMESTAMPTZ,
    times_completed INTEGER NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE user_references (
    id UUID PRIMARY KEY,
    user_id UUID NOT NULL,
    title TEXT NOT NULL,
    content TEXT,
    url TEXT,
    category TEXT,
    tags TEXT[],
    is_pinned BOOLEAN NOT NULL,
    is_archived BOOLEAN NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE user_rewards (
    id UUID PRIMARY KEY,
    user_id UUID NOT NULL,
    reward_type TEXT NOT NULL,
    source_id UUID,
    coins_earned INTEGER NOT NULL,
    xp_earned INTEGER NOT NULL,
    claimed BOOLEAN NOT NULL,
    claimed_at TIMESTAMPTZ,
    expires_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE user_streaks (
    id UUID PRIMARY KEY,
    user_id UUID NOT NULL,
    streak_type TEXT NOT NULL,
    current_streak INTEGER NOT NULL,
    longest_streak INTEGER NOT NULL,
    last_activity_date DATE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE workout_sections (
    id UUID PRIMARY KEY,
    workout_id UUID NOT NULL,
    name TEXT NOT NULL,
    section_type TEXT,
    sort_order INTEGER NOT NULL
);

CREATE TABLE workouts (
    id UUID PRIMARY KEY,
    user_id UUID NOT NULL,
    name TEXT NOT NULL,
    description TEXT,
    estimated_duration INTEGER,
    difficulty TEXT,
    category TEXT,
    is_template BOOLEAN NOT NULL,
    is_public BOOLEAN NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- =============================================================================
-- UNIQUE CONSTRAINTS
-- =============================================================================

-- Single column unique constraints
ALTER TABLE users ADD CONSTRAINT users_email_unique UNIQUE (email);
ALTER TABLE sessions ADD CONSTRAINT sessions_token_unique UNIQUE (token);
ALTER TABLE skill_definitions ADD CONSTRAINT skill_definitions_key_unique UNIQUE (key);
ALTER TABLE achievement_definitions ADD CONSTRAINT achievement_definitions_key_unique UNIQUE (key);
ALTER TABLE roles ADD CONSTRAINT roles_name_unique UNIQUE (name);
ALTER TABLE entitlements ADD CONSTRAINT entitlements_name_unique UNIQUE (name);
ALTER TABLE feature_flags ADD CONSTRAINT feature_flags_flag_name_unique UNIQUE (flag_name);
ALTER TABLE learn_topics ADD CONSTRAINT learn_topics_key_unique UNIQUE (key);
ALTER TABLE onboarding_flows ADD CONSTRAINT onboarding_flows_name_unique UNIQUE (name);
ALTER TABLE market_items ADD CONSTRAINT market_items_key_unique UNIQUE (key);

-- Composite unique constraints for ON CONFLICT operations
ALTER TABLE accounts ADD CONSTRAINT accounts_provider_account_unique UNIQUE (provider, provider_account_id);
ALTER TABLE focus_pause_state ADD CONSTRAINT focus_pause_state_session_unique UNIQUE (session_id);
ALTER TABLE user_lesson_progress ADD CONSTRAINT user_lesson_progress_unique UNIQUE (user_id, lesson_id);
ALTER TABLE user_drill_stats ADD CONSTRAINT user_drill_stats_unique UNIQUE (user_id, drill_id);
ALTER TABLE user_skills ADD CONSTRAINT user_skills_user_unique UNIQUE (user_id);
ALTER TABLE user_purchases ADD CONSTRAINT user_purchases_unique UNIQUE (user_id, item_id);
ALTER TABLE user_settings ADD CONSTRAINT user_settings_unique UNIQUE (user_id);
ALTER TABLE user_onboarding_state ADD CONSTRAINT user_onboarding_state_user_unique UNIQUE (user_id);
ALTER TABLE user_onboarding_responses ADD CONSTRAINT user_onboarding_responses_unique UNIQUE (user_id, step_id);
ALTER TABLE user_roles ADD CONSTRAINT user_roles_user_role_unique UNIQUE (user_id, role_id);

-- =============================================================================
-- INDEXES
-- =============================================================================

-- Auth
CREATE INDEX idx_sessions_user_id ON sessions(user_id);
CREATE INDEX idx_sessions_token ON sessions(token);
CREATE INDEX idx_sessions_expires_at ON sessions(expires_at);
CREATE INDEX idx_accounts_user_id ON accounts(user_id);
CREATE INDEX idx_accounts_provider ON accounts(provider, provider_account_id);

-- User data
CREATE INDEX idx_habits_user_id ON habits(user_id);
CREATE INDEX idx_goals_user_id ON goals(user_id);
CREATE INDEX idx_books_user_id ON books(user_id);
CREATE INDEX idx_focus_sessions_user_id ON focus_sessions(user_id);
CREATE INDEX idx_user_quests_user_id ON user_quests(user_id);
CREATE INDEX idx_activity_events_user_id ON activity_events(user_id);
CREATE INDEX idx_user_wallet_user_id ON user_wallet(user_id);
CREATE INDEX idx_user_progress_user_id ON user_progress(user_id);

-- Timestamps
CREATE INDEX idx_activity_events_created_at ON activity_events(created_at);
CREATE INDEX idx_focus_sessions_started_at ON focus_sessions(started_at);
CREATE INDEX idx_habit_completions_completed_at ON habit_completions(completed_at);

-- Performance optimizations (Quick Wins)
CREATE INDEX idx_daily_plans_user_date ON daily_plans(user_id, date DESC);
CREATE INDEX idx_habit_completions_user_date ON habit_completions(user_id, completed_at DESC);
CREATE INDEX idx_user_settings_config_gin ON user_settings USING gin(config_json);
