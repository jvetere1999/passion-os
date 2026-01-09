-- Migration: 0010_listening_prompt_templates
-- Created: January 7, 2026
-- Purpose: Admin-curated listening prompt templates for critical listening exercises
-- Branch: refactor/stack-split

-- =============================================================================
-- Listening Prompt Templates Table
-- Admin-curated templates for guided critical listening exercises
-- =============================================================================

CREATE TABLE IF NOT EXISTS listening_prompt_templates (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

    -- Template metadata
    name TEXT NOT NULL,
    description TEXT,

    -- Categorization
    category TEXT NOT NULL DEFAULT 'general' CHECK (category IN (
        'general',
        'frequency',
        'dynamics',
        'spatial',
        'arrangement',
        'production',
        'mixing',
        'mastering',
        'genre_specific'
    )),

    -- Difficulty for progressive learning
    difficulty TEXT NOT NULL DEFAULT 'beginner' CHECK (difficulty IN (
        'beginner',
        'intermediate',
        'advanced',
        'expert'
    )),

    -- The actual prompt text users will see
    prompt_text TEXT NOT NULL,

    -- Hints/guidance for what to listen for
    hints JSONB DEFAULT '[]'::jsonb,

    -- Expected answer patterns or key observations (for self-check)
    expected_observations JSONB DEFAULT '[]'::jsonb,

    -- Tags for filtering and search
    tags JSONB DEFAULT '[]'::jsonb,

    -- Ordering within category
    display_order INTEGER NOT NULL DEFAULT 0,

    -- Active status (allows soft-disable without deletion)
    is_active BOOLEAN NOT NULL DEFAULT true,

    -- Created by admin (references users table)
    created_by UUID REFERENCES users(id) ON DELETE SET NULL,

    -- Timestamps
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Indexes for listening_prompt_templates
CREATE INDEX idx_listening_prompt_templates_category ON listening_prompt_templates(category);
CREATE INDEX idx_listening_prompt_templates_difficulty ON listening_prompt_templates(difficulty);
CREATE INDEX idx_listening_prompt_templates_active ON listening_prompt_templates(is_active);
CREATE INDEX idx_listening_prompt_templates_order ON listening_prompt_templates(category, display_order);

-- Trigger for updated_at
CREATE TRIGGER update_listening_prompt_templates_updated_at
    BEFORE UPDATE ON listening_prompt_templates
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- =============================================================================
-- Listening Prompt Template Presets Table
-- Pre-configured settings/presets that can be applied with templates
-- =============================================================================

CREATE TABLE IF NOT EXISTS listening_prompt_presets (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

    -- Preset metadata
    name TEXT NOT NULL,
    description TEXT,

    -- Parent template (optional - can be standalone or template-attached)
    template_id UUID REFERENCES listening_prompt_templates(id) ON DELETE CASCADE,

    -- Preset type
    preset_type TEXT NOT NULL DEFAULT 'focus' CHECK (preset_type IN (
        'focus',           -- What to focus on
        'comparison',      -- A/B comparison settings
        'loop',            -- Loop region settings
        'visualization'    -- Visualization display settings
    )),

    -- The preset configuration (structure depends on preset_type)
    -- focus: { bands: ["low", "mid"], aspects: ["dynamics", "stereo"] }
    -- comparison: { mode: "ab", switch_interval_ms: 3000 }
    -- loop: { suggested_duration_ms: 5000, auto_advance: true }
    -- visualization: { show_spectrum: true, show_loudness: true }
    config JSONB NOT NULL DEFAULT '{}'::jsonb,

    -- Active status
    is_active BOOLEAN NOT NULL DEFAULT true,

    -- Created by admin
    created_by UUID REFERENCES users(id) ON DELETE SET NULL,

    -- Timestamps
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Indexes for listening_prompt_presets
CREATE INDEX idx_listening_prompt_presets_template ON listening_prompt_presets(template_id);
CREATE INDEX idx_listening_prompt_presets_type ON listening_prompt_presets(preset_type);
CREATE INDEX idx_listening_prompt_presets_active ON listening_prompt_presets(is_active);

-- Trigger for updated_at
CREATE TRIGGER update_listening_prompt_presets_updated_at
    BEFORE UPDATE ON listening_prompt_presets
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- =============================================================================
-- Views for common queries
-- =============================================================================

-- View: Active templates with preset counts
CREATE OR REPLACE VIEW v_listening_templates_summary AS
SELECT
    t.id,
    t.name,
    t.category,
    t.difficulty,
    t.display_order,
    t.is_active,
    t.created_at,
    COUNT(p.id) FILTER (WHERE p.is_active = true) AS active_preset_count,
    COUNT(p.id) AS total_preset_count
FROM listening_prompt_templates t
LEFT JOIN listening_prompt_presets p ON p.template_id = t.id
GROUP BY t.id
ORDER BY t.category, t.display_order, t.created_at;

-- =============================================================================
-- Seed data: Example templates for initial deployment
-- =============================================================================

-- Insert example templates (commented out - uncomment for seeding)
/*
INSERT INTO listening_prompt_templates (name, description, category, difficulty, prompt_text, hints, expected_observations, tags, display_order)
VALUES
    (
        'Low Frequency Identification',
        'Practice identifying bass and sub-bass frequencies',
        'frequency',
        'beginner',
        'Listen to the low end of this track. Can you identify where the kick drum sits in the frequency spectrum versus the bass line?',
        '["Focus on frequencies below 200Hz", "Try to distinguish between the thump (80-120Hz) and the sub (30-60Hz)"]',
        '["Kick drum typically has fundamental around 60-80Hz with punch around 100-120Hz", "Bass often occupies 60-120Hz for fundamental with harmonics above"]',
        '["mixing", "bass", "kick"]',
        1
    ),
    (
        'Stereo Width Analysis',
        'Learn to identify stereo placement and width',
        'spatial',
        'beginner',
        'Identify which elements in this mix are centered versus panned. How wide does the overall mix feel?',
        '["Close your eyes and visualize the sound stage", "Listen for elements that stay fixed versus those that move"]',
        '["Vocals, bass, and kick are typically centered", "Guitars, keys, and effects often panned for width"]',
        '["mixing", "stereo", "panning"]',
        1
    ),
    (
        'Dynamic Range Assessment',
        'Evaluate the dynamics and compression in a mix',
        'dynamics',
        'intermediate',
        'How much dynamic range does this track have? Compare the loudest and quietest moments. Does the mix breathe?',
        '["Listen for pumping or breathing artifacts", "Compare verse to chorus dynamics", "Note if transients feel preserved or squashed"]',
        '["Well-preserved dynamics allow clear transient attack", "Over-compression creates pumping and fatigue", "Good dynamics create emotional impact"]',
        '["mastering", "compression", "loudness"]',
        1
    );
*/

-- =============================================================================
-- Comments for documentation
-- =============================================================================

COMMENT ON TABLE listening_prompt_templates IS 'Admin-curated templates for guided critical listening exercises';
COMMENT ON TABLE listening_prompt_presets IS 'Pre-configured settings/presets that accompany listening prompts';
COMMENT ON VIEW v_listening_templates_summary IS 'Active templates with preset counts for admin overview';

