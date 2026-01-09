"Reference Tracks Domain documentation - schema, endpoints, security, determinism."

# Reference Tracks Domain

**Date:** January 7, 2026  
**Branch:** `refactor/stack-split`  
**Purpose:** Document the Critical Listening feature domain

---

## Overview

The Reference Tracks domain provides audio analysis, annotation, and structural region features for music production training. Users upload reference tracks (audio files), annotate specific points or ranges, define structural regions, and (in the future) receive guided listening prompts.

---

## Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                        Frontend (UI Only)                        │
│  - Audio player (Web Audio API)                                  │
│  - Waveform visualization                                        │
│  - Annotation/region overlay UI                                  │
│  - Analysis display                                              │
└─────────────────────────────────┬───────────────────────────────┘
                                  │ API calls
                                  ▼
┌─────────────────────────────────────────────────────────────────┐
│                    Backend (Rust/Axum)                           │
│  Routes: /reference/*                                            │
│  - Track CRUD                                                    │
│  - Upload (multipart or signed URL)                              │
│  - Analysis (stub/async job)                                     │
│  - Annotations CRUD                                              │
│  - Regions CRUD                                                  │
└───────────┬─────────────────────────────────┬───────────────────┘
            │                                 │
            ▼                                 ▼
     ┌─────────────┐                  ┌─────────────┐
     │  PostgreSQL │                  │     R2      │
     │  Metadata   │                  │   Audio     │
     └─────────────┘                  └─────────────┘
```

---

## Database Schema

### Migration: `0008_reference_tracks_substrate.sql`

#### Table: `reference_tracks`

Stores track metadata. Audio files live in R2.

| Column | Type | Description |
|--------|------|-------------|
| `id` | UUID | Primary key |
| `user_id` | UUID | FK to users (owner) |
| `name` | TEXT | Display name |
| `description` | TEXT | Optional description |
| `r2_key` | TEXT | R2 storage key |
| `file_size_bytes` | BIGINT | File size |
| `mime_type` | TEXT | MIME type (audio/*) |
| `duration_seconds` | REAL | Audio duration |
| `artist` | TEXT | Optional artist |
| `album` | TEXT | Optional album |
| `genre` | TEXT | Optional genre |
| `bpm` | REAL | Optional BPM |
| `key_signature` | TEXT | Optional key (e.g., "C major") |
| `tags` | JSONB | Tags array |
| `status` | TEXT | uploading/processing/ready/error |
| `error_message` | TEXT | Error details if failed |
| `created_at` | TIMESTAMPTZ | Creation time |
| `updated_at` | TIMESTAMPTZ | Last update |

#### Table: `track_analyses`

Stores analysis results/manifests.

| Column | Type | Description |
|--------|------|-------------|
| `id` | UUID | Primary key |
| `track_id` | UUID | FK to reference_tracks |
| `analysis_type` | TEXT | full/quick/spectral/loudness |
| `version` | TEXT | Analysis version |
| `status` | TEXT | pending/running/completed/failed |
| `started_at` | TIMESTAMPTZ | When analysis started |
| `completed_at` | TIMESTAMPTZ | When analysis completed |
| `error_message` | TEXT | Error details if failed |
| `summary` | JSONB | Quick-access summary |
| `manifest` | JSONB | Full analysis results |
| `created_at` | TIMESTAMPTZ | Creation time |
| `updated_at` | TIMESTAMPTZ | Last update |

#### Table: `analysis_frame_chunks`

Stores large frame-by-frame data in chunks.

| Column | Type | Description |
|--------|------|-------------|
| `id` | UUID | Primary key |
| `analysis_id` | UUID | FK to track_analyses |
| `chunk_index` | INTEGER | Chunk order (0-indexed) |
| `start_time_ms` | INTEGER | Chunk start time |
| `end_time_ms` | INTEGER | Chunk end time |
| `frames` | JSONB | Frame data array |
| `created_at` | TIMESTAMPTZ | Creation time |

#### Table: `track_annotations`

User annotations on points or ranges.

| Column | Type | Description |
|--------|------|-------------|
| `id` | UUID | Primary key |
| `track_id` | UUID | FK to reference_tracks |
| `user_id` | UUID | FK to users (author) |
| `start_time_ms` | INTEGER | Start position |
| `end_time_ms` | INTEGER | End position (NULL for point) |
| `title` | TEXT | Annotation title |
| `content` | TEXT | Annotation body |
| `category` | TEXT | general/technique/mix/mastering/arrangement/production |
| `color` | TEXT | Display color (hex) |
| `is_private` | BOOLEAN | Visibility flag |
| `created_at` | TIMESTAMPTZ | Creation time |
| `updated_at` | TIMESTAMPTZ | Last update |

#### Table: `track_regions`

Named sections/regions in a track.

| Column | Type | Description |
|--------|------|-------------|
| `id` | UUID | Primary key |
| `track_id` | UUID | FK to reference_tracks |
| `user_id` | UUID | FK to users (author) |
| `start_time_ms` | INTEGER | Region start |
| `end_time_ms` | INTEGER | Region end |
| `name` | TEXT | Region name |
| `description` | TEXT | Optional description |
| `section_type` | TEXT | intro/verse/chorus/bridge/breakdown/buildup/drop/outro/custom |
| `color` | TEXT | Display color (hex) |
| `display_order` | INTEGER | UI ordering |
| `created_at` | TIMESTAMPTZ | Creation time |
| `updated_at` | TIMESTAMPTZ | Last update |

---

## Deferred Tables

The following are designed but not implemented in v1:

### `listening_prompts`

Guided listening exercise definitions.

```sql
-- DEFERRED
CREATE TABLE listening_prompts (
    id UUID PRIMARY KEY,
    title TEXT NOT NULL,
    description TEXT,
    target_skill TEXT,  -- e.g., 'eq_perception', 'compression_detection'
    difficulty_level INTEGER,
    prompt_template JSONB,  -- Questions/tasks
    created_at TIMESTAMPTZ
);
```

### `prompt_instances`

User progress through prompts.

```sql
-- DEFERRED
CREATE TABLE prompt_instances (
    id UUID PRIMARY KEY,
    user_id UUID REFERENCES users(id),
    prompt_id UUID REFERENCES listening_prompts(id),
    track_id UUID REFERENCES reference_tracks(id),
    status TEXT,  -- pending/in_progress/completed
    response JSONB,
    score REAL,
    completed_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ
);
```

---

## API Endpoints

Base: `https://api.ecent.online/reference`

### Track Endpoints

| Method | Path | Description | Auth |
|--------|------|-------------|------|
| GET | `/tracks` | List user's tracks (paginated) | User |
| POST | `/tracks` | Create track record | User |
| GET | `/tracks/:id` | Get track with summary | User |
| PATCH | `/tracks/:id` | Update track metadata | User |
| DELETE | `/tracks/:id` | Delete track (+ R2 file) | User |

### Upload Endpoints

| Method | Path | Description | Auth |
|--------|------|-------------|------|
| POST | `/upload` | Upload audio (multipart) | User |
| POST | `/upload/init` | Get signed upload URL | User |

### Streaming Endpoints

| Method | Path | Description | Auth |
|--------|------|-------------|------|
| GET | `/tracks/:id/stream` | Get signed download URL | User |
| GET | `/tracks/:id/play` | Alias for stream | User |

### Analysis Endpoints

| Method | Path | Description | Auth |
|--------|------|-------------|------|
| GET | `/tracks/:id/analysis` | Get latest analysis | User |
| POST | `/tracks/:id/analysis` | Start analysis job | User |

### Annotation Endpoints

| Method | Path | Description | Auth |
|--------|------|-------------|------|
| GET | `/tracks/:id/annotations` | List annotations | User |
| POST | `/tracks/:id/annotations` | Create annotation | User |
| GET | `/annotations/:id` | Get annotation | User |
| PATCH | `/annotations/:id` | Update annotation | User |
| DELETE | `/annotations/:id` | Delete annotation | User |

### Region Endpoints

| Method | Path | Description | Auth |
|--------|------|-------------|------|
| GET | `/tracks/:id/regions` | List regions | User |
| POST | `/tracks/:id/regions` | Create region | User |
| GET | `/regions/:id` | Get region | User |
| PATCH | `/regions/:id` | Update region | User |
| DELETE | `/regions/:id` | Delete region | User |

---

## IDOR Prevention

All endpoints enforce ownership checks:

1. **Track Access:** `WHERE id = $1 AND user_id = $2`
   - Users can only access their own tracks
   - All queries include user_id filter

2. **Annotation Access:** `WHERE id = $1 AND user_id = $2`
   - Users can only modify their own annotations
   - Public annotations (is_private=false) are visible to all users on a shared track

3. **Region Access:** `WHERE id = $1 AND user_id = $2`
   - Users can only modify their own regions

4. **R2 Storage:**
   - Keys are prefixed with user_id: `{user_id}/audio/{uuid}.{ext}`
   - Backend verifies ownership before generating signed URLs

### Example Query (Track Get)

```sql
SELECT * FROM reference_tracks 
WHERE id = $1 AND user_id = $2
```

### Example Query (Annotation List)

```sql
SELECT * FROM track_annotations 
WHERE track_id = $1 AND (user_id = $2 OR is_private = false)
ORDER BY start_time_ms ASC
```

---

## CSRF Protection

All state-changing endpoints (POST, PATCH, DELETE) require:

1. Valid session cookie
2. Valid Origin header from allowed origins:
   - `https://ignition.ecent.online`
   - `https://admin.ignition.ecent.online`
   - `http://localhost:3000` (dev)
   - `http://localhost:3001` (dev)

This is enforced by the `csrf_check` middleware layer.

---

## Determinism & Versioning

### Analysis Determinism

The analysis system is designed for deterministic results:

1. **Version Tracking:** Each analysis has a `version` field
2. **Immutable Results:** Completed analyses are not modified
3. **Re-analysis:** Creating a new analysis creates a new record, preserving history

### API Contract Stability

| Aspect | Policy |
|--------|--------|
| Response shape | Stable within major version |
| Field names | snake_case |
| Dates | ISO 8601 (UTC) |
| IDs | UUIDs |
| Times | Milliseconds (integers) |

### Annotation/Region Ordering

- Annotations: ordered by `start_time_ms ASC`
- Regions: ordered by `start_time_ms ASC, display_order ASC`

---

## Error Codes

| Code | HTTP | Description |
|------|------|-------------|
| `not_found` | 404 | Track/annotation/region not found |
| `validation_error` | 422 | Invalid input (e.g., end_time < start_time) |
| `unauthorized` | 401 | No valid session |
| `forbidden` | 403 | CSRF violation or ownership denied |
| `config_error` | 500 | Storage not configured |

---

## Data Flow

### Upload Flow

```
1. Frontend calls POST /reference/upload/init
2. Backend returns signed upload URL + r2_key
3. Frontend uploads directly to R2
4. Frontend calls POST /reference/tracks with r2_key
5. Backend creates track record
6. (Optional) Frontend calls POST /reference/tracks/:id/analysis
```

### Streaming Flow

```
1. Frontend calls GET /reference/tracks/:id/stream
2. Backend verifies ownership
3. Backend generates signed download URL
4. Frontend uses URL in audio element src
5. Audio streams directly from R2
```

### Annotation Flow

```
1. User pauses playback at point of interest
2. Frontend calls POST /reference/tracks/:id/annotations
3. Backend creates annotation record
4. Frontend displays annotation in overlay
5. Annotations persist across sessions
```

---

## Testing

### Unit Tests

Located in `app/backend/crates/api/src/tests/reference_tests.rs`:

- Auth requirement tests
- CSRF enforcement tests
- IDOR prevention tests
- Annotation CRUD validation tests
- Region CRUD validation tests
- Model tests (enums, pagination)

### Integration Tests (Planned)

- OAuth + track upload flow
- Annotation roundtrip (create, read, update, delete)
- Region roundtrip (create, read, update, delete)
- Analysis job creation and status

---

## Migration Notes

### From Legacy D1

The legacy system stored:
- `reference_tracks` table (similar schema)
- `track_analysis_cache` table (JSON blob)

Migration steps:
1. Export reference_tracks rows
2. Map D1 schema to Postgres schema
3. Import with new UUIDs
4. Leave R2 files in place (keys unchanged if user_id prefix matches)

### Schema Differences

| D1 (Legacy) | Postgres (New) | Notes |
|-------------|----------------|-------|
| `track_analysis_cache` | `track_analyses` | Renamed, structured |
| N/A | `analysis_frame_chunks` | New for large data |
| N/A | `track_annotations` | New table |
| N/A | `track_regions` | New table |

---

## Future Considerations

1. **Listening Prompts:** Guided exercises with scoring
2. **Track Comparison:** Side-by-side analysis of multiple tracks
3. **Shared Tracks:** Collaborate with other users on annotations
4. **AI Analysis:** Automated analysis using ML models
5. **Offline Support:** Cache tracks for offline listening

---

## References

- [ENDPOINT_NAMESPACE_MAP.md](./ENDPOINT_NAMESPACE_MAP.md) - Route mapping
- [FEATURE_OWNERSHIP_MAP.md](./FEATURE_OWNERSHIP_MAP.md) - Feature ownership
- [API_CONTRACTS_PLAN.md](./API_CONTRACTS_PLAN.md) - API standards
- [security_model.md](./security_model.md) - Security details

