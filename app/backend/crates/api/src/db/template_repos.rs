//! Listening Prompt Template Repositories
//!
//! Database operations for listening prompt templates and presets.

use sqlx::PgPool;
use uuid::Uuid;

use super::template_models::{
    CreatePresetInput, CreateTemplateInput, ListeningPromptPreset, ListeningPromptPresetRow,
    ListeningPromptTemplate, ListeningPromptTemplateRow, TemplateListOptions, TemplateWithPresets,
    UpdatePresetInput, UpdateTemplateInput,
};

/// Repository for listening prompt templates
pub struct TemplateRepository;

impl TemplateRepository {
    /// List templates with filtering and pagination
    pub async fn list(
        pool: &PgPool,
        options: &TemplateListOptions,
    ) -> Result<Vec<ListeningPromptTemplate>, sqlx::Error> {
        let page = options.page.unwrap_or(1).max(1);
        let page_size = options.page_size.unwrap_or(50).min(100).max(1);
        let offset = (page - 1) * page_size;

        let rows = sqlx::query_as::<_, ListeningPromptTemplateRow>(
            r#"
            SELECT id, name, description, category, difficulty, prompt_text,
                   hints, expected_observations, tags, display_order, is_active,
                   created_by, created_at, updated_at
            FROM listening_prompt_templates
            WHERE ($1::TEXT IS NULL OR category = $1)
              AND ($2::TEXT IS NULL OR difficulty = $2)
              AND ($3::BOOLEAN IS NULL OR is_active = $3 OR $3 = false)
            ORDER BY category, display_order, created_at DESC
            LIMIT $4 OFFSET $5
            "#,
        )
        .bind(&options.category)
        .bind(&options.difficulty)
        .bind(&options.active_only)
        .bind(page_size)
        .bind(offset)
        .fetch_all(pool)
        .await?;

        Ok(rows.into_iter().map(Into::into).collect())
    }

    /// Count templates matching filter
    pub async fn count(pool: &PgPool, options: &TemplateListOptions) -> Result<i64, sqlx::Error> {
        let row: (i64,) = sqlx::query_as(
            r#"
            SELECT COUNT(*)
            FROM listening_prompt_templates
            WHERE ($1::TEXT IS NULL OR category = $1)
              AND ($2::TEXT IS NULL OR difficulty = $2)
              AND ($3::BOOLEAN IS NULL OR is_active = $3 OR $3 = false)
            "#,
        )
        .bind(&options.category)
        .bind(&options.difficulty)
        .bind(&options.active_only)
        .fetch_one(pool)
        .await?;

        Ok(row.0)
    }

    /// Get a single template by ID
    pub async fn get_by_id(
        pool: &PgPool,
        id: Uuid,
    ) -> Result<Option<ListeningPromptTemplate>, sqlx::Error> {
        let row = sqlx::query_as::<_, ListeningPromptTemplateRow>(
            r#"
            SELECT id, name, description, category, difficulty, prompt_text,
                   hints, expected_observations, tags, display_order, is_active,
                   created_by, created_at, updated_at
            FROM listening_prompt_templates
            WHERE id = $1
            "#,
        )
        .bind(id)
        .fetch_optional(pool)
        .await?;

        Ok(row.map(Into::into))
    }

    /// Get template with its presets
    pub async fn get_with_presets(
        pool: &PgPool,
        id: Uuid,
    ) -> Result<Option<TemplateWithPresets>, sqlx::Error> {
        let template = Self::get_by_id(pool, id).await?;

        match template {
            Some(template) => {
                let presets = PresetRepository::list_by_template(pool, id).await?;
                Ok(Some(TemplateWithPresets { template, presets }))
            }
            None => Ok(None),
        }
    }

    /// Create a new template
    pub async fn create(
        pool: &PgPool,
        input: &CreateTemplateInput,
        created_by: Uuid,
    ) -> Result<ListeningPromptTemplate, sqlx::Error> {
        let row = sqlx::query_as::<_, ListeningPromptTemplateRow>(
            r#"
            INSERT INTO listening_prompt_templates
                (name, description, category, difficulty, prompt_text,
                 hints, expected_observations, tags, display_order, is_active, created_by)
            VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
            RETURNING id, name, description, category, difficulty, prompt_text,
                      hints, expected_observations, tags, display_order, is_active,
                      created_by, created_at, updated_at
            "#,
        )
        .bind(&input.name)
        .bind(&input.description)
        .bind(&input.category)
        .bind(&input.difficulty)
        .bind(&input.prompt_text)
        .bind(serde_json::to_value(&input.hints).unwrap_or_default())
        .bind(serde_json::to_value(&input.expected_observations).unwrap_or_default())
        .bind(serde_json::to_value(&input.tags).unwrap_or_default())
        .bind(input.display_order)
        .bind(input.is_active)
        .bind(created_by)
        .fetch_one(pool)
        .await?;

        Ok(row.into())
    }

    /// Update a template
    pub async fn update(
        pool: &PgPool,
        id: Uuid,
        input: &UpdateTemplateInput,
    ) -> Result<Option<ListeningPromptTemplate>, sqlx::Error> {
        let row = sqlx::query_as::<_, ListeningPromptTemplateRow>(
            r#"
            UPDATE listening_prompt_templates
            SET name = COALESCE($2, name),
                description = COALESCE($3, description),
                category = COALESCE($4, category),
                difficulty = COALESCE($5, difficulty),
                prompt_text = COALESCE($6, prompt_text),
                hints = COALESCE($7, hints),
                expected_observations = COALESCE($8, expected_observations),
                tags = COALESCE($9, tags),
                display_order = COALESCE($10, display_order),
                is_active = COALESCE($11, is_active),
                updated_at = NOW()
            WHERE id = $1
            RETURNING id, name, description, category, difficulty, prompt_text,
                      hints, expected_observations, tags, display_order, is_active,
                      created_by, created_at, updated_at
            "#,
        )
        .bind(id)
        .bind(&input.name)
        .bind(&input.description)
        .bind(&input.category)
        .bind(&input.difficulty)
        .bind(&input.prompt_text)
        .bind(
            input
                .hints
                .as_ref()
                .map(|h| serde_json::to_value(h).unwrap_or_default()),
        )
        .bind(
            input
                .expected_observations
                .as_ref()
                .map(|o| serde_json::to_value(o).unwrap_or_default()),
        )
        .bind(
            input
                .tags
                .as_ref()
                .map(|t| serde_json::to_value(t).unwrap_or_default()),
        )
        .bind(input.display_order)
        .bind(input.is_active)
        .fetch_optional(pool)
        .await?;

        Ok(row.map(Into::into))
    }

    /// Delete a template
    pub async fn delete(pool: &PgPool, id: Uuid) -> Result<bool, sqlx::Error> {
        let result = sqlx::query("DELETE FROM listening_prompt_templates WHERE id = $1")
            .bind(id)
            .execute(pool)
            .await?;

        Ok(result.rows_affected() > 0)
    }
}

/// Repository for listening prompt presets
pub struct PresetRepository;

impl PresetRepository {
    /// List all presets
    pub async fn list(pool: &PgPool) -> Result<Vec<ListeningPromptPreset>, sqlx::Error> {
        let rows = sqlx::query_as::<_, ListeningPromptPresetRow>(
            r#"
            SELECT id, name, description, template_id, preset_type,
                   config, is_active, created_by, created_at, updated_at
            FROM listening_prompt_presets
            ORDER BY preset_type, name
            "#,
        )
        .fetch_all(pool)
        .await?;

        Ok(rows.into_iter().map(Into::into).collect())
    }

    /// List presets for a specific template
    pub async fn list_by_template(
        pool: &PgPool,
        template_id: Uuid,
    ) -> Result<Vec<ListeningPromptPreset>, sqlx::Error> {
        let rows = sqlx::query_as::<_, ListeningPromptPresetRow>(
            r#"
            SELECT id, name, description, template_id, preset_type,
                   config, is_active, created_by, created_at, updated_at
            FROM listening_prompt_presets
            WHERE template_id = $1
            ORDER BY preset_type, name
            "#,
        )
        .bind(template_id)
        .fetch_all(pool)
        .await?;

        Ok(rows.into_iter().map(Into::into).collect())
    }

    /// List standalone presets (no template)
    pub async fn list_standalone(pool: &PgPool) -> Result<Vec<ListeningPromptPreset>, sqlx::Error> {
        let rows = sqlx::query_as::<_, ListeningPromptPresetRow>(
            r#"
            SELECT id, name, description, template_id, preset_type,
                   config, is_active, created_by, created_at, updated_at
            FROM listening_prompt_presets
            WHERE template_id IS NULL
            ORDER BY preset_type, name
            "#,
        )
        .fetch_all(pool)
        .await?;

        Ok(rows.into_iter().map(Into::into).collect())
    }

    /// Get a single preset by ID
    pub async fn get_by_id(
        pool: &PgPool,
        id: Uuid,
    ) -> Result<Option<ListeningPromptPreset>, sqlx::Error> {
        let row = sqlx::query_as::<_, ListeningPromptPresetRow>(
            r#"
            SELECT id, name, description, template_id, preset_type,
                   config, is_active, created_by, created_at, updated_at
            FROM listening_prompt_presets
            WHERE id = $1
            "#,
        )
        .bind(id)
        .fetch_optional(pool)
        .await?;

        Ok(row.map(Into::into))
    }

    /// Create a new preset
    pub async fn create(
        pool: &PgPool,
        input: &CreatePresetInput,
        created_by: Uuid,
    ) -> Result<ListeningPromptPreset, sqlx::Error> {
        let row = sqlx::query_as::<_, ListeningPromptPresetRow>(
            r#"
            INSERT INTO listening_prompt_presets
                (name, description, template_id, preset_type, config, is_active, created_by)
            VALUES ($1, $2, $3, $4, $5, $6, $7)
            RETURNING id, name, description, template_id, preset_type,
                      config, is_active, created_by, created_at, updated_at
            "#,
        )
        .bind(&input.name)
        .bind(&input.description)
        .bind(input.template_id)
        .bind(&input.preset_type)
        .bind(&input.config)
        .bind(input.is_active)
        .bind(created_by)
        .fetch_one(pool)
        .await?;

        Ok(row.into())
    }

    /// Update a preset
    pub async fn update(
        pool: &PgPool,
        id: Uuid,
        input: &UpdatePresetInput,
    ) -> Result<Option<ListeningPromptPreset>, sqlx::Error> {
        // Handle the nested Option for template_id
        let template_id_update = match &input.template_id {
            Some(Some(id)) => Some(*id),
            Some(None) => None, // Explicitly set to NULL
            None => None,       // No change (handled by COALESCE in query)
        };
        let should_update_template_id = input.template_id.is_some();

        let row = sqlx::query_as::<_, ListeningPromptPresetRow>(
            r#"
            UPDATE listening_prompt_presets
            SET name = COALESCE($2, name),
                description = COALESCE($3, description),
                template_id = CASE WHEN $4::BOOLEAN THEN $5 ELSE template_id END,
                preset_type = COALESCE($6, preset_type),
                config = COALESCE($7, config),
                is_active = COALESCE($8, is_active),
                updated_at = NOW()
            WHERE id = $1
            RETURNING id, name, description, template_id, preset_type,
                      config, is_active, created_by, created_at, updated_at
            "#,
        )
        .bind(id)
        .bind(&input.name)
        .bind(&input.description)
        .bind(should_update_template_id)
        .bind(template_id_update)
        .bind(&input.preset_type)
        .bind(&input.config)
        .bind(input.is_active)
        .fetch_optional(pool)
        .await?;

        Ok(row.map(Into::into))
    }

    /// Delete a preset
    pub async fn delete(pool: &PgPool, id: Uuid) -> Result<bool, sqlx::Error> {
        let result = sqlx::query("DELETE FROM listening_prompt_presets WHERE id = $1")
            .bind(id)
            .execute(pool)
            .await?;

        Ok(result.rows_affected() > 0)
    }
}

#[cfg(test)]
mod tests {

    #[test]
    fn test_template_category_display() {
        use super::super::template_models::TemplateCategory;
        assert_eq!(TemplateCategory::Frequency.to_string(), "frequency");
        assert_eq!(
            TemplateCategory::GenreSpecific.to_string(),
            "genre_specific"
        );
    }

    #[test]
    fn test_template_difficulty_parse() {
        use super::super::template_models::TemplateDifficulty;
        assert_eq!(
            "advanced".parse::<TemplateDifficulty>().unwrap(),
            TemplateDifficulty::Advanced
        );
    }

    #[test]
    fn test_preset_type_parse() {
        use super::super::template_models::PresetType;
        assert_eq!(
            "visualization".parse::<PresetType>().unwrap(),
            PresetType::Visualization
        );
    }
}
