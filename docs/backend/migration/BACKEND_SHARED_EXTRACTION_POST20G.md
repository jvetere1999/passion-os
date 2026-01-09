# Backend Shared Extraction Post-20G

**Date:** January 7, 2026  
**Branch:** `refactor/stack-split`  
**Purpose:** Document reusable backend patterns extracted for feature route implementation

---

## Overview

This document describes the shared modules extracted to minimize hand-coding when implementing feature routes. All modules are located under `app/backend/crates/api/src/shared/`.

---

## Module Summary

| Module | Path | Purpose |
|--------|------|---------|
| `auth::extractor` | `shared/auth/extractor.rs` | Extract user context from request |
| `auth::csrf` | `shared/auth/csrf.rs` | CSRF token generation/verification |
| `auth::origin` | `shared/auth/origin.rs` | Origin/Referer verification |
| `auth::rbac` | `shared/auth/rbac.rs` | RBAC guards and policies |
| `http::errors` | `shared/http/errors.rs` | Standardized error responses |
| `http::response` | `shared/http/response.rs` | Response helpers |
| `http::validation` | `shared/http/validation.rs` | Input validation |
| `ids` | `shared/ids.rs` | Typed IDs for entities |
| `db::tx` | `shared/db/tx.rs` | Transaction utilities |
| `db::pagination` | `shared/db/pagination.rs` | Pagination helpers |
| `audit` | `shared/audit.rs` | Audit event logging |

---

## Module Details

### auth::extractor

**Purpose:** Extract authenticated user context from request extensions.

**Public API:**

```rust
/// Auth extractor - use in handler parameters
pub struct Auth {
    pub user_id: Uuid,
    pub email: String,
    pub name: String,
    pub role: String,
    pub session_id: Uuid,
    pub entitlements: Vec<String>,
    pub is_dev_bypass: bool,
}

impl Auth {
    pub fn is_admin(&self) -> bool;
    pub fn has_entitlement(&self, entitlement: &str) -> bool;
    pub fn has_any_entitlement(&self, entitlements: &[&str]) -> bool;
    pub fn has_all_entitlements(&self, entitlements: &[&str]) -> bool;
}

/// Optional auth extractor
pub struct MaybeAuth(pub Option<Auth>);
```

**Usage:**

```rust
use crate::shared::auth::Auth;

async fn protected_handler(auth: Auth) -> impl IntoResponse {
    format!("Hello, {}!", auth.email)
}

async fn optional_handler(auth: MaybeAuth) -> impl IntoResponse {
    match auth.0 {
        Some(user) => format!("Hello, {}!", user.email),
        None => "Hello, anonymous!".to_string(),
    }
}
```

---

### auth::csrf

**Purpose:** CSRF token utilities for additional protection beyond Origin verification.

**Public API:**

```rust
pub fn generate_token() -> String;
pub fn verify_token(expected: &str, provided: &str) -> bool;
pub fn create_csrf_cookie(token: &str, domain: &str, ttl_seconds: u64) -> String;

pub const CSRF_HEADER: &str = "X-CSRF-Token";
pub const CSRF_COOKIE: &str = "csrf_token";
```

**Usage:**

```rust
use crate::shared::auth::csrf;

let token = csrf::generate_token();
let cookie = csrf::create_csrf_cookie(&token, "ecent.online", 3600);

// In request handler
if !csrf::verify_token(&expected, &provided) {
    return Err(AppError::CsrfViolation);
}
```

---

### auth::origin

**Purpose:** Origin/Referer verification per DEC-002=A.

**Public API:**

```rust
pub fn is_origin_allowed(origin: &str, is_production: bool) -> bool;
pub fn is_referer_allowed(referer: &str, is_production: bool) -> bool;
pub fn verify_origin(headers: &HeaderMap, is_production: bool) -> bool;
pub fn check_origin(headers: &HeaderMap, is_production: bool) -> OriginCheck;
pub fn extract_origin(headers: &HeaderMap) -> Option<String>;

pub enum OriginCheck {
    Valid { origin: String },
    ValidReferer { referer: String },
    InvalidOrigin { provided: String },
    Missing,
}
```

**Usage:**

```rust
use crate::shared::auth::origin;

// Quick check
if !origin::verify_origin(req.headers(), is_production) {
    return Err(AppError::InvalidOrigin);
}

// Detailed check
match origin::check_origin(req.headers(), is_production) {
    OriginCheck::Valid { origin } => { /* allowed */ }
    OriginCheck::InvalidOrigin { provided } => {
        tracing::warn!("Invalid origin: {}", provided);
        return Err(AppError::InvalidOrigin);
    }
    OriginCheck::Missing => { /* handle */ }
    _ => {}
}
```

---

### auth::rbac

**Purpose:** RBAC guards and policies per DEC-004=B.

**Public API:**

```rust
// Middleware guards
pub async fn require_auth_guard(req: Request, next: Next) -> Result<Response, AppError>;
pub async fn require_admin_guard(req: Request, next: Next) -> Result<Response, AppError>;
pub fn require_entitlement_guard(entitlement: &'static str) -> impl Fn(...);
pub fn require_any_entitlement_guard(entitlements: &'static [&'static str]) -> impl Fn(...);
pub fn require_all_entitlements_guard(entitlements: &'static [&'static str]) -> impl Fn(...);

// Policy-based checks
pub struct RbacPolicy {
    pub any_of: Vec<String>,
    pub all_of: Vec<String>,
    pub admin_bypass: bool,
}

impl RbacPolicy {
    pub fn any(entitlements: &[&str]) -> Self;
    pub fn all(entitlements: &[&str]) -> Self;
    pub fn no_admin_bypass(self) -> Self;
    pub fn check(&self, auth: &AuthContext) -> bool;
}
```

**Usage:**

```rust
use crate::shared::auth::rbac;

// As middleware layer
Router::new()
    .route("/admin/users", get(handler))
    .layer(middleware::from_fn(rbac::require_admin_guard))

// With specific entitlement
Router::new()
    .route("/admin/backup", post(handler))
    .layer(middleware::from_fn(rbac::require_entitlement_guard("admin:backup")))

// Policy check in handler
let policy = RbacPolicy::any(&["feature:read", "feature:write"]);
if !policy.check(&auth_context) {
    return Err(AppError::Forbidden);
}
```

---

### http::errors

**Purpose:** Standardized API error responses.

**Public API:**

```rust
pub struct ApiError {
    pub error: String,
    pub message: String,
    pub code: Option<String>,
    pub fields: Option<Vec<FieldError>>,
}

pub struct FieldError {
    pub field: String,
    pub message: String,
    pub code: Option<String>,
}

impl ApiError {
    pub fn new(error: impl Into<String>, message: impl Into<String>) -> Self;
    pub fn not_found(resource: &str) -> Self;
    pub fn validation(message: impl Into<String>) -> Self;
    pub fn validation_fields(fields: Vec<FieldError>) -> Self;
    pub fn unauthorized() -> Self;
    pub fn forbidden() -> Self;
    pub fn internal() -> Self;
    pub fn with_code(self, code: impl Into<String>) -> Self;
}

// Convert AppError to ApiError
impl From<AppError> for ApiError;

// Helper trait
pub trait IntoApiError<T> {
    fn into_api_error(self) -> ApiResult<T>;
    fn or_not_found(self, resource: &str) -> ApiResult<T>;
}
```

**Usage:**

```rust
use crate::shared::http::{ApiError, IntoApiError};

async fn handler() -> Result<Json<User>, ApiError> {
    let user = repo.find_by_id(id).await
        .into_api_error()?
        .or_not_found("User")?;
    
    Ok(Json(user))
}

// Validation error with fields
let err = ApiError::validation_fields(vec![
    FieldError { field: "email".into(), message: "Invalid".into(), code: None },
]);
```

---

### http::response

**Purpose:** Response helpers for consistent API responses.

**Public API:**

```rust
pub struct ApiResponse<T> { pub success: bool, pub data: T }
pub struct PaginatedResponse<T> { pub items: Vec<T>, pub total: i64, ... }
pub struct Created<T> { pub data: T }
pub struct NoContent;
pub struct Deleted { pub deleted: bool, pub message: Option<String> }

// Helper functions
pub fn ok<T>(data: T) -> impl IntoResponse;
pub fn created<T>(data: T) -> impl IntoResponse;
pub fn no_content() -> impl IntoResponse;
```

**Usage:**

```rust
use crate::shared::http::response::*;

async fn create_handler() -> impl IntoResponse {
    let user = create_user().await?;
    Created::new(user)
}

async fn delete_handler() -> impl IntoResponse {
    delete_resource().await?;
    Deleted::ok()
}
```

---

### http::validation

**Purpose:** Fluent input validation.

**Public API:**

```rust
pub struct Validator {
    fn new() -> Self;
    fn required(self, field: &str, value: &str) -> Self;
    fn required_option<T>(self, field: &str, value: &Option<T>) -> Self;
    fn min_length(self, field: &str, value: &str, min: usize) -> Self;
    fn max_length(self, field: &str, value: &str, max: usize) -> Self;
    fn range<T>(self, field: &str, value: T, min: T, max: T) -> Self;
    fn email(self, field: &str, value: &str) -> Self;
    fn url(self, field: &str, value: &str) -> Self;
    fn uuid(self, field: &str, value: &str) -> Self;
    fn one_of<T>(self, field: &str, value: &T, allowed: &[T]) -> Self;
    fn custom<F>(self, check: F) -> Self;
    fn finish(self) -> Result<(), ApiError>;
}

pub fn validate_pagination(page: i64, page_size: i64) -> Result<(i64, i64), ApiError>;
pub fn pagination_offset(page: i64, page_size: i64) -> i64;
```

**Usage:**

```rust
use crate::shared::http::validation::Validator;

async fn create_handler(body: Json<CreateInput>) -> Result<..., ApiError> {
    Validator::new()
        .required("name", &body.name)
        .min_length("name", &body.name, 2)
        .max_length("name", &body.name, 100)
        .email("email", &body.email)
        .finish()?;
    
    // validation passed
}
```

---

### ids

**Purpose:** Type-safe IDs to prevent entity ID confusion.

**Public API:**

```rust
pub struct TypedId<T: EntityType> { ... }

impl<T: EntityType> TypedId<T> {
    pub fn new(id: Uuid) -> Self;
    pub fn generate() -> Self;
    pub fn into_inner(self) -> Uuid;
    pub fn as_uuid(&self) -> &Uuid;
}

// Pre-defined ID types
pub type UserId = TypedId<User>;
pub type TrackId = TypedId<Track>;
pub type AnnotationId = TypedId<Annotation>;
// ... etc for all entities

pub fn parse_uuid(s: &str, entity_name: &str) -> Result<Uuid, AppError>;
pub fn parse_uuid_optional(s: Option<&str>, entity_name: &str) -> Result<Option<Uuid>, AppError>;
```

**Usage:**

```rust
use crate::shared::ids::{UserId, TrackId};

// Type-safe: cannot mix user and track IDs
fn get_track(track_id: TrackId) { ... }
fn get_user(user_id: UserId) { ... }

// Compile error: cannot pass UserId where TrackId expected
// get_track(user_id);

// Generate new ID
let id: TrackId = TypedId::generate();

// Parse from string
let id: UserId = "550e8400-e29b-41d4-a716-446655440000".parse()?;
```

---

### db::tx

**Purpose:** Transaction utilities for explicit transaction boundaries.

**Public API:**

```rust
pub struct Tx<'a> {
    pub async fn begin(pool: &'a PgPool) -> Result<Self, AppError>;
    pub async fn commit(self) -> Result<(), AppError>;
    pub async fn rollback(self) -> Result<(), AppError>;
    pub fn as_mut(&mut self) -> &mut Transaction<'a, Postgres>;
}

pub async fn with_transaction<F, T, Fut>(pool: &PgPool, f: F) -> Result<T, AppError>
where
    F: FnOnce(&mut Transaction<'_, Postgres>) -> Fut,
    Fut: Future<Output = Result<T, AppError>>;
```

**Usage:**

```rust
use crate::shared::db::with_transaction;

let result = with_transaction(&pool, |tx| async move {
    sqlx::query("INSERT INTO users ...").execute(&mut **tx).await?;
    sqlx::query("INSERT INTO profiles ...").execute(&mut **tx).await?;
    Ok(user_id)
}).await?;
// Automatically commits on success, rolls back on error
```

---

### db::pagination

**Purpose:** Consistent pagination across list endpoints.

**Public API:**

```rust
pub struct PaginationQuery { pub page: i64, pub page_size: i64 }
pub struct NormalizedPagination { pub page: i64, pub page_size: i64, pub offset: i64 }
pub struct Paginated<T> { pub items: Vec<T>, pub total: i64, ... }

impl PaginationQuery {
    pub fn normalize(&self) -> NormalizedPagination;
}

impl<T> Paginated<T> {
    pub fn new(items: Vec<T>, total: i64, pagination: &NormalizedPagination) -> Self;
    pub fn empty(pagination: &NormalizedPagination) -> Self;
    pub fn map<U, F>(self, f: F) -> Paginated<U>;
}

// Cursor-based pagination
pub struct CursorQuery { pub cursor: Option<String>, pub limit: i64, ... }
pub struct CursorPaginated<T> { pub items: Vec<T>, pub next_cursor: Option<String>, ... }
```

**Usage:**

```rust
use crate::shared::db::pagination::{PaginationQuery, Paginated};

async fn list_handler(Query(query): Query<PaginationQuery>) -> impl IntoResponse {
    let pagination = query.normalize();
    
    let total = repo.count().await?;
    let items = repo.list(pagination.offset, pagination.page_size).await?;
    
    Json(Paginated::new(items, total, &pagination))
}
```

---

### audit

**Purpose:** Audit event logging for admin monitoring.

**Public API:**

```rust
pub enum AuditEventType {
    Login, Logout, UserCreated, ResourceCreated, AdminAction, ...
}

pub struct AuditEvent {
    pub fn new(event_type: AuditEventType, action: impl Into<String>) -> Self;
    pub fn with_user(self, user_id: Uuid) -> Self;
    pub fn with_resource(self, resource_type: &str, resource_id: Uuid) -> Self;
    pub fn with_metadata(self, key: &str, value: impl Serialize) -> Self;
    pub fn with_ip(self, ip: &str) -> Self;
}

pub trait AuditSink: Send + Sync {
    fn record(&self, event: AuditEvent) -> impl Future<Output = Result<(), AppError>>;
}

pub struct PostgresAuditSink { ... }
pub struct LoggingAuditSink;
pub struct NoOpAuditSink;
```

**Usage:**

```rust
use crate::shared::audit::{AuditEvent, AuditEventType, PostgresAuditSink, AuditSink};

let event = AuditEvent::new(AuditEventType::ResourceCreated, "Created track")
    .with_user(user_id)
    .with_resource("track", track_id)
    .with_metadata("track_name", "My Track");

sink.record(event).await?;
```

---

## Test Coverage

All modules include unit tests covering:
- Normal operation cases
- Edge cases (empty strings, None values, etc.)
- Error cases (invalid inputs, missing data)
- Negative cases (unauthorized, forbidden, etc.)

Run tests with:
```bash
cd app/backend && cargo test
```

---

## Integration with Feature Routes

Feature routes should use these shared modules to:

1. **Extract auth** using `Auth` extractor
2. **Validate input** using `Validator`
3. **Handle errors** using `ApiError`
4. **Return responses** using response helpers
5. **Paginate lists** using pagination helpers
6. **Use typed IDs** for entity references
7. **Wrap transactions** for multi-step operations
8. **Log audit events** for important actions

---

## References

- [BACKEND_SUBMODS_LAYOUT.md](./BACKEND_SUBMODS_LAYOUT.md) - Backend structure
- [ERROR_AND_VALIDATION_STANDARD.md](./ERROR_AND_VALIDATION_STANDARD.md) - Error standards
- [DECISIONS.md](./DECISIONS.md) - Security decisions (DEC-002, DEC-004)

