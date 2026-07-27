import type { NextConfig } from "next";

// Marketing site only — no backend API rewrites or product app proxies.
//
// Root by default (local dev + custom domain dataverse.alphaleap.co).
// Only set GITHUB_PAGES=true when publishing to the bare project URL
// (https://<org>.github.io/dataverse-landing-page) without a custom domain.
// With a custom domain, Pages serves at / — a basePath breaks all assets.
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
