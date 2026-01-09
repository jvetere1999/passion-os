/**
 * API Client Configuration
 */
/**
 * API client configuration options
 */
export interface ApiClientConfig {
    /**
     * Base URL for API requests
     * @default 'https://api.ecent.online' in production
     * @default 'http://localhost:3001' in development
     */
    baseUrl: string;
    /**
     * Whether to include credentials (cookies) in requests
     * @default true
     */
    credentials: RequestCredentials;
    /**
     * Default timeout in milliseconds
     * @default 30000
     */
    timeout: number;
    /**
     * Whether to automatically retry failed requests
     * @default true
     */
    retry: boolean;
    /**
     * Maximum number of retry attempts
     * @default 3
     */
    maxRetries: number;
    /**
     * Custom headers to include in all requests
     */
    headers: Record<string, string>;
    /**
     * Hook called before each request
     */
    onRequest?: (request: RequestInit, url: string) => RequestInit | Promise<RequestInit>;
    /**
     * Hook called on authentication errors (401)
     */
    onAuthError?: () => void | Promise<void>;
    /**
     * Hook called on CSRF errors
     */
    onCsrfError?: () => void | Promise<void>;
}
/**
 * Default configuration for production
 */
export declare const DEFAULT_CONFIG: ApiClientConfig;
/**
 * Development configuration
 */
export declare const DEV_CONFIG: Partial<ApiClientConfig>;
/**
 * Detect environment and return appropriate config
 */
export declare function getDefaultConfig(): ApiClientConfig;
//# sourceMappingURL=config.d.ts.map