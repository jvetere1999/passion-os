"API contracts plan defining response envelopes, pagination, auth, idempotency, and rate limits."

# API Contracts Plan

**Date:** January 7, 2026  
**Branch:** `refactor/stack-split`  
**Purpose:** Lock down stable backend API contracts to minimize drift during migration

---

## Overview

This document defines the API contract standards that ALL backend endpoints must follow. These contracts are immutable once deployed to production.

---

## Contract Version

| Field | Value |
|-------|-------|
| **Contract Version** | `v1` |
| **Base URL (Production)** | `https://api.ecent.online` |
| **Base URL (Development)** | `http://localhost:8080` |
| **Content-Type** | `application/json` (unless streaming) |

---

## Response Envelope

### Standard Success Response

All successful responses use a consistent envelope:

```json
{
  "data": <T>,
  "meta": {
    "request_id": "req_abc123def456"
  }
}
```

### List Response (Paginated)

```json
{
  "data": [<T>, <T>, ...],
  "meta": {
    "request_id": "req_abc123def456",
    "pagination": {
      "total": 150,
      "page": 1,
      "page_size": 20,
      "total_pages": 8,
      "has_next": true,
      "has_prev": false
    }
  }
}
```

### Error Response

See [ERROR_AND_VALIDATION_STANDARD.md](./ERROR_AND_VALIDATION_STANDARD.md) for full error types.

```json
{
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Input validation failed",
    "details": { ... }
  },
  "meta": {
    "request_id": "req_abc123def456"
  }
}
```

### Empty Success (204 No Content)

Operations that return no data (e.g., DELETE) return `204 No Content` with no body.

---

## Pagination Standard

### Request Parameters

| Parameter | Type | Default | Max | Description |
|-----------|------|---------|-----|-------------|
| `page` | integer | 1 | 1000 | 1-indexed page number |
| `page_size` | integer | 20 | 100 | Items per page |
| `sort` | string | varies | - | Sort field (e.g., `created_at`) |
| `order` | string | `desc` | - | `asc` or `desc` |

### Example Request

```
GET /focus?page=2&page_size=10&sort=started_at&order=desc
```

### Pagination Response Fields

| Field | Type | Description |
|-------|------|-------------|
| `total` | integer | Total items across all pages |
| `page` | integer | Current page number |
| `page_size` | integer | Items per page |
| `total_pages` | integer | Total number of pages |
| `has_next` | boolean | True if more pages exist |
| `has_prev` | boolean | True if previous pages exist |

### Cursor-Based Pagination (Future)

For high-volume endpoints, cursor-based pagination may be added:

```json
{
  "pagination": {
    "cursor": "eyJpZCI6MTAwfQ==",
    "has_next": true
  }
}
```

Request: `GET /events?cursor=eyJpZCI6MTAwfQ==&limit=50`

---

## Authentication Expectations

### Auth Levels

| Level | Description | Cookie Required | Session Valid | Role Check |
|-------|-------------|-----------------|---------------|------------|
| **Public** | No auth required | No | No | No |
| **User** | Authenticated user | Yes | Yes | No |
| **Admin** | Admin role required | Yes | Yes | `role = admin` |

### Cookie-Based Auth

All authenticated requests must include the session cookie:

```
Cookie: session=<token>; Domain=ecent.online; Path=/; HttpOnly; Secure; SameSite=None
```

### Auth Errors

| Condition | HTTP Status | Error Code |
|-----------|-------------|------------|
| No session cookie | 401 | `UNAUTHENTICATED` |
| Session expired | 401 | `SESSION_EXPIRED` |
| User lacks role | 403 | `FORBIDDEN` |
| CSRF violation | 403 | `CSRF_VIOLATION` |

### CSRF Protection

State-changing requests (POST, PUT, PATCH, DELETE) require valid Origin/Referer header:

**Allowed Origins:**
- `https://ignition.ecent.online`
- `https://admin.ignition.ecent.online`
- `http://localhost:3000` (dev only)
- `http://localhost:3001` (dev only)

### Session Requirements by Endpoint

| Namespace | Auth Level | Notes |
|-----------|------------|-------|
| `/health` | Public | Liveness/readiness |
| `/auth/login/*` | Public | OAuth initiation |
| `/auth/callback/*` | Public | OAuth callback |
| `/auth/logout` | User | End session |
| `/auth/session` | User | Get current session |
| `/auth/*` | User | Other auth endpoints |
| `/blobs/*` | User | Storage operations |
| `/focus/*` | User | Focus sessions |
| `/habits/*` | User | Habits |
| `/goals/*` | User | Goals |
| `/quests/*` | User | Quests |
| `/calendar/*` | User | Calendar |
| `/daily-plan/*` | User | Daily planning |
| `/exercise/*` | User | Exercise |
| `/programs/*` | User | Training programs |
| `/books/*` | User | Book tracking |
| `/learn/*` | User | Learning |
| `/market/*` | User | Market |
| `/gamification/*` | User | Gamification |
| `/reference/*` | User | Reference tracks |
| `/onboarding/*` | User | Onboarding |
| `/user/*` | User | User data |
| `/feedback/*` | User | Feedback |
| `/infobase/*` | User | Knowledge base |
| `/ideas/*` | User | Ideas |
| `/analysis/*` | User | Track analysis |
| `/admin/*` | Admin | All admin operations |

---

## Idempotency

### Idempotent Operations

| Method | Idempotent | Notes |
|--------|------------|-------|
| GET | Yes | Always safe |
| HEAD | Yes | Always safe |
| PUT | Yes | Full resource replacement |
| DELETE | Yes | Delete by ID |
| POST | **No** | Creates new resource |
| PATCH | **No** | Partial update |

### Idempotency Key (Optional)

For critical operations, clients may include an idempotency key:

```
Idempotency-Key: <uuid>
```

**Behavior:**
- If the same key is sent within 24 hours, return the cached response
- Key is scoped to user + endpoint
- Useful for: purchase, delete, complete operations

**Supported Endpoints:**
- `POST /market/purchase` - Prevent double purchase
- `POST /focus/:id/complete` - Prevent double XP
- `DELETE /user/delete` - Prevent duplicate deletion

### Implementation

```rust
// Backend checks idempotency cache before processing
if let Some(cached) = idempotency_cache.get(&key) {
    return cached.clone();
}
let result = process_request().await;
idempotency_cache.set(&key, &result, Duration::hours(24));
return result;
```

---

## Rate Limiting

### Default Limits

| Auth Level | Limit | Window | Notes |
|------------|-------|--------|-------|
| Public | 20 | 1 minute | OAuth endpoints |
| User | 100 | 1 minute | Most endpoints |
| Admin | 200 | 1 minute | Admin operations |

### Per-Endpoint Limits

| Endpoint | Limit | Window | Reason |
|----------|-------|--------|--------|
| `/auth/login/*` | 10 | 1 minute | Prevent brute force |
| `/blobs/upload` | 20 | 1 minute | Storage abuse |
| `/reference/upload` | 10 | 1 minute | Large files |
| `/market/purchase` | 5 | 1 minute | Economic abuse |
| `/user/export` | 2 | 1 hour | Expensive operation |
| `/admin/backup` | 1 | 1 hour | Very expensive |

### Rate Limit Headers

All responses include rate limit headers:

```
X-RateLimit-Limit: 100
X-RateLimit-Remaining: 95
X-RateLimit-Reset: 1704067200
```

### Rate Limited Response

```json
{
  "error": {
    "code": "RATE_LIMITED",
    "message": "Too many requests",
    "details": {
      "retry_after": 45
    }
  }
}
```

HTTP Status: `429 Too Many Requests`
Header: `Retry-After: 45`

---

## Request ID

Every request is assigned a unique ID:

- **Header:** `X-Request-ID`
- **Format:** `req_<ulid>` (e.g., `req_01ARZ3NDEKTSV4RRFFQ69G5FAV`)
- **Included in:** Response envelope, logs, error responses

Clients may pass their own request ID:

```
X-Request-ID: client_req_abc123
```

Backend will use client-provided ID if valid, otherwise generate one.

---

## Content Negotiation

### Request

```
Content-Type: application/json
Accept: application/json
```

### Response

```
Content-Type: application/json; charset=utf-8
```

### Streaming Endpoints

| Endpoint | Content-Type | Notes |
|----------|--------------|-------|
| `/reference/tracks/:id/stream` | `audio/*` | Audio streaming |
| `/blobs/:id` | Varies by blob | Binary download |
| `/user/export` | `application/zip` | Export download |

---

## Versioning Strategy

### Current Approach: No Explicit Versioning

Per copilot-instructions: "No back-compat and no public API guarantees."

During migration, the API is internal-only. Breaking changes are allowed.

### Future Consideration

If public API is needed later:

1. **URL prefix:** `/v1/focus`, `/v2/focus`
2. **Header:** `Accept: application/vnd.ignition.v1+json`

Not implemented for MVP.

---

## Date/Time Format

All dates and times use ISO 8601 format in UTC:

```json
{
  "created_at": "2026-01-07T14:30:00Z",
  "updated_at": "2026-01-07T15:45:30Z",
  "expires_at": "2026-02-07T14:30:00Z"
}
```

### Duration Format

Durations use seconds (integer):

```json
{
  "duration_seconds": 1500,
  "remaining_seconds": 300
}
```

---

## Null vs Absent Fields

### Rules

| Scenario | Representation |
|----------|----------------|
| Field has no value | `"field": null` |
| Field not applicable | Omit from response |
| Field unknown | Omit from response |

### Example

```json
{
  "id": "abc123",
  "name": "Focus Session",
  "completed_at": null,     // Not completed yet
  // description omitted - not applicable
}
```

---

## Boolean Representation

Always use JSON booleans, never strings:

```json
{
  "is_active": true,
  "is_completed": false,
  "age_verified": true
}
```

---

## ID Format

### UUID Format

Most IDs use UUIDv4:

```json
{
  "id": "550e8400-e29b-41d4-a716-446655440000"
}
```

### Special ID Formats

| Entity | Format | Example |
|--------|--------|---------|
| User ID | UUID | `550e8400-e29b-41d4-...` |
| Session Token | Random string | `abc123def456...` (64 chars) |
| Request ID | ULID with prefix | `req_01ARZ3NDEKTSV...` |
| Blob Key | Path format | `usr_abc123/audio/uuid.mp3` |

---

## Contract Stability Rules

### Breaking Changes (Not Allowed Once Deployed)

- Removing fields from responses
- Changing field types
- Renaming fields
- Changing error codes for same conditions
- Removing endpoints

### Non-Breaking Changes (Allowed)

- Adding new optional fields to responses
- Adding new endpoints
- Adding new optional request parameters
- Adding new error codes for new conditions

### Deprecation Process (Future)

1. Mark field as deprecated in docs
2. Add `X-Deprecated` header
3. Wait 2 release cycles
4. Remove in major version

---

## Contract Testing

### Required Tests

Each endpoint must have:

1. **Happy path test:** Valid request → expected response shape
2. **Auth test:** Missing auth → 401
3. **Validation test:** Invalid input → 400 with details
4. **Not found test:** Missing resource → 404

### Contract Test Example

```typescript
test('GET /focus returns paginated list', async () => {
  const response = await api.get('/focus?page=1&page_size=10');
  
  expect(response.status).toBe(200);
  expect(response.body).toMatchObject({
    data: expect.any(Array),
    meta: {
      request_id: expect.stringMatching(/^req_/),
      pagination: {
        total: expect.any(Number),
        page: 1,
        page_size: 10,
      }
    }
  });
});
```

---

## References

- [ERROR_AND_VALIDATION_STANDARD.md](./ERROR_AND_VALIDATION_STANDARD.md) - Error types
- [SHARED_TYPES_STRATEGY.md](./SHARED_TYPES_STRATEGY.md) - Type sharing
- [ENDPOINT_NAMESPACE_MAP.md](./ENDPOINT_NAMESPACE_MAP.md) - Endpoint organization
- [security_model.md](./security_model.md) - Auth details

