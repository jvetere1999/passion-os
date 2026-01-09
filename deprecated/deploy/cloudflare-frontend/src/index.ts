/**
 * Ignition Frontend Worker - Container Orchestrator
 *
 * Routes incoming requests to the Next.js frontend container.
 * Includes static fallback for landing page during container cold starts.
 */

import { Container, getContainer } from "@cloudflare/containers";

export interface Env {
  FRONTEND_CONTAINER: DurableObjectNamespace<FrontendContainer>;
  NODE_ENV: string;
  NEXT_PUBLIC_API_URL: string;
}

/**
 * FrontendContainer - Durable Object that manages the Next.js container.
 */
export class FrontendContainer extends Container {
  // Port the Next.js server listens on (must match Dockerfile EXPOSE and ENV PORT)
  defaultPort = 3000;
  
  // Keep container alive for 15 minutes after last request
  sleepAfter = "15m";

  // Environment variables passed to the container at runtime
  envVars = {
    NODE_ENV: "production",
    NEXT_PUBLIC_API_URL: "https://api.ecent.online",
    PORT: "3000",
    HOSTNAME: "0.0.0.0",
  };

  override onStart(): void {
    console.log("Ignition Frontend container started on port 3000");
  }

  override onStop(): void {
    console.log("Ignition Frontend container stopped");
  }

  override onError(error: unknown): void {
    console.error("Frontend container error:", error);
  }
}

/**
 * Simple HTML for landing page fallback during cold start
 */
const LANDING_PAGE_FALLBACK = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Ignition - Loading...</title>
  <style>
    body { font-family: system-ui, sans-serif; display: flex; align-items: center; justify-content: center; min-height: 100vh; margin: 0; background: #0a0a0a; color: #fafafa; }
    .container { text-align: center; }
    h1 { font-size: 2rem; margin-bottom: 0.5rem; }
    p { color: #888; }
    .spinner { width: 40px; height: 40px; border: 3px solid #333; border-top-color: #fff; border-radius: 50%; animation: spin 1s linear infinite; margin: 2rem auto; }
    @keyframes spin { to { transform: rotate(360deg); } }
  </style>
  <meta http-equiv="refresh" content="3">
</head>
<body>
  <div class="container">
    <h1>Ignition</h1>
    <div class="spinner"></div>
    <p>Starting up... This page will refresh automatically.</p>
  </div>
</body>
</html>`;

export default {
  async fetch(request: Request, env: Env): Promise<Response> {
    const url = new URL(request.url);

    // Health check endpoint
    if (url.pathname === "/_health") {
      return new Response(JSON.stringify({ status: "ok", service: "frontend" }), {
        headers: { "Content-Type": "application/json" },
      });
    }

    // Debug endpoint
    if (url.pathname === "/_debug") {
      return new Response(JSON.stringify({
        status: "worker running",
        url: request.url,
        hasContainerBinding: !!env.FRONTEND_CONTAINER,
      }), {
        headers: { "Content-Type": "application/json" },
      });
    }

    try {
      // Get container instance using consistent naming
      // @ts-expect-error - Cloudflare Containers beta types mismatch with runtime API
      const container = getContainer(env.FRONTEND_CONTAINER, "frontend");

      // Forward request to container
      // Note: Container.fetch doesn't support AbortController, so we rely on container startup timeout
      try {
        const response = await container.fetch(request);
        return response;
      } catch (fetchError) {
        // If container starting, show fallback for landing page
        if (url.pathname === "/" || url.pathname === "") {
          return new Response(LANDING_PAGE_FALLBACK, {
            status: 503,
            headers: { 
              "Content-Type": "text/html",
              "Retry-After": "5",
            },
          });
        }
        
        throw fetchError;
      }
    } catch (error) {
      // Return error details for debugging
      return new Response(JSON.stringify({
        error: "Container fetch failed",
        message: error instanceof Error ? error.message : String(error),
        path: url.pathname,
      }), {
        status: 500,
        headers: { "Content-Type": "application/json" },
      });
    }
  },
};
