-- Migration: 0001_create_auth_tables.sql
-- Auth.js D1 Adapter tables
-- See: https://authjs.dev/getting-started/adapters/d1

CREATE TABLE IF NOT EXISTS users (
    id TEXT PRIMARY KEY,
    name TEXT,
    email TEXT UNIQUE,
    emailVerified INTEGER,
    image TEXT,
    created_at TEXT DEFAULT (datetime('now')),
    updated_at TEXT DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS accounts (
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
    FOREIGN KEY (userId) REFERENCES users(id) ON DELETE CASCADE,
    UNIQUE(provider, providerAccountId)
);

CREATE INDEX IF NOT EXISTS idx_accounts_userId ON accounts(userId);

CREATE TABLE IF NOT EXISTS sessions (
    id TEXT PRIMARY KEY,
    sessionToken TEXT UNIQUE NOT NULL,
    userId TEXT NOT NULL,
    expires TEXT NOT NULL,
    FOREIGN KEY (userId) REFERENCES users(id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_sessions_userId ON sessions(userId);
CREATE INDEX IF NOT EXISTS idx_sessions_sessionToken ON sessions(sessionToken);

CREATE TABLE IF NOT EXISTS verification_tokens (
    identifier TEXT NOT NULL,
    token TEXT NOT NULL,
    expires TEXT NOT NULL,
    PRIMARY KEY(identifier, token)
);

-- Authenticators table for WebAuthn (optional, included for completeness)
CREATE TABLE IF NOT EXISTS authenticators (
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

CREATE INDEX IF NOT EXISTS idx_authenticators_credentialID ON authenticators(credentialID);
CREATE INDEX IF NOT EXISTS idx_authenticators_userId ON authenticators(userId);

