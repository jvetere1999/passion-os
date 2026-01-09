"Backend submodule layout defining internal structure, responsibilities, and dependencies."

# Backend Submodules Layout

**Date:** January 7, 2026  
**Branch:** `refactor/stack-split`  
**Purpose:** Define strict internal layout for Rust backend monolith

---

## Overview

The backend is structured as a Cargo workspace with a primary `api` crate. Internal organization follows a layered architecture with strict dependency rules.

---

## Workspace Structure

```
app/backend/
├── Cargo.toml              # Workspace manifest
├── Cargo.lock
├── rust-toolchain.toml     # Rust version (1.83+)
├── Dockerfile
├── .env.example
│
└── crates/
    └── api/                # Main API crate
        ├── Cargo.toml
        └── src/
            ├── main.rs
            ├── lib.rs
            └── ...
```

---

## Source Layout (`crates/api/src/`)

```
src/
├── main.rs                 # Entry point only
├── lib.rs                  # Module re-exports
├── config.rs               # Configuration
├── state.rs                # Application state
├── error.rs                # Error types (AppError)
│
├── routes/                 # Layer 1: HTTP handlers
│   ├── mod.rs
│   ├── health.rs           # /health
│   ├── auth.rs             # /auth/*
│   ├── admin.rs            # /admin/*
│   ├── blobs.rs            # /blobs/*
│   ├── api.rs              # Generic router
│   │
│   └── features/           # Feature-specific routes
│       ├── mod.rs
│       ├── gamification.rs # /gamification/*
│       ├── focus.rs        # /focus/*
│       ├── habits.rs       # /habits/*
│       ├── goals.rs        # /goals/*
│       ├── quests.rs       # /quests/*
│       ├── calendar.rs     # /calendar/*
│       ├── daily_plan.rs   # /daily-plan/*
│       ├── exercise.rs     # /exercise/*
│       ├── programs.rs     # /programs/*
│       ├── books.rs        # /books/*
│       ├── learn.rs        # /learn/*
│       ├── market.rs       # /market/*
│       ├── reference.rs    # /reference/*
│       ├── onboarding.rs   # /onboarding/*
│       ├── user.rs         # /user/*
│       ├── feedback.rs     # /feedback/*
│       ├── infobase.rs     # /infobase/*
│       ├── ideas.rs        # /ideas/*
│       └── analysis.rs     # /analysis/*
│
├── services/               # Layer 2: Business logic
│   ├── mod.rs
│   ├── auth.rs             # OAuth, session logic
│   ├── oauth.rs            # Provider-specific OAuth
│   ├── xp.rs               # XP calculations, level-ups
│   ├── wallet.rs           # Coin transactions
│   ├── achievements.rs     # Achievement detection
│   ├── streaks.rs          # Streak calculation
│   ├── focus.rs            # Focus session lifecycle
│   ├── quests.rs           # Quest progress, rewards
│   ├── market.rs           # Purchase, redemption
│   ├── export.rs           # User data export
│   └── backup.rs           # Admin backup/restore
│
├── db/                     # Layer 3: Database access
│   ├── mod.rs
│   ├── pool.rs             # SQLx pool
│   ├── models.rs           # Row types (FromRow)
│   └── repos/              # Repository implementations
│       ├── mod.rs
│       ├── users.rs
│       ├── sessions.rs
│       ├── accounts.rs
│       ├── gamification.rs
│       ├── focus.rs
│       ├── habits.rs
│       ├── goals.rs
│       ├── quests.rs
│       ├── calendar.rs
│       ├── daily_plans.rs
│       ├── exercise.rs
│       ├── programs.rs
│       ├── books.rs
│       ├── learn.rs
│       ├── market.rs
│       ├── reference.rs
│       ├── onboarding.rs
│       ├── settings.rs
│       ├── feedback.rs
│       ├── infobase.rs
│       ├── ideas.rs
│       ├── analysis.rs
│       └── admin.rs
│
├── storage/                # Layer 3: R2 access
│   ├── mod.rs
│   ├── client.rs           # S3 client wrapper
│   ├── signed_urls.rs      # Pre-signed URL generation
│   └── types.rs            # Blob types, categories
│
├── middleware/             # Cross-cutting
│   ├── mod.rs
│   ├── auth.rs             # Session extraction
│   ├── csrf.rs             # Origin/Referer check
│   ├── cors.rs             # CORS headers
│   ├── logging.rs          # Request/response logging
│   ├── error.rs            # Error response formatter
│   └── request_id.rs       # Request ID injection
│
├── validation/             # Cross-cutting
│   ├── mod.rs
│   ├── schemas.rs          # Input validation schemas
│   └── sanitize.rs         # Input sanitization
│
└── tests/                  # Integration tests
    ├── mod.rs
    ├── auth_tests.rs
    ├── storage_tests.rs
    └── ...
```

---

## Layer Definitions

### Layer 1: Routes (`routes/`)

**Responsibility:** HTTP request/response handling only

**Allowed Operations:**
- Parse request (path, query, body)
- Call services
- Format response
- Apply route-specific middleware

**NOT Allowed:**
- Direct database access
- Business logic calculations
- Direct storage access

**Dependencies:**
```
routes → services, middleware, validation
routes ✗ db, storage
```

### Layer 2: Services (`services/`)

**Responsibility:** Business logic, orchestration

**Allowed Operations:**
- Implement business rules
- Coordinate multiple repositories
- Call storage layer
- Transaction orchestration

**NOT Allowed:**
- HTTP concerns (request/response types)
- Direct SQL queries

**Dependencies:**
```
services → db/repos, storage
services ✗ routes, middleware
```

### Layer 3: Data Access (`db/`, `storage/`)

**Responsibility:** Data persistence and retrieval

**Allowed Operations:**
- SQL queries (parameterized only)
- R2/S3 operations
- Model mapping

**NOT Allowed:**
- Business logic
- Cross-repository calls

**Dependencies:**
```
db → external: Postgres (via SQLx)
storage → external: R2 (via aws-sdk-s3)
db ✗ storage, services, routes
storage ✗ db, services, routes
```

### Cross-Cutting: Middleware (`middleware/`)

**Responsibility:** Request/response pipeline concerns

**Allowed Operations:**
- Extract/verify session
- Check CSRF
- Add CORS headers
- Log requests
- Format errors

**Dependencies:**
```
middleware → config, db/repos/sessions
middleware ✗ services, routes (specific handlers)
```

### Cross-Cutting: Validation (`validation/`)

**Responsibility:** Input validation

**Allowed Operations:**
- Schema definitions
- Validation execution
- Sanitization

**Dependencies:**
```
validation → (none, pure functions)
```

---

## Submodule Dependency Matrix

| From ↓ / To → | routes | services | db/repos | storage | middleware | validation | config | error |
|---------------|--------|----------|----------|---------|------------|------------|--------|-------|
| **routes** | - | ✅ | ❌ | ❌ | ✅ | ✅ | ✅ | ✅ |
| **services** | ❌ | - | ✅ | ✅ | ❌ | ✅ | ✅ | ✅ |
| **db/repos** | ❌ | ❌ | - | ❌ | ❌ | ❌ | ✅ | ✅ |
| **storage** | ❌ | ❌ | ❌ | - | ❌ | ✅ | ✅ | ✅ |
| **middleware** | ❌ | ❌ | ⚠️* | ❌ | - | ❌ | ✅ | ✅ |
| **validation** | ❌ | ❌ | ❌ | ❌ | ❌ | - | ❌ | ✅ |

*`⚠️` = middleware can access `db/repos/sessions` only for session lookup

---

## Feature Domain Submodules

Each feature domain has consistent placement:

| Feature | Route File | Service File | Repo File | Tables |
|---------|------------|--------------|-----------|--------|
| Auth | `routes/auth.rs` | `services/auth.rs` | `db/repos/users.rs`, `sessions.rs`, `accounts.rs` | users, sessions, accounts |
| Gamification | `routes/features/gamification.rs` | `services/xp.rs`, `wallet.rs`, `achievements.rs` | `db/repos/gamification.rs` | user_progress, user_wallet, ... |
| Focus | `routes/features/focus.rs` | `services/focus.rs` | `db/repos/focus.rs` | focus_sessions, focus_pause_state |
| Habits | `routes/features/habits.rs` | `services/streaks.rs` | `db/repos/habits.rs` | habits, habit_logs |
| Goals | `routes/features/goals.rs` | (inline) | `db/repos/goals.rs` | goals, goal_milestones |
| Quests | `routes/features/quests.rs` | `services/quests.rs` | `db/repos/quests.rs` | quests, universal_quests, user_quest_progress |
| Calendar | `routes/features/calendar.rs` | (inline) | `db/repos/calendar.rs` | calendar_events |
| Daily Plan | `routes/features/daily_plan.rs` | (inline) | `db/repos/daily_plans.rs` | daily_plans |
| Exercise | `routes/features/exercise.rs` | (inline) | `db/repos/exercise.rs` | exercises, workouts, ... |
| Programs | `routes/features/programs.rs` | (inline) | `db/repos/programs.rs` | training_programs, ... |
| Books | `routes/features/books.rs` | (inline) | `db/repos/books.rs` | books, reading_sessions |
| Learn | `routes/features/learn.rs` | (inline) | `db/repos/learn.rs` | learn_topics, ... |
| Market | `routes/features/market.rs` | `services/market.rs` | `db/repos/market.rs` | market_items, user_purchases |
| Reference | `routes/features/reference.rs` | (inline) | `db/repos/reference.rs` | reference_tracks, track_analysis_cache |
| Onboarding | `routes/features/onboarding.rs` | (inline) | `db/repos/onboarding.rs` | user_onboarding_state, ... |
| User | `routes/features/user.rs` | `services/export.rs` | `db/repos/settings.rs` | user_settings, ... |
| Feedback | `routes/features/feedback.rs` | (inline) | `db/repos/feedback.rs` | feedback |
| Infobase | `routes/features/infobase.rs` | (inline) | `db/repos/infobase.rs` | infobase_entries |
| Ideas | `routes/features/ideas.rs` | (inline) | `db/repos/ideas.rs` | ideas |
| Analysis | `routes/features/analysis.rs` | (inline) | `db/repos/analysis.rs` | track_analysis_cache |
| Admin | `routes/admin.rs` | `services/backup.rs` | `db/repos/admin.rs` | all tables |

---

## Shared/Cross-Cutting Placement

| Concern | Location | Justification |
|---------|----------|---------------|
| Error types | `error.rs` | Used by all layers |
| App config | `config.rs` | Loaded at startup |
| App state | `state.rs` | Shared pool, config |
| User context | `middleware/auth.rs` | Request extension |
| Request ID | `middleware/request_id.rs` | Tracing |
| Validation schemas | `validation/schemas.rs` | Route input validation |
| Blob types | `storage/types.rs` | Storage-specific |
| DB models | `db/models.rs` | Row mapping |

---

## Module Visibility Rules

### Public (`pub`)

- `error::AppError` - Used by all layers
- `config::Config` - Accessed via state
- `state::AppState` - Passed to routes
- Route handlers - Registered in router
- Service functions - Called by routes
- Repository functions - Called by services

### Private (crate-only)

- Internal helpers in each module
- Database pool internals
- Storage client internals

### Module-Private

- Row types that don't leave the repo
- Internal calculation functions

---

## Testing Strategy by Layer

| Layer | Test Type | Location | What to Test |
|-------|-----------|----------|--------------|
| Routes | Integration | `tests/` | HTTP request/response, status codes |
| Services | Unit | Inline `#[cfg(test)]` | Business logic, calculations |
| Repos | Integration | `tests/` | SQL correctness (requires DB) |
| Storage | Integration | `tests/` | S3 operations (requires MinIO) |
| Middleware | Unit | Inline | Header parsing, context extraction |
| Validation | Unit | Inline | Schema validation |

---

## Adding a New Feature Domain

### Checklist

1. Create route file: `routes/features/<domain>.rs`
2. Create repo file: `db/repos/<domain>.rs`
3. (If complex) Create service file: `services/<domain>.rs`
4. Add to `routes/features/mod.rs`
5. Add to `db/repos/mod.rs`
6. Add to router in `routes/mod.rs`
7. Add migration if new tables needed
8. Add tests in `tests/`

### Template

```rust
// routes/features/example.rs
use axum::{Router, routing::get, extract::State};
use crate::{state::AppState, error::AppError, middleware::auth::AuthContext};

pub fn router() -> Router<AppState> {
    Router::new()
        .route("/", get(list))
        .route("/:id", get(get_one))
}

async fn list(
    State(state): State<AppState>,
    auth: AuthContext,
) -> Result<impl IntoResponse, AppError> {
    let items = crate::db::repos::example::list(&state.pool, &auth.user_id).await?;
    Ok(Json(items))
}
```

---

## References

- [module_boundaries.md](./module_boundaries.md) - Original boundaries
- [FEATURE_OWNERSHIP_MAP.md](./FEATURE_OWNERSHIP_MAP.md) - Feature ownership
- [FEATURE_EXTRACTION_BACKLOG.md](./FEATURE_EXTRACTION_BACKLOG.md) - Extraction queue

