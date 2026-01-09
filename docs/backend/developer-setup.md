# Backend Developer Setup

Complete guide to setting up the Ignition backend for local development.

---

## Prerequisites

| Tool | Version | Check Command |
|------|---------|---------------|
| Rust | 1.83+ | `rustc --version` |
| Cargo | 1.83+ | `cargo --version` |
| Docker | 24+ | `docker --version` |
| PostgreSQL Client | 17+ | `psql --version` |
| Git | 2.40+ | `git --version` |

---

## Repository Layout

```
app/
├── backend/               # Rust backend (this doc)
│   ├── crates/
│   │   └── api/           # Main API crate
│   │       ├── src/
│   │       │   ├── main.rs         # Entry point
│   │       │   ├── config.rs       # Configuration
│   │       │   ├── state.rs        # App state
│   │       │   ├── error.rs        # Error types
│   │       │   ├── routes/         # HTTP handlers
│   │       │   ├── db/             # Models and repos
│   │       │   ├── middleware/     # Auth, CSRF, etc.
│   │       │   ├── services/       # Business logic
│   │       │   └── storage/        # R2/S3 client
│   │       └── Cargo.toml
│   ├── Cargo.toml         # Workspace root
│   └── Dockerfile
├── frontend/              # Next.js frontend
├── admin/                 # Admin console
├── database/              # PostgreSQL migrations
│   └── migrations/
│       ├── 0001_initial.sql
│       ├── 0002_auth.sql
│       └── ...
└── r2/                    # R2 storage config
```

---

## Quick Start

### 1. Clone and Setup

```bash
# Clone repository
git clone https://github.com/yourusername/passion-os-next.git
cd passion-os-next

# Checkout correct branch
git checkout refactor/stack-split

# Navigate to backend
cd app/backend
```

### 2. Install Rust Toolchain

```bash
# Install rustup if not present
curl --proto '=https' --tlsv1.2 -sSf https://sh.rustup.rs | sh

# Install stable toolchain
rustup install stable
rustup default stable

# Verify installation
rustc --version
cargo --version
```

### 3. Start Database

```bash
# From project root
cd ../../infra

# Start PostgreSQL and MinIO (S3-compatible storage)
docker compose up -d postgres minio minio-init

# Verify services are running
docker compose ps
```

### 4. Configure Environment

```bash
# From backend directory
cd ../app/backend

# Copy example environment file
cp .env.example .env
```

Edit `.env`:

```bash
# Database
DATABASE_URL=postgres://ignition:ignition_dev@localhost:5432/ignition

# Server
SERVER_HOST=0.0.0.0
SERVER_PORT=8080
SERVER_ENVIRONMENT=development

# Auth
AUTH_COOKIE_DOMAIN=localhost
AUTH_DEV_BYPASS=true

# OAuth (optional for local dev with bypass)
GOOGLE_CLIENT_ID=
GOOGLE_CLIENT_SECRET=
AZURE_CLIENT_ID=
AZURE_CLIENT_SECRET=
AZURE_TENANT_ID=

# CORS
CORS_ALLOWED_ORIGINS=http://localhost:3000,http://localhost:3001

# Storage (MinIO for local)
STORAGE_ENDPOINT=http://localhost:9000
STORAGE_BUCKET=ignition
STORAGE_ACCESS_KEY_ID=minioadmin
STORAGE_SECRET_ACCESS_KEY=minioadmin
STORAGE_REGION=us-east-1

# Session
SESSION_SECRET=local-dev-secret-change-in-prod
```

### 5. Run Migrations

```bash
# Migrations are automatically applied by Docker on first run
# To apply manually:
psql $DATABASE_URL -f ../../app/database/migrations/0001_initial.sql
psql $DATABASE_URL -f ../../app/database/migrations/0002_auth.sql
# ... repeat for all migration files
```

### 6. Build and Run

```bash
# Build (debug mode for faster compilation)
cargo build

# Run
cargo run

# API available at http://localhost:8080
# Health check: http://localhost:8080/health
```

---

## Development Workflow

### Code Structure Patterns

#### Route Handlers

```rust
// src/routes/focus.rs
use axum::{
    extract::{Path, State},
    routing::{get, post},
    Extension, Json, Router,
};

pub fn router() -> Router<Arc<AppState>> {
    Router::new()
        .route("/sessions", get(list_sessions).post(create_session))
        .route("/sessions/:id", get(get_session).delete(delete_session))
}

async fn list_sessions(
    State(state): State<Arc<AppState>>,
    Extension(auth): Extension<AuthContext>,
) -> Result<Json<Vec<FocusSession>>, AppError> {
    let sessions = get_user_sessions(&state.db, auth.user_id).await?;
    Ok(Json(sessions))
}
```

#### Database Models

```rust
// src/db/focus_models.rs
use serde::{Deserialize, Serialize};
use sqlx::FromRow;
use uuid::Uuid;
use chrono::{DateTime, Utc};

#[derive(Debug, Serialize, Deserialize, FromRow)]
pub struct FocusSession {
    pub id: Uuid,
    pub user_id: Uuid,
    pub duration_minutes: i32,
    pub completed: bool,
    pub created_at: DateTime<Utc>,
    pub completed_at: Option<DateTime<Utc>>,
}
```

#### Repository Pattern

```rust
// src/db/focus_repos.rs
use sqlx::PgPool;

pub async fn get_user_sessions(
    pool: &PgPool,
    user_id: Uuid,
) -> Result<Vec<FocusSession>, sqlx::Error> {
    // CRITICAL: Use runtime query binding, NOT compile-time macros
    // ✅ CORRECT
    sqlx::query_as::<_, FocusSession>(
        "SELECT * FROM focus_sessions WHERE user_id = $1 ORDER BY created_at DESC"
    )
    .bind(user_id)
    .fetch_all(pool)
    .await
    
    // ❌ WRONG - compile-time macro (no DATABASE_URL at build)
    // sqlx::query_as!(FocusSession, "SELECT * FROM focus_sessions WHERE user_id = $1", user_id)
}
```

---

## SQLx Pattern (CRITICAL)

**Always use runtime query binding, NOT compile-time macros:**

```rust
// ✅ CORRECT - runtime binding
sqlx::query_as::<_, MyType>("SELECT * FROM table WHERE id = $1")
    .bind(id)
    .fetch_one(pool)
    .await

// ❌ WRONG - compile-time macro (no DATABASE_URL at build)
sqlx::query_as!(MyType, "SELECT * FROM table WHERE id = $1", id)
```

The compile-time macros require `DATABASE_URL` during build, which we don't have in CI/CD. Always use the runtime binding approach.

---

## Authentication

### How It Works

1. User visits `/auth/login?provider=google` (or `azure`)
2. Backend generates OAuth state and redirects to provider
3. Provider redirects back to `/auth/callback?code=...&state=...`
4. Backend exchanges code for tokens, creates/updates user
5. Backend creates session and sets cookie: `Domain=ecent.online; SameSite=None; Secure; HttpOnly`
6. User redirected to frontend with active session

### Cookie Configuration

```rust
// Cookie settings (production)
Cookie::new("session", session_token)
    .http_only()
    .secure(true)
    .same_site(SameSite::None)
    .domain("ecent.online")
    .path("/")
    .max_age(Duration::days(7))
```

### Auth Middleware

```rust
// All /api/* routes require authentication
pub fn api_routes() -> Router<Arc<AppState>> {
    Router::new()
        .nest("/api", super::api::router())
        .layer(middleware::from_fn(require_auth))
        .layer(middleware::from_fn(csrf_protection))
}

// Admin routes require admin role
pub fn admin_routes() -> Router<Arc<AppState>> {
    Router::new()
        .nest("/admin", super::admin::router())
        .layer(middleware::from_fn(require_admin))
        .layer(middleware::from_fn(require_auth))
        .layer(middleware::from_fn(csrf_protection))
}
```

### Dev Bypass (Local Only)

For local development without OAuth setup:

```bash
# In .env
AUTH_DEV_BYPASS=true
```

This creates a test user session automatically. **Only works on localhost/127.0.0.1**.

---

## Testing

### Unit Tests

```bash
# Run all tests
cargo test

# Run specific test
cargo test test_create_session

# Run with output
cargo test -- --nocapture

# Run tests for specific crate
cargo test -p ignition-api
```

### Integration Tests

```bash
# Ensure database is running
docker compose up -d postgres

# Run integration tests
cargo test --features integration

# Run specific integration test file
cargo test --features integration focus_integration
```

### Writing Tests

```rust
#[cfg(test)]
mod tests {
    use super::*;

    #[tokio::test]
    async fn test_create_session() {
        let pool = test_pool().await;
        let user_id = create_test_user(&pool).await;
        
        let session = create_focus_session(&pool, user_id, 25).await.unwrap();
        
        assert_eq!(session.duration_minutes, 25);
        assert!(!session.completed);
    }
}
```

---

## Build and Deploy

### Release Build

```bash
# Optimized release build
cargo build --release

# Binary at target/release/ignition-api
```

### Docker Build

```bash
# Build image
docker build -t ignition-api:latest .

# Run container
docker run -p 8080:8080 --env-file .env ignition-api:latest
```

### Type Checking and Linting

```bash
# Check for errors without building
cargo check

# Run clippy lints
cargo clippy -- -D warnings

# Format code
cargo fmt

# Check formatting
cargo fmt -- --check
```

---

## Troubleshooting

### Common Issues

| Issue | Solution |
|-------|----------|
| `DATABASE_URL not set` | Ensure `.env` is loaded or export env var |
| `Connection refused` | Check PostgreSQL is running: `docker compose ps` |
| `CORS error` | Verify `CORS_ALLOWED_ORIGINS` includes frontend URL |
| `401 Unauthorized` | Check session cookie is set, `AUTH_DEV_BYPASS=true` |
| `SQLx compile error` | Use runtime binding, not `query!` macros |

### Debug Commands

```bash
# Check database connection
psql postgres://ignition:ignition_dev@localhost:5432/ignition -c "SELECT 1"

# View logs
cargo run 2>&1 | tee .tmp/api.log

# Check MinIO
curl http://localhost:9000/minio/health/live

# Test health endpoint
curl http://localhost:8080/health
```

---

## Environment Variables

| Variable | Required | Default | Description |
|----------|----------|---------|-------------|
| `DATABASE_URL` | Yes | - | PostgreSQL connection string |
| `SERVER_HOST` | No | `0.0.0.0` | Bind address |
| `SERVER_PORT` | No | `8080` | HTTP port |
| `SERVER_ENVIRONMENT` | No | `development` | `development` or `production` |
| `AUTH_COOKIE_DOMAIN` | Yes | - | Cookie domain (`localhost` or `ecent.online`) |
| `AUTH_DEV_BYPASS` | No | `false` | Enable dev auth bypass |
| `CORS_ALLOWED_ORIGINS` | Yes | - | Comma-separated allowed origins |
| `SESSION_SECRET` | Yes | - | Secret for session encryption |
| `STORAGE_ENDPOINT` | Yes | - | S3/R2 endpoint URL |
| `STORAGE_BUCKET` | Yes | - | Storage bucket name |
| `STORAGE_ACCESS_KEY_ID` | Yes | - | S3 access key |
| `STORAGE_SECRET_ACCESS_KEY` | Yes | - | S3 secret key |

---

## Related Documentation

- [Frontend Developer Setup](../frontend/developer-setup.md)
- [Database Schema](./database.md)
- [API Reference](./api-reference.md)
- [Ops Runbooks](./ops/README.md)
