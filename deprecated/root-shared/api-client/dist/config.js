/**
 * API Client Configuration
 */
/**
 * Default configuration for production
 */
export const DEFAULT_CONFIG = {
    baseUrl: 'https://api.ecent.online',
    credentials: 'include',
    timeout: 30000,
    retry: true,
    maxRetries: 3,
    headers: {},
};
/**
 * Development configuration
 */
export const DEV_CONFIG = {
    baseUrl: 'http://localhost:3001',
};
/**
 * Detect environment and return appropriate config
 */
export function getDefaultConfig() {
    const isDev = typeof window !== 'undefined'
        ? window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1'
        : process.env.NODE_ENV === 'development';
    return {
        ...DEFAULT_CONFIG,
        ...(isDev ? DEV_CONFIG : {}),
    };
}
//# sourceMappingURL=config.js.map