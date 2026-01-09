/**
 * Server-side API client utilities
 *
 * For use in Next.js Server Components and Server Actions
 */
/**
 * Server request options
 */
export interface ServerRequestOptions {
    /** Session cookie value */
    sessionCookie?: string;
    /** Additional cookies */
    cookies?: Record<string, string>;
    /** Cache strategy */
    cache?: RequestCache;
    /** Revalidation time in seconds */
    revalidate?: number | false;
    /** Request tags for cache invalidation */
    tags?: string[];
    /** Custom headers */
    headers?: Record<string, string>;
}
/**
 * Server-side API client for Server Components
 */
export declare class ServerApiClient {
    private baseUrl;
    constructor(baseUrl?: string);
    /**
     * Execute a server-side fetch
     */
    private execute;
    get<T>(path: string, options?: ServerRequestOptions): Promise<T>;
    post<T, B = unknown>(path: string, body?: B, options?: ServerRequestOptions): Promise<T>;
    put<T, B = unknown>(path: string, body?: B, options?: ServerRequestOptions): Promise<T>;
    patch<T, B = unknown>(path: string, body?: B, options?: ServerRequestOptions): Promise<T>;
    delete<T>(path: string, options?: ServerRequestOptions): Promise<T>;
}
/**
 * Create a server API client
 */
export declare function createServerClient(baseUrl?: string): ServerApiClient;
//# sourceMappingURL=server.d.ts.map