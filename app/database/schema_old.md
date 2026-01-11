# Database Schema Documentation

**Created:** January 6, 2026  
**Branch:** `refactor/stack-split`  
**Database:** PostgreSQL 17+  
**Purpose:** Document the Postgres schema for the Ignition backend

---

## Overview

The database schema is organized into substrate layers:

| Layer | Description | Migration |
|-------|-------------|-----------|
| **Auth Substrate** | Identity, sessions, RBAC | `0001_auth_substrate.sql` |
| **Gamification Substrate** | XP, coins, achievements, skills | Planned: `0002_gamification.sql` |
| **Content Substrate** | Quests, exercises, learning | Planned: `0003_content.sql` |
| **User Data Substrate** | Settings, plans, activities | Planned: `0004_user_data.sql` |

---

## Migration 0001: Auth Substrate

### Tables

#### `users`

Core user identity table.

| Column | Type | Nullable | Default | Description |
|--------|------|----------|---------|-------------|
| `id` | UUID | NO | `gen_random_uuid()` | Primary key |
| `name` | TEXT | NO | `'User'` | Display name |
| `email` | TEXT | NO | - | Unique email address |
| `email_verified` | TIMESTAMPTZ | YES | - | When email was verified |
| `image` | TEXT | YES | - | Profile image URL |
| `role` | TEXT | NO | `'user'` | Legacy role (user/admin/moderator) |
| `approved` | BOOLEAN | NO | `true` | Account approval status |
| `age_verified` | BOOLEAN | NO | `true` | Age verification (COPPA) |
| `tos_accepted` | BOOLEAN | NO | `false` | Terms of Service accepted |
| `tos_accepted_at` | TIMESTAMPTZ | YES | - | When TOS was accepted |
| `tos_version` | TEXT | YES | - | TOS version accepted |
| `last_activity_at` | TIMESTAMPTZ | YES | - | Last user activity |
| `created_at` | TIMESTAMPTZ | NO | `NOW()` | Account creation time |
| `updated_at` | TIMESTAMPTZ | NO | `NOW()` | Last update time |

**Indexes:**
- `idx_users_email` - Unique email lookup
- `idx_users_role` - Role-based queries
- `idx_users_created_at` - Temporal queries

**Constraints:**
- `role` must be one of: `'user'`, `'admin'`, `'moderator'`

---

#### `accounts`

OAuth provider account links.

| Column | Type | Nullable | Default | Description |
|--------|------|----------|---------|-------------|
| `id` | UUID | NO | `gen_random_uuid()` | Primary key |
| `user_id` | UUID | NO | - | FK to users |
| `type` | TEXT | NO | `'oauth'` | Account type |
| `provider` | TEXT | NO | - | OAuth provider (google/azure-ad) |
| `provider_account_id` | TEXT | NO | - | ID from provider |
| `refresh_token` | TEXT | YES | - | OAuth refresh token |
| `access_token` | TEXT | YES | - | OAuth access token |
| `expires_at` | BIGINT | YES | - | Token expiration (Unix) |
| `token_type` | TEXT | YES | - | Token type (Bearer) |
| `scope` | TEXT | YES | - | OAuth scopes |
| `id_token` | TEXT | YES | - | OIDC ID token |
| `session_state` | TEXT | YES | - | OAuth session state |
| `created_at` | TIMESTAMPTZ | NO | `NOW()` | Creation time |
| `updated_at` | TIMESTAMPTZ | NO | `NOW()` | Last update |

**Indexes:**
- `idx_accounts_user_id` - User account lookup
- `idx_accounts_provider` - Provider-based queries

**Constraints:**
- `provider` must be one of: `'google'`, `'azure-ad'`, `'credentials'`
- Unique on `(provider, provider_account_id)`

---

#### `sessions`

Active user sessions (per DEC-001=A).

| Column | Type | Nullable | Default | Description |
|--------|------|----------|---------|-------------|
| `id` | UUID | NO | `gen_random_uuid()` | Primary key |
| `user_id` | UUID | NO | - | FK to users |
| `token` | TEXT | NO | - | Session token (in cookie) |
| `expires_at` | TIMESTAMPTZ | NO | - | Session expiration |
| `created_at` | TIMESTAMPTZ | NO | `NOW()` | Session creation |
| `last_activity_at` | TIMESTAMPTZ | NO | `NOW()` | Last activity |
| `user_agent` | TEXT | YES | - | Browser user agent |
| `ip_address` | INET | YES | - | Client IP address |
| `rotated_from` | UUID | YES | - | Previous session (rotation) |

**Indexes:**
- `idx_sessions_token` - Token lookup
- `idx_sessions_user_id` - User sessions
- `idx_sessions_expires_at` - Expiry cleanup
- `idx_sessions_last_activity` - Activity queries

---

#### `verification_tokens`

Email verification/magic link tokens.

| Column | Type | Nullable | Default | Description |
|--------|------|----------|---------|-------------|
| `identifier` | TEXT | NO | - | Email or identifier |
| `token` | TEXT | NO | - | Verification token |
| `expires` | TIMESTAMPTZ | NO | - | Token expiration |
| `created_at` | TIMESTAMPTZ | NO | `NOW()` | Creation time |

**Primary Key:** `(identifier, token)`

---

#### `authenticators`

WebAuthn/Passkey credentials.

| Column | Type | Nullable | Default | Description |
|--------|------|----------|---------|-------------|
| `id` | UUID | NO | `gen_random_uuid()` | Primary key |
| `user_id` | UUID | NO | - | FK to users |
| `credential_id` | TEXT | NO | - | WebAuthn credential ID |
| `provider_account_id` | TEXT | NO | - | Provider account ID |
| `credential_public_key` | TEXT | NO | - | Public key (base64) |
| `counter` | BIGINT | NO | `0` | Signature counter |
| `credential_device_type` | TEXT | NO | `'singleDevice'` | Device type |
| `credential_backed_up` | BOOLEAN | NO | `false` | Backed up flag |
| `transports` | TEXT | YES | - | Transport types (JSON) |
| `created_at` | TIMESTAMPTZ | NO | `NOW()` | Creation time |

---

### RBAC Tables (per DEC-004=B)

#### `roles`

Role definitions.

| Column | Type | Nullable | Default | Description |
|--------|------|----------|---------|-------------|
| `id` | UUID | NO | `gen_random_uuid()` | Primary key |
| `name` | TEXT | NO | - | Role name (unique) |
| `description` | TEXT | YES | - | Role description |
| `parent_role_id` | UUID | YES | - | Parent role (hierarchy) |
| `created_at` | TIMESTAMPTZ | NO | `NOW()` | Creation time |

**Default Roles:**
- `user` - Standard user with basic access
- `admin` - Administrator with full access
- `moderator` - Moderator with limited admin access

---

#### `entitlements`

Granular permissions.

| Column | Type | Nullable | Default | Description |
|--------|------|----------|---------|-------------|
| `id` | UUID | NO | `gen_random_uuid()` | Primary key |
| `name` | TEXT | NO | - | Entitlement name (unique) |
| `description` | TEXT | YES | - | Description |
| `resource` | TEXT | NO | - | Resource type |
| `action` | TEXT | NO | - | Action type |
| `created_at` | TIMESTAMPTZ | NO | `NOW()` | Creation time |

**Default Entitlements:**
- `users:read`, `users:write`, `users:delete`
- `admin:access`, `admin:users`, `admin:content`, `admin:backup`
- `quests:read`, `quests:write`, `quests:admin`
- `feedback:read`, `feedback:write`, `feedback:admin`

---

#### `role_entitlements`

Role-to-entitlement mapping.

| Column | Type | Nullable | Default | Description |
|--------|------|----------|---------|-------------|
| `role_id` | UUID | NO | - | FK to roles |
| `entitlement_id` | UUID | NO | - | FK to entitlements |
| `created_at` | TIMESTAMPTZ | NO | `NOW()` | Grant time |

**Primary Key:** `(role_id, entitlement_id)`

---

#### `user_roles`

User-to-role mapping.

| Column | Type | Nullable | Default | Description |
|--------|------|----------|---------|-------------|
| `user_id` | UUID | NO | - | FK to users |
| `role_id` | UUID | NO | - | FK to roles |
| `granted_by` | UUID | YES | - | FK to granting user |
| `granted_at` | TIMESTAMPTZ | NO | `NOW()` | Grant time |
| `expires_at` | TIMESTAMPTZ | YES | - | Optional expiration |

**Primary Key:** `(user_id, role_id)`

---

### Audit & Activity Tables

#### `audit_log`

Security audit log for admin monitoring.

| Column | Type | Nullable | Default | Description |
|--------|------|----------|---------|-------------|
| `id` | UUID | NO | `gen_random_uuid()` | Primary key |
| `user_id` | UUID | YES | - | FK to users (actor) |
| `session_id` | UUID | YES | - | FK to sessions |
| `event_type` | TEXT | NO | - | Event type |
| `resource_type` | TEXT | YES | - | Affected resource type |
| `resource_id` | TEXT | YES | - | Affected resource ID |
| `action` | TEXT | NO | - | Action performed |
| `status` | TEXT | NO | `'success'` | success/failure/denied |
| `details` | JSONB | YES | - | Additional context |
| `ip_address` | INET | YES | - | Client IP |
| `user_agent` | TEXT | YES | - | Browser user agent |
| `request_id` | TEXT | YES | - | Request correlation ID |
| `created_at` | TIMESTAMPTZ | NO | `NOW()` | Event time |

**Event Types:**
- `login`, `logout`, `login_failed`
- `session_created`, `session_rotated`, `session_expired`
- `role_change`, `entitlement_change`
- `data_export`, `data_delete`
- `backup_created`, `backup_restored`

---

#### `activity_events`

General user activity events (gamification/analytics).

| Column | Type | Nullable | Default | Description |
|--------|------|----------|---------|-------------|
| `id` | UUID | NO | `gen_random_uuid()` | Primary key |
| `user_id` | UUID | NO | - | FK to users |
| `event_type` | TEXT | NO | - | Event type |
| `category` | TEXT | YES | - | Event category |
| `metadata` | JSONB | YES | - | Event-specific data |
| `xp_earned` | INTEGER | YES | `0` | XP reward |
| `coins_earned` | INTEGER | YES | `0` | Coin reward |
| `created_at` | TIMESTAMPTZ | NO | `NOW()` | Event time |

---

### Views

#### `user_with_roles`

Convenience view for auth checks.

```sql
SELECT 
    id, email, name, legacy_role, approved, age_verified, tos_accepted,
    roles,        -- ARRAY of role names
    entitlements  -- ARRAY of entitlement names
FROM user_with_roles
WHERE id = $1;
```

#### `user_session_count`

Active session count per user.

```sql
SELECT user_id, active_sessions, last_active
FROM user_session_count
WHERE user_id = $1;
```

---

### Functions

#### `cleanup_expired_sessions()`

Removes expired sessions. Returns count of deleted rows.

```sql
SELECT cleanup_expired_sessions();
```

#### `cleanup_expired_tokens()`

Removes expired verification tokens. Returns count of deleted rows.

```sql
SELECT cleanup_expired_tokens();
```

---

## D1 to Postgres Type Mapping

| D1 (SQLite) | Postgres | Notes |
|-------------|----------|-------|
| TEXT PRIMARY KEY | UUID DEFAULT gen_random_uuid() | Use native UUIDs |
| INTEGER (boolean) | BOOLEAN | Native boolean type |
| TEXT (datetime) | TIMESTAMPTZ | Native timestamp with timezone |
| TEXT (JSON) | JSONB | Indexed JSON |
| INTEGER | INTEGER / BIGINT | Same semantics |
| TEXT | TEXT | Same semantics |

---

## Future Migrations

| Migration | Tables | Status |
|-----------|--------|--------|
| `0002_gamification.sql` | user_wallet, user_progress, user_skills, achievements, points_ledger, streaks | Planned |
| `0003_content.sql` | quests, universal_quests, exercises, workouts, learn_* | Planned |
| `0004_user_data.sql` | user_settings, user_interests, daily_plans, calendar_events | Planned |
| `0005_market.sql` | market_items, user_purchases | Planned |
| `0006_reference.sql` | reference_tracks, track_analysis_cache | Planned |

---

## Schema Exceptions

See [schema_exceptions.md](../docs/backend/migration/schema_exceptions.md) for any deviations from 1:1 D1 translation.

Current exceptions for auth substrate:
- `users.id`: Changed from TEXT to UUID (safer, native type)
- `sessions`: Added `ip_address` (INET), `user_agent`, `rotated_from` columns
- `accounts.provider`: Added CHECK constraint for known providers
- Added full RBAC system (roles, entitlements, user_roles, role_entitlements)
- Added audit_log table (D1 had empty admin_audit_log)

---

## References

- [DECISIONS.md](../docs/backend/migration/DECISIONS.md) - DEC-001, DEC-004
- [security_model.md](../docs/backend/migration/security_model.md) - Session strategy
- [d1_usage_inventory.md](../docs/backend/migration/d1_usage_inventory.md) - Source schema

