# Reference Tracks Admin - Listening Prompt Templates

**Date:** January 7, 2026  
**Branch:** `refactor/stack-split`  
**Purpose:** Admin-curated listening prompt templates for critical listening exercises

---

## Overview

This document describes the admin functionality for managing listening prompt templates, which are pre-configured guided listening exercises that users can apply when studying reference tracks.

**Key Features:**
- Admin-only CRUD for listening prompt templates
- Categorized templates (frequency, dynamics, spatial, etc.)
- Difficulty levels (beginner to expert)
- Preset configurations for focus areas, visualization, and looping
- Tags and hints for discoverability

---

## Database Schema

### Tables

#### `listening_prompt_templates`

Admin-curated templates for guided critical listening exercises.

| Column | Type | Description |
|--------|------|-------------|
| `id` | UUID | Primary key |
| `name` | TEXT | Template name |
| `description` | TEXT | Optional description |
| `category` | TEXT | Category (see below) |
| `difficulty` | TEXT | Difficulty level |
| `prompt_text` | TEXT | The prompt users see |
| `hints` | JSONB | Array of hint strings |
| `expected_observations` | JSONB | Expected observations for self-check |
| `tags` | JSONB | Array of tag strings |
| `display_order` | INTEGER | Ordering within category |
| `is_active` | BOOLEAN | Soft-delete flag |
| `created_by` | UUID | Admin who created it |
| `created_at` | TIMESTAMPTZ | Creation timestamp |
| `updated_at` | TIMESTAMPTZ | Last update timestamp |

**Categories:**
- `general` - General listening exercises
- `frequency` - Frequency analysis (EQ, spectrum)
- `dynamics` - Dynamics and compression
- `spatial` - Stereo field and space
- `arrangement` - Song structure analysis
- `production` - Production techniques
- `mixing` - Mix engineering
- `mastering` - Mastering concepts
- `genre_specific` - Genre-specific exercises

**Difficulty Levels:**
- `beginner` - Entry-level exercises
- `intermediate` - Moderate complexity
- `advanced` - Complex analysis
- `expert` - Professional-level

#### `listening_prompt_presets`

Pre-configured settings that can accompany templates.

| Column | Type | Description |
|--------|------|-------------|
| `id` | UUID | Primary key |
| `name` | TEXT | Preset name |
| `description` | TEXT | Optional description |
| `template_id` | UUID | Parent template (optional) |
| `preset_type` | TEXT | Type of preset |
| `config` | JSONB | Configuration object |
| `is_active` | BOOLEAN | Active flag |
| `created_by` | UUID | Admin who created it |
| `created_at` | TIMESTAMPTZ | Creation timestamp |
| `updated_at` | TIMESTAMPTZ | Last update timestamp |

**Preset Types:**
- `focus` - What aspects to focus on
- `comparison` - A/B comparison settings
- `loop` - Loop region settings
- `visualization` - Display settings

---

## API Endpoints

All endpoints require admin authentication (DEC-004=B: DB-backed roles).

### Templates

| Method | Path | Description |
|--------|------|-------------|
| `GET` | `/admin/templates` | List templates with filtering |
| `GET` | `/admin/templates/:id` | Get template with presets |
| `POST` | `/admin/templates` | Create template |
| `PUT` | `/admin/templates/:id` | Update template |
| `DELETE` | `/admin/templates/:id` | Delete template |

### Presets

| Method | Path | Description |
|--------|------|-------------|
| `GET` | `/admin/templates/:id/presets` | List presets for template |
| `POST` | `/admin/templates/:id/presets` | Create preset for template |
| `GET` | `/admin/templates/presets` | List all presets |
| `GET` | `/admin/templates/presets/standalone` | List standalone presets |
| `GET` | `/admin/templates/presets/:id` | Get preset |
| `PUT` | `/admin/templates/presets/:id` | Update preset |
| `DELETE` | `/admin/templates/presets/:id` | Delete preset |

### Query Parameters (List Templates)

| Parameter | Type | Description |
|-----------|------|-------------|
| `category` | string | Filter by category |
| `difficulty` | string | Filter by difficulty |
| `active_only` | boolean | Show only active templates |
| `page` | integer | Page number (default 1) |
| `page_size` | integer | Items per page (default 50, max 100) |

### Request/Response Examples

#### Create Template

```http
POST /admin/templates
Content-Type: application/json

{
  "name": "Low Frequency Identification",
  "description": "Practice identifying bass and sub-bass frequencies",
  "category": "frequency",
  "difficulty": "beginner",
  "prompt_text": "Listen to the low end of this track. Can you identify where the kick drum sits versus the bass line?",
  "hints": [
    "Focus on frequencies below 200Hz",
    "Try to distinguish between the thump and the sub"
  ],
  "expected_observations": [
    "Kick drum typically has fundamental around 60-80Hz",
    "Bass often occupies 60-120Hz for fundamental"
  ],
  "tags": ["mixing", "bass", "kick"],
  "display_order": 1,
  "is_active": true
}
```

#### Response

```json
{
  "template": {
    "id": "550e8400-e29b-41d4-a716-446655440000",
    "name": "Low Frequency Identification",
    "description": "Practice identifying bass and sub-bass frequencies",
    "category": "frequency",
    "difficulty": "beginner",
    "prompt_text": "Listen to the low end of this track...",
    "hints": ["Focus on frequencies below 200Hz", "..."],
    "expected_observations": ["Kick drum typically...", "..."],
    "tags": ["mixing", "bass", "kick"],
    "display_order": 1,
    "is_active": true,
    "created_by": "user-uuid",
    "created_at": "2026-01-07T12:00:00Z",
    "updated_at": "2026-01-07T12:00:00Z"
  }
}
```

---

## Admin UI

The admin templates page is accessible at `/admin/templates` in the admin console.

### Features

1. **Template List**
   - Cards showing template name, category, difficulty, and prompt
   - Badges for category, difficulty, and active status
   - Quick actions for edit and delete

2. **Filtering**
   - Category dropdown filter
   - Difficulty dropdown filter
   - Active-only checkbox

3. **Create/Edit Modal**
   - Form for all template fields
   - Multi-line input for hints and observations
   - Tag entry

4. **RBAC**
   - Page requires admin role
   - All mutations protected by CSRF

### Location

```
app/admin/src/app/templates/
├── page.tsx           # Page component
├── TemplatesClient.tsx # Client component with CRUD UI
└── templates.module.css # Styles
```

---

## Security

### RBAC (DEC-004=B)

- All `/admin/*` routes require authenticated admin role
- Role is checked via DB-backed user roles
- Non-admin users receive 403 Forbidden

### CSRF (DEC-002=A)

- All state-changing requests (POST/PUT/DELETE) require CSRF protection
- Origin header verification via middleware
- Only allowed origins: `ignition.ecent.online`, `admin.ignition.ecent.online`

### Audit

- `created_by` tracks which admin created each template
- `updated_at` tracks last modification time
- Future: Add to admin_audit_log table

---

## Migration

The schema is created by migration `0010_listening_prompt_templates.sql`:

```bash
# Apply migration
psql $DATABASE_URL -f app/database/migrations/0010_listening_prompt_templates.sql

# Rollback if needed
psql $DATABASE_URL -f app/database/migrations/0010_listening_prompt_templates.down.sql
```

---

## Testing

### Backend Tests

Located at: `app/backend/crates/api/src/tests/template_tests.rs`

| Test | Description |
|------|-------------|
| `test_template_category_serialization` | Category enum serializes correctly |
| `test_template_difficulty_serialization` | Difficulty enum serializes correctly |
| `test_template_category_parsing` | Category parses from string |
| `test_template_difficulty_parsing` | Difficulty parses from string |
| `test_create_template_input_defaults` | Default values applied correctly |
| `test_create_template_input_full` | Full input parses correctly |
| `test_update_template_input_partial` | Partial updates work |
| `test_create_preset_input_defaults` | Preset defaults applied |
| `test_create_preset_input_with_config` | Preset config parses |
| `test_rbac_documentation` | Documents RBAC requirements |
| `test_all_template_categories_valid` | All categories valid |
| `test_all_template_difficulties_valid` | All difficulties valid |
| `test_template_serialization_roundtrip` | JSON round-trip works |

### Playwright Tests

Located at: `app/admin/tests/templates.spec.ts`

| Test | Description |
|------|-------------|
| `page loads with correct title` | Page renders correctly |
| `shows empty state when no templates` | Empty state visible |
| `filter controls are visible` | Filters render |
| `add template button opens modal` | Modal opens |
| `modal can be closed` | Modal closes |
| `form validation requires name and prompt text` | Validation works |
| `category filter changes results` | Category filter works |
| `difficulty filter changes results` | Difficulty filter works |
| `active only checkbox works` | Checkbox toggles |

---

## Files Created

| File | Purpose |
|------|---------|
| `app/database/migrations/0010_listening_prompt_templates.sql` | Schema migration |
| `app/database/migrations/0010_listening_prompt_templates.down.sql` | Rollback migration |
| `app/backend/crates/api/src/db/template_models.rs` | Rust models |
| `app/backend/crates/api/src/db/template_repos.rs` | Rust repositories |
| `app/backend/crates/api/src/routes/admin_templates.rs` | Admin routes |
| `app/backend/crates/api/src/tests/template_tests.rs` | Backend tests |
| `app/admin/src/lib/api/templates.ts` | Admin API client |
| `app/admin/src/app/templates/page.tsx` | Admin page |
| `app/admin/src/app/templates/TemplatesClient.tsx` | Admin UI component |
| `app/admin/src/app/templates/templates.module.css` | Admin styles |
| `app/admin/tests/templates.spec.ts` | Playwright tests |

---

## References

- [reference_tracks_domain.md](./reference_tracks_domain.md) - Reference tracks domain docs
- [PHASE_GATE.md](./PHASE_GATE.md) - Phase gating status
- [DECISIONS.md](./DECISIONS.md) - DEC-004=B (DB-backed admin roles)
- [security_model.md](./security_model.md) - CSRF and auth requirements

