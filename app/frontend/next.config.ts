import type { NextConfig } from "next";

// NOTE: OpenNext/Cloudflare bindings removed - frontend now runs in container
// All API logic goes through Rust backend at api.ecent.online

const nextConfig: NextConfig = {
  // Standard Next.js output (no Cloudflare Workers)
  output: "standalone",

  // Disable image optimization for now
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

  // Experimental features
  experimental: {
    // Server Actions are stable in Next 15
  },
};

export default nextConfig;

