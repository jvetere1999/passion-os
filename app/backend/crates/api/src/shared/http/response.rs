//! Response Helpers
//!
//! Standardized response types and helpers for consistent API responses.

use axum::{
    http::StatusCode,
    response::{IntoResponse, Response},
    Json,
};
use serde::Serialize;

/// Standard success response wrapper
#[derive(Debug, Clone, Serialize)]
pub struct ApiResponse<T: Serialize> {
    /// Success flag
    pub success: bool,
    /// Response data
    pub data: T,
}

impl<T: Serialize> ApiResponse<T> {
    /// Create a success response
    pub fn ok(data: T) -> Self {
        Self {
            success: true,
            data,
        }
    }
}

impl<T: Serialize> IntoResponse for ApiResponse<T> {
    fn into_response(self) -> Response {
        (StatusCode::OK, Json(self)).into_response()
    }
}

/// Paginated response wrapper
#[derive(Debug, Clone, Serialize)]
pub struct PaginatedResponse<T: Serialize> {
    /// Items in this page
    pub items: Vec<T>,
    /// Total count across all pages
    pub total: i64,
    /// Current page (1-indexed)
    pub page: i64,
    /// Items per page
    pub page_size: i64,
    /// Total number of pages
    pub total_pages: i64,
    /// Has next page
    pub has_next: bool,
    /// Has previous page
    pub has_previous: bool,
}

impl<T: Serialize> PaginatedResponse<T> {
    /// Create a new paginated response
    pub fn new(items: Vec<T>, total: i64, page: i64, page_size: i64) -> Self {
        let total_pages = (total as f64 / page_size as f64).ceil() as i64;
        Self {
            items,
            total,
            page,
            page_size,
            total_pages,
            has_next: page < total_pages,
            has_previous: page > 1,
        }
    }

    /// Create an empty paginated response
    pub fn empty(page_size: i64) -> Self {
        Self {
            items: vec![],
            total: 0,
            page: 1,
            page_size,
            total_pages: 0,
            has_next: false,
            has_previous: false,
        }
    }
}

impl<T: Serialize> IntoResponse for PaginatedResponse<T> {
    fn into_response(self) -> Response {
        (StatusCode::OK, Json(self)).into_response()
    }
}

/// Created response (201)
#[derive(Debug, Clone, Serialize)]
pub struct Created<T: Serialize> {
    /// Created resource
    pub data: T,
}

impl<T: Serialize> Created<T> {
    /// Create a new created response
    pub fn new(data: T) -> Self {
        Self { data }
    }
}

impl<T: Serialize> IntoResponse for Created<T> {
    fn into_response(self) -> Response {
        (StatusCode::CREATED, Json(self)).into_response()
    }
}

/// No content response (204)
pub struct NoContent;

impl IntoResponse for NoContent {
    fn into_response(self) -> Response {
        StatusCode::NO_CONTENT.into_response()
    }
}

/// Delete response
#[derive(Debug, Clone, Serialize)]
pub struct Deleted {
    /// Deleted flag
    pub deleted: bool,
    /// Optional message
    #[serde(skip_serializing_if = "Option::is_none")]
    pub message: Option<String>,
}

impl Deleted {
    /// Create a deleted response
    pub fn ok() -> Self {
        Self {
            deleted: true,
            message: None,
        }
    }

    /// Create a deleted response with message
    pub fn with_message(message: impl Into<String>) -> Self {
        Self {
            deleted: true,
            message: Some(message.into()),
        }
    }
}

impl IntoResponse for Deleted {
    fn into_response(self) -> Response {
        (StatusCode::OK, Json(self)).into_response()
    }
}

/// Helper function for 200 OK JSON response
pub fn ok<T: Serialize>(data: T) -> impl IntoResponse {
    (StatusCode::OK, Json(data))
}

/// Helper function for 201 Created JSON response
pub fn created<T: Serialize>(data: T) -> impl IntoResponse {
    (StatusCode::CREATED, Json(data))
}

/// Helper function for 204 No Content response
pub fn no_content() -> impl IntoResponse {
    StatusCode::NO_CONTENT
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_api_response_ok() {
        let response = ApiResponse::ok("test");
        assert!(response.success);
        assert_eq!(response.data, "test");
    }

    #[test]
    fn test_paginated_response_new() {
        let items = vec![1, 2, 3];
        let response = PaginatedResponse::new(items, 10, 1, 3);

        assert_eq!(response.items.len(), 3);
        assert_eq!(response.total, 10);
        assert_eq!(response.page, 1);
        assert_eq!(response.page_size, 3);
        assert_eq!(response.total_pages, 4);
        assert!(response.has_next);
        assert!(!response.has_previous);
    }

    #[test]
    fn test_paginated_response_last_page() {
        let items = vec![1];
        let response = PaginatedResponse::new(items, 10, 4, 3);

        assert!(!response.has_next);
        assert!(response.has_previous);
    }

    #[test]
    fn test_paginated_response_empty() {
        let response: PaginatedResponse<i32> = PaginatedResponse::empty(10);

        assert!(response.items.is_empty());
        assert_eq!(response.total, 0);
        assert_eq!(response.total_pages, 0);
        assert!(!response.has_next);
        assert!(!response.has_previous);
    }

    #[test]
    fn test_created_response() {
        #[derive(Serialize)]
        struct User {
            id: i32,
        }

        let created = Created::new(User { id: 1 });
        assert_eq!(created.data.id, 1);
    }

    #[test]
    fn test_deleted_response() {
        let deleted = Deleted::ok();
        assert!(deleted.deleted);
        assert!(deleted.message.is_none());

        let deleted_with_msg = Deleted::with_message("Successfully deleted");
        assert!(deleted_with_msg.deleted);
        assert_eq!(
            deleted_with_msg.message,
            Some("Successfully deleted".to_string())
        );
    }
}
