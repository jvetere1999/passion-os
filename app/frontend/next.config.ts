import type { NextConfig } from "next";

// OpenNext for Cloudflare Workers
// The frontend runs as a Worker, not a container
// All API logic goes through Rust backend at api.ecent.online

const nextConfig: NextConfig = {
  // No output specified - OpenNext handles this
  // output: "standalone" is NOT used for Workers

  // Disable image optimization - use Cloudflare Images instead
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

