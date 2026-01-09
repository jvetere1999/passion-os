//! Typed IDs
//!
//! Provides type-safe ID wrappers to prevent ID confusion between entity types.

use std::fmt;
use std::marker::PhantomData;
use std::str::FromStr;

use axum::{
    extract::{FromRequestParts, Path},
    http::request::Parts,
};
use serde::{Deserialize, Serialize};
use uuid::Uuid;

use crate::error::AppError;

/// Marker trait for entity types
pub trait EntityType: Send + Sync + 'static {
    /// Entity name for error messages
    const NAME: &'static str;
}

/// Type-safe ID wrapper
#[derive(Clone, Copy, PartialEq, Eq, Hash)]
pub struct TypedId<T: EntityType> {
    id: Uuid,
    _marker: PhantomData<T>,
}

impl<T: EntityType> TypedId<T> {
    /// Create a new typed ID from a UUID
    pub fn new(id: Uuid) -> Self {
        Self {
            id,
            _marker: PhantomData,
        }
    }

    /// Generate a new random typed ID
    pub fn generate() -> Self {
        Self::new(Uuid::new_v4())
    }

    /// Get the inner UUID
    pub fn into_inner(self) -> Uuid {
        self.id
    }

    /// Get reference to inner UUID
    pub fn as_uuid(&self) -> &Uuid {
        &self.id
    }
}

impl<T: EntityType> fmt::Debug for TypedId<T> {
    fn fmt(&self, f: &mut fmt::Formatter<'_>) -> fmt::Result {
        write!(f, "{}({})", T::NAME, self.id)
    }
}

impl<T: EntityType> fmt::Display for TypedId<T> {
    fn fmt(&self, f: &mut fmt::Formatter<'_>) -> fmt::Result {
        write!(f, "{}", self.id)
    }
}

impl<T: EntityType> FromStr for TypedId<T> {
    type Err = uuid::Error;

    fn from_str(s: &str) -> Result<Self, Self::Err> {
        Uuid::parse_str(s).map(Self::new)
    }
}

impl<T: EntityType> From<Uuid> for TypedId<T> {
    fn from(id: Uuid) -> Self {
        Self::new(id)
    }
}

impl<T: EntityType> From<TypedId<T>> for Uuid {
    fn from(id: TypedId<T>) -> Self {
        id.id
    }
}

impl<T: EntityType> Serialize for TypedId<T> {
    fn serialize<S>(&self, serializer: S) -> Result<S::Ok, S::Error>
    where
        S: serde::Serializer,
    {
        self.id.serialize(serializer)
    }
}

impl<'de, T: EntityType> Deserialize<'de> for TypedId<T> {
    fn deserialize<D>(deserializer: D) -> Result<Self, D::Error>
    where
        D: serde::Deserializer<'de>,
    {
        Uuid::deserialize(deserializer).map(Self::new)
    }
}

/// Axum extractor for path parameters
impl<T, S> FromRequestParts<S> for TypedId<T>
where
    T: EntityType,
    S: Send + Sync,
{
    type Rejection = AppError;

    async fn from_request_parts(parts: &mut Parts, state: &S) -> Result<Self, Self::Rejection> {
        let Path(id): Path<String> = Path::from_request_parts(parts, state)
            .await
            .map_err(|_| AppError::BadRequest(format!("Invalid {} ID in path", T::NAME)))?;

        id.parse()
            .map_err(|_| AppError::BadRequest(format!("Invalid {} ID format", T::NAME)))
    }
}

// Common entity type markers
macro_rules! define_entity {
    ($name:ident, $display:expr) => {
        /// Entity type marker
        #[derive(Debug, Clone, Copy, PartialEq, Eq)]
        pub struct $name;

        impl EntityType for $name {
            const NAME: &'static str = $display;
        }

        paste::paste! {
            /// Type alias for this entity's ID
            pub type [<$name Id>] = TypedId<$name>;
        }
    };
}

define_entity!(User, "User");
define_entity!(Session, "Session");
define_entity!(Track, "Track");
define_entity!(Analysis, "Analysis");
define_entity!(Annotation, "Annotation");
define_entity!(Region, "Region");
define_entity!(Template, "Template");
define_entity!(Preset, "Preset");
define_entity!(Focus, "Focus");
define_entity!(Habit, "Habit");
define_entity!(Goal, "Goal");
define_entity!(Quest, "Quest");
define_entity!(Exercise, "Exercise");
define_entity!(Workout, "Workout");
define_entity!(Book, "Book");
define_entity!(Program, "Program");
define_entity!(Blob, "Blob");

/// Parse a UUID string, returning AppError on failure
pub fn parse_uuid(s: &str, entity_name: &str) -> Result<Uuid, AppError> {
    Uuid::parse_str(s)
        .map_err(|_| AppError::BadRequest(format!("Invalid {} ID format", entity_name)))
}

/// Parse an optional UUID string
pub fn parse_uuid_optional(s: Option<&str>, entity_name: &str) -> Result<Option<Uuid>, AppError> {
    match s {
        Some(s) => parse_uuid(s, entity_name).map(Some),
        None => Ok(None),
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_typed_id_new() {
        let uuid = Uuid::new_v4();
        let id: UserId = TypedId::new(uuid);
        assert_eq!(id.into_inner(), uuid);
    }

    #[test]
    fn test_typed_id_generate() {
        let id1: UserId = TypedId::generate();
        let id2: UserId = TypedId::generate();
        assert_ne!(id1, id2);
    }

    #[test]
    fn test_typed_id_from_str() {
        let uuid_str = "550e8400-e29b-41d4-a716-446655440000";
        let id: UserId = uuid_str.parse().unwrap();
        assert_eq!(id.to_string(), uuid_str);
    }

    #[test]
    fn test_typed_id_from_str_invalid() {
        let result: Result<UserId, _> = "not-a-uuid".parse();
        assert!(result.is_err());
    }

    #[test]
    fn test_typed_id_debug() {
        let uuid = Uuid::parse_str("550e8400-e29b-41d4-a716-446655440000").unwrap();
        let id: UserId = TypedId::new(uuid);
        let debug = format!("{:?}", id);
        assert!(debug.contains("User"));
        assert!(debug.contains("550e8400"));
    }

    #[test]
    fn test_typed_id_display() {
        let uuid = Uuid::parse_str("550e8400-e29b-41d4-a716-446655440000").unwrap();
        let id: UserId = TypedId::new(uuid);
        assert_eq!(id.to_string(), "550e8400-e29b-41d4-a716-446655440000");
    }

    #[test]
    fn test_typed_id_serialize() {
        let uuid = Uuid::parse_str("550e8400-e29b-41d4-a716-446655440000").unwrap();
        let id: UserId = TypedId::new(uuid);
        let json = serde_json::to_string(&id).unwrap();
        assert_eq!(json, "\"550e8400-e29b-41d4-a716-446655440000\"");
    }

    #[test]
    fn test_typed_id_deserialize() {
        let json = "\"550e8400-e29b-41d4-a716-446655440000\"";
        let id: UserId = serde_json::from_str(json).unwrap();
        assert_eq!(id.to_string(), "550e8400-e29b-41d4-a716-446655440000");
    }

    #[test]
    fn test_parse_uuid() {
        let result = parse_uuid("550e8400-e29b-41d4-a716-446655440000", "User");
        assert!(result.is_ok());

        let result = parse_uuid("invalid", "User");
        assert!(result.is_err());
    }

    #[test]
    fn test_parse_uuid_optional() {
        let result = parse_uuid_optional(Some("550e8400-e29b-41d4-a716-446655440000"), "User");
        assert!(result.unwrap().is_some());

        let result = parse_uuid_optional(None, "User");
        assert!(result.unwrap().is_none());

        let result = parse_uuid_optional(Some("invalid"), "User");
        assert!(result.is_err());
    }

    #[test]
    fn test_different_types_not_equal() {
        // This test is compile-time: UserId and TrackId are different types
        // and cannot be compared or used interchangeably
        let user_id: UserId = TypedId::generate();
        let track_id: TrackId = TypedId::generate();

        // These would be compile errors:
        // assert_ne!(user_id, track_id);
        // let _: TrackId = user_id;

        // We can only compare same types
        assert_ne!(user_id.into_inner(), track_id.into_inner());
    }
}
