/**
 * Public-folder asset URLs.
 *
 * Next rewrites `/_next/*` with `assetPrefix`, but it does *not* touch URLs we
 * write by hand into `src`/`href`. Under the GitHub Pages project-site
 * basePath those would resolve to the domain root and 404, so every reference
 * to a file in `public/` has to go through here.
 */
export const basePath = process.env.NEXT_PUBLIC_BASE_PATH ?? "";

export function asset(path: string): string {
  return `${basePath}${path.startsWith("/") ? path : `/${path}`}`;
}
