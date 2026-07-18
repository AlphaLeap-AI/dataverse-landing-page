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
- `npm run build` — production build
- `npm start` — serve production build

## License

Apache License 2.0 — see [LICENSE](./LICENSE).
