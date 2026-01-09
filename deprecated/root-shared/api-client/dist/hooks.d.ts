/**
 * React hooks for API client
 *
 * Provides React-specific utilities and hooks for data fetching
 */
import { ApiClientError } from './client.js';
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
export declare function useFetch<T>(path: string, options?: UseFetchOptions): AsyncState<T> & {
    refetch: () => Promise<void>;
};
/**
 * Hook for mutations (POST, PUT, PATCH, DELETE)
 */
export declare function useMutation<T, B = unknown>(method: 'post' | 'put' | 'patch' | 'delete', path: string): {
    mutate: (body?: B) => Promise<T>;
    loading: boolean;
    error: ApiClientError | null;
    reset: () => void;
};
/**
 * Hook for file uploads
 */
export declare function useUpload<T>(path: string): {
    upload: (file: File, fieldName?: string, additionalFields?: Record<string, string>) => Promise<T>;
    loading: boolean;
    progress: number;
    error: ApiClientError | null;
    reset: () => void;
};
//# sourceMappingURL=hooks.d.ts.map