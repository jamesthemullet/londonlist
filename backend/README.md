# London List — Backend

[Strapi 5](https://strapi.io) CMS powering London List, exposing a GraphQL API for the
[Next.js frontend](../frontend). It stores user accounts and lists, and handles
Stripe-backed Pro subscriptions. Place data comes from OpenStreetMap via the frontend's search;
only list and account state is persisted here.

## Content types (`src/api`)

- `list`, `list-item` — a user's personal to-do list and its individual place entries.
- `list-setting` — per-list visibility settings (public/private).
- `account` — custom account-management endpoints (delete account, etc.) layered on top of the
  built-in `users-permissions` plugin.
- `stripe` — checkout, billing portal, and webhook handling for Pro subscriptions.

Custom GraphQL resolvers (`src/index.ts`) expose `place`, `placesByArea`, `relatedPlaces`,
`allPlaces`, and `planLimits` queries that proxy place data from the OpenStreetMap-backed Strapi
records. These are anonymous (no auth required). GraphQL is served at `/graphql` via
`@strapi/plugin-graphql`; see `config/env/production/plugins.js` for the production config.

## Getting started

```bash
yarn install
yarn develop
```

Strapi admin panel: [http://localhost:1337/admin](http://localhost:1337/admin)

Requires a `.env` with database credentials and the app/API keys Strapi generates on first run,
plus Stripe keys for the `stripe` API to work.

## Scripts

| Command | Description |
|---|---|
| `yarn develop` | Start with autoReload enabled |
| `yarn start` | Start with autoReload disabled |
| `yarn build` | Build the admin panel |
| `yarn lint` | Run Biome lint |
| `yarn check` | Run Biome checks and TypeScript |
| `yarn test` | Run Jest unit tests |
| `yarn knip` | Detect unused exports |

## Environment variables

Key variables required in `.env` (see `.env.example`):

- `DATABASE_*` — PostgreSQL connection details
- `APP_KEYS`, `API_TOKEN_SALT`, `ADMIN_JWT_SECRET`, `JWT_SECRET`, `TRANSFER_TOKEN_SALT` — Strapi-generated secrets
- `FRONTEND_URL` — required in production for CORS (comma-separated for multiple origins)
- `STRIPE_SECRET_KEY`, `STRIPE_WEBHOOK_SECRET`, `STRIPE_PRO_MONTHLY_PRICE_ID`, `STRIPE_PRO_ANNUAL_PRICE_ID` — Stripe billing

## Deployment

Production-specific config lives under `config/env/production/`. See the
[Strapi deployment documentation](https://docs.strapi.io/developer-docs/latest/setup-deployment-guides/deployment.html)
for general guidance.

## Node version

Node 20.9–24 (24 recommended). See `package.json` `engines` field.
