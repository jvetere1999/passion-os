# Ignition Backend Migration Plan

**Version:** 1.0  
**Date:** January 6, 2026  
**Author:** Migration Planner Agent

---

## Executive Summary

This document provides an exact, security-first path to migrate the Ignition application from:

**CURRENT STATE:**
- Next.js 15 (App Router) on OpenNext/Cloudflare Workers
- Auth.js/NextAuth v5 running in Next API routes / edge handlers
- D1 for database + R2 for blobs
- Next API routes under `src/app/api/**`

**TARGET STATE:**
- OpenNext frontend (SSR/RSC UI only), NO auth logic and NO direct data access
- Rust backend in Cloudflare Containers using Axum + Tower middleware
- Backend-owned OAuth + session auth; browser holds only HttpOnly session cookies
- Postgres is the ONLY database (replace D1 entirely)
- Backend is the ONLY component that talks to Postgres and R2
- ALL `/api/*` endpoints move to the backend; frontend calls backend only

---

## PHASE 0 - Repository Inventory

### 1. Core Configuration

| File | Purpose | Key Details |
|------|---------|-------------|
| `package.json` (L1-86) | Dependencies | Next.js 15.1.3, React 19, next-auth 5.0.0-beta.25, @auth/d1-adapter 1.7.4 |
| `next.config.ts` (L1-72) | Next.js config | `output: "standalone"`, security headers (X-Frame-Options, X-Content-Type-Options), disabled image optimization |
| `open-next.config.ts` (L1-27) | OpenNext config | cloudflare-node wrapper, edge converter, external middleware |
| `wrangler.toml` (L1-82) | Cloudflare config | D1 binding: `DB`, R2 binding: `BLOBS`, compatibility_flags: `nodejs_compat` |
| `src/middleware.ts` (L1-137) | Route protection | Uses `auth()` from lib/auth, protects non-public routes, redirects to signin |

### 2. Auth Layer

| File | Lines | Purpose | Security Notes |
|------|-------|---------|----------------|
| `src/lib/auth/index.ts` | 1-477 | Auth.js configuration | D1Adapter for sessions, Google/Microsoft OAuth, cookie config (HttpOnly, SameSite=lax, Secure in prod) |
| `src/lib/auth/providers.ts` | 1-171 | OAuth provider config | Google and Microsoft Entra ID, profile mapping, email validation |
| `src/lib/auth/useAuth.ts` | - | Client hook | Session state for client components |
| `src/lib/auth/SessionProvider.tsx` | - | React context | Wraps app with session provider |
| `src/app/api/auth/[...nextauth]/route.ts` | 1-13 | Auth handler | Exports GET/POST handlers from lib/auth |
| `src/app/api/auth/accept-tos/route.ts` | 1-59 | TOS acceptance | Records TOS version acceptance |
| `src/app/api/auth/verify-age/route.ts` | - | Age verification | Sets age_verified flag |

**Cookie Configuration (from `src/lib/auth/index.ts` L115-140):**
```typescript
cookies: {
  sessionToken: {
    name: "passion-os.session-token",
    options: { httpOnly: true, sameSite: "lax", path: "/", secure: useSecureCookies }
  },
  callbackUrl: { name: "passion-os.callback-url", ... },
  csrfToken: { name: "passion-os.csrf-token", ... },
}
```

### 3. API Surface (55 Route Handlers)

See [API_ENDPOINT_INVENTORY.md](./docs/API_ENDPOINT_INVENTORY.md) for complete table.

**Summary by Domain:**
| Domain | Routes | Auth | D1 Tables | R2 |
|--------|--------|------|-----------|-----|
| Auth | 4 | Mixed | users, sessions, accounts | No |
| Admin | 9 | Admin | All tables | No |
| Focus | 4 | User | focus_sessions, focus_pause_state | No |
| Quests | 1 | User | quests, universal_quests, user_quest_progress | No |
| Habits | 1 | User | habits, habit_logs, user_streaks | No |
| Goals | 1 | User | goals, goal_milestones | No |
| Calendar | 1 | User | calendar_events | No |
| Exercise | 2 | User | exercises, workouts, workout_sessions, personal_records | No |
| Books | 1 | User | books, reading_sessions | No |
| Learn | 3 | User | learn_topics, learn_lessons, user_lesson_progress | No |
| Market | 4 | User | market_items, user_wallet, user_purchases, points_ledger | No |
| Onboarding | 5 | User | onboarding_flows, onboarding_steps, user_onboarding_state | No |
| Gamification | 1 | User | achievement_definitions, user_achievements | No |
| Blobs | 2 | User | - | Yes |
| Reference | 6 | User | reference_tracks, track_analysis_cache | Yes |
| Infobase | 1 | User | infobase_entries | No |
| Ideas | 1 | User | ideas | No |
| Daily Plan | 1 | User | daily_plans | No |
| Programs | 1 | User | training_programs, program_weeks | No |
| Feedback | 1 | User | feedback | No |
| User | 2 | User | All (export/delete) | No |
| Analysis | 1 | User | track_analysis_cache | No |

### 4. Data Layer

| File | Purpose |
|------|---------|
| `src/lib/db/client.ts` (L1-109) | D1 query helpers (query, queryOne, execute, batch) |
| `src/lib/db/types.ts` (L1-728) | TypeScript entity types |
| `src/lib/db/repositories/` | Repository pattern implementations |
| `migrations/0100_master_reset.sql` (L1-1249) | Complete D1 schema (47+ tables) |

**Repository Modules:**
- `users.ts` - User CRUD, ensureUserExists (L1-220)
- `gamification.ts` - Wallet, points, achievements (L1-710)
- `focusSessions.ts` - Focus session management
- `calendarEvents.ts` - Calendar CRUD
- `onboarding.ts` - Onboarding flows and state
- `market.ts` - Market items and purchases
- `quests.ts` - Quest management
- `activity-events.ts` - Activity logging
- `infobase.ts` - Knowledge base
- `referenceTracks.ts` - Audio track metadata
- `track-analysis.ts` - Track analysis cache

### 5. R2/Storage Layer

| File | Lines | Purpose |
|------|-------|---------|
| `src/lib/storage/r2.ts` | 1-324 | R2 operations (upload, get, delete, list) |
| `src/lib/storage/types.ts` | 1-173 | MIME types, size limits, categories |
| `src/lib/storage/keys.ts` | - | Key generation helpers |
| `src/lib/storage/index.ts` | - | Barrel export |

**R2 Usage Points:**
| Route | Operation | Auth |
|-------|-----------|------|
| `POST /api/blobs/upload` | Upload blob | User |
| `GET /api/blobs/[id]` | Download blob | User (owner check) |
| `DELETE /api/blobs/[id]` | Delete blob | User (owner check) |
| `POST /api/reference/upload` | Upload audio track | User |
| `GET /api/reference/tracks/[id]/stream` | Stream audio | User (owner check) |
| `GET /api/reference/tracks/[id]/play` | Play audio | User (owner check) |

### 6. Security Patterns

**Current Implementation:**

| Aspect | Location | Implementation |
|--------|----------|----------------|
| Route Protection | `src/middleware.ts` L55-120 | Auth check, redirect to signin |
| Admin Check | `src/lib/admin/index.ts` L1-27 | `isAdminEmail()` from env var |
| Session Cookies | `src/lib/auth/index.ts` L115-140 | HttpOnly, SameSite=lax, Secure=prod |
| CSRF Token | `src/lib/auth/index.ts` L131-137 | Auth.js built-in csrf-token cookie |
| Redirect Validation | `src/lib/auth/index.ts` L96-114 | Origin check, relative paths only |
| Headers | `next.config.ts` L36-56 | X-Frame-Options, X-Content-Type-Options, Referrer-Policy |

**Missing/Weak Areas:**
- No explicit rate limiting (relies on Cloudflare edge)
- No explicit CORS configuration (same-origin by default)
- Admin routes use email whitelist only (no role field enforcement)
- No service-to-service auth tokens defined

---

## PHASE 1 - Findings

### A. Framework/Runtime Analysis

**Next.js Version:** 15.1.3  
**React Version:** 19.0.0  
**Runtime:** Edge (via OpenNext cloudflare-node wrapper)

**Node-only API Usage:**
- NONE detected in API routes (all use Cloudflare Workers-compatible APIs)
- `crypto.randomUUID()` is used (supported in Workers)
- All D1/R2 access via Cloudflare bindings

**Potential Issues for Migration:**
- Auth.js D1 adapter deeply integrated - requires complete auth rewrite
- `getCloudflareContext()` used extensively - Rust backend will use native bindings
- `ensureUserExists()` pattern creates users on-demand - needs backend equivalent

### B. API Endpoint Inventory

See separate file: [conversions/docs/API_ENDPOINT_INVENTORY.md](./docs/API_ENDPOINT_INVENTORY.md)

### C. Auth Entry Inventory

| Route | Method | Purpose | Cookies | Provider | Age/Approval Check |
|-------|--------|---------|---------|----------|-------------------|
| `/api/auth/[...nextauth]` | GET/POST | OAuth callbacks | session-token, csrf-token, callback-url | Google, Microsoft | No |
| `/api/auth/accept-tos` | GET/POST | TOS acceptance | Reads session | - | No |
| `/api/auth/verify-age` | POST | Age verification | Reads session | - | Sets age_verified |

**Admin Gating Enforcement:**
| Route | File | Line | Method |
|-------|------|------|--------|
| `/api/admin/*` | Various | L10-15 | `isAdminEmail(session?.user?.email)` |

### D. R2 Usage Inventory

| Code Path | File | Lines | Operation | Owner Check | Must Move to Backend |
|-----------|------|-------|-----------|-------------|---------------------|
| Blob upload | `api/blobs/upload/route.ts` | L1-153 | Write | userId from session | Yes |
| Blob download | `api/blobs/[id]/route.ts` | L1-100 | Read | userId prefix | Yes |
| Blob delete | `api/blobs/[id]/route.ts` | L80-150 | Delete | userId prefix | Yes |
| Track upload | `api/reference/upload/route.ts` | L1-100 | Write | userId from session | Yes |
| Track stream | `api/reference/tracks/[id]/stream/route.ts` | L1-101 | Read | D1 ownership check | Yes |
| Track play | `api/reference/tracks/[id]/play/route.ts` | L1-80 | Read | D1 ownership check | Yes |

**No client-side R2 access detected** - all access goes through API routes.

---

## PHASE 2 - Modular Sub-mods Target Structure

### Directory Layout

```
conversions/
├── backend/                    # Rust workspace root
│   ├── Cargo.toml             # Workspace manifest
│   ├── crates/
│   │   ├── common/            # Shared types, errors, config
│   │   │   ├── Cargo.toml
│   │   │   └── src/
│   │   │       ├── lib.rs
│   │   │       ├── config.rs
│   │   │       ├── errors.rs
│   │   │       └── types.rs
│   │   │
│   │   ├── auth/              # OAuth + session management
│   │   │   ├── Cargo.toml
│   │   │   └── src/
│   │   │       ├── lib.rs
│   │   │       ├── oauth/
│   │   │       │   ├── mod.rs
│   │   │       │   ├── google.rs
│   │   │       │   └── microsoft.rs
│   │   │       ├── session/
│   │   │       │   ├── mod.rs
│   │   │       │   ├── cookie.rs
│   │   │       │   └── store.rs
│   │   │       └── middleware.rs
│   │   │
│   │   ├── db/                # Database layer
│   │   │   ├── Cargo.toml
│   │   │   └── src/
│   │   │       ├── lib.rs
│   │   │       ├── pool.rs
│   │   │       ├── migrations/
│   │   │       └── repositories/
│   │   │           ├── mod.rs
│   │   │           ├── users.rs
│   │   │           ├── sessions.rs
│   │   │           └── ...
│   │   │
│   │   ├── storage/           # R2 abstraction
│   │   │   ├── Cargo.toml
│   │   │   └── src/
│   │   │       ├── lib.rs
│   │   │       ├── r2.rs
│   │   │       └── types.rs
│   │   │
│   │   ├── users/             # User domain
│   │   ├── admin/             # Admin domain
│   │   ├── focus/             # Focus sessions domain
│   │   ├── quests/            # Quests domain
│   │   ├── habits/            # Habits domain
│   │   ├── goals/             # Goals domain
│   │   ├── calendar/          # Calendar domain
│   │   ├── exercise/          # Exercise/fitness domain
│   │   ├── books/             # Books domain
│   │   ├── learn/             # Learning domain
│   │   ├── market/            # Market/rewards domain
│   │   ├── onboarding/        # Onboarding domain
│   │   ├── gamification/      # Points/achievements domain
│   │   ├── infobase/          # Knowledge base domain
│   │   ├── uploads/           # Blob upload handling
│   │   └── api/               # Axum router + handlers
│   │       ├── Cargo.toml
│   │       └── src/
│   │           ├── main.rs
│   │           ├── router.rs
│   │           ├── middleware/
│   │           │   ├── mod.rs
│   │           │   ├── auth.rs
│   │           │   ├── admin.rs
│   │           │   ├── rate_limit.rs
│   │           │   ├── cors.rs
│   │           │   └── logging.rs
│   │           └── handlers/
│   │               ├── mod.rs
│   │               ├── auth.rs
│   │               ├── focus.rs
│   │               └── ...
│   │
│   └── tests/
│       ├── integration/
│       └── e2e/
│
├── frontend/                   # Frontend integration shims
│   ├── api-client/            # Typed API client
│   │   ├── index.ts
│   │   ├── client.ts
│   │   ├── types.ts
│   │   └── endpoints/
│   │       ├── auth.ts
│   │       ├── focus.ts
│   │       └── ...
│   │
│   ├── ssr-forwarder/         # SSR cookie forwarding
│   │   ├── index.ts
│   │   └── middleware.ts
│   │
│   ├── types/                 # Shared TypeScript types
│   │   └── api.ts
│   │
│   └── route-proxies/         # Temporary shims during migration
│       └── README.md
│
├── migrations/                 # Postgres migration
│   ├── postgres-schema/
│   │   ├── 0001_initial.sql
│   │   ├── 0002_auth.sql
│   │   └── ...
│   │
│   ├── data-migration/
│   │   ├── export-d1.ts
│   │   ├── transform.ts
│   │   └── import-postgres.ts
│   │
│   └── verification/
│       ├── row-counts.sql
│       └── data-integrity.sql
│
└── docs/
    ├── API_ENDPOINT_INVENTORY.md
    ├── SCHEMA_MIGRATION_MAP.md
    ├── ARCHITECTURE_DECISIONS.md
    ├── ROLLOUT_PLAN.md
    └── SECURITY_CHECKLIST.md
```

### Module Boundaries

#### Backend Crates

| Module | Ownership | Public API | Data Access | Auth Required |
|--------|-----------|------------|-------------|---------------|
| `common` | Shared types, errors, config | `Error`, `Result`, `Config`, base types | None | N/A |
| `auth` | OAuth flows, sessions, cookies | `authenticate()`, `create_session()`, `validate_session()` | `sessions`, `users`, `accounts` | N/A (creates auth) |
| `db` | Connection pool, migrations | `Pool`, `Transaction`, repository traits | All tables | N/A (internal) |
| `storage` | R2 operations | `upload()`, `download()`, `delete()`, `sign_url()` | None (R2 only) | Via caller |
| `users` | User profiles, settings | `get_user()`, `update_user()`, `delete_user()` | `users`, `user_settings` | User |
| `admin` | Admin operations | `list_users()`, `backup()`, `cleanup()` | All tables | Admin |
| `focus` | Focus sessions | `create_session()`, `complete()`, `abandon()` | `focus_sessions` | User |
| `quests` | Quest management | `list_quests()`, `update_progress()` | `quests`, `user_quest_progress` | User |
| `habits` | Habit tracking | `list_habits()`, `log_habit()` | `habits`, `habit_logs` | User |
| `goals` | Goals | `list_goals()`, `create_goal()` | `goals`, `goal_milestones` | User |
| `calendar` | Calendar events | `list_events()`, `create_event()` | `calendar_events` | User |
| `exercise` | Workouts, exercises | `list_exercises()`, `log_workout()` | `exercises`, `workouts`, etc | User |
| `books` | Book tracking | `list_books()`, `log_reading()` | `books`, `reading_sessions` | User |
| `learn` | Learning content | `get_dashboard()`, `complete_lesson()` | `learn_*` tables | User |
| `market` | Market, wallet | `get_items()`, `purchase()`, `redeem()` | `market_items`, `user_wallet` | User |
| `onboarding` | Onboarding flows | `get_state()`, `complete_step()` | `onboarding_*` tables | User |
| `gamification` | Points, achievements | `get_wallet()`, `award_points()` | `points_ledger`, `user_achievements` | User |
| `infobase` | Knowledge base | `list_entries()`, `create_entry()` | `infobase_entries` | User |
| `uploads` | Blob handling | `upload_blob()`, `get_blob()` | `reference_tracks` + R2 | User |
| `api` | HTTP layer | Axum router, handlers | Via other modules | Via middleware |

#### Test Boundaries

- **Unit tests:** Each crate has `#[cfg(test)]` modules
- **Integration tests:** `conversions/backend/tests/integration/` tests cross-crate behavior
- **E2E tests:** `conversions/backend/tests/e2e/` tests full HTTP flows

---

## PHASE 3 - Architecture Decisions

### Decision: Plan A (Same-Site Routing) - RECOMMENDED

**Rationale:**
1. **Cookie simplicity:** First-party cookies avoid SameSite/CORS complexity
2. **No CORS preflight:** Same origin means no OPTIONS requests
3. **Single domain:** Simpler DNS, TLS, and CDN configuration
4. **User experience:** No cross-origin issues with credentials

**Implementation:**
- UI served at `https://ignition.ecent.online`
- Backend API at `https://ignition.ecent.online/api/*`
- Auth endpoints at `https://ignition.ecent.online/auth/*`
- Cloudflare routes:
  - `/*` -> OpenNext Worker (UI)
  - `/api/*` -> Rust Container (Backend)
  - `/auth/*` -> Rust Container (Backend)

### Cookie Specification

```rust
pub struct SessionCookie {
    name: "ignition_session",
    value: "<session_id>",  // UUID or JWT
    http_only: true,
    secure: true,
    same_site: "Lax",
    path: "/",
    domain: None,  // Inherit from request
    max_age: 30 * 24 * 60 * 60,  // 30 days
}
```

### Session Storage Schema (Postgres)

```sql
CREATE TABLE sessions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    token_hash BYTEA NOT NULL UNIQUE,  -- SHA256 of session token
    ip_address INET,
    user_agent TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    expires_at TIMESTAMPTZ NOT NULL,
    last_active_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    
    CONSTRAINT sessions_not_expired CHECK (expires_at > now())
);

CREATE INDEX idx_sessions_user ON sessions(user_id);
CREATE INDEX idx_sessions_expires ON sessions(expires_at);
```

### CSRF Strategy

**Double-Submit Cookie Pattern:**

1. On session creation, generate random CSRF token
2. Store token in HttpOnly cookie `ignition_csrf`
3. Store same token in `X-CSRF-Token` response header
4. Client reads header and includes in subsequent requests as `X-CSRF-Token` header
5. Server validates cookie value matches header value

```rust
// Middleware pseudocode
fn csrf_middleware(req: Request) -> Result<Request, Response> {
    if req.method().is_safe() {
        return Ok(req);
    }
    
    let cookie_token = req.cookie("ignition_csrf")?;
    let header_token = req.header("X-CSRF-Token")?;
    
    if !constant_time_eq(cookie_token, header_token) {
        return Err(Response::forbidden("CSRF validation failed"));
    }
    
    Ok(req)
}
```

### Service-to-Service Auth (UI Worker -> Backend)

For SSR requests where the UI worker needs to call backend:

1. **Option A:** Forward user cookies (current session)
2. **Option B:** Shared secret header for internal calls

**Chosen: Option A + origin validation**
- UI worker forwards `Cookie` header from original request
- Backend validates cookie as normal
- Backend also validates `X-Forwarded-For` and origin headers
- No additional secrets needed

---

## PHASE 4 - Postgres Migration Plan

### Schema Migration Map

See [conversions/docs/SCHEMA_MIGRATION_MAP.md](./docs/SCHEMA_MIGRATION_MAP.md) for complete mapping.

**Key Type Conversions (SQLite -> Postgres):**

| SQLite | Postgres | Notes |
|--------|----------|-------|
| `TEXT PRIMARY KEY` | `UUID PRIMARY KEY DEFAULT gen_random_uuid()` | Use native UUID |
| `INTEGER` (boolean) | `BOOLEAN` | `0/1` -> `false/true` |
| `TEXT` (datetime) | `TIMESTAMPTZ` | Parse ISO strings |
| `TEXT` (JSON) | `JSONB` | Parse and validate |
| `REAL` | `DOUBLE PRECISION` or `NUMERIC` | Check precision needs |
| `INTEGER` (auto) | `SERIAL` or `BIGSERIAL` | For non-UUID IDs |

**Problematic Patterns:**

1. **ID Generation:** D1 uses `crypto.randomUUID()` in app code; Postgres can use `gen_random_uuid()`
2. **Date formats:** D1 stores `datetime('now')` as TEXT; Postgres uses `now()` returning TIMESTAMPTZ
3. **Boolean storage:** D1 uses 0/1 INTEGER; Postgres has native BOOLEAN
4. **JSON validation:** D1 stores any TEXT; Postgres JSONB validates syntax

### Data Migration Strategy

```
Phase 1: Schema Creation
├── Create Postgres tables with new schema
├── Add foreign keys in disabled state
└── Create indexes

Phase 2: Data Export
├── Run export script on D1 (via Wrangler)
├── Output: NDJSON files per table
└── Store in R2 temporarily

Phase 3: Data Transform
├── Type conversions (int->bool, text->uuid, text->timestamptz)
├── JSON validation and repair
├── Reference integrity checks
└── Output: Postgres COPY format

Phase 4: Data Import
├── Disable triggers/constraints
├── COPY data into tables
├── Re-enable constraints
└── Verify foreign keys

Phase 5: Verification
├── Row count comparison
├── Sample data spot checks
├── Referential integrity validation
└── Generate verification report
```

### Secrets Checklist

| Secret | Purpose | Storage | Backend Access |
|--------|---------|---------|----------------|
| `DATABASE_URL` | Postgres connection | Container env | Yes |
| `AUTH_SECRET` | Session signing key | Container env | Yes |
| `GOOGLE_CLIENT_ID` | Google OAuth | Container env | Yes |
| `GOOGLE_CLIENT_SECRET` | Google OAuth | Container env | Yes |
| `AZURE_AD_CLIENT_ID` | Microsoft OAuth | Container env | Yes |
| `AZURE_AD_CLIENT_SECRET` | Microsoft OAuth | Container env | Yes |
| `AZURE_AD_TENANT_ID` | Microsoft OAuth | Container env | Yes |
| `R2_ACCESS_KEY_ID` | R2 access | Container env | Yes |
| `R2_SECRET_ACCESS_KEY` | R2 access | Container env | Yes |
| `CLOUDFLARE_API_TOKEN` | CI/CD only | GitHub Secrets | No |

**UI Worker should have NONE of these secrets.**

---

## PHASE 5 - Backend Implementation Plan

### Rust Workspace Structure

```toml
# conversions/backend/Cargo.toml
[workspace]
resolver = "2"
members = [
    "crates/common",
    "crates/auth",
    "crates/db",
    "crates/storage",
    "crates/users",
    "crates/admin",
    "crates/focus",
    "crates/quests",
    "crates/habits",
    "crates/goals",
    "crates/calendar",
    "crates/exercise",
    "crates/books",
    "crates/learn",
    "crates/market",
    "crates/onboarding",
    "crates/gamification",
    "crates/infobase",
    "crates/uploads",
    "crates/api",
]

[workspace.dependencies]
axum = "0.7"
tower = "0.4"
tower-http = { version = "0.5", features = ["cors", "trace", "request-id"] }
sqlx = { version = "0.7", features = ["runtime-tokio", "postgres", "uuid", "chrono", "json"] }
tokio = { version = "1", features = ["full"] }
serde = { version = "1", features = ["derive"] }
serde_json = "1"
uuid = { version = "1", features = ["v4", "serde"] }
chrono = { version = "0.4", features = ["serde"] }
thiserror = "1"
tracing = "0.1"
tracing-subscriber = { version = "0.3", features = ["env-filter", "json"] }
```

### Middleware Stack (Tower)

```rust
// conversions/backend/crates/api/src/middleware/mod.rs

pub fn create_middleware_stack() -> ServiceBuilder<...> {
    ServiceBuilder::new()
        // 1. Request ID (first, for tracing)
        .layer(RequestIdLayer::new())
        // 2. Tracing
        .layer(TraceLayer::new_for_http())
        // 3. Rate limiting
        .layer(RateLimitLayer::new(100, Duration::from_secs(60)))
        // 4. CORS (for any cross-origin needs)
        .layer(CorsLayer::permissive())  // Tighten in production
        // 5. Session extraction
        .layer(SessionLayer::new(session_store))
        // 6. CSRF validation
        .layer(CsrfLayer::new())
        // 7. Timeout
        .layer(TimeoutLayer::new(Duration::from_secs(30)))
}
```

### Auth Implementation Plan

```rust
// OAuth Flow (Google example)
// 1. GET /auth/google -> Redirect to Google
// 2. GET /auth/google/callback?code=... -> Exchange code, create session
// 3. Set session cookie, redirect to /today

// Session Validation
// 1. Extract cookie from request
// 2. Hash cookie value
// 3. Look up session by token_hash
// 4. Validate not expired
// 5. Update last_active_at
// 6. Attach user to request extensions

// Logout
// 1. DELETE /auth/logout
// 2. Delete session from DB
// 3. Clear cookie with Max-Age=0
```

### Error Types

```rust
// conversions/backend/crates/common/src/errors.rs

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
    
    #[error("conflict: {0}")]
    Conflict(String),
    
    #[error("internal error")]
    Internal(#[from] anyhow::Error),
    
    #[error("database error")]
    Database(#[from] sqlx::Error),
}

impl IntoResponse for AppError {
    fn into_response(self) -> Response {
        let (status, message) = match &self {
            AppError::Unauthorized => (StatusCode::UNAUTHORIZED, "Unauthorized"),
            AppError::Forbidden => (StatusCode::FORBIDDEN, "Forbidden"),
            AppError::NotFound(msg) => (StatusCode::NOT_FOUND, msg.as_str()),
            AppError::BadRequest(msg) => (StatusCode::BAD_REQUEST, msg.as_str()),
            AppError::Conflict(msg) => (StatusCode::CONFLICT, msg.as_str()),
            AppError::Internal(_) | AppError::Database(_) => {
                tracing::error!(?self, "Internal error");
                (StatusCode::INTERNAL_SERVER_ERROR, "Internal server error")
            }
        };
        
        Json(json!({ "error": message })).into_response()
    }
}
```

### Observability Plan

1. **Structured Logging:** `tracing` with JSON format
2. **Request IDs:** `tower-http::request_id` for correlation
3. **Metrics:** Prometheus endpoint at `/metrics`
4. **Audit Logs:** Admin actions logged to `admin_audit_log` table
5. **Health Check:** `GET /health` returns DB and R2 status

---

## PHASE 6 - R2 Move to Backend-Only

### Current R2 Access Points

| Current Route | New Backend Route | Auth | Owner Check |
|---------------|-------------------|------|-------------|
| `POST /api/blobs/upload` | `POST /api/v1/blobs` | User | userId from session |
| `GET /api/blobs/[id]` | `GET /api/v1/blobs/:id` | User | Postgres lookup |
| `DELETE /api/blobs/[id]` | `DELETE /api/v1/blobs/:id` | User | Postgres lookup |
| `POST /api/reference/upload` | `POST /api/v1/tracks` | User | userId from session |
| `GET /api/reference/tracks/[id]/stream` | `GET /api/v1/tracks/:id/stream` | User | Postgres lookup |
| `GET /api/reference/tracks/[id]/play` | (merge with stream) | User | Postgres lookup |

### Authorization Rules

```rust
// For each blob access:
// 1. Validate session
// 2. Query Postgres for blob metadata
// 3. Check user_id matches session.user_id
// 4. If admin, allow any access
// 5. Return 404 for unauthorized (not 403, to avoid enumeration)

async fn authorize_blob_access(
    session: &Session,
    blob_id: Uuid,
    db: &PgPool,
) -> Result<BlobMetadata, AppError> {
    let blob = sqlx::query_as!(BlobMetadata,
        "SELECT * FROM blobs WHERE id = $1",
        blob_id
    )
    .fetch_optional(db)
    .await?
    .ok_or(AppError::NotFound("Blob not found".into()))?;
    
    if blob.user_id != session.user_id && !session.is_admin {
        return Err(AppError::NotFound("Blob not found".into()));
    }
    
    Ok(blob)
}
```

### Signed URL Option

For large file downloads, consider signed URLs:

```rust
// Instead of proxying through backend:
// 1. Generate time-limited signed URL
// 2. Return URL to client
// 3. Client fetches directly from R2

// Requires R2 custom domain or public bucket
// Trade-off: Faster downloads vs. access logging
```

---

## PHASE 7 - Frontend Changes

### Remove Auth.js

**Files to Remove:**
- `src/lib/auth/index.ts`
- `src/lib/auth/providers.ts`
- `src/lib/auth/SessionProvider.tsx`
- `src/lib/auth/useAuth.ts`
- `src/app/api/auth/[...nextauth]/route.ts`
- `src/app/api/auth/accept-tos/route.ts`
- `src/app/api/auth/verify-age/route.ts`

**Dependencies to Remove:**
- `next-auth`
- `@auth/d1-adapter`

### New API Client

```typescript
// conversions/frontend/api-client/client.ts

class APIClient {
  private baseUrl: string;
  
  constructor(baseUrl = '/api/v1') {
    this.baseUrl = baseUrl;
  }
  
  async request<T>(
    path: string,
    options: RequestInit = {}
  ): Promise<T> {
    const response = await fetch(`${this.baseUrl}${path}`, {
      ...options,
      credentials: 'include',  // Always send cookies
      headers: {
        'Content-Type': 'application/json',
        'X-CSRF-Token': this.getCsrfToken(),
        ...options.headers,
      },
    });
    
    if (!response.ok) {
      throw new APIError(response.status, await response.json());
    }
    
    return response.json();
  }
  
  private getCsrfToken(): string {
    // Read from cookie or header set on last response
    return document.cookie
      .split('; ')
      .find(row => row.startsWith('csrf_token='))
      ?.split('=')[1] ?? '';
  }
}

export const api = new APIClient();
```

### SSR Cookie Forwarding

```typescript
// conversions/frontend/ssr-forwarder/middleware.ts

export function createServerAPIClient(request: Request): APIClient {
  const cookies = request.headers.get('cookie') ?? '';
  
  return new APIClient('/api/v1', {
    headers: {
      'Cookie': cookies,
      'X-Forwarded-For': request.headers.get('cf-connecting-ip') ?? '',
    },
  });
}

// Usage in Server Component:
export async function getServerSideProps({ req }) {
  const api = createServerAPIClient(req);
  const data = await api.get('/focus/stats');
  return { props: { data } };
}
```

### Replace All API Calls

**Pattern to find:**
```typescript
// OLD
const response = await fetch('/api/focus', { ... });

// NEW
import { api } from '@/lib/api';
const data = await api.post('/focus', { ... });
```

---

## PHASE 8 - Deployment Artifacts

### Cloudflare Configuration

**wrangler.toml (UI Worker):**
```toml
name = "ignition"
compatibility_date = "2025-01-02"
compatibility_flags = ["nodejs_compat"]
main = ".open-next/worker.js"

[assets]
directory = ".open-next/assets"
binding = "ASSETS"

# NO database bindings
# NO R2 bindings
# NO secrets

[vars]
NODE_ENV = "production"
NEXT_PUBLIC_APP_URL = "https://ignition.ecent.online"
API_BASE_URL = "https://ignition.ecent.online/api/v1"
```

**container.toml (Rust Backend):**
```toml
name = "ignition-api"
image = "registry.example.com/ignition-api:latest"

[env]
DATABASE_URL = { from_secret = "DATABASE_URL" }
AUTH_SECRET = { from_secret = "AUTH_SECRET" }
GOOGLE_CLIENT_ID = { from_secret = "GOOGLE_CLIENT_ID" }
GOOGLE_CLIENT_SECRET = { from_secret = "GOOGLE_CLIENT_SECRET" }
AZURE_AD_CLIENT_ID = { from_secret = "AZURE_AD_CLIENT_ID" }
AZURE_AD_CLIENT_SECRET = { from_secret = "AZURE_AD_CLIENT_SECRET" }
AZURE_AD_TENANT_ID = { from_secret = "AZURE_AD_TENANT_ID" }

[r2_bindings]
BLOBS = { bucket = "ignition-blobs" }

[[routes]]
pattern = "/api/*"
zone_name = "ecent.online"

[[routes]]
pattern = "/auth/*"
zone_name = "ecent.online"
```

### Environment Matrix

| Variable | UI Worker | Backend Container |
|----------|-----------|-------------------|
| `NODE_ENV` | production | production |
| `NEXT_PUBLIC_APP_URL` | Yes | No |
| `API_BASE_URL` | Yes | No |
| `DATABASE_URL` | **No** | Yes |
| `AUTH_SECRET` | **No** | Yes |
| `GOOGLE_*` | **No** | Yes |
| `AZURE_*` | **No** | Yes |
| `ADMIN_EMAILS` | **No** | Yes |
| R2 Binding | **No** | Yes |

### Security Headers

```rust
// Backend response headers
fn security_headers() -> HeaderMap {
    let mut headers = HeaderMap::new();
    headers.insert("X-Content-Type-Options", "nosniff".parse().unwrap());
    headers.insert("X-Frame-Options", "SAMEORIGIN".parse().unwrap());
    headers.insert("Referrer-Policy", "strict-origin-when-cross-origin".parse().unwrap());
    headers.insert("X-XSS-Protection", "1; mode=block".parse().unwrap());
    headers
}
```

### Rate Limiting

```rust
// Per-IP rate limits
const RATE_LIMITS: &[(&str, u32, Duration)] = &[
    ("/auth/*", 10, Duration::from_secs(60)),      // 10 auth attempts/min
    ("/api/v1/admin/*", 100, Duration::from_secs(60)), // 100 admin calls/min
    ("/api/v1/*", 300, Duration::from_secs(60)),   // 300 general calls/min
];
```

---

## PHASE 9 - Validation & Tests

### Playwright Updates

```typescript
// tests/auth.spec.ts - UPDATE

test('OAuth login flow', async ({ page }) => {
  await page.goto('/');
  await page.click('[data-testid="signin-google"]');
  
  // New: OAuth redirects to /auth/google
  await expect(page).toHaveURL(/accounts\.google\.com/);
  
  // After OAuth callback, should redirect to /today
  // (Mock OAuth in test environment)
  await page.goto('/auth/google/callback?code=test');
  await expect(page).toHaveURL('/today');
  
  // Verify session cookie is set
  const cookies = await page.context().cookies();
  const sessionCookie = cookies.find(c => c.name === 'ignition_session');
  expect(sessionCookie).toBeDefined();
  expect(sessionCookie?.httpOnly).toBe(true);
  expect(sessionCookie?.sameSite).toBe('Lax');
});
```

### Contract Tests

```typescript
// tests/contracts/api.spec.ts

describe('API Contracts', () => {
  test('POST /api/v1/focus returns correct schema', async () => {
    const response = await api.post('/focus', {
      duration: 300,
      mode: 'focus'
    });
    
    expect(response).toMatchSchema({
      type: 'object',
      properties: {
        id: { type: 'string', format: 'uuid' },
        status: { enum: ['active', 'completed', 'abandoned'] },
        started_at: { type: 'string', format: 'date-time' },
      },
      required: ['id', 'status', 'started_at']
    });
  });
});
```

### Smoke Tests

```typescript
// tests/smoke/security.spec.ts

test('Session cookies have correct attributes', async ({ request }) => {
  const response = await request.post('/auth/test-login');
  const cookies = response.headers()['set-cookie'];
  
  expect(cookies).toContain('HttpOnly');
  expect(cookies).toContain('SameSite=Lax');
  expect(cookies).toContain('Secure');
});

test('CSRF validation rejects missing token', async ({ request }) => {
  const response = await request.post('/api/v1/focus', {
    data: { duration: 300 },
    headers: { 'X-CSRF-Token': '' }
  });
  
  expect(response.status()).toBe(403);
});

test('Unauthenticated requests return 401', async ({ request }) => {
  const response = await request.get('/api/v1/focus');
  expect(response.status()).toBe(401);
});
```

---

## UNKNOWNS / Missing Inputs

| Item | Required File(s) | Impact |
|------|------------------|--------|
| Cloudflare Containers config | N/A (new tech) | Need to verify container deployment process |
| Postgres hosting | N/A | Need to decide: Neon, Supabase, or self-hosted |
| R2 custom domain | Cloudflare dashboard | Needed for signed URLs if chosen |
| OAuth redirect URIs | Google/Azure consoles | Need to add new callback URLs |

---

## RISKS & MITIGATIONS

### Security Risks

| Risk | Severity | Mitigation |
|------|----------|------------|
| Session fixation during migration | High | Generate new session IDs on backend migration; invalidate all D1 sessions |
| CSRF during transition | High | Maintain CSRF protection throughout; test extensively |
| Cookie scope issues | Medium | Test same-site routing works correctly; have fallback to subdomain |
| Secrets in UI worker | Critical | Audit wrangler.toml; CI check that UI worker has no secrets |
| SQL injection in new backend | High | Use sqlx with compile-time query checking |

### Data Integrity Risks

| Risk | Severity | Mitigation |
|------|----------|------------|
| Data loss during migration | Critical | Full D1 backup before migration; verify row counts |
| Type conversion errors | High | Validate transforms with sample data; reversible migration |
| Foreign key violations | High | Import in dependency order; defer FK checks during import |
| UUID format differences | Medium | Validate all IDs are valid UUIDs before import |

### Operational Risks

| Risk | Severity | Mitigation |
|------|----------|------------|
| Downtime during cutover | Medium | Blue-green deployment; rollback plan |
| Performance regression | Medium | Load test backend before cutover |
| Missing API coverage | High | Automated API inventory comparison |

---

## FILE-BY-FILE CHANGE LIST

### New Files (in conversions/)

| Path | Description |
|------|-------------|
| `conversions/backend/Cargo.toml` | Rust workspace manifest |
| `conversions/backend/crates/*/` | All backend crates (see structure above) |
| `conversions/frontend/api-client/` | New API client |
| `conversions/frontend/ssr-forwarder/` | SSR cookie forwarding |
| `conversions/migrations/postgres-schema/` | Postgres DDL |
| `conversions/migrations/data-migration/` | Migration scripts |
| `conversions/docs/` | Architecture docs |

### Files to Modify (outside conversions/)

| Path | Change |
|------|--------|
| `package.json` | Remove next-auth, @auth/d1-adapter |
| `wrangler.toml` | Remove D1/R2 bindings |
| `src/middleware.ts` | Replace auth() with cookie check |
| `src/lib/auth/` | Replace with API client import |
| `src/app/api/**` | Delete all route handlers |
| `src/lib/db/` | Delete (data access moves to backend) |
| `src/lib/storage/` | Delete (R2 access moves to backend) |
| `.github/workflows/deploy.yml` | Add backend build/deploy step |

### Files to Delete

| Path | Reason |
|------|--------|
| `src/app/api/**/*.ts` | All API routes move to backend |
| `src/lib/auth/` | Auth moves to backend |
| `src/lib/db/` | D1 access removed |
| `src/lib/storage/` | R2 access removed |
| `migrations/*.sql` | D1 migrations deprecated |

---

## MIGRATION STEPS (PR-Sized)

### Phase A: Preparation (Week 1-2)

1. **PR-A1:** Create `conversions/` directory structure
2. **PR-A2:** Initialize Rust workspace with common crate
3. **PR-A3:** Create Postgres schema files
4. **PR-A4:** Create data export/transform scripts
5. **PR-A5:** Create frontend API client skeleton

### Phase B: Backend Core (Week 3-4)

6. **PR-B1:** Implement `db` crate with connection pool
7. **PR-B2:** Implement `auth` crate (OAuth flows, sessions)
8. **PR-B3:** Implement `storage` crate (R2 access)
9. **PR-B4:** Implement base middleware stack
10. **PR-B5:** Implement error handling and logging

### Phase C: Domain Modules (Week 5-7)

11. **PR-C1:** Implement `users` module
12. **PR-C2:** Implement `focus` module
13. **PR-C3:** Implement `quests` + `habits` modules
14. **PR-C4:** Implement `goals` + `calendar` modules
15. **PR-C5:** Implement `exercise` + `books` modules
16. **PR-C6:** Implement `market` + `gamification` modules
17. **PR-C7:** Implement `onboarding` + `learn` modules
18. **PR-C8:** Implement `admin` + `infobase` modules
19. **PR-C9:** Implement `uploads` module (R2)

### Phase D: API Layer (Week 8)

20. **PR-D1:** Implement all auth handlers
21. **PR-D2:** Implement all user handlers
22. **PR-D3:** Implement all domain handlers
23. **PR-D4:** Implement admin handlers

### Phase E: Frontend Migration (Week 9-10)

24. **PR-E1:** Add API client to frontend
25. **PR-E2:** Replace auth hooks
26. **PR-E3:** Replace focus API calls
27. **PR-E4:** Replace all remaining API calls
28. **PR-E5:** Remove Auth.js and D1/R2 code

### Phase F: Data Migration (Week 11)

29. **PR-F1:** Set up Postgres in staging
30. **PR-F2:** Run data migration in staging
31. **PR-F3:** Verify data integrity
32. **PR-F4:** Update CI/CD for backend

### Phase G: Cutover (Week 12)

33. **PR-G1:** Production Postgres setup
34. **PR-G2:** Data migration to production
35. **PR-G3:** Deploy backend container
36. **PR-G4:** Update Cloudflare routes
37. **PR-G5:** Deploy frontend update
38. **PR-G6:** Decommission D1

---

## Appendix: Quick Reference

### Current Auth Flow
```
Browser -> Next.js Middleware -> Auth.js -> D1 Session -> API Route
```

### Target Auth Flow
```
Browser -> Rust Backend (validate cookie) -> Postgres Session -> Handler
```

### Current Data Flow
```
Browser -> Next.js API -> D1/R2 -> Response
```

### Target Data Flow
```
Browser -> (or) -> Rust Backend -> Postgres/R2 -> Response
           SSR -> UI Worker ->
```

---

*End of Migration Plan*

