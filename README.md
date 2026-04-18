# EcoPass Shopify App

Repository: https://github.com/Elena-Trambusti/ecopass

EcoPass is an embedded Shopify app that lets merchants configure and display a Digital Product Passport badge on product pages through a Theme App Extension.

## Core Features

- Embedded admin dashboard for badge styling and enablement.
- Product sustainability badge rendered in storefront theme blocks.
- Automatic metafield population for DPP fallback values.
- Subscription billing plan (EcoPass Pro) with trial support.
- Shopify webhook handling for uninstall and privacy compliance workflows.

## Tech Stack

- Remix + Shopify App Remix
- Polaris + App Bridge
- Prisma ORM
- Theme App Extension (Liquid/CSS/JS)

## Local Setup

1. Copy `.env.example` to `.env`.
2. Fill valid Shopify credentials and local app URL.
3. Configure Postgres for local development.

Se su Windows non hai Docker, segui: [docs/LOCAL_DATABASE_WINDOWS.md](docs/LOCAL_DATABASE_WINDOWS.md)

Se hai Docker Desktop:

```bash
docker compose up -d
```

4. Install dependencies:
   - `npm install`
5. Generate Prisma client:
   - `npm run prisma:generate`
6. Apply database migrations:
   - `npx prisma migrate dev`
7. Start development:
   - `npm run dev`

## Deploy su Fly.io

Segui la guida passo-passo: [docs/DEPLOY_FLY.md](docs/DEPLOY_FLY.md)

## Quality Gates

Run before each release:

- `npm run typecheck`
- `npm run build`
- `npm run test`

## Privacy and Legal

- Privacy policy draft: `PRIVACY.md`
- Terms draft: `TERMS.md`
- Support policy draft: `SUPPORT.md`

## App Store Submission References

- Listing copy source: `docs/LISTING_COPY.md`
- Release and dry-run checklist: `docs/RELEASE_CHECKLIST.md`

## Production Notes

- Replace placeholder production URL values in `shopify.app.toml` before publishing.
- Keep `.env` out of source control and rotate secrets if exposed.

