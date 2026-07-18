# Dataverse Landing Page

Public marketing site for [Dataverse](https://github.com/AlphaLeap-AI) — an enterprise data agent for grounded, SQL-backed answers.

This repository is **marketing-only**. It does not include the product application (sign-in, dashboard, chat, or API clients).

## Quick start

```bash
cp .env.example .env.local
# set NEXT_PUBLIC_SITE_URL and NEXT_PUBLIC_DEMO_EMAIL

npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

## Environment variables

| Variable | Purpose |
|----------|---------|
| `NEXT_PUBLIC_SITE_URL` | Canonical site URL for SEO (`robots.txt`, sitemap, Open Graph) |
| `NEXT_PUBLIC_DEMO_EMAIL` | Inbox used by the demo request form (`mailto:`) |

No API keys or backend credentials are required or accepted.

## Scripts

- `npm run dev` — development server
- `npm run build` — production build
- `npm start` — serve production build

## License

Apache License 2.0 — see [LICENSE](./LICENSE).
