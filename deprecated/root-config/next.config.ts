import type { NextConfig } from "next";
import { initOpenNextCloudflareForDev } from "@opennextjs/cloudflare";

// Initialize Cloudflare bindings for local development
// This makes D1, R2, and other bindings available during `npm run dev`
if (process.env.NODE_ENV === "development") {
  initOpenNextCloudflareForDev();
}

const nextConfig: NextConfig = {
  // Optimize for Cloudflare Workers deployment
  output: "standalone",

  // Disable image optimization (not supported on Workers)
  images: {
    unoptimized: true,
  },

  // Strict mode for React
  reactStrictMode: true,

  // TypeScript strict checks during build
  typescript: {
    // Fail build on type errors
    ignoreBuildErrors: false,
  },

  // ESLint during build
  eslint: {
    // Fail build on lint errors
    ignoreDuringBuilds: false,
  },

  // Ensure proper transpilation
  transpilePackages: [],

  // Security headers
  async headers() {
    return [
      {
        source: "/:path*",
        headers: [
          {
            key: "X-DNS-Prefetch-Control",
            value: "on",
          },
          {
            key: "X-Frame-Options",
            value: "SAMEORIGIN",
          },
          {
            key: "X-Content-Type-Options",
            value: "nosniff",
          },
          {
            key: "Referrer-Policy",
            value: "strict-origin-when-cross-origin",
          },
        ],
      },
    ];
  },

  // Experimental features for Cloudflare compatibility
  experimental: {
    // Server Actions are stable in Next 15
  },
};

export default nextConfig;

