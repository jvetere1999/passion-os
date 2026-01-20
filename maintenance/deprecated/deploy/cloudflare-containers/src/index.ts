/**
 * Ignition API Worker - Container Orchestrator
 *
 * This Worker routes incoming requests to the Rust backend Container.
 * It uses Cloudflare Containers (beta) to run the full Rust monolith.
 */

import { Container, getContainer } from "@cloudflare/containers";
// Import env as global to access secrets - required for Containers
// https://developers.cloudflare.com/workers/runtime-apis/bindings/#importing-env-as-a-global
import { env as globalEnv } from "cloudflare:workers";

export interface Env {
  API_CONTAINER: DurableObjectNamespace<ApiContainer>;
  BLOBS: R2Bucket;

  // Secrets passed to container
  DATABASE_URL: string;
  SESSION_SECRET: string;
  GOOGLE_CLIENT_ID: string;
  GOOGLE_CLIENT_SECRET: string;
  AZURE_CLIENT_ID: string;
  AZURE_CLIENT_SECRET: string;
  AZURE_TENANT_ID: string;
  STORAGE_ENDPOINT: string;
  STORAGE_ACCESS_KEY_ID: string;
  STORAGE_SECRET_ACCESS_KEY: string;

  // Vars
  NODE_ENV: string;
  API_URL: string;
}

// Helper to safely get env var - returns undefined for empty/missing
const safeGet = (value: string | undefined): string | undefined => {
  if (!value || value === "" || value === "undefined") return undefined;
  return value;
};

// Type assertion for global env
const typedEnv = globalEnv as Env;

/**
 * ApiContainer - Durable Object that manages the Rust API container.
 * Each instance can handle multiple requests.
 */
export class ApiContainer extends Container<Env> {
  // Port the Rust server listens on
  defaultPort = 8080;

  // Keep container alive for 4 hours after last request
  sleepAfter = "4h";
  
  // Config version - bump this to force container restart on deploy
  private static readonly CONFIG_VERSION = "2026-01-10-v5";
  private configVersionKey = "__config_version";

  constructor(ctx: DurableObjectState<Env>, env: Env) {
    super(ctx, env);
    
    // Log configuration status for debugging - try BOTH constructor env AND global env
    console.log("[ApiContainer] Constructor env vs Global env:");
    console.log(`  Constructor GOOGLE_CLIENT_ID: ${safeGet(env.GOOGLE_CLIENT_ID) ? "✓ SET" : "✗ MISSING"}`);
    console.log(`  Global GOOGLE_CLIENT_ID: ${safeGet(typedEnv.GOOGLE_CLIENT_ID) ? "✓ SET" : "✗ MISSING"}`);
    console.log(`  Constructor DATABASE_URL: ${safeGet(env.DATABASE_URL) ? "✓ SET" : "✗ MISSING"}`);
    console.log(`  Global DATABASE_URL: ${safeGet(typedEnv.DATABASE_URL) ? "✓ SET" : "✗ MISSING"}`);

    // Use constructor env (like fuse-on-r2 example does)
    const e = env;
    
    // Log ALL secrets individually for debugging
    console.log("[ApiContainer] All secrets status:");
    console.log(`  DATABASE_URL: ${safeGet(e.DATABASE_URL) ? "✓" : "✗"}`);
    console.log(`  SESSION_SECRET: ${safeGet(e.SESSION_SECRET) ? "✓" : "✗"}`);
    console.log(`  GOOGLE_CLIENT_ID: ${safeGet(e.GOOGLE_CLIENT_ID) ? "✓" : "✗"}`);
    console.log(`  GOOGLE_CLIENT_SECRET: ${safeGet(e.GOOGLE_CLIENT_SECRET) ? "✓" : "✗"}`);
    console.log(`  AZURE_CLIENT_ID: ${safeGet(e.AZURE_CLIENT_ID) ? "✓" : "✗"}`);
    console.log(`  AZURE_CLIENT_SECRET: ${safeGet(e.AZURE_CLIENT_SECRET) ? "✓" : "✗"}`);
    console.log(`  AZURE_TENANT_ID: ${safeGet(e.AZURE_TENANT_ID) ? "✓" : "✗"}`);
    console.log(`  STORAGE_ENDPOINT: ${safeGet(e.STORAGE_ENDPOINT) ? "✓" : "✗"}`);
    console.log(`  STORAGE_ACCESS_KEY_ID: ${safeGet(e.STORAGE_ACCESS_KEY_ID) ? "✓" : "✗"}`);
    console.log(`  STORAGE_SECRET_ACCESS_KEY: ${safeGet(e.STORAGE_SECRET_ACCESS_KEY) ? "✓" : "✗"}`);
    
    // Build env vars object - only include storage vars if ALL are present
    const hasAllStorageSecrets = !!(
      safeGet(e.STORAGE_ENDPOINT) &&
      safeGet(e.STORAGE_ACCESS_KEY_ID) &&
      safeGet(e.STORAGE_SECRET_ACCESS_KEY)
    );

    // Set envVars instance property - read by Container when starting
    this.envVars = {
      // Database
      DATABASE_URL: safeGet(e.DATABASE_URL) || "",

      // Server config
      SERVER_HOST: "0.0.0.0",
      SERVER_PORT: "8080",
      SERVER_ENVIRONMENT: e.NODE_ENV || "production",
      SERVER_PUBLIC_URL: "https://api.ecent.online",

      // Auth
      SESSION_SECRET: safeGet(e.SESSION_SECRET) || "",
      AUTH_COOKIE_DOMAIN: "ecent.online",
      AUTH_SESSION_TTL_SECONDS: "2592000", // 30 days
      AUTH_DEV_BYPASS: "false",

      // OAuth - use nested format for config crate with _ separator
      // Only set if credentials are present
      ...(safeGet(e.GOOGLE_CLIENT_ID) && safeGet(e.GOOGLE_CLIENT_SECRET) ? {
        AUTH_OAUTH_GOOGLE_CLIENT_ID: e.GOOGLE_CLIENT_ID,
        AUTH_OAUTH_GOOGLE_CLIENT_SECRET: e.GOOGLE_CLIENT_SECRET,
        AUTH_OAUTH_GOOGLE_REDIRECT_URI: "https://api.ecent.online/auth/callback/google",
      } : {}),

      ...(safeGet(e.AZURE_CLIENT_ID) && safeGet(e.AZURE_CLIENT_SECRET) && safeGet(e.AZURE_TENANT_ID) ? {
        AUTH_OAUTH_AZURE_CLIENT_ID: e.AZURE_CLIENT_ID,
        AUTH_OAUTH_AZURE_CLIENT_SECRET: e.AZURE_CLIENT_SECRET,
        AUTH_OAUTH_AZURE_REDIRECT_URI: "https://api.ecent.online/auth/callback/azure",
        AUTH_OAUTH_AZURE_TENANT_ID: e.AZURE_TENANT_ID,
      } : {}),

      // Storage (R2) - only include if ALL storage secrets are present
      ...(hasAllStorageSecrets ? {
        STORAGE_ENDPOINT: e.STORAGE_ENDPOINT,
        STORAGE_ACCESS_KEY_ID: e.STORAGE_ACCESS_KEY_ID,
        STORAGE_SECRET_ACCESS_KEY: e.STORAGE_SECRET_ACCESS_KEY,
        STORAGE_BUCKET: "ignition",
        STORAGE_REGION: "auto",
      } : {}),

      // CORS
      CORS_ALLOWED_ORIGINS:
        "https://ignition.ecent.online,https://admin.ignition.ecent.online",
    };

    console.log(`[ApiContainer] envVars keys: ${Object.keys(this.envVars).join(", ")}`);
    console.log(`[ApiContainer] OAuth Google: ${safeGet(e.GOOGLE_CLIENT_ID) ? "ENABLED" : "DISABLED"}`);
    console.log(`[ApiContainer] OAuth Azure: ${safeGet(e.AZURE_TENANT_ID) ? "ENABLED" : "DISABLED"}`);
    console.log(`[ApiContainer] Storage R2: ${hasAllStorageSecrets ? "ENABLED" : "DISABLED"}`);
  }

  override onStart(): void {
    console.log("Ignition API container started");
    const env = this.env as Env;
    
    // Debug: Check if secrets are available
    const hasDbUrl = !!env.DATABASE_URL;
    const hasSessionSecret = !!env.SESSION_SECRET;
    console.log(`[onStart] DATABASE_URL present: ${hasDbUrl}`);
    console.log(`[onStart] SESSION_SECRET present: ${hasSessionSecret}`);
    
    if (!hasDbUrl) {
      console.error("[onStart] CRITICAL: DATABASE_URL secret is missing!");
    }
  }

  override onStop(): void {
    console.log("Ignition API container stopped");
  }

  override onError(error: unknown): void {
    console.error("Container error:", error);
  }

  // Override fetch to intercept debug requests BEFORE forwarding to container
  override async fetch(request: Request): Promise<Response> {
    const url = new URL(request.url);
    
    // Auto-restart if config version changed (new deployment with different env vars)
    const storedVersion = await this.ctx.storage.get<string>(this.configVersionKey);
    if (storedVersion !== ApiContainer.CONFIG_VERSION) {
      console.log(`[ApiContainer] Config version changed: ${storedVersion} -> ${ApiContainer.CONFIG_VERSION}`);
      // Stop container if running so it restarts with new envVars
      try {
        const state = await this.getState();
        if (state.status === "healthy" || state.status === "running") {
          console.log("[ApiContainer] Stopping container for config update...");
          await this.stop();
        }
      } catch (e) {
        console.log("[ApiContainer] Container not running, will start fresh");
      }
      // Save new version
      await this.ctx.storage.put(this.configVersionKey, ApiContainer.CONFIG_VERSION);
    }
    
    // Restart endpoint - stop container so it restarts with new envVars
    if (url.pathname === "/_restart") {
      try {
        await this.stop();
        return new Response(
          JSON.stringify({
            success: true,
            message: "Container stopped. It will restart on next request with updated envVars.",
            envVarsKeys: Object.keys(this.envVars || {}),
          }),
          { headers: { "Content-Type": "application/json" } }
        );
      } catch (err) {
        console.error("[ApiContainer] Failed to restart container", err);
        return new Response(
          JSON.stringify({
            success: false,
            error: "Failed to restart container",
          }),
          { status: 500, headers: { "Content-Type": "application/json" } }
        );
      }
    }
    
    // Debug endpoint to check secrets from Durable Object context
    if (url.pathname === "/_do-debug") {
      const e = this.env as Env;
      return new Response(
        JSON.stringify({
          context: "DurableObject",
          secretsStatus: {
            DATABASE_URL: !!e.DATABASE_URL,
            SESSION_SECRET: !!e.SESSION_SECRET,
            GOOGLE_CLIENT_ID: !!e.GOOGLE_CLIENT_ID,
            GOOGLE_CLIENT_SECRET: !!e.GOOGLE_CLIENT_SECRET,
            AZURE_CLIENT_ID: !!e.AZURE_CLIENT_ID,
            AZURE_CLIENT_SECRET: !!e.AZURE_CLIENT_SECRET,
            AZURE_TENANT_ID: !!e.AZURE_TENANT_ID,
            STORAGE_ENDPOINT: !!e.STORAGE_ENDPOINT,
            STORAGE_ACCESS_KEY_ID: !!e.STORAGE_ACCESS_KEY_ID,
            STORAGE_SECRET_ACCESS_KEY: !!e.STORAGE_SECRET_ACCESS_KEY,
          },
          envVarsKeys: Object.keys(this.envVars || {}),
          envVarsHasStorage: !!(this.envVars && "STORAGE_ACCESS_KEY_ID" in this.envVars),
        }),
        { headers: { "Content-Type": "application/json" } }
      );
    }
    
    // Ensure container is started before forwarding requests
    try {
      const state = await this.getState();
      if (state.status !== "healthy" && state.status !== "running") {
        console.log(`[ApiContainer] Container status: ${state.status}, starting...`);
        await this.start();
      }
    } catch (e) {
      console.log("[ApiContainer] Starting container (no state available)...");
      await this.start();
    }
    
    // Forward all other requests to the container
    return super.fetch(request);
  }
}

/**
 * Helper to get or create a container instance.
 * Uses consistent naming for load balancing across N instances.
 */
function getApiContainer(env: Env, instanceId: number = 0) {
  const id = `api-instance-${instanceId}`;
  return getContainer(env.API_CONTAINER, id);
}

/**
 * Simple round-robin load balancer across container instances.
 */
let requestCounter = 0;
const MAX_INSTANCES = 1; // Reduced to 1 for stability

function loadBalance(env: Env) {
  const instanceId = requestCounter % MAX_INSTANCES;
  requestCounter++;
  return getApiContainer(env, instanceId);
}

export default {
  async fetch(request: Request, env: Env): Promise<Response> {
    const url = new URL(request.url);

    // Debug: Log secrets availability in Worker fetch (NOT in Durable Object)
    console.log("[Worker fetch] Env secrets check:");
    console.log(`  GOOGLE_CLIENT_ID: ${env.GOOGLE_CLIENT_ID ? "SET (" + env.GOOGLE_CLIENT_ID.substring(0, 8) + "...)" : "MISSING"}`);
    console.log(`  GOOGLE_CLIENT_SECRET: ${env.GOOGLE_CLIENT_SECRET ? "SET" : "MISSING"}`);
    console.log(`  DATABASE_URL: ${env.DATABASE_URL ? "SET" : "MISSING"}`);

    // Health check endpoint (handled by Worker, not container)
    if (url.pathname === "/health" || url.pathname === "/") {
      return new Response(
        JSON.stringify({
          status: "ok",
          service: "ignition-api",
          timestamp: new Date().toISOString(),
          // Debug: include ALL secrets status in response
          secretsStatus: {
            DATABASE_URL: !!env.DATABASE_URL,
            SESSION_SECRET: !!env.SESSION_SECRET,
            GOOGLE_CLIENT_ID: !!env.GOOGLE_CLIENT_ID,
            GOOGLE_CLIENT_SECRET: !!env.GOOGLE_CLIENT_SECRET,
            AZURE_CLIENT_ID: !!env.AZURE_CLIENT_ID,
            AZURE_CLIENT_SECRET: !!env.AZURE_CLIENT_SECRET,
            AZURE_TENANT_ID: !!env.AZURE_TENANT_ID,
            STORAGE_ENDPOINT: !!env.STORAGE_ENDPOINT,
            STORAGE_ACCESS_KEY_ID: !!env.STORAGE_ACCESS_KEY_ID,
            STORAGE_SECRET_ACCESS_KEY: !!env.STORAGE_SECRET_ACCESS_KEY,
          }
        }),
        {
          headers: { "Content-Type": "application/json" },
        }
      );
    }

    // Debug endpoint to check Durable Object's env (forwarded to DO)
    if (url.pathname === "/_do-debug") {
      const container = loadBalance(env);
      return container.fetch(request);
    }

    // Restart endpoint - stop containers so they restart with new envVars
    if (url.pathname === "/_restart") {
      // Restart all instances
      const results = [];
      for (let i = 0; i < MAX_INSTANCES; i++) {
        const container = getApiContainer(env, i);
        try {
          const response = await container.fetch(request);
          results.push(await response.json());
        } catch (err) {
          results.push({ instance: i, error: String(err) });
        }
      }
      return new Response(
        JSON.stringify({ restarted: results }),
        { headers: { "Content-Type": "application/json" } }
      );
    }

    // CORS preflight handling
    if (request.method === "OPTIONS") {
      return new Response(null, {
        status: 204,
        headers: {
          "Access-Control-Allow-Origin": request.headers.get("Origin") || "*",
          "Access-Control-Allow-Methods":
            "GET, POST, PUT, PATCH, DELETE, OPTIONS",
          "Access-Control-Allow-Headers":
            "Content-Type, Authorization, Cookie",
          "Access-Control-Allow-Credentials": "true",
          "Access-Control-Max-Age": "86400",
        },
      });
    }

    try {
      // Get a container instance (load balanced)
      const container = loadBalance(env);

      // Ensure container is started
      await container.start();

      // Forward the request to the container
      const response = await container.fetch(request);

      // Add CORS headers to response
      const origin = request.headers.get("Origin");
      if (origin) {
        const newHeaders = new Headers(response.headers);
        newHeaders.set("Access-Control-Allow-Origin", origin);
        newHeaders.set("Access-Control-Allow-Credentials", "true");

        return new Response(response.body, {
          status: response.status,
          statusText: response.statusText,
          headers: newHeaders,
        });
      }

      return response;
    } catch (error) {
      console.error("Error forwarding to container:", error);
      return new Response(
        JSON.stringify({
          error: "Internal Server Error",
          message:
            error instanceof Error ? error.message : "Container unavailable",
        }),
        {
          status: 503,
          headers: { "Content-Type": "application/json" },
        }
      );
    }
  },

  async scheduled(event: ScheduledEvent, env: Env): Promise<void> {
    console.log("Keep-alive ping triggered at:", new Date().toISOString());
    
    try {
      // Ping the health endpoint to keep container warm
      const container = loadBalance(env);
      await container.start();
      
      const response = await container.fetch(
        new Request("https://api.ecent.online/health", {
          method: "GET",
        })
      );
      
      console.log(`Keep-alive ping successful: ${response.status}`);
    } catch (error) {
      console.error("Keep-alive ping failed:", error);
    }
  },
};
