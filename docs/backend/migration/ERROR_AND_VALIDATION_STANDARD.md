"Error and validation standard for the backend API."

# Error and Validation Standard

**Date:** January 7, 2026  
**Branch:** `refactor/stack-split`  
**Purpose:** Define canonical error types, HTTP mapping, response envelope, and validation approach

---

## Overview

This document defines:
1. Backend error types (Rust)
2. HTTP status code mapping
3. Response envelope format
4. Input validation approach
5. Error messages and codes

---

## Error Type Hierarchy

### Rust Error Enum (`error.rs`)

```rust
use axum::{
    http::StatusCode,
    response::{IntoResponse, Response},
    Json,
};
use serde::Serialize;

/// Canonical application error type
#[derive(Debug, Clone)]
pub enum AppError {
    // ============================================================
    // Authentication Errors (401)
    // ============================================================
    
    /// No valid session token provided
    Unauthenticated,
    
    /// Session token expired
    SessionExpired,
    
    /// OAuth flow failed
    OAuthError(String),
    
    // ============================================================
    // Authorization Errors (403)
    // ============================================================
    
    /// User lacks required role
    Forbidden,
    
    /// CSRF validation failed
    CsrfViolation,
    
    /// Origin not in allowlist
    InvalidOrigin,
    
    // ============================================================
    // Resource Errors (404)
    // ============================================================
    
    /// Requested resource not found
    NotFound,
    
    /// Resource not found with details
    ResourceNotFound { resource: String, id: String },
    
    // ============================================================
    // Validation Errors (400)
    // ============================================================
    
    /// Input validation failed
    ValidationError(Vec<ValidationError>),
    
    /// Single field validation error
    InvalidField { field: String, message: String },
    
    /// Request body parsing failed
    InvalidBody(String),
    
    /// Missing required field
    MissingField(String),
    
    // ============================================================
    // Conflict Errors (409)
    // ============================================================
    
    /// Resource already exists
    Conflict(String),
    
    /// Unique constraint violated
    DuplicateEntry { field: String, value: String },
    
    // ============================================================
    // Rate Limiting (429)
    // ============================================================
    
    /// Too many requests
    RateLimited { retry_after: u64 },
    
    // ============================================================
    // Storage Errors (400/413/415)
    // ============================================================
    
    /// File too large
    FileTooLarge { max_bytes: u64, actual_bytes: u64 },
    
    /// Invalid MIME type
    InvalidMimeType { provided: String, allowed: Vec<String> },
    
    /// Storage operation failed
    StorageError(String),
    
    // ============================================================
    // Database Errors (500)
    // ============================================================
    
    /// Database query failed
    DatabaseError(String),
    
    /// Transaction failed
    TransactionError(String),
    
    // ============================================================
    // Internal Errors (500)
    // ============================================================
    
    /// Unexpected internal error
    InternalError(String),
    
    /// Configuration error
    ConfigError(String),
    
    /// External service error
    ExternalServiceError { service: String, message: String },
}

#[derive(Debug, Clone, Serialize)]
pub struct ValidationError {
    pub field: String,
    pub code: String,
    pub message: String,
}
```

---

## HTTP Status Code Mapping

| Error Variant | HTTP Status | Code Constant |
|---------------|-------------|---------------|
| `Unauthenticated` | 401 | `UNAUTHENTICATED` |
| `SessionExpired` | 401 | `SESSION_EXPIRED` |
| `OAuthError` | 401 | `OAUTH_ERROR` |
| `Forbidden` | 403 | `FORBIDDEN` |
| `CsrfViolation` | 403 | `CSRF_VIOLATION` |
| `InvalidOrigin` | 403 | `INVALID_ORIGIN` |
| `NotFound` | 404 | `NOT_FOUND` |
| `ResourceNotFound` | 404 | `RESOURCE_NOT_FOUND` |
| `ValidationError` | 400 | `VALIDATION_ERROR` |
| `InvalidField` | 400 | `INVALID_FIELD` |
| `InvalidBody` | 400 | `INVALID_BODY` |
| `MissingField` | 400 | `MISSING_FIELD` |
| `Conflict` | 409 | `CONFLICT` |
| `DuplicateEntry` | 409 | `DUPLICATE_ENTRY` |
| `RateLimited` | 429 | `RATE_LIMITED` |
| `FileTooLarge` | 413 | `FILE_TOO_LARGE` |
| `InvalidMimeType` | 415 | `INVALID_MIME_TYPE` |
| `StorageError` | 500 | `STORAGE_ERROR` |
| `DatabaseError` | 500 | `DATABASE_ERROR` |
| `TransactionError` | 500 | `TRANSACTION_ERROR` |
| `InternalError` | 500 | `INTERNAL_ERROR` |
| `ConfigError` | 500 | `CONFIG_ERROR` |
| `ExternalServiceError` | 502 | `EXTERNAL_SERVICE_ERROR` |

---

## Response Envelope

### Success Response

```json
{
  "data": { ... }
}
```

### Success Response (List)

```json
{
  "data": [ ... ],
  "meta": {
    "total": 100,
    "page": 1,
    "page_size": 20
  }
}
```

### Error Response

```json
{
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Input validation failed",
    "details": { ... }
  }
}
```

### Rust Types

```rust
#[derive(Serialize)]
pub struct SuccessResponse<T: Serialize> {
    pub data: T,
}

#[derive(Serialize)]
pub struct ListResponse<T: Serialize> {
    pub data: Vec<T>,
    pub meta: ListMeta,
}

#[derive(Serialize)]
pub struct ListMeta {
    pub total: i64,
    pub page: i32,
    pub page_size: i32,
}

#[derive(Serialize)]
pub struct ErrorResponse {
    pub error: ErrorBody,
}

#[derive(Serialize)]
pub struct ErrorBody {
    pub code: String,
    pub message: String,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub details: Option<serde_json::Value>,
}
```

---

## Error Response Examples

### Authentication Error (401)

```json
{
  "error": {
    "code": "UNAUTHENTICATED",
    "message": "Authentication required"
  }
}
```

### Forbidden Error (403)

```json
{
  "error": {
    "code": "FORBIDDEN",
    "message": "Admin role required"
  }
}
```

### Not Found Error (404)

```json
{
  "error": {
    "code": "RESOURCE_NOT_FOUND",
    "message": "Focus session not found",
    "details": {
      "resource": "focus_session",
      "id": "abc123"
    }
  }
}
```

### Validation Error (400)

```json
{
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Input validation failed",
    "details": {
      "errors": [
        {
          "field": "duration_seconds",
          "code": "range",
          "message": "Duration must be between 60 and 7200 seconds"
        },
        {
          "field": "mode",
          "code": "enum",
          "message": "Mode must be one of: deep, light, pomodoro"
        }
      ]
    }
  }
}
```

### File Too Large Error (413)

```json
{
  "error": {
    "code": "FILE_TOO_LARGE",
    "message": "File exceeds maximum size",
    "details": {
      "max_bytes": 52428800,
      "actual_bytes": 75000000
    }
  }
}
```

### Rate Limited Error (429)

```json
{
  "error": {
    "code": "RATE_LIMITED",
    "message": "Too many requests",
    "details": {
      "retry_after": 60
    }
  }
}
```

---

## IntoResponse Implementation

```rust
impl IntoResponse for AppError {
    fn into_response(self) -> Response {
        let (status, code, message, details) = match &self {
            // Authentication
            AppError::Unauthenticated => (
                StatusCode::UNAUTHORIZED,
                "UNAUTHENTICATED",
                "Authentication required".to_string(),
                None,
            ),
            AppError::SessionExpired => (
                StatusCode::UNAUTHORIZED,
                "SESSION_EXPIRED",
                "Session has expired".to_string(),
                None,
            ),
            AppError::OAuthError(msg) => (
                StatusCode::UNAUTHORIZED,
                "OAUTH_ERROR",
                msg.clone(),
                None,
            ),
            
            // Authorization
            AppError::Forbidden => (
                StatusCode::FORBIDDEN,
                "FORBIDDEN",
                "Access denied".to_string(),
                None,
            ),
            AppError::CsrfViolation => (
                StatusCode::FORBIDDEN,
                "CSRF_VIOLATION",
                "CSRF validation failed".to_string(),
                None,
            ),
            AppError::InvalidOrigin => (
                StatusCode::FORBIDDEN,
                "INVALID_ORIGIN",
                "Origin not allowed".to_string(),
                None,
            ),
            
            // Not Found
            AppError::NotFound => (
                StatusCode::NOT_FOUND,
                "NOT_FOUND",
                "Resource not found".to_string(),
                None,
            ),
            AppError::ResourceNotFound { resource, id } => (
                StatusCode::NOT_FOUND,
                "RESOURCE_NOT_FOUND",
                format!("{} not found", resource),
                Some(json!({ "resource": resource, "id": id })),
            ),
            
            // Validation
            AppError::ValidationError(errors) => (
                StatusCode::BAD_REQUEST,
                "VALIDATION_ERROR",
                "Input validation failed".to_string(),
                Some(json!({ "errors": errors })),
            ),
            AppError::InvalidField { field, message } => (
                StatusCode::BAD_REQUEST,
                "INVALID_FIELD",
                message.clone(),
                Some(json!({ "field": field })),
            ),
            AppError::InvalidBody(msg) => (
                StatusCode::BAD_REQUEST,
                "INVALID_BODY",
                msg.clone(),
                None,
            ),
            AppError::MissingField(field) => (
                StatusCode::BAD_REQUEST,
                "MISSING_FIELD",
                format!("Missing required field: {}", field),
                Some(json!({ "field": field })),
            ),
            
            // Conflict
            AppError::Conflict(msg) => (
                StatusCode::CONFLICT,
                "CONFLICT",
                msg.clone(),
                None,
            ),
            AppError::DuplicateEntry { field, value } => (
                StatusCode::CONFLICT,
                "DUPLICATE_ENTRY",
                format!("{} already exists", field),
                Some(json!({ "field": field, "value": value })),
            ),
            
            // Rate Limiting
            AppError::RateLimited { retry_after } => (
                StatusCode::TOO_MANY_REQUESTS,
                "RATE_LIMITED",
                "Too many requests".to_string(),
                Some(json!({ "retry_after": retry_after })),
            ),
            
            // Storage
            AppError::FileTooLarge { max_bytes, actual_bytes } => (
                StatusCode::PAYLOAD_TOO_LARGE,
                "FILE_TOO_LARGE",
                "File exceeds maximum size".to_string(),
                Some(json!({ "max_bytes": max_bytes, "actual_bytes": actual_bytes })),
            ),
            AppError::InvalidMimeType { provided, allowed } => (
                StatusCode::UNSUPPORTED_MEDIA_TYPE,
                "INVALID_MIME_TYPE",
                format!("MIME type {} not allowed", provided),
                Some(json!({ "provided": provided, "allowed": allowed })),
            ),
            AppError::StorageError(msg) => (
                StatusCode::INTERNAL_SERVER_ERROR,
                "STORAGE_ERROR",
                msg.clone(),
                None,
            ),
            
            // Database
            AppError::DatabaseError(_) => (
                StatusCode::INTERNAL_SERVER_ERROR,
                "DATABASE_ERROR",
                "Database operation failed".to_string(),
                None, // Don't expose internal details
            ),
            AppError::TransactionError(_) => (
                StatusCode::INTERNAL_SERVER_ERROR,
                "TRANSACTION_ERROR",
                "Transaction failed".to_string(),
                None,
            ),
            
            // Internal
            AppError::InternalError(_) => (
                StatusCode::INTERNAL_SERVER_ERROR,
                "INTERNAL_ERROR",
                "An internal error occurred".to_string(),
                None, // Don't expose internal details
            ),
            AppError::ConfigError(_) => (
                StatusCode::INTERNAL_SERVER_ERROR,
                "CONFIG_ERROR",
                "Configuration error".to_string(),
                None,
            ),
            AppError::ExternalServiceError { service, .. } => (
                StatusCode::BAD_GATEWAY,
                "EXTERNAL_SERVICE_ERROR",
                format!("External service {} unavailable", service),
                None,
            ),
        };

        let body = ErrorResponse {
            error: ErrorBody {
                code: code.to_string(),
                message,
                details,
            },
        };

        (status, Json(body)).into_response()
    }
}
```

---

## Validation Approach

### Location

Validators live in `src/validation/`:

```
validation/
├── mod.rs          # Re-exports
├── schemas.rs      # Validation schemas per domain
└── sanitize.rs     # Input sanitization
```

### Validation Library

Use `validator` crate with custom derive:

```rust
use validator::{Validate, ValidationError};
use serde::Deserialize;

#[derive(Deserialize, Validate)]
pub struct CreateFocusSessionRequest {
    #[validate(custom = "validate_focus_mode")]
    pub mode: String,
    
    #[validate(range(min = 60, max = 7200))]
    pub duration_seconds: i32,
}

fn validate_focus_mode(mode: &str) -> Result<(), ValidationError> {
    match mode {
        "deep" | "light" | "pomodoro" => Ok(()),
        _ => Err(ValidationError::new("invalid_mode")),
    }
}
```

### Validation Middleware

Apply validation in route handlers:

```rust
use axum::{extract::Json, response::IntoResponse};
use validator::Validate;

pub async fn create_session(
    Json(payload): Json<CreateFocusSessionRequest>,
) -> Result<impl IntoResponse, AppError> {
    // Validate input
    payload.validate()
        .map_err(|e| AppError::ValidationError(convert_validator_errors(e)))?;
    
    // Process request...
}

fn convert_validator_errors(errors: validator::ValidationErrors) -> Vec<ValidationError> {
    errors
        .field_errors()
        .into_iter()
        .flat_map(|(field, errs)| {
            errs.iter().map(move |e| ValidationError {
                field: field.to_string(),
                code: e.code.to_string(),
                message: e.message.clone().unwrap_or_default().to_string(),
            })
        })
        .collect()
}
```

---

## Validation Schemas by Domain

### Focus Sessions

```rust
// validation/schemas.rs

#[derive(Deserialize, Validate)]
pub struct CreateFocusSessionRequest {
    #[validate(custom = "validate_focus_mode")]
    pub mode: String,
    
    #[validate(range(min = 60, max = 7200))]
    pub duration_seconds: i32,
}

#[derive(Deserialize, Validate)]
pub struct CompleteFocusRequest {
    #[validate(range(min = 0))]
    pub actual_seconds: Option<i32>,
}
```

### Habits

```rust
#[derive(Deserialize, Validate)]
pub struct CreateHabitRequest {
    #[validate(length(min = 1, max = 100))]
    pub name: String,
    
    #[validate(custom = "validate_frequency")]
    pub frequency: String,
}
```

### Goals

```rust
#[derive(Deserialize, Validate)]
pub struct CreateGoalRequest {
    #[validate(length(min = 1, max = 200))]
    pub title: String,
    
    #[validate(length(max = 1000))]
    pub description: Option<String>,
    
    pub target_date: Option<String>, // Validated as ISO date
}
```

### Storage

```rust
#[derive(Deserialize, Validate)]
pub struct UploadRequest {
    #[validate(length(min = 1, max = 255))]
    pub filename: String,
    
    #[validate(custom = "validate_mime_type")]
    pub mime_type: String,
    
    #[validate(range(min = 1, max = 104857600))] // 100MB
    pub size_bytes: u64,
}
```

---

## Input Sanitization

### Text Sanitization

```rust
// validation/sanitize.rs

/// Remove leading/trailing whitespace, normalize internal whitespace
pub fn sanitize_text(input: &str) -> String {
    input.split_whitespace().collect::<Vec<_>>().join(" ")
}

/// Limit string length safely (UTF-8 aware)
pub fn truncate(input: &str, max_len: usize) -> String {
    input.chars().take(max_len).collect()
}

/// Remove HTML tags
pub fn strip_html(input: &str) -> String {
    ammonia::clean(input)
}
```

### When to Sanitize

| Input Type | Sanitization | When |
|------------|--------------|------|
| User names | `sanitize_text` | Before validation |
| Descriptions | `strip_html`, `truncate` | Before storage |
| IDs | None (validated as UUID) | Validation only |
| Numbers | None | Validation only |
| Dates | None (parsed strictly) | Validation only |

---

## Error Logging

### Log Levels by Error Type

| Error Type | Log Level | Details Logged |
|------------|-----------|----------------|
| Validation errors | WARN | Field, code, request ID |
| Auth errors | INFO | User ID (if known), IP |
| Not Found | DEBUG | Resource type, ID |
| Rate Limited | INFO | User ID, endpoint |
| Database errors | ERROR | Full error, query (sanitized) |
| Internal errors | ERROR | Full stack trace |

### Example

```rust
impl AppError {
    pub fn log(&self, request_id: &str) {
        match self {
            AppError::DatabaseError(e) => {
                tracing::error!(
                    request_id = %request_id,
                    error = %e,
                    "Database error"
                );
            }
            AppError::ValidationError(errors) => {
                tracing::warn!(
                    request_id = %request_id,
                    errors = ?errors,
                    "Validation failed"
                );
            }
            // ... other variants
        }
    }
}
```

---

## TypeScript Error Types (Frontend)

```typescript
// shared/api-types/src/errors.ts

export interface ApiError {
  code: string;
  message: string;
  details?: unknown;
}

export interface ValidationErrorDetail {
  field: string;
  code: string;
  message: string;
}

export interface ApiErrorResponse {
  error: ApiError;
}

// Error codes enum for type safety
export const ErrorCodes = {
  UNAUTHENTICATED: 'UNAUTHENTICATED',
  SESSION_EXPIRED: 'SESSION_EXPIRED',
  FORBIDDEN: 'FORBIDDEN',
  CSRF_VIOLATION: 'CSRF_VIOLATION',
  NOT_FOUND: 'NOT_FOUND',
  RESOURCE_NOT_FOUND: 'RESOURCE_NOT_FOUND',
  VALIDATION_ERROR: 'VALIDATION_ERROR',
  INVALID_FIELD: 'INVALID_FIELD',
  RATE_LIMITED: 'RATE_LIMITED',
  FILE_TOO_LARGE: 'FILE_TOO_LARGE',
  INTERNAL_ERROR: 'INTERNAL_ERROR',
} as const;

export type ErrorCode = typeof ErrorCodes[keyof typeof ErrorCodes];
```

---

## Frontend Error Handling

```typescript
// shared/api-client/src/errors.ts

import type { ApiError, ErrorCode, ErrorCodes } from '@ignition/api-types';

export class ApiRequestError extends Error {
  constructor(
    public status: number,
    public error: ApiError
  ) {
    super(error.message);
    this.name = 'ApiRequestError';
  }

  get code(): string {
    return this.error.code;
  }

  get isAuthError(): boolean {
    return this.status === 401;
  }

  get isForbidden(): boolean {
    return this.status === 403;
  }

  get isValidationError(): boolean {
    return this.error.code === 'VALIDATION_ERROR';
  }

  get validationErrors(): ValidationErrorDetail[] {
    if (this.isValidationError && this.error.details) {
      return (this.error.details as { errors: ValidationErrorDetail[] }).errors;
    }
    return [];
  }
}
```

---

## Summary

| Aspect | Standard |
|--------|----------|
| Error enum | `AppError` in `error.rs` |
| HTTP mapping | Defined per variant |
| Success envelope | `{ "data": ... }` |
| Error envelope | `{ "error": { "code", "message", "details?" } }` |
| Validation crate | `validator` |
| Validation location | `src/validation/` |
| Log internal details | Never in response, always in logs |
| TypeScript types | `shared/api-types/src/errors.ts` |

---

## References

- [BACKEND_SUBMODS_LAYOUT.md](./BACKEND_SUBMODS_LAYOUT.md) - Where error.rs lives
- [SHARED_EXTRACTION_PLAN.md](./SHARED_EXTRACTION_PLAN.md) - TypeScript types
- [module_boundaries.md](./module_boundaries.md) - Error type placement

