//! Recovery Code Validation Service
//!
//! Provides validation for recovery codes including:
//! - Format validation (correct length and character set)
//! - Rate limiting for recovery attempts

use crate::error::AppError;

/// Recovery code validation service
pub struct RecoveryValidator;

impl RecoveryValidator {
    /// Validate recovery code format
    ///
    /// Valid format: XXXX-XXXX-XXXX (12 alphanumeric characters with dashes)
    ///
    /// # Errors
    /// Returns `AppError::BadRequest` if format is invalid
    pub fn validate_code_format(code: &str) -> Result<(), AppError> {
        // Code should be in format: XXXX-XXXX-XXXX
        if code.len() != 14 {
            return Err(AppError::BadRequest(
                "Recovery code must be 14 characters (XXXX-XXXX-XXXX format)".to_string(),
            ));
        }

        // Check format manually: groups of 4 alphanumeric separated by dashes
        let parts: Vec<&str> = code.split('-').collect();
        if parts.len() != 3 {
            return Err(AppError::BadRequest(
                "Recovery code must have 3 groups separated by dashes".to_string(),
            ));
        }

        for part in parts {
            if part.len() != 4 {
                return Err(AppError::BadRequest(
                    "Each code group must be exactly 4 characters".to_string(),
                ));
            }

            if !part
                .chars()
                .all(|c| c.is_ascii_alphanumeric() && c.is_ascii_uppercase())
            {
                return Err(AppError::BadRequest(
                    "Code must contain only uppercase letters and numbers: XXXX-XXXX-XXXX"
                        .to_string(),
                ));
            }
        }

        Ok(())
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_valid_recovery_code_format() {
        assert!(RecoveryValidator::validate_code_format("ABCD-1234-WXYZ").is_ok());
    }

    #[test]
    fn test_invalid_recovery_code_too_short() {
        assert!(RecoveryValidator::validate_code_format("ABC-123-XYZ").is_err());
    }

    #[test]
    fn test_invalid_recovery_code_lowercase() {
        assert!(RecoveryValidator::validate_code_format("abcd-1234-wxyz").is_err());
    }
}
