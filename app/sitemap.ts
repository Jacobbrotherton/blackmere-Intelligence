import { MetadataRoute } from "next";

const BASE_URL = "https://blackmereintelligence.com";

const SECTORS = [
  "technology",
  "healthcare",
  "financials",
  "energy",
  "industrials",
  "private-equity",
];

export default function sitemap(): MetadataRoute.Sitemap {
  const now = new Date();

  const staticRoutes: MetadataRoute.Sitemap = [
    {
      url: BASE_URL,
      lastModified: now,
      changeFrequency: "hourly",
      priority: 1.0,
    },
    {
      url: `${BASE_URL}/stock-analysis`,
      lastModified: now,
      changeFrequency: "daily",
      priority: 0.8,
    },
    {
      url: `${BASE_URL}/subscribe`,
      lastModified: now,
      changeFrequency: "monthly",
      priority: 0.6,
    },
  ];

  const sectorRoutes: MetadataRoute.Sitemap = SECTORS.map((id) => ({
    url: `${BASE_URL}/sectors/${id}`,
    lastModified: now,
    changeFrequency: "hourly" as const,
    priority: 0.9,
  }));

  return [...staticRoutes, ...sectorRoutes];
}
