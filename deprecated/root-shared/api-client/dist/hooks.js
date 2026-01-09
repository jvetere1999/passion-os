/**
 * React hooks for API client
 *
 * Provides React-specific utilities and hooks for data fetching
 */
import { useCallback, useEffect, useState } from 'react';
import { getApiClient, ApiClientError } from './client.js';
/**
 * Hook for fetching data from API
 */
export function useFetch(path, options = {}) {
    const [state, setState] = useState({
        data: null,
        loading: !options.skip,
        error: null,
    });
    const fetchData = useCallback(async () => {
        setState(prev => ({ ...prev, loading: true, error: null }));
        try {
            const data = await getApiClient().get(path);
            setState({ data, loading: false, error: null });
            options.onSuccess?.(data);
        }
        catch (error) {
            const apiError = error instanceof ApiClientError
                ? error
                : new ApiClientError(error instanceof Error ? error.message : 'Unknown error', 'internal_error', 0);
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
export function useMutation(method, path) {
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);
    const mutate = useCallback(async (body) => {
        setLoading(true);
        setError(null);
        try {
            const client = getApiClient();
            let result;
            switch (method) {
                case 'post':
                    result = await client.post(path, body);
                    break;
                case 'put':
                    result = await client.put(path, body);
                    break;
                case 'patch':
                    result = await client.patch(path, body);
                    break;
                case 'delete':
                    result = await client.delete(path);
                    break;
            }
            setLoading(false);
            return result;
        }
        catch (err) {
            const apiError = err instanceof ApiClientError
                ? err
                : new ApiClientError(err instanceof Error ? err.message : 'Unknown error', 'internal_error', 0);
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
export function useUpload(path) {
    const [loading, setLoading] = useState(false);
    const [progress, setProgress] = useState(0);
    const [error, setError] = useState(null);
    const upload = useCallback(async (file, fieldName, additionalFields) => {
        setLoading(true);
        setProgress(0);
        setError(null);
        try {
            // Note: Progress tracking would require XMLHttpRequest or custom fetch implementation
            setProgress(50); // Simulated progress
            const result = await getApiClient().upload(path, file, fieldName, additionalFields);
            setProgress(100);
            setLoading(false);
            return result;
        }
        catch (err) {
            const apiError = err instanceof ApiClientError
                ? err
                : new ApiClientError(err instanceof Error ? err.message : 'Upload failed', 'internal_error', 0);
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
//# sourceMappingURL=hooks.js.map