//! Common Validators
//!
//! Reusable validation functions for request data.

use crate::shared::http::errors::{ApiError, FieldError};

/// Validation result
pub type ValidationResult = Result<(), Vec<FieldError>>;

/// Validator builder for fluent validation
pub struct Validator {
    errors: Vec<FieldError>,
}

impl Default for Validator {
    fn default() -> Self {
        Self::new()
    }
}

impl Validator {
    /// Create a new validator
    pub fn new() -> Self {
        Self { errors: vec![] }
    }

    /// Check if a string is not empty
    pub fn required(mut self, field: &str, value: &str) -> Self {
        if value.trim().is_empty() {
            self.errors.push(FieldError {
                field: field.to_string(),
                message: format!("{} is required", field),
                code: Some("required".to_string()),
            });
        }
        self
    }

    /// Check if an optional value is present
    pub fn required_option<T>(mut self, field: &str, value: &Option<T>) -> Self {
        if value.is_none() {
            self.errors.push(FieldError {
                field: field.to_string(),
                message: format!("{} is required", field),
                code: Some("required".to_string()),
            });
        }
        self
    }

    /// Check minimum length
    pub fn min_length(mut self, field: &str, value: &str, min: usize) -> Self {
        if value.len() < min {
            self.errors.push(FieldError {
                field: field.to_string(),
                message: format!("{} must be at least {} characters", field, min),
                code: Some("min_length".to_string()),
            });
        }
        self
    }

    /// Check maximum length
    pub fn max_length(mut self, field: &str, value: &str, max: usize) -> Self {
        if value.len() > max {
            self.errors.push(FieldError {
                field: field.to_string(),
                message: format!("{} must be at most {} characters", field, max),
                code: Some("max_length".to_string()),
            });
        }
        self
    }

    /// Check value is within range (inclusive)
    pub fn range<T: PartialOrd + std::fmt::Display>(
        mut self,
        field: &str,
        value: T,
        min: T,
        max: T,
    ) -> Self {
        if value < min || value > max {
            self.errors.push(FieldError {
                field: field.to_string(),
                message: format!("{} must be between {} and {}", field, min, max),
                code: Some("range".to_string()),
            });
        }
        self
    }

    /// Check minimum value
    pub fn min<T: PartialOrd + std::fmt::Display>(mut self, field: &str, value: T, min: T) -> Self {
        if value < min {
            self.errors.push(FieldError {
                field: field.to_string(),
                message: format!("{} must be at least {}", field, min),
                code: Some("min".to_string()),
            });
        }
        self
    }

    /// Check maximum value
    pub fn max<T: PartialOrd + std::fmt::Display>(mut self, field: &str, value: T, max: T) -> Self {
        if value > max {
            self.errors.push(FieldError {
                field: field.to_string(),
                message: format!("{} must be at most {}", field, max),
                code: Some("max".to_string()),
            });
        }
        self
    }

    /// Check email format (simple regex)
    pub fn email(mut self, field: &str, value: &str) -> Self {
        if !is_valid_email(value) {
            self.errors.push(FieldError {
                field: field.to_string(),
                message: "Invalid email format".to_string(),
                code: Some("email".to_string()),
            });
        }
        self
    }

    /// Check URL format
    pub fn url(mut self, field: &str, value: &str) -> Self {
        if url::Url::parse(value).is_err() {
            self.errors.push(FieldError {
                field: field.to_string(),
                message: "Invalid URL format".to_string(),
                code: Some("url".to_string()),
            });
        }
        self
    }

    /// Check UUID format
    pub fn uuid(mut self, field: &str, value: &str) -> Self {
        if uuid::Uuid::parse_str(value).is_err() {
            self.errors.push(FieldError {
                field: field.to_string(),
                message: "Invalid UUID format".to_string(),
                code: Some("uuid".to_string()),
            });
        }
        self
    }

    /// Check value is in allowed list
    pub fn one_of<T: PartialEq + std::fmt::Display>(
        mut self,
        field: &str,
        value: &T,
        allowed: &[T],
    ) -> Self {
        if !allowed.contains(value) {
            let allowed_str: Vec<String> = allowed.iter().map(|v| v.to_string()).collect();
            self.errors.push(FieldError {
                field: field.to_string(),
                message: format!("{} must be one of: {}", field, allowed_str.join(", ")),
                code: Some("one_of".to_string()),
            });
        }
        self
    }

    /// Add custom validation
    pub fn custom<F>(mut self, check: F) -> Self
    where
        F: FnOnce() -> Option<FieldError>,
    {
        if let Some(error) = check() {
            self.errors.push(error);
        }
        self
    }

    /// Finish validation and return result
    pub fn finish(self) -> Result<(), ApiError> {
        if self.errors.is_empty() {
            Ok(())
        } else {
            Err(ApiError::validation_fields(self.errors))
        }
    }

    /// Check if validation has errors
    pub fn has_errors(&self) -> bool {
        !self.errors.is_empty()
    }

    /// Get current errors
    pub fn errors(&self) -> &[FieldError] {
        &self.errors
    }
}

/// Simple email validation (not comprehensive)
fn is_valid_email(email: &str) -> bool {
    let email = email.trim();
    if email.is_empty() {
        return false;
    }

    // Simple check: contains @ and at least one .
    let parts: Vec<&str> = email.split('@').collect();
    if parts.len() != 2 {
        return false;
    }

    let local = parts[0];
    let domain = parts[1];

    !local.is_empty() && !domain.is_empty() && domain.contains('.')
}

/// Validate pagination parameters
pub fn validate_pagination(page: i64, page_size: i64) -> Result<(i64, i64), ApiError> {
    let page = if page < 1 { 1 } else { page };
    let page_size = page_size.clamp(1, 100);
    Ok((page, page_size))
}

/// Calculate offset from page and page_size
pub fn pagination_offset(page: i64, page_size: i64) -> i64 {
    (page - 1) * page_size
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_validator_required() {
        let result = Validator::new().required("name", "John").finish();
        assert!(result.is_ok());

        let result = Validator::new().required("name", "").finish();
        assert!(result.is_err());
    }

    #[test]
    fn test_validator_required_option() {
        let result = Validator::new()
            .required_option("value", &Some(42))
            .finish();
        assert!(result.is_ok());

        let result = Validator::new()
            .required_option::<i32>("value", &None)
            .finish();
        assert!(result.is_err());
    }

    #[test]
    fn test_validator_min_length() {
        let result = Validator::new().min_length("name", "John", 2).finish();
        assert!(result.is_ok());

        let result = Validator::new().min_length("name", "J", 2).finish();
        assert!(result.is_err());
    }

    #[test]
    fn test_validator_max_length() {
        let result = Validator::new().max_length("name", "John", 10).finish();
        assert!(result.is_ok());

        let result = Validator::new()
            .max_length("name", "John Doe Smith", 10)
            .finish();
        assert!(result.is_err());
    }

    #[test]
    fn test_validator_range() {
        let result = Validator::new().range("age", 25, 18, 65).finish();
        assert!(result.is_ok());

        let result = Validator::new().range("age", 10, 18, 65).finish();
        assert!(result.is_err());
    }

    #[test]
    fn test_validator_email() {
        let result = Validator::new().email("email", "test@example.com").finish();
        assert!(result.is_ok());

        let result = Validator::new().email("email", "invalid-email").finish();
        assert!(result.is_err());
    }

    #[test]
    fn test_validator_uuid() {
        let result = Validator::new()
            .uuid("id", "550e8400-e29b-41d4-a716-446655440000")
            .finish();
        assert!(result.is_ok());

        let result = Validator::new().uuid("id", "not-a-uuid").finish();
        assert!(result.is_err());
    }

    #[test]
    fn test_validator_one_of() {
        let result = Validator::new()
            .one_of("status", &"active", &["active", "inactive", "pending"])
            .finish();
        assert!(result.is_ok());

        let result = Validator::new()
            .one_of("status", &"unknown", &["active", "inactive", "pending"])
            .finish();
        assert!(result.is_err());
    }

    #[test]
    fn test_validator_custom() {
        let result = Validator::new().custom(|| None).finish();
        assert!(result.is_ok());

        let result = Validator::new()
            .custom(|| {
                Some(FieldError {
                    field: "custom".to_string(),
                    message: "Custom error".to_string(),
                    code: None,
                })
            })
            .finish();
        assert!(result.is_err());
    }

    #[test]
    fn test_validator_chaining() {
        let result = Validator::new()
            .required("name", "John")
            .min_length("name", "John", 2)
            .max_length("name", "John", 50)
            .finish();
        assert!(result.is_ok());
    }

    #[test]
    fn test_validate_pagination() {
        let (page, size) = validate_pagination(1, 10).unwrap();
        assert_eq!(page, 1);
        assert_eq!(size, 10);

        let (page, size) = validate_pagination(-1, 10).unwrap();
        assert_eq!(page, 1);

        let (page, size) = validate_pagination(1, 200).unwrap();
        assert_eq!(size, 100);
    }

    #[test]
    fn test_pagination_offset() {
        assert_eq!(pagination_offset(1, 10), 0);
        assert_eq!(pagination_offset(2, 10), 10);
        assert_eq!(pagination_offset(3, 25), 50);
    }

    #[test]
    fn test_is_valid_email() {
        assert!(is_valid_email("test@example.com"));
        assert!(is_valid_email("user.name@sub.domain.com"));
        assert!(!is_valid_email("invalid"));
        assert!(!is_valid_email("@domain.com"));
        assert!(!is_valid_email("user@"));
        assert!(!is_valid_email("user@domain"));
        assert!(!is_valid_email(""));
    }
}
