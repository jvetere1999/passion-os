"Shared types strategy defining source of truth, consumption patterns, and drift prevention."

# Shared Types Strategy

**Date:** January 7, 2026  
**Branch:** `refactor/stack-split`  
**Purpose:** Define single source of truth for API types and drift prevention mechanisms

---

## Overview

This document defines how API types are shared across the backend, frontend, and admin console while preventing type drift.

---

## Source of Truth Hierarchy

```
┌─────────────────────────────────────────────────────────────┐
│                   1. Rust Backend Types                      │
│                      (Source of Truth)                       │
│               app/backend/crates/api/src/                    │
└──────────────────────────┬──────────────────────────────────┘
                           │
                           │ Manually synced to
                           ▼
┌─────────────────────────────────────────────────────────────┐
│                2. TypeScript API Types                       │
│               shared/api-types/src/*.ts                      │
│                   (Contract Mirror)                          │
└──────────────────────────┬──────────────────────────────────┘
                           │
                           │ Imported by
          ┌────────────────┼────────────────┐
          ▼                ▼                ▼
┌─────────────────┐ ┌─────────────┐ ┌─────────────────┐
│ shared/api-     │ │ app/        │ │ app/            │
│ client          │ │ frontend    │ │ admin           │
└─────────────────┘ └─────────────┘ └─────────────────┘
```

---

## Layer Definitions

### Layer 1: Rust Backend Types (Source of Truth)

**Location:** `app/backend/crates/api/src/`

**Responsibility:** Define the actual API response shapes.

**Files:**
```
src/
├── routes/
│   └── features/
│       ├── focus.rs        # FocusSession struct
│       ├── habits.rs       # Habit, HabitLog structs
│       └── ...
├── db/
│   └── models.rs           # Database row types
└── error.rs                # AppError enum
```

**Example:**
```rust
// app/backend/crates/api/src/routes/features/focus.rs
#[derive(Serialize)]
pub struct FocusSession {
    pub id: Uuid,
    pub user_id: Uuid,
    pub mode: String,
    pub duration_seconds: i32,
    pub started_at: DateTime<Utc>,
    pub completed_at: Option<DateTime<Utc>>,
    pub xp_awarded: Option<i32>,
}
```

### Layer 2: TypeScript API Types (Contract Mirror)

**Location:** `shared/api-types/src/`

**Responsibility:** Mirror Rust types for TypeScript consumers.

**Package Name:** `@ignition/api-types`

**Files:**
```
src/
├── index.ts            # Re-exports
├── common.ts           # Shared types (pagination, envelope)
├── errors.ts           # Error types
├── auth.ts             # Auth types
├── focus.ts            # Focus types
├── habits.ts           # Habit types
├── goals.ts            # Goal types
├── quests.ts           # Quest types
├── calendar.ts         # Calendar types
├── exercise.ts         # Exercise types
├── market.ts           # Market types
├── gamification.ts     # Gamification types
├── reference.ts        # Reference track types
├── onboarding.ts       # Onboarding types
├── user.ts             # User types
├── storage.ts          # Blob storage types
└── admin.ts            # Admin types
```

**Example:**
```typescript
// shared/api-types/src/focus.ts
export interface FocusSession {
  id: string;
  user_id: string;
  mode: FocusMode;
  duration_seconds: number;
  started_at: string;      // ISO 8601
  completed_at: string | null;
  xp_awarded: number | null;
}

export type FocusMode = 'deep' | 'light' | 'pomodoro';
```

### Layer 3: API Client (Consumer)

**Location:** `shared/api-client/src/`

**Responsibility:** Typed fetch wrapper using `@ignition/api-types`.

**Package Name:** `@ignition/api-client`

**Depends on:** `@ignition/api-types`

---

## Type Categories

### Response Types

Types returned by the API in response bodies.

```typescript
// Response type - what the API returns
export interface FocusSession {
  id: string;
  user_id: string;
  mode: FocusMode;
  // ...
}
```

### Request Types

Types for request bodies (POST, PUT, PATCH).

```typescript
// Request type - what the client sends
export interface CreateFocusSessionRequest {
  mode: FocusMode;
  duration_seconds: number;
}

export interface UpdateHabitRequest {
  name?: string;
  frequency?: HabitFrequency;
}
```

### Enum Types

Constrained string values.

```typescript
export type FocusMode = 'deep' | 'light' | 'pomodoro';
export type HabitFrequency = 'daily' | 'weekly' | 'custom';
export type GoalStatus = 'active' | 'completed' | 'archived';
```

### Envelope Types

Standard response wrappers.

```typescript
// common.ts
export interface DataResponse<T> {
  data: T;
  meta: ResponseMeta;
}

export interface ListResponse<T> {
  data: T[];
  meta: ResponseMeta & {
    pagination: PaginationMeta;
  };
}

export interface ResponseMeta {
  request_id: string;
}

export interface PaginationMeta {
  total: number;
  page: number;
  page_size: number;
  total_pages: number;
  has_next: boolean;
  has_prev: boolean;
}
```

---

## Naming Conventions

### Response Types

Named after the resource:

```typescript
// Good
export interface FocusSession { ... }
export interface Habit { ... }
export interface User { ... }

// Bad
export interface FocusSessionResponse { ... }
export interface FocusSessionData { ... }
```

### Request Types

Named with action prefix:

```typescript
// Good
export interface CreateFocusSessionRequest { ... }
export interface UpdateHabitRequest { ... }
export interface CompleteFocusSessionRequest { ... }

// Bad
export interface FocusSessionInput { ... }
export interface NewHabit { ... }
```

### List Types

Use plural or explicit array in envelope:

```typescript
// Using envelope (preferred)
ListResponse<FocusSession>

// Alternative explicit
export interface FocusSessionList {
  sessions: FocusSession[];
  total: number;
}
```

---

## Frontend/Admin Consumption

### Import Pattern

```typescript
// In app/frontend or app/admin
import type { 
  FocusSession,
  CreateFocusSessionRequest,
  ListResponse 
} from '@ignition/api-types';

import { useApi, apiRequest } from '@ignition/api-client';
```

### React Hook Usage

```typescript
// Using the API client hooks
import { useApi } from '@ignition/api-client';
import type { FocusSession, ListResponse } from '@ignition/api-types';

function FocusList() {
  const { data, error, isLoading } = useApi<ListResponse<FocusSession>>('/focus');
  
  if (isLoading) return <Spinner />;
  if (error) return <Error error={error} />;
  
  return (
    <ul>
      {data.data.map(session => (
        <FocusItem key={session.id} session={session} />
      ))}
    </ul>
  );
}
```

### Server Component Usage

```typescript
// In Server Component
import { serverApiRequest } from '@ignition/api-client/server';
import type { FocusSession, ListResponse } from '@ignition/api-types';

export default async function FocusPage() {
  const sessions = await serverApiRequest<ListResponse<FocusSession>>('/focus');
  
  return <FocusList sessions={sessions.data} />;
}
```

---

## Drift Prevention Mechanisms

### Mechanism 1: Type Sync Checklist

When Rust types change, follow this checklist:

- [ ] Update Rust struct in `app/backend/`
- [ ] Update TypeScript interface in `shared/api-types/`
- [ ] Run `npm run typecheck` in root
- [ ] Run `cargo check` in backend
- [ ] Update any affected tests
- [ ] Update docs if response shape changed

### Mechanism 2: Contract Tests

Backend tests verify response shapes:

```rust
#[test]
fn test_focus_session_serialization() {
    let session = FocusSession {
        id: Uuid::new_v4(),
        mode: "deep".to_string(),
        // ...
    };
    
    let json = serde_json::to_value(&session).unwrap();
    
    assert!(json["id"].is_string());
    assert!(json["mode"].is_string());
    assert!(json["started_at"].is_string()); // ISO 8601
}
```

Frontend tests verify type expectations:

```typescript
test('FocusSession type matches API response', async () => {
  const response = await fetch('/focus');
  const data: ListResponse<FocusSession> = await response.json();
  
  // TypeScript compiler verifies shape at build time
  const session = data.data[0];
  expect(typeof session.id).toBe('string');
  expect(typeof session.duration_seconds).toBe('number');
});
```

### Mechanism 3: CI Type Check

GitHub Actions runs on every PR:

```yaml
jobs:
  typecheck:
    steps:
      - name: Backend types
        run: cd app/backend && cargo check
      
      - name: Shared types
        run: cd shared/api-types && npm run typecheck
      
      - name: Frontend types
        run: cd app/frontend && npm run typecheck
      
      - name: Admin types
        run: cd app/admin && npm run typecheck
```

### Mechanism 4: Type Generation (Future)

Consider automated generation with:

- **typeshare** - Rust → TypeScript
- **specta** - Rust → TypeScript (with ts-rs)
- **OpenAPI** - Generate from spec

**Current approach:** Manual sync (simpler, full control)

**Migration path:** When type count > 50, evaluate automation

---

## Type File Organization

### Per-Domain Files

Each domain has its own file:

```typescript
// shared/api-types/src/focus.ts
export interface FocusSession { ... }
export interface FocusPauseState { ... }
export type FocusMode = 'deep' | 'light' | 'pomodoro';
export interface CreateFocusSessionRequest { ... }
export interface CompleteFocusSessionRequest { ... }
```

### Barrel Export

```typescript
// shared/api-types/src/index.ts
export * from './common';
export * from './errors';
export * from './auth';
export * from './focus';
export * from './habits';
export * from './goals';
// ... all domains
```

### No Circular Imports

```typescript
// ❌ Bad: circular
// focus.ts imports from gamification.ts
// gamification.ts imports from focus.ts

// ✅ Good: common types in shared location
// focus.ts imports from common.ts
// gamification.ts imports from common.ts
```

---

## Rust to TypeScript Mapping

| Rust Type | TypeScript Type | Notes |
|-----------|-----------------|-------|
| `String` | `string` | |
| `Uuid` | `string` | Serialized as string |
| `i32`, `i64` | `number` | |
| `f32`, `f64` | `number` | |
| `bool` | `boolean` | |
| `Option<T>` | `T \| null` | Use null, not undefined |
| `Vec<T>` | `T[]` | |
| `DateTime<Utc>` | `string` | ISO 8601 format |
| `HashMap<K, V>` | `Record<K, V>` | |
| `enum` (unit) | string union | `type Mode = 'a' \| 'b'` |
| `enum` (data) | tagged union | See below |

### Tagged Union Example

Rust:
```rust
#[derive(Serialize)]
#[serde(tag = "type")]
pub enum PaymentMethod {
    Coins { amount: i32 },
    Premium { subscription_id: String },
}
```

TypeScript:
```typescript
export type PaymentMethod =
  | { type: 'Coins'; amount: number }
  | { type: 'Premium'; subscription_id: string };
```

---

## Anti-Patterns to Avoid

### 1. Duplicating Types

```typescript
// ❌ Bad: defining types in app/frontend
// app/frontend/src/types/focus.ts
interface FocusSession { ... }

// ✅ Good: import from shared
// app/frontend/src/components/Focus.tsx
import type { FocusSession } from '@ignition/api-types';
```

### 2. Any Types

```typescript
// ❌ Bad
const data: any = await response.json();

// ✅ Good
const data: ListResponse<FocusSession> = await response.json();
```

### 3. Inline Type Assertions

```typescript
// ❌ Bad
const session = data as FocusSession;

// ✅ Good: use typed API client
const { data } = useApi<DataResponse<FocusSession>>('/focus/123');
```

### 4. Mutable Shared State

```typescript
// ❌ Bad: shared state in types package
export const currentUser = { value: null };

// ✅ Good: types only, no runtime state
export interface User { ... }
```

---

## Versioning

### Package Version

```json
// shared/api-types/package.json
{
  "name": "@ignition/api-types",
  "version": "0.1.0"
}
```

### Breaking Changes

When breaking changes occur:

1. Bump minor version (pre-1.0: `0.1.0` → `0.2.0`)
2. Update all consumers
3. Document in CHANGELOG

### Changelog

```markdown
// shared/api-types/CHANGELOG.md

## 0.2.0 - 2026-01-15

### Breaking Changes
- `FocusSession.xp_awarded` is now `number | null` (was `number`)

### Added
- `FocusPauseState` interface
```

---

## References

- [API_CONTRACTS_PLAN.md](./API_CONTRACTS_PLAN.md) - API contract standards
- [SHARED_EXTRACTION_PLAN.md](./SHARED_EXTRACTION_PLAN.md) - Overall shared code strategy
- [ERROR_AND_VALIDATION_STANDARD.md](./ERROR_AND_VALIDATION_STANDARD.md) - Error types
- [ENDPOINT_NAMESPACE_MAP.md](./ENDPOINT_NAMESPACE_MAP.md) - Endpoint organization

