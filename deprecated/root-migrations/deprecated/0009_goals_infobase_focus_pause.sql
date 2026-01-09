-- Migration: 0009_goals_infobase_focus_pause.sql
-- Add goals, infobase entries, and focus pause state tables

-- Goals table
CREATE TABLE IF NOT EXISTS goals (
    id TEXT PRIMARY KEY,
    user_id TEXT NOT NULL,
    title TEXT NOT NULL,
    description TEXT,
    category TEXT NOT NULL DEFAULT 'personal',
    deadline TEXT,
    milestones TEXT, -- JSON array of milestone objects
    completed INTEGER NOT NULL DEFAULT 0,
    created_at TEXT NOT NULL,
    updated_at TEXT NOT NULL,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_goals_user ON goals(user_id);
CREATE INDEX IF NOT EXISTS idx_goals_category ON goals(category);

-- Infobase entries table
CREATE TABLE IF NOT EXISTS infobase_entries (
    id TEXT PRIMARY KEY,
    user_id TEXT NOT NULL,
    title TEXT NOT NULL,
    content TEXT NOT NULL,
    category TEXT NOT NULL DEFAULT 'Tips',
    tags TEXT, -- JSON array of tags
    created_at TEXT NOT NULL,
    updated_at TEXT NOT NULL,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_infobase_user ON infobase_entries(user_id);
CREATE INDEX IF NOT EXISTS idx_infobase_category ON infobase_entries(category);

-- Focus pause state table (for cross-device sync)
CREATE TABLE IF NOT EXISTS focus_pause_state (
    id TEXT PRIMARY KEY,
    user_id TEXT NOT NULL UNIQUE,
    mode TEXT NOT NULL DEFAULT 'focus',
    time_remaining INTEGER NOT NULL,
    paused_at TEXT NOT NULL,
    created_at TEXT NOT NULL,
    updated_at TEXT NOT NULL,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_focus_pause_user ON focus_pause_state(user_id);

