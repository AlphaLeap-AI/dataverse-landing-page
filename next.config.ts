import type { NextConfig } from "next";

// Marketing site only — no backend API rewrites or product app proxies.
//
// GitHub Pages (project site) serves under /dataverse-landing-page.
// Local dev and custom domains stay at the root.
const repoName = "dataverse-landing-page";
const isGithubPages = process.env.GITHUB_PAGES === "true";
const basePath = isGithubPages ? `/${repoName}` : "";

const nextConfig: NextConfig = {
  output: "export",
  images: {
    unoptimized: true,
  },
  // assetPrefix only rewrites /_next/*. Hand-written URLs into public/ (the
  // hero video, its poster) need the prefix too — src/lib/assets.ts reads this.
  env: {
    NEXT_PUBLIC_BASE_PATH: basePath,
  },
  ...(isGithubPages
    ? {
        basePath,
        assetPrefix: `${basePath}/`,
      }
    : {}),
};

export default nextConfig;
