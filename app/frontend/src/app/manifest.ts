/**
 * Mobile App Manifest
 * PWA configuration for iOS/iPadOS "Add to Home Screen"
 */

import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "Ignition",
    short_name: "Ignition",
    description: "A starter engine for focus, movement, and learning",
    start_url: "/m",
    display: "standalone",
    background_color: "#0a0a0a",
    theme_color: "#8B0000",
    orientation: "portrait-primary",
    icons: [
      {
        src: "/icon.svg",
        sizes: "any",
        type: "image/svg+xml",
      },
    ],
    categories: ["productivity", "music", "education"],
  };
}

