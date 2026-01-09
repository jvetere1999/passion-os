-- Migration: 0007_universal_quests_admin.sql
-- Universal quests system, admin features, feedback, and user profiles

-- Add age and birthdate to users
ALTER TABLE users ADD COLUMN birthdate TEXT;
ALTER TABLE users ADD COLUMN age_verified INTEGER NOT NULL DEFAULT 0;
ALTER TABLE users ADD COLUMN age_verified_at TEXT;

-- Universal quests (admin-created, shared by all users)
-- Named universal_quests to avoid conflict with existing per-user quests table
CREATE TABLE IF NOT EXISTS universal_quests (
    id TEXT PRIMARY KEY,
    title TEXT NOT NULL,
    description TEXT NOT NULL,
    type TEXT NOT NULL DEFAULT 'daily', -- 'daily', 'weekly', 'special', 'achievement'
    xp_reward INTEGER NOT NULL DEFAULT 10,
    coin_reward INTEGER NOT NULL DEFAULT 5,
    target INTEGER NOT NULL DEFAULT 1,
    skill_id TEXT, -- Which skill gets XP (proficiency, knowledge, guts, kindness, charm)
    is_active INTEGER NOT NULL DEFAULT 1,
    start_date TEXT, -- When quest becomes available
    end_date TEXT, -- When quest expires (null = no expiry)
    created_by TEXT NOT NULL, -- Can be 'system' for default quests or user ID
    created_at TEXT NOT NULL,
    updated_at TEXT NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_universal_quests_type ON universal_quests(type);
CREATE INDEX IF NOT EXISTS idx_universal_quests_active ON universal_quests(is_active);

-- User quest progress (for universal quests)
CREATE TABLE IF NOT EXISTS user_quest_progress (
    id TEXT PRIMARY KEY,
    user_id TEXT NOT NULL,
    quest_id TEXT NOT NULL,
    progress INTEGER NOT NULL DEFAULT 0,
    completed INTEGER NOT NULL DEFAULT 0,
    completed_at TEXT,
    reset_date TEXT, -- For daily/weekly reset tracking
    created_at TEXT NOT NULL,
    updated_at TEXT NOT NULL,
    UNIQUE(user_id, quest_id, reset_date),
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (quest_id) REFERENCES universal_quests(id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_user_quest_progress_user ON user_quest_progress(user_id);
CREATE INDEX IF NOT EXISTS idx_user_quest_progress_quest ON user_quest_progress(quest_id);

-- User stats and wallet
CREATE TABLE IF NOT EXISTS user_stats (
    id TEXT PRIMARY KEY,
    user_id TEXT NOT NULL UNIQUE,
    coins INTEGER NOT NULL DEFAULT 0,
    total_xp INTEGER NOT NULL DEFAULT 0,
    level INTEGER NOT NULL DEFAULT 1,
    streak_current INTEGER NOT NULL DEFAULT 0,
    streak_best INTEGER NOT NULL DEFAULT 0,
    last_active_date TEXT,
    created_at TEXT NOT NULL,
    updated_at TEXT NOT NULL,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_user_stats_user ON user_stats(user_id);

-- User skills (Persona-style)
CREATE TABLE IF NOT EXISTS user_skills (
    id TEXT PRIMARY KEY,
    user_id TEXT NOT NULL,
    skill_id TEXT NOT NULL, -- 'proficiency', 'knowledge', 'guts', 'kindness', 'charm'
    level INTEGER NOT NULL DEFAULT 1,
    xp INTEGER NOT NULL DEFAULT 0,
    xp_to_next INTEGER NOT NULL DEFAULT 100,
    max_level INTEGER NOT NULL DEFAULT 10,
    created_at TEXT NOT NULL,
    updated_at TEXT NOT NULL,
    UNIQUE(user_id, skill_id),
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_user_skills_user ON user_skills(user_id);

-- Skill definitions (admin configurable)
CREATE TABLE IF NOT EXISTS skill_definitions (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    description TEXT,
    color TEXT NOT NULL DEFAULT '#8b5cf6',
    icon TEXT,
    max_level INTEGER NOT NULL DEFAULT 10,
    xp_scaling_base INTEGER NOT NULL DEFAULT 100, -- Base XP needed per level
    xp_scaling_multiplier REAL NOT NULL DEFAULT 1.5, -- Multiplier per level
    display_order INTEGER NOT NULL DEFAULT 0,
    is_active INTEGER NOT NULL DEFAULT 1,
    created_at TEXT NOT NULL,
    updated_at TEXT NOT NULL
);

-- Feedback system (bug reports, feature requests)
CREATE TABLE IF NOT EXISTS feedback (
    id TEXT PRIMARY KEY,
    user_id TEXT NOT NULL,
    type TEXT NOT NULL, -- 'bug', 'feature', 'other'
    title TEXT NOT NULL,
    description TEXT NOT NULL,
    status TEXT NOT NULL DEFAULT 'open', -- 'open', 'in_progress', 'resolved', 'closed'
    priority TEXT DEFAULT 'normal', -- 'low', 'normal', 'high', 'critical'
    admin_notes TEXT,
    resolved_by TEXT,
    resolved_at TEXT,
    created_at TEXT NOT NULL,
    updated_at TEXT NOT NULL,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (resolved_by) REFERENCES users(id) ON DELETE SET NULL
);

CREATE INDEX IF NOT EXISTS idx_feedback_user ON feedback(user_id);
CREATE INDEX IF NOT EXISTS idx_feedback_type ON feedback(type);
CREATE INDEX IF NOT EXISTS idx_feedback_status ON feedback(status);

-- Admin audit log
CREATE TABLE IF NOT EXISTS admin_audit_log (
    id TEXT PRIMARY KEY,
    admin_id TEXT NOT NULL,
    action TEXT NOT NULL,
    target_type TEXT, -- 'user', 'quest', 'feedback', 'skill', etc
    target_id TEXT,
    details TEXT, -- JSON blob of action details
    created_at TEXT NOT NULL,
    FOREIGN KEY (admin_id) REFERENCES users(id) ON DELETE SET NULL
);

CREATE INDEX IF NOT EXISTS idx_admin_audit_admin ON admin_audit_log(admin_id);
CREATE INDEX IF NOT EXISTS idx_admin_audit_target ON admin_audit_log(target_type, target_id);

-- Insert default skill definitions
INSERT OR IGNORE INTO skill_definitions (id, name, description, color, display_order, created_at, updated_at) VALUES
    ('proficiency', 'Proficiency', 'Task completion and productivity', '#ef4444', 0, datetime('now'), datetime('now')),
    ('knowledge', 'Knowledge', 'Learning and focus sessions', '#3b82f6', 1, datetime('now'), datetime('now')),
    ('guts', 'Guts', 'Exercise and pushing limits', '#f59e0b', 2, datetime('now'), datetime('now')),
    ('kindness', 'Kindness', 'Helping others and community', '#10b981', 3, datetime('now'), datetime('now')),
    ('charm', 'Charm', 'Social activities and networking', '#ec4899', 4, datetime('now'), datetime('now'));

-- Insert default quests
INSERT OR IGNORE INTO universal_quests (id, title, description, type, xp_reward, coin_reward, target, skill_id, created_by, created_at, updated_at) VALUES
    ('quest-daily-focus', 'Deep Focus', 'Complete 2 focus sessions', 'daily', 50, 25, 2, 'knowledge', 'system', datetime('now'), datetime('now')),
    ('quest-daily-exercise', 'Stay Active', 'Log 1 exercise session', 'daily', 30, 15, 1, 'guts', 'system', datetime('now'), datetime('now')),
    ('quest-daily-planner', 'Plan Ahead', 'Add 3 events to your planner', 'daily', 20, 10, 3, 'proficiency', 'system', datetime('now'), datetime('now')),
    ('quest-weekly-focus', 'Focus Master', 'Complete 10 focus sessions this week', 'weekly', 200, 100, 10, 'knowledge', 'system', datetime('now'), datetime('now')),
    ('quest-weekly-streak', 'Consistency', 'Maintain a 5-day streak', 'weekly', 150, 75, 5, 'proficiency', 'system', datetime('now'), datetime('now'));


