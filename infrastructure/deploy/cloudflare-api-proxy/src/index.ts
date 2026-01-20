/**
 * Ignition API Proxy Worker
 * 
 * Routes requests from api.ecent.online to the Fly.io backend.
 * Handles CORS and preserves cookies for cross-origin auth.
 */

export interface Env {
  BACKEND_URL: string;
}

const ALLOWED_ORIGINS = [
  "https://ignition.ecent.online",
  "https://admin.ecent.online",
  "http://localhost:3000",
  "http://localhost:3001",
];

export default {
  async fetch(request: Request, env: Env): Promise<Response> {
    const url = new URL(request.url);
    const origin = request.headers.get("Origin");

    // Handle CORS preflight
    if (request.method === "OPTIONS") {
      return handleCors(request, origin);
    }

    // Build backend URL
    const backendUrl = new URL(url.pathname + url.search, env.BACKEND_URL);

    // Forward request to Fly.io backend
    const backendRequest = new Request(backendUrl.toString(), {
      method: request.method,
      headers: request.headers,
      body: request.body,
      redirect: "manual", // Don't follow redirects, let client handle
    });

    try {
      const response = await fetch(backendRequest);

      // Clone response and add CORS headers
      const newHeaders = new Headers(response.headers);
      
      if (origin && isAllowedOrigin(origin)) {
        newHeaders.set("Access-Control-Allow-Origin", origin);
        newHeaders.set("Access-Control-Allow-Credentials", "true");
      }

      return new Response(response.body, {
        status: response.status,
        statusText: response.statusText,
        headers: newHeaders,
      });
    } catch (error) {
      console.error("Backend proxy error:", error);
      return new Response(
        JSON.stringify({
          error: "Backend unavailable",
          message: error instanceof Error ? error.message : "Unknown error",
        }),
        {
          status: 503,
          headers: {
            "Content-Type": "application/json",
            ...(origin && isAllowedOrigin(origin) ? {
              "Access-Control-Allow-Origin": origin,
              "Access-Control-Allow-Credentials": "true",
            } : {}),
          },
        }
      );
    }
  },
};

function isAllowedOrigin(origin: string): boolean {
  return ALLOWED_ORIGINS.includes(origin);
}

function handleCors(request: Request, origin: string | null): Response {
  const headers: Record<string, string> = {
    "Access-Control-Allow-Methods": "GET, POST, PUT, PATCH, DELETE, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type, Authorization, Cookie, X-Requested-With",
    "Access-Control-Max-Age": "86400",
  };

  if (origin && isAllowedOrigin(origin)) {
    headers["Access-Control-Allow-Origin"] = origin;
    headers["Access-Control-Allow-Credentials"] = "true";
  }

  return new Response(null, {
    status: 204,
    headers,
  });
}
