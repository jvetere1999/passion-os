# @ignition/api-client

Shared API client for Ignition frontend and admin applications.

## Installation

This package is part of the Ignition monorepo and is consumed via npm workspaces.

```bash
# From root of monorepo
npm install
```

## Features

- **Type-safe**: Full TypeScript support with types from `@ignition/api-types`
- **Browser & Server**: Works in both client components and server components
- **React Hooks**: Built-in hooks for data fetching and mutations
- **Error Handling**: Consistent error handling with `ApiClientError`
- **CSRF Protection**: Automatic Origin header for state-changing requests
- **Cookie Forwarding**: Automatic credential handling

## Usage

### Browser / Client Components

```typescript
import { api, ApiClient, configureApiClient } from '@ignition/api-client';
import type { User, FocusSession } from '@ignition/api-types';

// Using default client
const user = await api.get<User>('/api/user/me');
const session = await api.post<FocusSession>('/api/focus', { 
  mode: 'focus', 
  duration_minutes: 25 
});

// Configure default client
configureApiClient({
  baseUrl: 'https://api.ecent.online',
  onAuthError: () => {
    window.location.href = '/auth/signin';
  },
});

// Or create custom client instance
const client = new ApiClient({ 
  baseUrl: 'https://api.example.com' 
});
const data = await client.get<User>('/api/user/me');
```

### Server Components

```typescript
import { createServerClient } from '@ignition/api-client';
import { cookies } from 'next/headers';
import type { User } from '@ignition/api-types';

export async function getCurrentUser(): Promise<User | null> {
  const cookieStore = await cookies();
  const session = cookieStore.get('session');
  
  if (!session) return null;

  try {
    const client = createServerClient();
    return await client.get<User>('/api/user/me', { 
      sessionCookie: session.value,
      cache: 'no-store',
    });
  } catch {
    return null;
  }
}
```

### React Hooks

```typescript
import { useFetch, useMutation, useUpload } from '@ignition/api-client';
import type { User, FocusSession, CreateFocusRequest } from '@ignition/api-types';

function UserProfile() {
  const { data: user, loading, error, refetch } = useFetch<User>('/api/user/me');

  if (loading) return <div>Loading...</div>;
  if (error) return <div>Error: {error.message}</div>;
  
  return <div>Hello, {user?.name}</div>;
}

function FocusTimer() {
  const { mutate, loading } = useMutation<FocusSession, CreateFocusRequest>(
    'post', 
    '/api/focus'
  );

  const startSession = async () => {
    const session = await mutate({ mode: 'focus', duration_minutes: 25 });
    console.log('Started session:', session.id);
  };

  return (
    <button onClick={startSession} disabled={loading}>
      {loading ? 'Starting...' : 'Start Focus'}
    </button>
  );
}

function FileUploader() {
  const { upload, loading, progress, error } = useUpload<UploadResponse>('/api/blobs/upload');

  const handleFile = async (file: File) => {
    const result = await upload(file);
    console.log('Uploaded:', result.id);
  };

  return (
    <input 
      type="file" 
      onChange={e => e.target.files?.[0] && handleFile(e.target.files[0])} 
      disabled={loading}
    />
  );
}
```

## Error Handling

```typescript
import { api, ApiClientError } from '@ignition/api-client';

try {
  await api.post('/api/some-endpoint', data);
} catch (error) {
  if (error instanceof ApiClientError) {
    if (error.isAuthError()) {
      // Redirect to login
      window.location.href = '/auth/signin';
    } else if (error.isValidationError()) {
      // Show validation errors
      console.error('Validation failed:', error.details);
    } else if (error.isCsrfError()) {
      // CSRF token issue - refresh page
      window.location.reload();
    } else {
      // General error
      console.error(error.message);
    }
  }
}
```

## Configuration

```typescript
import { configureApiClient } from '@ignition/api-client';

configureApiClient({
  // Base URL for all requests
  baseUrl: 'https://api.ecent.online',
  
  // Include cookies (default: 'include')
  credentials: 'include',
  
  // Request timeout in ms (default: 30000)
  timeout: 30000,
  
  // Custom headers for all requests
  headers: {
    'X-Client-Version': '1.0.0',
  },
  
  // Hook called on auth errors
  onAuthError: () => {
    window.location.href = '/auth/signin';
  },
  
  // Hook called on CSRF errors
  onCsrfError: () => {
    window.location.reload();
  },
});
```

## API Reference

### `api` Object

Convenience methods using the default client:

- `api.get<T>(path, options?)` - GET request
- `api.post<T, B>(path, body?, options?)` - POST request
- `api.put<T, B>(path, body?, options?)` - PUT request
- `api.patch<T, B>(path, body?, options?)` - PATCH request
- `api.delete<T>(path, options?)` - DELETE request
- `api.upload<T>(path, file, fieldName?, additionalFields?, options?)` - File upload

### `ApiClient` Class

Create custom client instances:

```typescript
const client = new ApiClient(config);
```

### `createServerClient()` Function

Create a server-side client for Server Components:

```typescript
const client = createServerClient(baseUrl?);
```

### Hooks

- `useFetch<T>(path, options?)` - Fetch data with loading state
- `useMutation<T, B>(method, path)` - Mutations with loading state
- `useUpload<T>(path)` - File uploads with progress

## See Also

- [@ignition/api-types](../api-types/README.md) - Shared TypeScript types
- [consuming-api-types.md](../../docs/frontend/consuming-api-types.md) - Frontend guide
- [api_contract_strategy.md](../../docs/backend/migration/api_contract_strategy.md) - API strategy

