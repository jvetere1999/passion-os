"Local dev auth bypass guardrails. Bypass must hard-fail in non-local environments."

# Local Dev Auth Bypass Specification

**Created:** January 6, 2026  
**Branch:** `refactor/stack-split`  
**Purpose:** Define bounded dev bypass mechanism with hard security constraints

---

## Overview

Dev bypass allows local development without full OAuth flow. This is a **security-sensitive** mechanism that must be carefully constrained.

---

## Bypass Configuration

### Environment Flag

| Setting | Value |
|---------|-------|
| **Flag Name** | `AUTH_DEV_BYPASS` |
| **Type** | Boolean string (`"true"` / `"false"`) |
| **Default** | `"false"` (bypass disabled) |

### Required Conditions (ALL must be true)

For bypass to activate, **ALL** of these must be true:

| Condition | Check |
|-----------|-------|
| `AUTH_DEV_BYPASS=true` | Environment variable explicitly set |
| `NODE_ENV=development` | Not production/staging |
| Host is `localhost` OR `127.0.0.1` | Request origin check |

### Hard Fail Conditions

Bypass MUST **hard-fail** (reject request, return 403) if:

| Condition | Action |
|-----------|--------|
| `NODE_ENV=production` | Reject even if `AUTH_DEV_BYPASS=true` |
| `NODE_ENV=staging` | Reject even if `AUTH_DEV_BYPASS=true` |
| Host is not `localhost`/`127.0.0.1` | Reject even if other conditions met |
| `AUTH_DEV_BYPASS` not explicitly `"true"` | Use normal auth flow |

---

## Implementation Requirements

### Backend (Rust/Axum)

```rust
// Pseudo-code - actual implementation in app/backend/

fn is_dev_bypass_allowed(req: &Request, env: &Environment) -> bool {
    // All conditions must be true
    let bypass_flag = env.get("AUTH_DEV_BYPASS") == Some("true");
    let is_development = env.get("NODE_ENV") == Some("development");
    let host = req.headers().get("Host").unwrap_or_default();
    let is_localhost = host.starts_with("localhost") || host.starts_with("127.0.0.1");
    
    // Hard fail: even if bypass_flag is set, reject in non-local
    if bypass_flag && !is_development {
        // Log security warning
        warn!("AUTH_DEV_BYPASS set in non-development environment - rejecting");
        return false;
    }
    
    if bypass_flag && !is_localhost {
        // Log security warning
        warn!("AUTH_DEV_BYPASS set for non-localhost host - rejecting");
        return false;
    }
    
    bypass_flag && is_development && is_localhost
}
```

### Bypass User

When bypass is active, use a fixed dev user:

| Field | Value |
|-------|-------|
| `id` | `dev_user_local` |
| `email` | `dev@localhost` |
| `name` | `Local Dev User` |
| `role` | `admin` (for full access during dev) |

---

## Required Tests

### Backend Integration Tests

The following tests MUST exist and pass:

#### Test 1: Bypass rejected in production

```rust
#[tokio::test]
async fn test_bypass_rejected_in_production() {
    // Setup: AUTH_DEV_BYPASS=true, NODE_ENV=production
    // Action: Make authenticated request
    // Assert: 403 Forbidden, bypass not activated
}
```

#### Test 2: Bypass rejected for non-localhost

```rust
#[tokio::test]
async fn test_bypass_rejected_for_non_localhost() {
    // Setup: AUTH_DEV_BYPASS=true, NODE_ENV=development, Host=example.com
    // Action: Make authenticated request
    // Assert: 403 Forbidden, bypass not activated
}
```

#### Test 3: Bypass works in valid local dev

```rust
#[tokio::test]
async fn test_bypass_works_in_local_dev() {
    // Setup: AUTH_DEV_BYPASS=true, NODE_ENV=development, Host=localhost:3000
    // Action: Make authenticated request
    // Assert: 200 OK, dev user returned
}
```

#### Test 4: Bypass disabled by default

```rust
#[tokio::test]
async fn test_bypass_disabled_by_default() {
    // Setup: AUTH_DEV_BYPASS not set, NODE_ENV=development, Host=localhost
    // Action: Make authenticated request without session
    // Assert: 401 Unauthorized, normal auth required
}
```

---

## Security Checklist

Before enabling bypass in any environment:

- [ ] `NODE_ENV` is correctly set to `development`
- [ ] `SERVER_ENVIRONMENT` is correctly set to `development`
- [ ] Host check is implemented and tested
- [ ] Hard-fail tests pass
- [ ] No bypass code paths leak to production builds
- [ ] Bypass flag is NOT in any production/staging .env files
- [ ] Container deployment uses `AUTH_DEV_BYPASS=false` explicitly

---

## Docker Compose Integration

### Local Development (infra/docker-compose.yml)

```yaml
services:
  api:
    environment:
      AUTH_DEV_BYPASS: ${AUTH_DEV_BYPASS:-false}  # Default disabled
      SERVER_ENVIRONMENT: development
```

### Enabling Bypass

```bash
# In .env file (for local dev only)
AUTH_DEV_BYPASS=true
SERVER_ENVIRONMENT=development
```

### Production Override

Production compose files MUST explicitly set:

```yaml
services:
  api:
    environment:
      AUTH_DEV_BYPASS: "false"  # Explicit, not variable
      SERVER_ENVIRONMENT: production
```

---

## Audit Trail

When bypass is activated, log:

```
[SECURITY] Dev auth bypass activated for request
  host: localhost:3000
  path: /api/focus
  method: GET
  bypass_user: dev@localhost
  timestamp: 2026-01-07T12:00:00Z
```

This log entry MUST be generated even in development to help identify bypass usage patterns.

---

## Exceptions

Any deviation from this spec requires:

1. Entry in `exceptions.md` with full justification
2. Explicit owner approval
3. Time-limited exception with sunset date

---

## References

- Copilot-instructions: "Local Dev Auth Bypass Guardrails" section
- [exceptions.md](./exceptions.md) - For any approved deviations
- [DECISIONS.md](./DECISIONS.md) - DEC-002 (CSRF/Origin rules)

