//! Pagination Utilities
//!
//! Provides helpers for consistent pagination across all list endpoints.

use axum::extract::Query;
use serde::{Deserialize, Serialize};

/// Default page size
pub const DEFAULT_PAGE_SIZE: i64 = 20;

/// Maximum page size
pub const MAX_PAGE_SIZE: i64 = 100;

/// Pagination query parameters
#[derive(Debug, Clone, Deserialize)]
pub struct PaginationQuery {
    /// Page number (1-indexed)
    #[serde(default = "default_page")]
    pub page: i64,
    /// Items per page
    #[serde(default = "default_page_size")]
    pub page_size: i64,
}

fn default_page() -> i64 {
    1
}

fn default_page_size() -> i64 {
    DEFAULT_PAGE_SIZE
}

impl Default for PaginationQuery {
    fn default() -> Self {
        Self {
            page: 1,
            page_size: DEFAULT_PAGE_SIZE,
        }
    }
}

impl PaginationQuery {
    /// Normalize pagination values
    pub fn normalize(&self) -> NormalizedPagination {
        let page = self.page.max(1);
        let page_size = self.page_size.clamp(1, MAX_PAGE_SIZE);
        let offset = (page - 1) * page_size;

        NormalizedPagination {
            page,
            page_size,
            offset,
        }
    }
}

/// Normalized pagination values ready for database queries
#[derive(Debug, Clone, Copy)]
pub struct NormalizedPagination {
    /// Page number (1-indexed, always >= 1)
    pub page: i64,
    /// Items per page (always 1-100)
    pub page_size: i64,
    /// Offset for LIMIT/OFFSET queries
    pub offset: i64,
}

impl NormalizedPagination {
    /// Create from explicit values
    pub fn new(page: i64, page_size: i64) -> Self {
        let page = page.max(1);
        let page_size = page_size.clamp(1, MAX_PAGE_SIZE);
        let offset = (page - 1) * page_size;
        Self {
            page,
            page_size,
            offset,
        }
    }
}

/// Paginated result
#[derive(Debug, Clone, Serialize)]
pub struct Paginated<T> {
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

impl<T> Paginated<T> {
    /// Create a new paginated result
    pub fn new(items: Vec<T>, total: i64, pagination: &NormalizedPagination) -> Self {
        let total_pages = if pagination.page_size > 0 {
            (total as f64 / pagination.page_size as f64).ceil() as i64
        } else {
            0
        };

        Self {
            items,
            total,
            page: pagination.page,
            page_size: pagination.page_size,
            total_pages,
            has_next: pagination.page < total_pages,
            has_previous: pagination.page > 1,
        }
    }

    /// Create an empty paginated result
    pub fn empty(pagination: &NormalizedPagination) -> Self {
        Self {
            items: vec![],
            total: 0,
            page: pagination.page,
            page_size: pagination.page_size,
            total_pages: 0,
            has_next: false,
            has_previous: false,
        }
    }

    /// Map items to a different type
    pub fn map<U, F>(self, f: F) -> Paginated<U>
    where
        F: FnMut(T) -> U,
    {
        Paginated {
            items: self.items.into_iter().map(f).collect(),
            total: self.total,
            page: self.page,
            page_size: self.page_size,
            total_pages: self.total_pages,
            has_next: self.has_next,
            has_previous: self.has_previous,
        }
    }
}

/// Cursor-based pagination query
#[derive(Debug, Clone, Deserialize)]
pub struct CursorQuery {
    /// Cursor for pagination (typically an ID or timestamp)
    pub cursor: Option<String>,
    /// Number of items to fetch
    #[serde(default = "default_page_size")]
    pub limit: i64,
    /// Direction: "next" or "prev"
    #[serde(default = "default_direction")]
    pub direction: String,
}

fn default_direction() -> String {
    "next".to_string()
}

impl CursorQuery {
    /// Normalize cursor query
    pub fn normalize(&self) -> NormalizedCursor {
        let limit = self.limit.clamp(1, MAX_PAGE_SIZE);
        let direction = if self.direction == "prev" {
            CursorDirection::Previous
        } else {
            CursorDirection::Next
        };

        NormalizedCursor {
            cursor: self.cursor.clone(),
            limit,
            direction,
        }
    }
}

/// Cursor direction
#[derive(Debug, Clone, Copy, PartialEq, Eq)]
pub enum CursorDirection {
    Next,
    Previous,
}

/// Normalized cursor pagination
#[derive(Debug, Clone)]
pub struct NormalizedCursor {
    /// Cursor value (if any)
    pub cursor: Option<String>,
    /// Items to fetch
    pub limit: i64,
    /// Direction
    pub direction: CursorDirection,
}

/// Cursor-based paginated result
#[derive(Debug, Clone, Serialize)]
pub struct CursorPaginated<T> {
    /// Items
    pub items: Vec<T>,
    /// Next cursor (if more items available)
    #[serde(skip_serializing_if = "Option::is_none")]
    pub next_cursor: Option<String>,
    /// Previous cursor (if not at start)
    #[serde(skip_serializing_if = "Option::is_none")]
    pub prev_cursor: Option<String>,
    /// Has more items in current direction
    pub has_more: bool,
}

impl<T> CursorPaginated<T> {
    /// Create new cursor-paginated result
    pub fn new(items: Vec<T>, next_cursor: Option<String>, prev_cursor: Option<String>) -> Self {
        let has_more = next_cursor.is_some();
        Self {
            items,
            next_cursor,
            prev_cursor,
            has_more,
        }
    }
}

/// Extract and normalize pagination from query
pub fn extract_pagination(Query(query): Query<PaginationQuery>) -> NormalizedPagination {
    query.normalize()
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_pagination_query_default() {
        let query = PaginationQuery::default();
        assert_eq!(query.page, 1);
        assert_eq!(query.page_size, DEFAULT_PAGE_SIZE);
    }

    #[test]
    fn test_pagination_normalize() {
        let query = PaginationQuery {
            page: 3,
            page_size: 25,
        };
        let norm = query.normalize();
        assert_eq!(norm.page, 3);
        assert_eq!(norm.page_size, 25);
        assert_eq!(norm.offset, 50);
    }

    #[test]
    fn test_pagination_normalize_negative() {
        let query = PaginationQuery {
            page: -1,
            page_size: 10,
        };
        let norm = query.normalize();
        assert_eq!(norm.page, 1);
        assert_eq!(norm.offset, 0);
    }

    #[test]
    fn test_pagination_normalize_too_large() {
        let query = PaginationQuery {
            page: 1,
            page_size: 500,
        };
        let norm = query.normalize();
        assert_eq!(norm.page_size, MAX_PAGE_SIZE);
    }

    #[test]
    fn test_paginated_new() {
        let items = vec![1, 2, 3];
        let pagination = NormalizedPagination::new(1, 10);
        let result = Paginated::new(items, 25, &pagination);

        assert_eq!(result.items.len(), 3);
        assert_eq!(result.total, 25);
        assert_eq!(result.page, 1);
        assert_eq!(result.total_pages, 3);
        assert!(result.has_next);
        assert!(!result.has_previous);
    }

    #[test]
    fn test_paginated_last_page() {
        let items = vec![1, 2];
        let pagination = NormalizedPagination::new(3, 10);
        let result = Paginated::new(items, 25, &pagination);

        assert!(!result.has_next);
        assert!(result.has_previous);
    }

    #[test]
    fn test_paginated_empty() {
        let pagination = NormalizedPagination::new(1, 10);
        let result: Paginated<i32> = Paginated::empty(&pagination);

        assert!(result.items.is_empty());
        assert_eq!(result.total, 0);
        assert!(!result.has_next);
        assert!(!result.has_previous);
    }

    #[test]
    fn test_paginated_map() {
        let items = vec![1, 2, 3];
        let pagination = NormalizedPagination::new(1, 10);
        let result = Paginated::new(items, 3, &pagination);
        let mapped = result.map(|x| x * 2);

        assert_eq!(mapped.items, vec![2, 4, 6]);
    }

    #[test]
    fn test_cursor_query_normalize() {
        let query = CursorQuery {
            cursor: Some("abc123".to_string()),
            limit: 50,
            direction: "next".to_string(),
        };
        let norm = query.normalize();

        assert_eq!(norm.cursor, Some("abc123".to_string()));
        assert_eq!(norm.limit, 50);
        assert_eq!(norm.direction, CursorDirection::Next);
    }

    #[test]
    fn test_cursor_query_previous() {
        let query = CursorQuery {
            cursor: None,
            limit: 20,
            direction: "prev".to_string(),
        };
        let norm = query.normalize();

        assert_eq!(norm.direction, CursorDirection::Previous);
    }
}
