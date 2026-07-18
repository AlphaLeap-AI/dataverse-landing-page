import type { MetadataRoute } from "next";

import { getSiteUrl } from "@/lib/site";

// Required for `output: "export"` (GitHub Pages static deploy).
export const dynamic = "force-static";

export default function sitemap(): MetadataRoute.Sitemap {
  const siteUrl = getSiteUrl();

  return [
    {
      url: siteUrl,
      lastModified: new Date(),
      changeFrequency: "weekly",
      priority: 1,
    },
  ];
}
