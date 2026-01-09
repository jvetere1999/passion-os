/**
 * Server-side API client utilities
 *
 * For use in Next.js Server Components and Server Actions
 */
import { ApiClientError } from './client.js';
import { DEFAULT_CONFIG } from './config.js';
/**
 * Create cookie header from cookies object
 */
function buildCookieHeader(sessionCookie, cookies) {
    const parts = [];
    if (sessionCookie) {
        parts.push(`session=${sessionCookie}`);
    }
    if (cookies) {
        Object.entries(cookies).forEach(([name, value]) => {
            parts.push(`${name}=${value}`);
        });
    }
    return parts.join('; ');
}
/**
 * Server-side API client for Server Components
 */
export class ServerApiClient {
    baseUrl;
    constructor(baseUrl) {
        this.baseUrl = baseUrl ?? process.env.API_URL ?? DEFAULT_CONFIG.baseUrl;
    }
    /**
     * Execute a server-side fetch
     */
    async execute(method, path, options = {}, body) {
        const url = new URL(path, this.baseUrl).toString();
        const headers = {
            'Content-Type': 'application/json',
            ...options.headers,
        };
        // Add cookies
        const cookieHeader = buildCookieHeader(options.sessionCookie, options.cookies);
        if (cookieHeader) {
            headers['Cookie'] = cookieHeader;
        }
        const fetchOptions = {
            method,
            headers,
            cache: options.cache ?? 'no-store',
        };
        // Add Next.js specific options
        if (options.revalidate !== undefined || options.tags) {
            fetchOptions.next = {};
            if (options.revalidate !== undefined) {
                fetchOptions.next.revalidate = options.revalidate;
            }
            if (options.tags) {
                fetchOptions.next.tags = options.tags;
            }
        }
        if (body !== undefined) {
            fetchOptions.body = JSON.stringify(body);
        }
        const response = await fetch(url, fetchOptions);
        if (!response.ok) {
            let errorBody;
            try {
                errorBody = await response.json();
            }
            catch {
                errorBody = {
                    error: {
                        type: 'internal_error',
                        message: `HTTP ${response.status}: ${response.statusText}`,
                    },
                };
            }
            throw ApiClientError.fromApiError(errorBody, response.status);
        }
        const contentType = response.headers.get('Content-Type');
        if (!contentType?.includes('application/json')) {
            return undefined;
        }
        const result = await response.json();
        return 'data' in result ? result.data : result;
    }
    async get(path, options) {
        return this.execute('GET', path, options);
    }
    async post(path, body, options) {
        return this.execute('POST', path, options, body);
    }
    async put(path, body, options) {
        return this.execute('PUT', path, options, body);
    }
    async patch(path, body, options) {
        return this.execute('PATCH', path, options, body);
    }
    async delete(path, options) {
        return this.execute('DELETE', path, options);
    }
}
/**
 * Create a server API client
 */
export function createServerClient(baseUrl) {
    return new ServerApiClient(baseUrl);
}
//# sourceMappingURL=server.js.map