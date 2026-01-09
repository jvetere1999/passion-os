/**
 * @ignition/api-client
 *
 * Shared API client for Ignition frontend and admin applications.
 * Single entry point for all API communication with the backend.
 *
 * @example Browser/Client Component
 * ```typescript
 * import { api, ApiClient, configureApiClient } from '@ignition/api-client';
 * import type { User } from '@ignition/api-types';
 *
 * // Simple usage with default client
 * const user = await api.get<User>('/api/user/me');
 *
 * // Or create custom client
 * const client = new ApiClient({ baseUrl: 'https://api.example.com' });
 * const data = await client.get<User>('/api/user/me');
 * ```
 *
 * @example Server Component
 * ```typescript
 * import { createServerClient } from '@ignition/api-client/server';
 * import { cookies } from 'next/headers';
 *
 * const cookieStore = await cookies();
 * const session = cookieStore.get('session');
 *
 * const client = createServerClient();
 * const user = await client.get('/api/user/me', {
 *   sessionCookie: session?.value
 * });
 * ```
 *
 * @example React Hooks
 * ```typescript
 * import { useFetch, useMutation } from '@ignition/api-client/hooks';
 *
 * function MyComponent() {
 *   const { data, loading, error } = useFetch<User>('/api/user/me');
 *   const { mutate, loading: saving } = useMutation<void, UpdateUserRequest>('patch', '/api/user/me');
 * }
 * ```
 */

// ============================================
// Client
// ============================================
export {
  ApiClient,
  ApiClientError,
  getApiClient,
  configureApiClient,
  api,
  type ApiRequestOptions,
} from './client.js';

// ============================================
// Configuration
// ============================================
export {
  type ApiClientConfig,
  DEFAULT_CONFIG,
  DEV_CONFIG,
  getDefaultConfig,
} from './config.js';

// ============================================
// Server (for Server Components)
// ============================================
export {
  ServerApiClient,
  createServerClient,
  type ServerRequestOptions,
} from './server.js';

// ============================================
// React Hooks
// ============================================
export {
  useFetch,
  useMutation,
  useUpload,
  type AsyncState,
  type UseFetchOptions,
} from './hooks.js';

