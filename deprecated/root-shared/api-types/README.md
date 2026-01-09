# @ignition/api-types

Shared API types for Ignition frontend and admin applications.

## Installation

This package is part of the Ignition monorepo and is consumed via npm workspaces.

```bash
# From root of monorepo
npm install
```

## Usage

```typescript
import type { 
  User, 
  ApiResponse, 
  FocusSession,
  BlobInfo,
} from '@ignition/api-types';

import { 
  isAllowedMimeType, 
  ApiClientError,
  getCategoryFromMimeType,
} from '@ignition/api-types';
```

## Type Categories

### Common Types

| Type | Description |
|------|-------------|
| `UUID` | UUID string alias |
| `ISOTimestamp` | ISO 8601 timestamp string |
| `ApiResponse<T>` | Standard response envelope |
| `ApiError` | Error response format |

### Auth Types

| Type | Description |
|------|-------------|
| `User` | User entity |
| `Session` | Session entity |
| `UserRole` | User role enum |
| `OAuthProvider` | OAuth provider enum |

### Storage Types

| Type | Description |
|------|-------------|
| `BlobInfo` | Blob metadata |
| `UploadResponse` | Upload result |
| `SignedUrlResponse` | Presigned URL |
| `BlobCategory` | Blob category enum |

### Focus Types

| Type | Description |
|------|-------------|
| `FocusSession` | Focus session entity |
| `FocusMode` | Focus mode enum |
| `CreateFocusRequest` | Create request |

### Gamification Types

| Type | Description |
|------|-------------|
| `UserProgress` | XP and level progress |
| `UserWallet` | Wallet balance |
| `Achievement` | Achievement definition |
| `UserAchievement` | Unlocked achievement |

## Constants

```typescript
import { 
  ALLOWED_MIME_TYPES,
  SIZE_LIMITS,
  SIGNED_URL_EXPIRY,
} from '@ignition/api-types';

// ALLOWED_MIME_TYPES: readonly string[]
// SIZE_LIMITS: { MAX_FILE_SIZE, MAX_AUDIO_SIZE, MAX_IMAGE_SIZE }
// SIGNED_URL_EXPIRY: { DOWNLOAD, UPLOAD }
```

## Helper Functions

```typescript
import { 
  isAllowedMimeType,
  getCategoryFromMimeType,
  getMaxSizeForMime,
  isSuccess,
  isClientError,
  isServerError,
} from '@ignition/api-types';
```

## Error Handling

```typescript
import { ApiClientError, isApiClientError, getErrorMessage } from '@ignition/api-types';

try {
  const response = await apiClient.get('/api/user/me');
} catch (error) {
  if (isApiClientError(error)) {
    if (error.isAuthError()) {
      // Redirect to login
    }
    console.error(error.message, error.type, error.details);
  }
}
```

## Development

```bash
# Type check
npm run typecheck

# Build
npm run build
```

## Source of Truth

These types mirror the Rust types in:

- `app/backend/crates/api/src/db/models.rs`
- `app/backend/crates/api/src/storage/types.rs`
- `app/backend/crates/api/src/routes/*.rs`

See [api_contract_strategy.md](../../docs/backend/migration/api_contract_strategy.md) for the full strategy.

