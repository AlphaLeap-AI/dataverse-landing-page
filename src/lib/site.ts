export const siteName = "Dataverse";
export const defaultSiteUrl = "http://localhost:3000";

export function getSiteUrl() {
  const rawUrl = process.env.NEXT_PUBLIC_SITE_URL?.trim();
  const normalized = rawUrl && rawUrl.length > 0 ? rawUrl : defaultSiteUrl;
  return normalized.replace(/\/+$/, "");
}

export function getMetadataBase() {
  return new URL(getSiteUrl());
}
