-- OAuth State Storage (for distributed OAuth across multiple machines)
-- Stores PKCE verifier and redirect info during OAuth flow

CREATE TABLE oauth_states (
    state_key VARCHAR(64) PRIMARY KEY,
    pkce_verifier TEXT NOT NULL,
    redirect_uri TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    expires_at TIMESTAMPTZ NOT NULL DEFAULT (NOW() + INTERVAL '10 minutes')
);

-- Index for cleanup of expired states
CREATE INDEX idx_oauth_states_expires_at ON oauth_states(expires_at);

-- Comment
COMMENT ON TABLE oauth_states IS 'Temporary storage for OAuth state during authentication flow';
