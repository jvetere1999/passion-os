# Architecture Decision Records

**Date:** January 6, 2026

This document captures the key architectural decisions for the Ignition backend migration.

---

## ADR-001: Same-Site Routing (Plan A)

### Status
**ACCEPTED**

### Context
We need to decide how the frontend (OpenNext Worker) and backend (Rust Container) communicate:

- **Plan A:** Same-site routing - UI and API on same domain via Cloudflare routes
- **Plan B:** Separate subdomain - API at `api.ignition.ecent.online`

### Decision
**Plan A: Same-site routing**

- UI served at `https://ignition.ecent.online/*`
- Backend API at `https://ignition.ecent.online/api/v1/*`
- Auth endpoints at `https://ignition.ecent.online/auth/*`
- Cloudflare routes direct `/api/*` and `/auth/*` to backend container

### Rationale
1. **Cookie simplicity:** First-party cookies with `SameSite=Lax` work without issues
2. **No CORS complexity:** Same origin means no preflight requests, no CORS headers needed
3. **Single SSL certificate:** One domain = one cert
4. **User trust:** Users see same domain in all requests
5. **SSR compatibility:** Server components can call backend with same-origin semantics

### Consequences
- **Positive:** Simpler cookie handling, no CORS, easier debugging
- **Negative:** Route collision risk (must namespace API paths)
- **Mitigation:** All backend routes prefixed with `/api/v1/` or `/auth/`

---

## ADR-002: Session Token Storage (Hash vs. Plaintext)

### Status
**ACCEPTED**

### Context
Auth.js currently stores session tokens in plaintext in the `sessions` table. This is a security risk if the database is compromised.

### Decision
Store SHA-256 hash of session token in database, not the plaintext token.

```rust
// On session creation
let token = generate_secure_token();  // 32 bytes random
let token_hash = sha256(token);
db.insert_session(token_hash, user_id, ...);
set_cookie("ignition_session", token);  // Client gets plaintext

// On session validation
let cookie_token = get_cookie("ignition_session");
let hash = sha256(cookie_token);
db.find_session_by_hash(hash);
```

### Rationale
1. If database is leaked, attackers cannot forge sessions
2. Industry standard practice (same as password hashing concept)
3. Minimal performance overhead (one SHA-256 per request)
4. Existing sessions can be invalidated during migration

### Consequences
- **Breaking change:** All existing D1 sessions will be invalidated
- **Mitigation:** Users will need to re-login after migration (acceptable for security)

---

## ADR-003: CSRF Protection Strategy

### Status
**ACCEPTED**

### Context
Need to prevent cross-site request forgery for state-changing operations.

### Decision
**Double-Submit Cookie Pattern:**

1. Generate random CSRF token on session creation
2. Set as HttpOnly cookie `ignition_csrf`
3. Return same token in `X-CSRF-Token` response header
4. Client reads header, includes in subsequent requests as `X-CSRF-Token` header
5. Server validates cookie value equals header value

### Rationale
1. Stateless - no server-side token storage needed
2. Works with same-site cookies (Plan A)
3. Compatible with SSR (cookies forwarded from browser)
4. Simple implementation in Tower middleware

### Implementation
```rust
// Response (on login or session refresh)
Set-Cookie: ignition_csrf=<random_token>; HttpOnly; Secure; SameSite=Lax
X-CSRF-Token: <same_random_token>

// Request (from client)
Cookie: ignition_csrf=<token>
X-CSRF-Token: <token>

// Middleware validation
if cookie_token != header_token {
    return Err(403 CSRF validation failed);
}
```

### Consequences
- Client must read `X-CSRF-Token` from response headers
- Must update API client to include header in requests
- Safe methods (GET, HEAD, OPTIONS) are exempt

---

## ADR-004: Database Choice (Postgres Provider)

### Status
**PROPOSED** (requires team input)

### Context
Need to select a Postgres provider for production use.

### Options

| Provider | Pros | Cons |
|----------|------|------|
| **Neon** | Serverless, auto-scaling, branching, free tier | Newer, cold start latency |
| **Supabase** | Postgres + Auth + Storage, good DX | Heavier than needed |
| **PlanetScale** | MySQL (not Postgres) | Wrong DB type |
| **Cloudflare Hyperdrive** | Connection pooling, edge caching | Requires separate Postgres host |
| **Self-hosted** | Full control | Operational burden |

### Recommendation
**Neon + Cloudflare Hyperdrive**

- Neon provides serverless Postgres with branching for dev/staging
- Hyperdrive provides connection pooling and edge caching
- Best of both: managed DB + Cloudflare integration

### Configuration
```toml
# wrangler.toml (backend container)
[[hyperdrive]]
binding = "HYPERDRIVE"
id = "<hyperdrive-id>"
```

```rust
// Connection
let pool = PgPool::connect(env::var("HYPERDRIVE_URL")?).await?;
```

---

## ADR-005: Rust Workspace Organization

### Status
**ACCEPTED**

### Context
Need to organize Rust code for maintainability, compile times, and clear module boundaries.

### Decision
**Cargo workspace with domain-driven crates:**

```
conversions/backend/
├── Cargo.toml (workspace)
├── crates/
│   ├── common/      # Shared types, errors, config
│   ├── auth/        # OAuth, sessions
│   ├── db/          # Connection pool, migrations, base repository
│   ├── storage/     # R2 abstraction
│   ├── api/         # Axum router, handlers, middleware
│   └── <domain>/    # One crate per domain (focus, quests, etc.)
```

### Rationale
1. **Clear boundaries:** Each domain is self-contained
2. **Faster rebuilds:** Only changed crates recompile
3. **Easy testing:** Each crate has own tests
4. **Dependency control:** Explicit crate dependencies prevent accidental coupling

### Consequences
- More boilerplate (multiple Cargo.toml files)
- Need to manage inter-crate dependencies carefully
- Worth it for a project this size

---

## ADR-006: Error Handling Strategy

### Status
**ACCEPTED**

### Context
Need consistent error handling across all handlers.

### Decision
**Typed error enum + thiserror + IntoResponse:**

```rust
#[derive(Debug, thiserror::Error)]
pub enum AppError {
    #[error("unauthorized")]
    Unauthorized,
    
    #[error("forbidden")]
    Forbidden,
    
    #[error("not found: {0}")]
    NotFound(String),
    
    #[error("bad request: {0}")]
    BadRequest(String),
    
    #[error("internal error")]
    Internal(#[from] anyhow::Error),
}

impl IntoResponse for AppError {
    fn into_response(self) -> Response {
        let (status, message) = match &self {
            AppError::Unauthorized => (401, "Unauthorized"),
            AppError::Forbidden => (403, "Forbidden"),
            AppError::NotFound(msg) => (404, msg.as_str()),
            AppError::BadRequest(msg) => (400, msg.as_str()),
            AppError::Internal(e) => {
                tracing::error!(error = ?e, "Internal error");
                (500, "Internal server error")
            }
        };
        
        Json(json!({ "error": message })).into_response()
    }
}
```

### Rationale
1. **Type safety:** Compiler ensures all error cases handled
2. **Consistent responses:** All errors have same JSON structure
3. **No information leakage:** Internal errors don't expose details
4. **Logging:** Internal errors logged with full context

---

## ADR-007: Request Validation Strategy

### Status
**ACCEPTED**

### Context
Need to validate incoming request bodies.

### Decision
**serde + validator crate:**

```rust
use serde::Deserialize;
use validator::Validate;

#[derive(Deserialize, Validate)]
pub struct CreateFocusRequest {
    #[validate(range(min = 60, max = 7200))]
    pub duration: u32,
    
    #[serde(default = "default_mode")]
    pub mode: FocusMode,
}

async fn create_focus(
    Json(body): Json<CreateFocusRequest>,
) -> Result<impl IntoResponse, AppError> {
    body.validate().map_err(|e| AppError::BadRequest(e.to_string()))?;
    // ...
}
```

### Rationale
1. **Declarative:** Validation rules in struct definition
2. **Compile-time checked:** Serde handles deserialization errors
3. **Good error messages:** Validator provides field-specific errors
4. **Extensible:** Custom validators for complex rules

---

## ADR-008: Rate Limiting Implementation

### Status
**ACCEPTED**

### Context
Need to prevent abuse and protect backend resources.

### Decision
**Tower middleware with per-route limits:**

```rust
use tower::limit::RateLimitLayer;

// Global rate limiter
let global_limit = RateLimitLayer::new(300, Duration::from_secs(60));

// Route-specific limits
let auth_limit = RateLimitLayer::new(10, Duration::from_secs(60));
let admin_limit = RateLimitLayer::new(100, Duration::from_secs(60));

Router::new()
    .route("/auth/*", auth_routes.layer(auth_limit))
    .route("/api/v1/admin/*", admin_routes.layer(admin_limit))
    .layer(global_limit)
```

### Rate Limits
| Route Pattern | Requests | Window | Notes |
|---------------|----------|--------|-------|
| `/auth/*` | 10 | 60s | Prevent brute force |
| `/api/v1/admin/*` | 100 | 60s | Admin operations |
| `/api/v1/*` (global) | 300 | 60s | General API |
| `/api/v1/blobs/upload` | 10 | 60s | Prevent storage abuse |

### Consequences
- May need to adjust limits based on real usage
- Consider Redis-based rate limiting for multi-instance scaling

---

## ADR-009: Observability Stack

### Status
**ACCEPTED**

### Context
Need logging, tracing, and metrics for debugging and monitoring.

### Decision
**tracing + tracing-subscriber (JSON) + Prometheus metrics:**

```rust
// Structured logging
tracing::info!(
    user_id = %user_id,
    action = "focus_complete",
    duration_seconds = %duration,
    "Focus session completed"
);

// Request tracing via Tower
use tower_http::trace::TraceLayer;
app.layer(TraceLayer::new_for_http())

// Metrics endpoint
Router::new()
    .route("/metrics", get(prometheus_metrics))
```

### Log Format (JSON)
```json
{
    "timestamp": "2026-01-06T12:34:56.789Z",
    "level": "INFO",
    "message": "Focus session completed",
    "user_id": "abc123",
    "action": "focus_complete",
    "duration_seconds": 1500,
    "request_id": "req-xyz"
}
```

### Metrics
- `http_requests_total{method, path, status}`
- `http_request_duration_seconds{method, path}`
- `db_query_duration_seconds{query}`
- `active_sessions_count`

---

## ADR-010: Frontend API Client Design

### Status
**ACCEPTED**

### Context
Need a typed client for frontend to call backend.

### Decision
**Fetch-based client with TypeScript types:**

```typescript
// api-client/client.ts
class APIClient {
    async request<T>(path: string, options: RequestInit = {}): Promise<T> {
        const response = await fetch(`/api/v1${path}`, {
            credentials: 'include',
            headers: {
                'Content-Type': 'application/json',
                'X-CSRF-Token': this.getCsrfToken(),
                ...options.headers,
            },
            ...options,
        });
        
        if (!response.ok) {
            throw new APIError(response.status, await response.json());
        }
        
        return response.json();
    }
}

// Type-safe methods
export const api = {
    focus: {
        create: (data: CreateFocusRequest) => 
            client.request<FocusSession>('/focus', { method: 'POST', body: JSON.stringify(data) }),
        list: () => 
            client.request<FocusSession[]>('/focus'),
    },
    // ...
};
```

### Rationale
1. **No external dependencies:** Uses native fetch
2. **Type safety:** TypeScript generics ensure correct types
3. **Centralized error handling:** All errors flow through one path
4. **CSRF handling:** Automatic token inclusion

---

## ADR-011: Data Migration Strategy

### Status
**ACCEPTED**

### Context
Need to migrate data from D1 (SQLite) to Postgres without data loss.

### Decision
**Export -> Transform -> Import with verification:**

```
1. EXPORT (D1 -> NDJSON files)
   └── wrangler d1 execute --json | transform to NDJSON

2. TRANSFORM (TypeScript)
   ├── UUID validation
   ├── Boolean conversion (0/1 -> true/false)
   ├── Datetime parsing (TEXT -> ISO)
   ├── JSON validation
   └── Foreign key ordering

3. IMPORT (Postgres COPY)
   ├── Disable foreign keys
   ├── COPY data
   ├── Re-enable foreign keys
   └── Build indexes

4. VERIFY
   ├── Row counts match
   ├── Sample data spot checks
   ├── Foreign key integrity
   └── Computed fields (wallet balances)
```

### Rollback Plan
1. Keep D1 read-only during migration window
2. If Postgres issues detected, revert routes to D1
3. D1 data remains source of truth until cutover confirmed

---

## ADR-012: Session Migration Approach

### Status
**ACCEPTED**

### Context
Existing Auth.js sessions in D1 need to be handled during migration.

### Decision
**Invalidate all sessions, force re-login:**

### Rationale
1. Token storage format changes (plaintext -> hash)
2. Session table schema changes
3. Clean slate prevents security issues
4. Users will re-login via OAuth (seamless)

### Implementation
1. Don't migrate `sessions` table data
2. Deploy new backend with empty sessions table
3. Users visiting site get redirected to login
4. OAuth flow creates new session in Postgres

### Communication
- Add banner before migration: "System maintenance on [date], you may need to sign in again"

---

*End of Architecture Decision Records*

