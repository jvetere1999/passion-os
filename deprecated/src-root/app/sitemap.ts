import type { MetadataRoute } from "next";

const BASE_URL =
  process.env.NEXT_PUBLIC_APP_URL ||
  "https://passion-os.ecent.online";

export default function sitemap(): MetadataRoute.Sitemap {
  const lastModified = new Date();

  // Static public pages
  const staticPages: MetadataRoute.Sitemap = [
    {
      url: BASE_URL,
      lastModified,
      changeFrequency: "weekly",
      priority: 1,
    },
    {
      url: `${BASE_URL}/about`,
      lastModified,
      changeFrequency: "monthly",
      priority: 0.8,
    },
    {
      url: `${BASE_URL}/privacy`,
      lastModified,
      changeFrequency: "monthly",
      priority: 0.3,
    },
    {
      url: `${BASE_URL}/terms`,
      lastModified,
      changeFrequency: "monthly",
      priority: 0.3,
    },
    {
      url: `${BASE_URL}/contact`,
      lastModified,
      changeFrequency: "monthly",
      priority: 0.5,
    },
    {
      url: `${BASE_URL}/auth/signin`,
      lastModified,
      changeFrequency: "monthly",
      priority: 0.6,
    },
  ];

  // DAW Hub pages (publicly accessible)
  const dawIds = [
    "ableton",
    "logic",
    "flstudio",
    "protools",
    "cubase",
    "reaper",
    "bitwig",
    "studio-one",
    "reason",
  ];

  const hubPages: MetadataRoute.Sitemap = [
    {
      url: `${BASE_URL}/hub`,
      lastModified,
      changeFrequency: "weekly",
      priority: 0.9,
    },
    ...dawIds.map((dawId) => ({
      url: `${BASE_URL}/hub/${dawId}`,
      lastModified,
      changeFrequency: "weekly" as const,
      priority: 0.8,
    })),
  ];

  // Template pages
  const templatePages: MetadataRoute.Sitemap = [
    {
      url: `${BASE_URL}/templates`,
      lastModified,
      changeFrequency: "monthly",
      priority: 0.7,
    },
    {
      url: `${BASE_URL}/templates/drums`,
      lastModified,
      changeFrequency: "monthly",
      priority: 0.6,
    },
    {
      url: `${BASE_URL}/templates/chords`,
      lastModified,
      changeFrequency: "monthly",
      priority: 0.6,
    },
    {
      url: `${BASE_URL}/templates/melody`,
      lastModified,
      changeFrequency: "monthly",
      priority: 0.6,
    },
  ];

  return [...staticPages, ...hubPages, ...templatePages];
}

