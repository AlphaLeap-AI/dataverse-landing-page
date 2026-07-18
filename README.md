# Dataverse Landing Page

Public marketing site for [Dataverse](https://github.com/AlphaLeap-AI) — an enterprise data agent for grounded, SQL-backed answers.

This repository is **marketing-only**. It does not include the product application (sign-in, dashboard, chat, or API clients).

## Quick start

```bash
./build.sh    # install deps if needed, start on http://localhost:3000
./stop.sh     # stop cleanly
```

Optional: copy env first, or let `./build.sh` create `.env.local` from `.env.example`:

```bash
cp .env.example .env.local
# set NEXT_PUBLIC_SITE_URL and NEXT_PUBLIC_DEMO_EMAIL
```

Override port with `PORT=3001 ./build.sh` (use the same `PORT` with `./stop.sh`).

## Environment variables

| Variable | Purpose |
|----------|---------|
| `NEXT_PUBLIC_SITE_URL` | Canonical site URL for SEO (`robots.txt`, sitemap, Open Graph) |
| `NEXT_PUBLIC_DEMO_EMAIL` | Inbox used by the demo request form (`mailto:`) |

No API keys or backend credentials are required or accepted.

## Scripts

- `./build.sh` — start the marketing site (background; writes `.landing.pid` / `.landing.log`)
- `./stop.sh` — stop the process started by `./build.sh`
- `npm run dev` — development server (foreground)
- `npm run build` — production build (static export → `out/`)
- `npm start` — not used for static export; serve `out/` with any static host

## Deploy to GitHub Pages

This site is configured for **static export** and deploys via GitHub Actions.

**Live URL (project Pages):**  
https://alphaleap-ai.github.io/dataverse-landing-page/

### One-time repo setup

1. Open **Settings → Pages**.
2. Under **Build and deployment → Source**, choose **GitHub Actions**.
3. (Optional) **Settings → Secrets and variables → Actions → Variables**  
   add `NEXT_PUBLIC_DEMO_EMAIL` with your demo inbox address.

### How it works

- Push to `master` (or run the workflow manually under **Actions**).
- Workflow sets `GITHUB_PAGES=true` so Next builds with `basePath` `/dataverse-landing-page`.
- Artifact is the static `out/` folder; GitHub Pages serves it.

### Local static build (same as CI)

```bash
GITHUB_PAGES=true \
  NEXT_PUBLIC_SITE_URL=https://alphaleap-ai.github.io/dataverse-landing-page \
  NEXT_PUBLIC_DEMO_EMAIL=sales@example.com \
  npm run build

npx serve out
```

### Custom domain later

1. Set the domain under **Settings → Pages**.
2. Build **without** `GITHUB_PAGES=true` (root paths, no repo basePath).
3. Point `NEXT_PUBLIC_SITE_URL` at the custom domain.

## License

Apache License 2.0 — see [LICENSE](./LICENSE).
