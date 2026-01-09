//! Shared modules for backend feature routes
//!
//! These modules provide reusable patterns for:
//! - Authentication extraction and guards
//! - CSRF and Origin verification
//! - RBAC authorization
//! - HTTP response/error helpers
//! - Validation utilities
//! - Typed IDs
//! - Database transactions and pagination
//! - Audit logging

pub mod audit;
pub mod auth;
pub mod db;
pub mod http;
pub mod ids;
