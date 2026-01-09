/**
 * OpenNext Configuration for Cloudflare Workers
 *
 * This configures the Next.js app to run as a Cloudflare Worker
 * instead of a container.
 *
 * @see https://opennext.js.org/cloudflare
 */

import type { OpenNextConfig } from "@opennextjs/cloudflare";

const config: OpenNextConfig = {
  default: {
    override: {
      wrapper: "cloudflare-node",
      converter: "edge",
      proxyExternalRequest: "fetch",
      incrementalCache: "dummy",
      tagCache: "dummy",
      queue: "direct",
    },
  },
  // External node modules that need special handling
  edgeExternals: ["node:crypto"],
  // Middleware runs on edge
  middleware: {
    external: true,
    override: {
      wrapper: "cloudflare-edge",
      converter: "edge",
      proxyExternalRequest: "fetch",
      incrementalCache: "dummy",
      tagCache: "dummy",
      queue: "direct",
    },
  },
};

export default config;
