import type { MetadataRoute } from "next";

import { getSiteUrl } from "@/lib/site";

// Required for `output: "export"` (GitHub Pages static deploy).
export const dynamic = "force-static";

export default function robots(): MetadataRoute.Robots {
  const siteUrl = getSiteUrl();

  return {
    rules: [
      {
        userAgent: "*",
        allow: "/",
      },
    ],
    sitemap: `${siteUrl}/sitemap.xml`,
    host: siteUrl,
  };
}
