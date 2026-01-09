/**
 * Cloudflare Workers environment bindings
 * These are available in server components and API routes
 */

declare global {
  namespace NodeJS {
    interface ProcessEnv {
      // Auth.js
      AUTH_SECRET: string;
      AUTH_URL?: string;

      // Google OAuth
      GOOGLE_CLIENT_ID: string;
      GOOGLE_CLIENT_SECRET: string;

      // Microsoft Entra ID OAuth
      AZURE_AD_CLIENT_ID: string;
      AZURE_AD_CLIENT_SECRET: string;
      AZURE_AD_TENANT_ID: string;

      // App config
      NODE_ENV: "development" | "preview" | "production";
      NEXT_PUBLIC_APP_URL: string;

      // Feature Flags (optional - default to OFF when unset)
      // Accepts: "1", "true", "on" (case-insensitive) as truthy
      FLAG_TODAY_FEATURES_MASTER?: string;
      FLAG_TODAY_DECISION_SUPPRESSION_V1?: string;
      FLAG_TODAY_NEXT_ACTION_RESOLVER_V1?: string;
      FLAG_TODAY_MOMENTUM_FEEDBACK_V1?: string;
      FLAG_TODAY_SOFT_LANDING_V1?: string;
      FLAG_TODAY_REDUCED_MODE_V1?: string;
      FLAG_TODAY_DYNAMIC_UI_V1?: string;
    }
  }
}

/**
 * Cloudflare bindings available via getRequestContext()
 */
export interface CloudflareEnv {
  DB: D1Database;
  BLOBS: R2Bucket;
  CACHE?: KVNamespace;
  ASSETS: Fetcher;
}

export {};

