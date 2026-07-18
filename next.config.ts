import type { NextConfig } from "next";

// Marketing site only — no backend API rewrites or product app proxies.
//
// GitHub Pages (project site) serves under /dataverse-landing-page.
// Local dev and custom domains stay at the root.
const repoName = "dataverse-landing-page";
const isGithubPages = process.env.GITHUB_PAGES === "true";

const nextConfig: NextConfig = {
  output: "export",
  images: {
    unoptimized: true,
  },
  ...(isGithubPages
    ? {
        basePath: `/${repoName}`,
        assetPrefix: `/${repoName}/`,
      }
    : {}),
};

export default nextConfig;
