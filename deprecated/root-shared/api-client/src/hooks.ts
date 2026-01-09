/**
 * React hooks for API client
 *
 * Provides React-specific utilities and hooks for data fetching
 */

import { useCallback, useEffect, useState } from 'react';
import { getApiClient, ApiClientError } from './client.js';

/**
 * State for async operations
 */
export interface AsyncState<T> {
  data: T | null;
  loading: boolean;
  error: ApiClientError | null;
}

/**
 * Options for useFetch hook
 */
export interface UseFetchOptions {
  /** Skip initial fetch */
  skip?: boolean;
  /** Dependencies that trigger refetch */
  deps?: unknown[];
  /** Callback on success */
  onSuccess?: (data: unknown) => void;
  /** Callback on error */
  onError?: (error: ApiClientError) => void;
}

/**
 * Hook for fetching data from API
 */
export function useFetch<T>(
  path: string,
  options: UseFetchOptions = {}
): AsyncState<T> & { refetch: () => Promise<void> } {
  const [state, setState] = useState<AsyncState<T>>({
    data: null,
    loading: !options.skip,
    error: null,
  });

  const fetchData = useCallback(async () => {
    setState(prev => ({ ...prev, loading: true, error: null }));

    try {
      const data = await getApiClient().get<T>(path);
      setState({ data, loading: false, error: null });
      options.onSuccess?.(data);
    } catch (error) {
      const apiError = error instanceof ApiClientError
        ? error
        : new ApiClientError(
            error instanceof Error ? error.message : 'Unknown error',
            'internal_error',
            0
          );
      setState({ data: null, loading: false, error: apiError });
      options.onError?.(apiError);
    }
  }, [path, options.onSuccess, options.onError]);

  useEffect(() => {
    if (!options.skip) {
      void fetchData();
    }
  }, [options.skip, fetchData, ...(options.deps ?? [])]);

  return { ...state, refetch: fetchData };
}

/**
 * Hook for mutations (POST, PUT, PATCH, DELETE)
 */
export function useMutation<T, B = unknown>(
  method: 'post' | 'put' | 'patch' | 'delete',
  path: string
): {
  mutate: (body?: B) => Promise<T>;
  loading: boolean;
  error: ApiClientError | null;
  reset: () => void;
} {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<ApiClientError | null>(null);

  const mutate = useCallback(async (body?: B): Promise<T> => {
    setLoading(true);
    setError(null);

    try {
      const client = getApiClient();
      let result: T;

      switch (method) {
        case 'post':
          result = await client.post<T, B>(path, body);
          break;
        case 'put':
          result = await client.put<T, B>(path, body);
          break;
        case 'patch':
          result = await client.patch<T, B>(path, body);
          break;
        case 'delete':
          result = await client.delete<T>(path);
          break;
      }

      setLoading(false);
      return result;
    } catch (err) {
      const apiError = err instanceof ApiClientError
        ? err
        : new ApiClientError(
            err instanceof Error ? err.message : 'Unknown error',
            'internal_error',
            0
          );
      setError(apiError);
      setLoading(false);
      throw apiError;
    }
  }, [method, path]);

  const reset = useCallback(() => {
    setError(null);
  }, []);

  return { mutate, loading, error, reset };
}

/**
 * Hook for file uploads
 */
export function useUpload<T>(
  path: string
): {
  upload: (file: File, fieldName?: string, additionalFields?: Record<string, string>) => Promise<T>;
  loading: boolean;
  progress: number;
  error: ApiClientError | null;
  reset: () => void;
} {
  const [loading, setLoading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [error, setError] = useState<ApiClientError | null>(null);

  const upload = useCallback(async (
    file: File,
    fieldName?: string,
    additionalFields?: Record<string, string>
  ): Promise<T> => {
    setLoading(true);
    setProgress(0);
    setError(null);

    try {
      // Note: Progress tracking would require XMLHttpRequest or custom fetch implementation
      setProgress(50); // Simulated progress

      const result = await getApiClient().upload<T>(path, file, fieldName, additionalFields);

      setProgress(100);
      setLoading(false);
      return result;
    } catch (err) {
      const apiError = err instanceof ApiClientError
        ? err
        : new ApiClientError(
            err instanceof Error ? err.message : 'Upload failed',
            'internal_error',
            0
          );
      setError(apiError);
      setLoading(false);
      throw apiError;
    }
  }, [path]);

  const reset = useCallback(() => {
    setError(null);
    setProgress(0);
  }, []);

  return { upload, loading, progress, error, reset };
}

