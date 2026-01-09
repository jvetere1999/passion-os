//! Central Error Mapping
//!
//! Provides standardized error responses and error type mappings.

use axum::{
    http::StatusCode,
    response::{IntoResponse, Response},
    Json,
};
use serde::Serialize;

use crate::error::AppError;

/// Standard error response body
#[derive(Debug, Clone, Serialize)]
pub struct ApiError {
    /// Error type code (e.g., "not_found", "validation_error")
    pub error: String,
    /// Human-readable error message
    pub message: String,
    /// Optional error code for client handling
    #[serde(skip_serializing_if = "Option::is_none")]
    pub code: Option<String>,
    /// Optional field-level errors for validation
    #[serde(skip_serializing_if = "Option::is_none")]
    pub fields: Option<Vec<FieldError>>,
}

/// Field-level validation error
#[derive(Debug, Clone, Serialize)]
pub struct FieldError {
    /// Field name (e.g., "email", "name")
    pub field: String,
    /// Error message for this field
    pub message: String,
    /// Optional error code
    #[serde(skip_serializing_if = "Option::is_none")]
    pub code: Option<String>,
}

impl ApiError {
    /// Create a simple error with type and message
    pub fn new(error: impl Into<String>, message: impl Into<String>) -> Self {
        Self {
            error: error.into(),
            message: message.into(),
            code: None,
            fields: None,
        }
    }

    /// Create a not found error
    pub fn not_found(resource: &str) -> Self {
        Self::new("not_found", format!("{} not found", resource))
    }

    /// Create a validation error
    pub fn validation(message: impl Into<String>) -> Self {
        Self::new("validation_error", message)
    }

    /// Create a validation error with field errors
    pub fn validation_fields(fields: Vec<FieldError>) -> Self {
        Self {
            error: "validation_error".to_string(),
            message: "Validation failed".to_string(),
            code: None,
            fields: Some(fields),
        }
    }

    /// Create an unauthorized error
    pub fn unauthorized() -> Self {
        Self::new("unauthorized", "Authentication required")
    }

    /// Create a forbidden error
    pub fn forbidden() -> Self {
        Self::new("forbidden", "Access denied")
    }

    /// Create an internal error
    pub fn internal() -> Self {
        Self::new("internal_error", "Internal server error")
    }

    /// Add error code
    pub fn with_code(mut self, code: impl Into<String>) -> Self {
        self.code = Some(code.into());
        self
    }
}

impl IntoResponse for ApiError {
    fn into_response(self) -> Response {
        let status = match self.error.as_str() {
            "not_found" => StatusCode::NOT_FOUND,
            "validation_error" => StatusCode::UNPROCESSABLE_ENTITY,
            "unauthorized" => StatusCode::UNAUTHORIZED,
            "forbidden" | "csrf_violation" | "invalid_origin" => StatusCode::FORBIDDEN,
            "bad_request" => StatusCode::BAD_REQUEST,
            _ => StatusCode::INTERNAL_SERVER_ERROR,
        };

        (status, Json(self)).into_response()
    }
}

impl From<AppError> for ApiError {
    fn from(err: AppError) -> Self {
        match err {
            AppError::NotFound(msg) => Self::not_found(&msg),
            AppError::Unauthorized => Self::unauthorized(),
            AppError::Forbidden => Self::forbidden(),
            AppError::CsrfViolation => Self::new("csrf_violation", "CSRF validation failed"),
            AppError::InvalidOrigin => Self::new("invalid_origin", "Invalid origin"),
            AppError::BadRequest(msg) => Self::new("bad_request", msg),
            AppError::Validation(msg) => Self::validation(msg),
            AppError::OAuthError(msg) => Self::new("oauth_error", msg),
            AppError::SessionExpired => Self::new("session_expired", "Session has expired"),
            AppError::Database(_) => Self::internal(),
            AppError::Internal(_) => Self::internal(),
            AppError::Config(_) => Self::internal(),
        }
    }
}

/// Result type for API handlers using ApiError
pub type ApiResult<T> = Result<T, ApiError>;

/// Helper trait to map errors to API errors
pub trait IntoApiError<T> {
    /// Convert to ApiResult
    fn into_api_error(self) -> ApiResult<T>;

    /// Map to not found error
    fn or_not_found(self, resource: &str) -> ApiResult<T>;
}

impl<T, E: Into<AppError>> IntoApiError<T> for Result<T, E> {
    fn into_api_error(self) -> ApiResult<T> {
        self.map_err(|e| ApiError::from(e.into()))
    }

    fn or_not_found(self, resource: &str) -> ApiResult<T> {
        self.map_err(|_| ApiError::not_found(resource))
    }
}

impl<T> IntoApiError<T> for Option<T> {
    fn into_api_error(self) -> ApiResult<T> {
        self.ok_or_else(ApiError::internal)
    }

    fn or_not_found(self, resource: &str) -> ApiResult<T> {
        self.ok_or_else(|| ApiError::not_found(resource))
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_api_error_new() {
        let err = ApiError::new("test_error", "Test message");
        assert_eq!(err.error, "test_error");
        assert_eq!(err.message, "Test message");
        assert!(err.code.is_none());
        assert!(err.fields.is_none());
    }

    #[test]
    fn test_api_error_not_found() {
        let err = ApiError::not_found("User");
        assert_eq!(err.error, "not_found");
        assert_eq!(err.message, "User not found");
    }

    #[test]
    fn test_api_error_validation_fields() {
        let fields = vec![FieldError {
            field: "email".to_string(),
            message: "Invalid email".to_string(),
            code: None,
        }];
        let err = ApiError::validation_fields(fields);
        assert_eq!(err.error, "validation_error");
        assert!(err.fields.is_some());
        assert_eq!(err.fields.as_ref().unwrap().len(), 1);
    }

    #[test]
    fn test_api_error_with_code() {
        let err = ApiError::unauthorized().with_code("TOKEN_EXPIRED");
        assert_eq!(err.code, Some("TOKEN_EXPIRED".to_string()));
    }

    #[test]
    fn test_from_app_error() {
        let app_err = AppError::NotFound("Resource".to_string());
        let api_err: ApiError = app_err.into();
        assert_eq!(api_err.error, "not_found");
    }

    #[test]
    fn test_option_or_not_found() {
        let some: Option<i32> = Some(42);
        assert!(some.or_not_found("Number").is_ok());

        let none: Option<i32> = None;
        let err = none.or_not_found("Number").unwrap_err();
        assert_eq!(err.error, "not_found");
        assert_eq!(err.message, "Number not found");
    }
}
