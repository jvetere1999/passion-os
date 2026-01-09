"Shared code extraction plan across app/frontend/admin/backend."

# Shared Extraction Plan

**Date:** January 7, 2026  
**Branch:** `refactor/stack-split`  
**Purpose:** Define shared contracts, types, and extraction rules across frontend/admin/backend

---

## Overview

This document defines how code is shared across the three main applications:
1. **Backend** (`app/backend/`) - Rust API
2. **Frontend** (`app/frontend/`) - Next.js user UI
3. **Admin** (`app/admin/`) - Next.js admin UI

---

## Shared Code Locations

```
root/
├── shared/                     # Shared TypeScript packages
│   ├── api-types/              # API contract types
│   │   ├── package.json
│   │   ├── tsconfig.json
│   │   └── src/
│   │       ├── index.ts
│   │       ├── auth.ts
│   │       ├── user.ts
│   │       ├── gamification.ts
│   │       ├── focus.ts
│   │       ├── habits.ts
│   │       ├── goals.ts
│   │       ├── quests.ts
│   │       ├── calendar.ts
│   │       ├── exercise.ts
│   │       ├── market.ts
│   │       ├── reference.ts
│   │       ├── admin.ts
│   │       ├── storage.ts
│   │       └── errors.ts
│   │
│   ├── api-client/             # API client wrapper
│   │   ├── package.json
│   │   ├── tsconfig.json
│   │   └── src/
│   │       ├── index.ts
│   │       ├── client.ts       # Core fetch wrapper
│   │       ├── server.ts       # Server Component client
│   │       ├── hooks.ts        # React hooks (useSWR, etc.)
│   │       └── errors.ts       # Error handling
│   │
│   └── ui-components/          # Shared UI (future, if needed)
│       └── ...
│
├── app/
│   ├── frontend/               # Consumes shared/*
│   ├── admin/                  # Consumes shared/*
│   └── backend/                # Defines API contract (source of truth)
```

---

## Package Relationships

```
┌─────────────────────────────────────────────────────────────┐
│                    app/backend (Rust)                        │
│                    SOURCE OF TRUTH                           │
│                    Defines API responses                     │
└─────────────────────────────────┬───────────────────────────┘
                                  │ Documented in
                                  ▼
┌─────────────────────────────────────────────────────────────┐
│                  shared/api-types (TypeScript)               │
│                  MANUAL SYNC with Rust types                 │
│                  export interface User { ... }               │
└────────────────────┬────────────────────────────────────────┘
                     │ Imported by
          ┌──────────┴──────────┐
          ▼                     ▼
┌─────────────────────┐  ┌─────────────────────┐
│  shared/api-client  │  │  (direct import)    │
│  Typed fetch wrapper│  │  in frontend/admin  │
└─────────┬───────────┘  └──────────┬──────────┘
          │                         │
          ▼                         ▼
┌─────────────────────┐  ┌─────────────────────┐
│   app/frontend      │  │   app/admin         │
│   (imports both)    │  │   (imports both)    │
└─────────────────────┘  └─────────────────────┘
```

---

## API Types Package (`shared/api-types/`)

### Purpose

Single source of TypeScript types for API contracts. Mirrors Rust response types.

### Structure

```typescript
// shared/api-types/src/index.ts
export * from './auth';
export * from './user';
export * from './gamification';
export * from './focus';
export * from './habits';
export * from './goals';
export * from './quests';
export * from './calendar';
export * from './exercise';
export * from './market';
export * from './reference';
export * from './admin';
export * from './storage';
export * from './errors';
```

### Type Conventions

```typescript
// Request types (input)
export interface CreateFocusSessionRequest {
  mode: FocusMode;
  duration_seconds: number;
}

// Response types (output)
export interface FocusSession {
  id: string;
  user_id: string;
  mode: FocusMode;
  duration_seconds: number;
  started_at: string; // ISO 8601
  completed_at: string | null;
  xp_awarded: number | null;
}

// List response envelope
export interface ListResponse<T> {
  data: T[];
  total: number;
  page: number;
  page_size: number;
}

// Single item response envelope
export interface DataResponse<T> {
  data: T;
}
```

### Sync with Rust

Types in `shared/api-types/` must match Rust types in `app/backend/`.

| Rust Type | TypeScript Type | Location |
|-----------|-----------------|----------|
| `struct User` | `interface User` | `shared/api-types/src/user.ts` |
| `struct Session` | `interface Session` | `shared/api-types/src/auth.ts` |
| `enum AppError` | `interface ApiError` | `shared/api-types/src/errors.ts` |

**Sync Responsibility:** Manual. When Rust types change, update TypeScript types.

**Future:** Consider code generation (e.g., `typeshare`, `specta`) for automatic sync.

---

## API Client Package (`shared/api-client/`)

### Purpose

Typed fetch wrapper for calling the backend API.

### Core Client

```typescript
// shared/api-client/src/client.ts
import type { ApiError } from '@ignition/api-types';

const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'https://api.ecent.online';

export async function apiRequest<T>(
  path: string,
  options: RequestInit = {}
): Promise<T> {
  const response = await fetch(`${API_BASE}${path}`, {
    ...options,
    credentials: 'include',
    headers: {
      'Content-Type': 'application/json',
      ...options.headers,
    },
  });

  if (!response.ok) {
    const error: ApiError = await response.json().catch(() => ({
      error: 'Unknown error',
      code: 'UNKNOWN',
    }));
    throw new ApiRequestError(response.status, error);
  }

  return response.json();
}

export class ApiRequestError extends Error {
  constructor(
    public status: number,
    public error: ApiError
  ) {
    super(error.error);
    this.name = 'ApiRequestError';
  }
}
```

### Server Component Client

```typescript
// shared/api-client/src/server.ts
import { cookies } from 'next/headers';

export async function serverApiRequest<T>(
  path: string,
  options: RequestInit = {}
): Promise<T> {
  const cookieStore = cookies();
  const sessionCookie = cookieStore.get('session');

  return apiRequest<T>(path, {
    ...options,
    headers: {
      ...options.headers,
      Cookie: sessionCookie ? `session=${sessionCookie.value}` : '',
    },
  });
}
```

### React Hooks

```typescript
// shared/api-client/src/hooks.ts
import useSWR from 'swr';
import { apiRequest } from './client';

export function useApi<T>(path: string | null) {
  return useSWR<T>(path, apiRequest);
}

export function useUser() {
  return useApi<User>('/auth/session');
}

export function useFocusSessions() {
  return useApi<ListResponse<FocusSession>>('/focus');
}
```

---

## Frontend/Admin Shared UI Conventions

### Component Sharing Strategy

| Approach | When to Use | Location |
|----------|-------------|----------|
| **Duplicate** | Simple, rarely changes | Each app's `components/` |
| **Shared Package** | Complex, reused | `shared/ui-components/` |
| **Headless** | Behavior only | `shared/hooks/` |

### Current State

For MVP, **duplicate** components in each app. Create shared package only when:
- Component is complex (>100 lines)
- Component is used identically in both apps
- Component has non-trivial state management

### Shared UI Package (Future)

```
shared/ui-components/
├── package.json
├── tsconfig.json
└── src/
    ├── index.ts
    ├── Button.tsx
    ├── Card.tsx
    ├── Modal.tsx
    └── ...
```

**NOT Shared:**
- Page layouts (different per app)
- App-specific features
- Auth UI (handled by backend redirects)

---

## Extraction Rules

### Rule 1: No Circular Dependencies

```
✅ Allowed:
shared/api-client → shared/api-types

❌ Not Allowed:
shared/api-types → shared/api-client
app/frontend → shared/* → app/frontend
```

### Rule 2: No Utils Dump

```
✅ Good:
shared/api-types/src/focus.ts      // Focus domain types
shared/api-types/src/gamification.ts // Gamification types

❌ Bad:
shared/utils/index.ts              // Random helpers
shared/common/helpers.ts           // Grab bag
```

**Rule:** Each file in shared packages must have a clear, documented purpose.

### Rule 3: Stable Interfaces

```
✅ Good:
// Version-stable interface
export interface User {
  id: string;
  email: string;
  name: string | null;
}

❌ Bad:
// Internal implementation detail
export interface UserRow {
  _id: Buffer;
  _email: string;
  _name: string | undefined;
}
```

**Rule:** Shared types are API contracts. Internal types stay in the consuming app.

### Rule 4: Single Source of Truth

| Concept | Source of Truth | Consumers |
|---------|-----------------|-----------|
| API response shape | Rust backend | shared/api-types |
| Database schema | Postgres migrations | Rust backend |
| Business rules | Rust services | (none, backend-only) |
| UI components | Each app | (not shared by default) |

### Rule 5: No Business Logic in Shared

```
✅ Good (types only):
export interface XpAward {
  amount: number;
  reason: string;
}

❌ Bad (business logic):
export function calculateLevel(xp: number): number {
  return Math.floor(Math.sqrt(xp / 100));
}
```

**Rule:** Business logic lives in backend only. Frontend only displays.

---

## Import Paths

### Frontend (`app/frontend/`)

```typescript
// API types
import type { User, FocusSession } from '@ignition/api-types';

// API client
import { useApi, apiRequest } from '@ignition/api-client';

// Local components
import { FocusTimer } from '@/components/focus/FocusTimer';
```

### Admin (`app/admin/`)

```typescript
// Same API imports
import type { User, AdminStats } from '@ignition/api-types';
import { serverApiRequest } from '@ignition/api-client/server';

// Local admin components
import { UserTable } from '@/components/admin/UserTable';
```

### Package.json Configuration

```json
// app/frontend/package.json
{
  "dependencies": {
    "@ignition/api-types": "workspace:*",
    "@ignition/api-client": "workspace:*"
  }
}
```

```json
// shared/api-client/package.json
{
  "dependencies": {
    "@ignition/api-types": "workspace:*"
  }
}
```

---

## Type Sync Process

### When Backend Changes

1. Update Rust types in `app/backend/`
2. Update corresponding TypeScript types in `shared/api-types/`
3. Run typecheck in frontend/admin to catch mismatches
4. Update any affected components

### Checklist for Type Changes

- [ ] Rust type updated
- [ ] TypeScript type updated
- [ ] Response envelope consistent
- [ ] Optional fields marked correctly
- [ ] Date fields are ISO strings
- [ ] `npm run typecheck` passes in frontend
- [ ] `npm run typecheck` passes in admin

---

## Workspace Configuration

### Root package.json

```json
{
  "private": true,
  "workspaces": [
    "shared/*",
    "app/frontend",
    "app/admin"
  ]
}
```

### Shared Package Template

```json
// shared/api-types/package.json
{
  "name": "@ignition/api-types",
  "version": "0.1.0",
  "private": true,
  "main": "./dist/index.js",
  "types": "./dist/index.d.ts",
  "scripts": {
    "build": "tsc",
    "typecheck": "tsc --noEmit"
  },
  "devDependencies": {
    "typescript": "^5.x"
  }
}
```

---

## Migration Path

### Phase 1: Types Extraction (Done)

- [x] Create `shared/api-types/`
- [x] Move API type definitions
- [x] Update frontend imports

### Phase 2: Client Extraction (Done)

- [x] Create `shared/api-client/`
- [x] Implement typed fetch wrapper
- [x] Add React hooks

### Phase 3: Admin Integration (Ready)

- [ ] Configure admin to use shared packages
- [ ] Migrate admin API calls

### Phase 4: Component Evaluation (Future)

- [ ] Identify truly shared components
- [ ] Create `shared/ui-components/` if needed
- [ ] Keep app-specific components local

---

## Anti-Patterns to Avoid

### 1. Leaking Internal Types

```typescript
// ❌ Bad: Internal DB type in shared
export interface UserRow {
  user_id: Buffer;
  email_address: string;
}

// ✅ Good: API contract type
export interface User {
  id: string;
  email: string;
}
```

### 2. Shared State

```typescript
// ❌ Bad: Shared mutable state
export const globalUser = { current: null };

// ✅ Good: State in consuming app
// (React context, Zustand, etc.)
```

### 3. Environment-Specific Code

```typescript
// ❌ Bad: Frontend-only code in shared
import { useRouter } from 'next/router';

// ✅ Good: Pure types only
export interface NavigationState { ... }
```

### 4. Over-Abstraction

```typescript
// ❌ Bad: Abstract for one consumer
export interface GenericCrudResource<T> {
  list(): Promise<T[]>;
  get(id: string): Promise<T>;
  ...
}

// ✅ Good: Concrete, specific
export interface FocusService {
  getSessions(): Promise<FocusSession[]>;
  getActiveSession(): Promise<FocusSession | null>;
  ...
}
```

---

## References

- [BACKEND_SUBMODS_LAYOUT.md](./BACKEND_SUBMODS_LAYOUT.md) - Backend structure
- [FEATURE_OWNERSHIP_MAP.md](./FEATURE_OWNERSHIP_MAP.md) - Feature ownership
- [api_contract_strategy.md](./api_contract_strategy.md) - API contract details
- [docs/frontend/consuming-api-types.md](../../frontend/consuming-api-types.md) - Frontend usage

