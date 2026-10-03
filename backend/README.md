# London List — Backend

[Strapi 5](https://strapi.io) CMS powering London List, exposing a GraphQL API for the
[Next.js frontend](../frontend). It stores places to see and do in London, user accounts and
lists, and handles Stripe-backed Pro subscriptions.

## Content types (`src/api`)

- `attraction`, `exhibition`, `museum` — places and events users can search for and add to a list.
- `list`, `list-item`, `list-setting` — a user's personal to-do list, its items, and per-list
  settings (visibility, etc.).
- `account` — custom account-management endpoints layered on top of the built-in
  `users-permissions` plugin.
- `stripe` — checkout, billing portal, and webhook handling for Pro subscriptions.

GraphQL is served at `/graphql` via `@strapi/plugin-graphql`; see `config/env/production/plugins.js`
for the production GraphQL config.

## Getting started

```bash
npm install
npm run develop
```

Strapi admin panel: [http://localhost:1337/admin](http://localhost:1337/admin)

Requires a `.env` with database credentials and the app/API keys Strapi generates on first run,
plus Stripe keys for the `stripe` API to work.

## Scripts

| Command | Description |
|---|---|
| `npm run develop` | Start with autoReload enabled |
| `npm run start` | Start with autoReload disabled |
| `npm run build` | Build the admin panel |
| `npm run lint` | Run Biome lint |
| `npm run check` | Run Biome checks |
| `npm test` | Run tests (Jest) |

## Deployment

See the [Strapi deployment documentation](https://docs.strapi.io/developer-docs/latest/setup-deployment-guides/deployment.html)
for general guidance. Production-specific config lives under `config/env/production/`.
