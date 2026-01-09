/**
 * Ignition Frontend Worker - Container Orchestrator
 *
 * Routes incoming requests to the Next.js frontend container.
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
  defaultPort = 3000;
  sleepAfter = "15m";

  get envVars() {
    const env = this.env as Env;
    return {
      NODE_ENV: env.NODE_ENV || "production",
      NEXT_PUBLIC_API_URL: env.NEXT_PUBLIC_API_URL || "https://api.ecent.online",
      PORT: "3000",
      HOSTNAME: "0.0.0.0",
    };
  }
}

export default {
  async fetch(request: Request, env: Env): Promise<Response> {
    const url = new URL(request.url);

    // Health check endpoint
    if (url.pathname === "/_health") {
      return new Response(JSON.stringify({ status: "ok", service: "frontend" }), {
        headers: { "Content-Type": "application/json" },
      });
    }

    // Debug: Return info about the request while we troubleshoot container
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
      // Get container instance
      const id = env.FRONTEND_CONTAINER.idFromName("frontend");
      const container = getContainer(env.FRONTEND_CONTAINER, id);

      // Forward request to container
      return container.fetch(request);
    } catch (error) {
      // Return error details for debugging
      return new Response(JSON.stringify({
        error: "Container fetch failed",
        message: error instanceof Error ? error.message : String(error),
        stack: error instanceof Error ? error.stack : undefined,
      }), {
        status: 500,
        headers: { "Content-Type": "application/json" },
      });
    }
  },
};
