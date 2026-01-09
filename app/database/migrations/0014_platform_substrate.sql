-- ============================================================================
-- Migration: 0014_platform_substrate
-- Created: January 7, 2026
-- Purpose: Platform tables (Feedback, Infobase, Ideas, Onboarding, User Settings)
--
-- This migration implements:
--   - feedback: User bug reports and feature requests
--   - infobase_entries: Knowledge base entries
--   - ideas: User ideas/notes
--   - onboarding_flows: Onboarding flow definitions
--   - onboarding_steps: Steps within flows
--   - user_onboarding_state: User's onboarding progress
--   - user_settings: User preferences
--   - user_interests: User interest selections
--
-- D1 → Postgres Changes:
--   - TEXT PRIMARY KEY → UUID with gen_random_uuid()
--   - TEXT timestamps → TIMESTAMPTZ
--   - JSON columns → JSONB for better indexing
--   - Added proper indexes and constraints
--
-- References:
--   - d1_usage_inventory.md: D1 platform tables
--   - feature_porting_playbook.md: Wave 4
-- ============================================================================

-- ============================================================================
-- SECTION 1: FEEDBACK
-- ============================================================================

-- User feedback (bug reports, feature requests)
CREATE TABLE feedback (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,

    -- Feedback type
    feedback_type TEXT NOT NULL CHECK (feedback_type IN ('bug', 'feature', 'other')),

    -- Content
    title TEXT NOT NULL,
    description TEXT NOT NULL,

    -- Status
    status TEXT NOT NULL DEFAULT 'open' CHECK (status IN (
        'open', 'acknowledged', 'in_progress', 'resolved', 'closed', 'wont_fix'
    )),

    -- Priority
    priority TEXT NOT NULL DEFAULT 'normal' CHECK (priority IN (
        'low', 'normal', 'high', 'urgent'
    )),

    -- Admin response
    admin_response TEXT,
    resolved_at TIMESTAMPTZ,

    -- Metadata
    metadata JSONB,

    -- Timestamps
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Indexes
CREATE INDEX idx_feedback_user ON feedback(user_id);
CREATE INDEX idx_feedback_status ON feedback(status);
CREATE INDEX idx_feedback_type ON feedback(feedback_type);
CREATE INDEX idx_feedback_created ON feedback(created_at DESC);

-- Auto-update updated_at
CREATE TRIGGER update_feedback_updated_at
    BEFORE UPDATE ON feedback
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- ============================================================================
-- SECTION 2: INFOBASE
-- ============================================================================

-- Knowledge base entries
CREATE TABLE infobase_entries (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,

    -- Content
    title TEXT NOT NULL,
    content TEXT NOT NULL,

    -- Organization
    category TEXT NOT NULL DEFAULT 'Tips',
    tags JSONB,

    -- Timestamps
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Indexes
CREATE INDEX idx_infobase_user ON infobase_entries(user_id);
CREATE INDEX idx_infobase_category ON infobase_entries(category);
CREATE INDEX idx_infobase_updated ON infobase_entries(updated_at DESC);

-- Full-text search index
CREATE INDEX idx_infobase_search ON infobase_entries 
    USING GIN (to_tsvector('english', title || ' ' || content));

-- Auto-update updated_at
CREATE TRIGGER update_infobase_updated_at
    BEFORE UPDATE ON infobase_entries
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- ============================================================================
-- SECTION 3: IDEAS
-- ============================================================================

-- User ideas/notes
CREATE TABLE ideas (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,

    -- Content
    title TEXT NOT NULL,
    content TEXT,

    -- Organization
    category TEXT NOT NULL DEFAULT 'general',
    tags JSONB,

    -- Status
    is_pinned BOOLEAN NOT NULL DEFAULT false,

    -- Timestamps
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Indexes
CREATE INDEX idx_ideas_user ON ideas(user_id);
CREATE INDEX idx_ideas_category ON ideas(category);
CREATE INDEX idx_ideas_pinned ON ideas(is_pinned);
CREATE INDEX idx_ideas_created ON ideas(created_at DESC);

-- Auto-update updated_at
CREATE TRIGGER update_ideas_updated_at
    BEFORE UPDATE ON ideas
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- ============================================================================
-- SECTION 4: ONBOARDING FLOWS
-- ============================================================================

-- Onboarding flow definitions
CREATE TABLE onboarding_flows (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    
    -- Flow info
    name TEXT NOT NULL UNIQUE,
    description TEXT,
    
    -- Status
    is_active BOOLEAN NOT NULL DEFAULT true,
    
    -- Metrics
    total_steps INTEGER NOT NULL DEFAULT 0,
    
    -- Timestamps
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Insert default flow
INSERT INTO onboarding_flows (id, name, description, total_steps, is_active)
VALUES (
    'a0000000-0000-4000-8000-000000000001'::UUID,
    'flow_main_v1',
    'Main onboarding flow for new users',
    5,
    true
);

-- Onboarding steps
CREATE TABLE onboarding_steps (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    flow_id UUID NOT NULL REFERENCES onboarding_flows(id) ON DELETE CASCADE,
    
    -- Step order
    step_order INTEGER NOT NULL,
    
    -- Step type
    step_type TEXT NOT NULL CHECK (step_type IN (
        'welcome', 'tour', 'input', 'multi_select', 'action', 'completion'
    )),
    
    -- Content
    title TEXT NOT NULL,
    description TEXT,
    
    -- Targeting (for tour steps)
    target_selector TEXT,
    target_route TEXT,
    fallback_content TEXT,
    
    -- Options (for multi_select/input steps)
    options JSONB,
    allows_multiple BOOLEAN NOT NULL DEFAULT false,
    
    -- Validation
    required BOOLEAN NOT NULL DEFAULT true,
    
    -- Action config
    action_type TEXT,
    action_config JSONB,
    
    -- Timestamps
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    
    -- Unique step order per flow
    UNIQUE(flow_id, step_order)
);

-- Indexes
CREATE INDEX idx_onboarding_steps_flow ON onboarding_steps(flow_id);
CREATE INDEX idx_onboarding_steps_order ON onboarding_steps(flow_id, step_order);

-- Insert default steps
INSERT INTO onboarding_steps (id, flow_id, step_order, step_type, title, description, required) VALUES
('b0000000-0000-4000-8000-000000000001'::UUID, 'a0000000-0000-4000-8000-000000000001'::UUID, 1, 'welcome', 'Welcome to Ignition', 'Let''s get you set up for success.', true),
('b0000000-0000-4000-8000-000000000002'::UUID, 'a0000000-0000-4000-8000-000000000001'::UUID, 2, 'multi_select', 'What are your interests?', 'Select topics you want to focus on.', true),
('b0000000-0000-4000-8000-000000000003'::UUID, 'a0000000-0000-4000-8000-000000000001'::UUID, 3, 'input', 'Set your first goal', 'What do you want to achieve?', true),
('b0000000-0000-4000-8000-000000000004'::UUID, 'a0000000-0000-4000-8000-000000000001'::UUID, 4, 'tour', 'Explore the Dashboard', 'Let''s take a quick tour.', false),
('b0000000-0000-4000-8000-000000000005'::UUID, 'a0000000-0000-4000-8000-000000000001'::UUID, 5, 'completion', 'You''re all set!', 'Start your journey now.', true);

-- Auto-update updated_at
CREATE TRIGGER update_onboarding_steps_updated_at
    BEFORE UPDATE ON onboarding_steps
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- ============================================================================
-- SECTION 5: USER ONBOARDING STATE
-- ============================================================================

-- User's onboarding progress
CREATE TABLE user_onboarding_state (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    flow_id UUID NOT NULL REFERENCES onboarding_flows(id) ON DELETE CASCADE,
    
    -- Current position
    current_step_id UUID REFERENCES onboarding_steps(id),
    
    -- Status
    status TEXT NOT NULL DEFAULT 'not_started' CHECK (status IN (
        'not_started', 'in_progress', 'completed', 'skipped'
    )),
    
    -- Resume capability
    can_resume BOOLEAN NOT NULL DEFAULT true,
    
    -- Timestamps
    started_at TIMESTAMPTZ,
    completed_at TIMESTAMPTZ,
    skipped_at TIMESTAMPTZ,
    
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    
    -- One state per user
    UNIQUE(user_id)
);

-- Indexes
CREATE INDEX idx_user_onboarding_user ON user_onboarding_state(user_id);
CREATE INDEX idx_user_onboarding_status ON user_onboarding_state(status);

-- Auto-update updated_at
CREATE TRIGGER update_user_onboarding_state_updated_at
    BEFORE UPDATE ON user_onboarding_state
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Step responses (user answers to onboarding questions)
CREATE TABLE user_onboarding_responses (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    step_id UUID NOT NULL REFERENCES onboarding_steps(id) ON DELETE CASCADE,
    
    -- Response data
    response JSONB NOT NULL,
    
    -- Timestamps
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    
    -- One response per user per step
    UNIQUE(user_id, step_id)
);

-- Indexes
CREATE INDEX idx_user_onboarding_responses_user ON user_onboarding_responses(user_id);

-- ============================================================================
-- SECTION 6: USER SETTINGS
-- ============================================================================

-- User preferences and settings
CREATE TABLE user_settings (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    
    -- Notification settings
    notifications_enabled BOOLEAN NOT NULL DEFAULT true,
    email_notifications BOOLEAN NOT NULL DEFAULT true,
    push_notifications BOOLEAN NOT NULL DEFAULT false,
    
    -- Display settings
    theme TEXT NOT NULL DEFAULT 'system' CHECK (theme IN ('light', 'dark', 'system')),
    timezone TEXT,
    locale TEXT NOT NULL DEFAULT 'en',
    
    -- Privacy settings
    profile_public BOOLEAN NOT NULL DEFAULT false,
    show_activity BOOLEAN NOT NULL DEFAULT true,
    
    -- Feature settings
    soft_landing_until TIMESTAMPTZ,  -- Reduced complexity mode
    daily_reminder_time TEXT,         -- HH:MM format
    
    -- Timestamps
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    
    -- One settings record per user
    UNIQUE(user_id)
);

-- Indexes
CREATE INDEX idx_user_settings_user ON user_settings(user_id);

-- Auto-update updated_at
CREATE TRIGGER update_user_settings_updated_at
    BEFORE UPDATE ON user_settings
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- ============================================================================
-- SECTION 7: USER INTERESTS
-- ============================================================================

-- User interest selections (from onboarding)
CREATE TABLE user_interests (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    
    -- Interest category
    interest_key TEXT NOT NULL,
    interest_label TEXT NOT NULL,
    
    -- Timestamps
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    
    -- Unique interest per user
    UNIQUE(user_id, interest_key)
);

-- Indexes
CREATE INDEX idx_user_interests_user ON user_interests(user_id);
CREATE INDEX idx_user_interests_key ON user_interests(interest_key);
