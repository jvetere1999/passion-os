-- Migration: 0002_create_app_tables.sql
-- Application data tables for Passion OS
-- Extends auth tables from 0001

-- ============================================
-- Planner Core Tables
-- ============================================

-- Event log (append-only, source of truth)
CREATE TABLE IF NOT EXISTS log_events (
    id TEXT PRIMARY KEY,
    user_id TEXT NOT NULL,
    event_type TEXT NOT NULL,
    payload TEXT NOT NULL,
    timestamp TEXT NOT NULL,
    domain_id TEXT,
    created_at TEXT DEFAULT (datetime('now')),
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_log_events_user ON log_events(user_id);
CREATE INDEX IF NOT EXISTS idx_log_events_type ON log_events(event_type);
CREATE INDEX IF NOT EXISTS idx_log_events_timestamp ON log_events(timestamp);
CREATE INDEX IF NOT EXISTS idx_log_events_domain ON log_events(domain_id);

-- Quests (materialized from events)
CREATE TABLE IF NOT EXISTS quests (
    id TEXT PRIMARY KEY,
    user_id TEXT NOT NULL,
    title TEXT NOT NULL,
    description TEXT,
    domain_id TEXT NOT NULL,
    status TEXT NOT NULL DEFAULT 'pending',
    priority TEXT NOT NULL DEFAULT 'medium',
    due_date TEXT,
    created_at TEXT NOT NULL,
    updated_at TEXT NOT NULL,
    completed_at TEXT,
    tags TEXT,
    xp_value INTEGER DEFAULT 0,
    parent_id TEXT,
    content_hash TEXT NOT NULL,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (parent_id) REFERENCES quests(id) ON DELETE SET NULL
);

CREATE INDEX IF NOT EXISTS idx_quests_user ON quests(user_id);
CREATE INDEX IF NOT EXISTS idx_quests_status ON quests(status);
CREATE INDEX IF NOT EXISTS idx_quests_domain ON quests(domain_id);
CREATE INDEX IF NOT EXISTS idx_quests_due ON quests(due_date);
CREATE INDEX IF NOT EXISTS idx_quests_parent ON quests(parent_id);

-- Schedule rules
CREATE TABLE IF NOT EXISTS schedule_rules (
    id TEXT PRIMARY KEY,
    user_id TEXT NOT NULL,
    name TEXT NOT NULL,
    description TEXT,
    domain_id TEXT NOT NULL,
    enabled INTEGER NOT NULL DEFAULT 1,
    recurrence TEXT NOT NULL,
    days_of_week TEXT,
    day_of_month INTEGER,
    custom_cron TEXT,
    quest_template TEXT NOT NULL,
    created_at TEXT NOT NULL,
    updated_at TEXT NOT NULL,
    content_hash TEXT NOT NULL,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_schedule_rules_user ON schedule_rules(user_id);
CREATE INDEX IF NOT EXISTS idx_schedule_rules_enabled ON schedule_rules(enabled);

-- Plan templates
CREATE TABLE IF NOT EXISTS plan_templates (
    id TEXT PRIMARY KEY,
    user_id TEXT NOT NULL,
    name TEXT NOT NULL,
    description TEXT,
    domain_id TEXT NOT NULL,
    template_type TEXT NOT NULL,
    quest_templates TEXT NOT NULL,
    tags TEXT,
    estimated_duration INTEGER,
    created_at TEXT NOT NULL,
    updated_at TEXT NOT NULL,
    content_hash TEXT NOT NULL,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_plan_templates_user ON plan_templates(user_id);
CREATE INDEX IF NOT EXISTS idx_plan_templates_type ON plan_templates(template_type);

-- Skill tree state (one per user)
CREATE TABLE IF NOT EXISTS skill_trees (
    id TEXT PRIMARY KEY,
    user_id TEXT NOT NULL UNIQUE,
    version INTEGER NOT NULL DEFAULT 1,
    nodes TEXT NOT NULL,
    total_xp INTEGER NOT NULL DEFAULT 0,
    achievements TEXT,
    updated_at TEXT NOT NULL,
    content_hash TEXT NOT NULL,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- Reward ledger (append-only)
CREATE TABLE IF NOT EXISTS reward_ledger (
    id TEXT PRIMARY KEY,
    user_id TEXT NOT NULL,
    domain_id TEXT NOT NULL,
    reward_type TEXT NOT NULL,
    amount INTEGER NOT NULL,
    reason TEXT NOT NULL,
    source_event_id TEXT,
    metadata TEXT,
    created_at TEXT NOT NULL,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_reward_ledger_user ON reward_ledger(user_id);
CREATE INDEX IF NOT EXISTS idx_reward_ledger_type ON reward_ledger(reward_type);

-- ============================================
-- Focus Domain Tables
-- ============================================

CREATE TABLE IF NOT EXISTS focus_sessions (
    id TEXT PRIMARY KEY,
    user_id TEXT NOT NULL,
    started_at TEXT NOT NULL,
    ended_at TEXT,
    planned_duration INTEGER NOT NULL,
    actual_duration INTEGER,
    status TEXT NOT NULL,
    mode TEXT NOT NULL,
    metadata TEXT,
    created_at TEXT DEFAULT (datetime('now')),
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_focus_sessions_user ON focus_sessions(user_id);
CREATE INDEX IF NOT EXISTS idx_focus_sessions_started ON focus_sessions(started_at);
CREATE INDEX IF NOT EXISTS idx_focus_sessions_status ON focus_sessions(status);

-- ============================================
-- Producing Domain Tables
-- ============================================

-- Projects
CREATE TABLE IF NOT EXISTS projects (
    id TEXT PRIMARY KEY,
    user_id TEXT NOT NULL,
    name TEXT NOT NULL,
    description TEXT,
    notes TEXT,
    status TEXT NOT NULL DEFAULT 'active',
    starred INTEGER NOT NULL DEFAULT 0,
    tags TEXT,
    created_at TEXT NOT NULL,
    updated_at TEXT NOT NULL,
    content_hash TEXT NOT NULL,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_projects_user ON projects(user_id);
CREATE INDEX IF NOT EXISTS idx_projects_status ON projects(status);
CREATE INDEX IF NOT EXISTS idx_projects_starred ON projects(starred);

-- Reference libraries
CREATE TABLE IF NOT EXISTS reference_libraries (
    id TEXT PRIMARY KEY,
    user_id TEXT NOT NULL,
    name TEXT NOT NULL,
    description TEXT,
    created_at TEXT NOT NULL,
    updated_at TEXT NOT NULL,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_reference_libraries_user ON reference_libraries(user_id);

-- Reference tracks (blobs stored in R2)
CREATE TABLE IF NOT EXISTS reference_tracks (
    id TEXT PRIMARY KEY,
    library_id TEXT NOT NULL,
    user_id TEXT NOT NULL,
    name TEXT NOT NULL,
    blob_key TEXT NOT NULL,
    mime_type TEXT NOT NULL,
    size_bytes INTEGER NOT NULL,
    duration_ms INTEGER,
    metadata TEXT,
    created_at TEXT NOT NULL,
    FOREIGN KEY (library_id) REFERENCES reference_libraries(id) ON DELETE CASCADE,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_reference_tracks_library ON reference_tracks(library_id);
CREATE INDEX IF NOT EXISTS idx_reference_tracks_user ON reference_tracks(user_id);

-- Infobase entries
CREATE TABLE IF NOT EXISTS infobase_entries (
    id TEXT PRIMARY KEY,
    user_id TEXT NOT NULL,
    title TEXT NOT NULL,
    content TEXT NOT NULL,
    category TEXT,
    tags TEXT,
    pinned INTEGER NOT NULL DEFAULT 0,
    created_at TEXT NOT NULL,
    updated_at TEXT NOT NULL,
    content_hash TEXT NOT NULL,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_infobase_entries_user ON infobase_entries(user_id);
CREATE INDEX IF NOT EXISTS idx_infobase_entries_category ON infobase_entries(category);
CREATE INDEX IF NOT EXISTS idx_infobase_entries_pinned ON infobase_entries(pinned);

-- Lane templates
CREATE TABLE IF NOT EXISTS lane_templates (
    id TEXT PRIMARY KEY,
    user_id TEXT NOT NULL,
    name TEXT NOT NULL,
    template_type TEXT NOT NULL,
    lane_settings TEXT NOT NULL,
    notes TEXT NOT NULL,
    bpm INTEGER NOT NULL,
    bars INTEGER NOT NULL,
    time_signature TEXT NOT NULL,
    tags TEXT,
    created_at TEXT NOT NULL,
    updated_at TEXT NOT NULL,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_lane_templates_user ON lane_templates(user_id);
CREATE INDEX IF NOT EXISTS idx_lane_templates_type ON lane_templates(template_type);

-- ============================================
-- User Settings
-- ============================================

CREATE TABLE IF NOT EXISTS user_settings (
    user_id TEXT PRIMARY KEY,
    theme TEXT NOT NULL DEFAULT 'system',
    selected_product TEXT,
    keyboard_layout TEXT NOT NULL DEFAULT 'mac',
    notifications_enabled INTEGER NOT NULL DEFAULT 1,
    focus_default_duration INTEGER NOT NULL DEFAULT 1500,
    focus_break_duration INTEGER NOT NULL DEFAULT 300,
    focus_long_break_duration INTEGER NOT NULL DEFAULT 900,
    settings_json TEXT,
    updated_at TEXT DEFAULT (datetime('now')),
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

