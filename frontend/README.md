# London List — frontend

The Next.js (React, TypeScript) app for [London List](../README.md): build a personal
to-do list of places to see and do in London, search and browse places on an interactive
map, and share public lists with others.

This app talks to the Strapi CMS in [`../backend`](../backend) over GraphQL (via Apollo
Client) and REST for auth, list sharing, and Stripe billing.

## Prerequisites

- Node.js 18+
- The backend running locally (see [`../backend/README.md`](../backend/README.md)) — the
  frontend needs a running Strapi instance to fetch places, lists, and user data.

## Getting started

```bash
yarn install
yarn dev
```

Open [http://localhost:3000](http://localhost:3000) to see the app.

## Configuration

The frontend reads these environment variables (see `.env.development` at the repo root
for local defaults):

| Variable | Purpose | Default |
|---|---|---|
| `STRAPI_URL` | Base URL of the Strapi backend (GraphQL + REST) | `http://127.0.0.1:1337` |
| `NEXT_PUBLIC_SITE_URL` | Public site URL, used for canonical/OG tags and sitemaps | `https://londonlist.vercel.app` |
| `NEXT_PUBLIC_OPENTABLE_AFFILIATE_ID` | OpenTable affiliate ID for booking links | — |
| `NEXT_PUBLIC_BOOKING_AFFILIATE_ID` | Booking.com affiliate ID for booking links | — |
| `NEXT_PUBLIC_VIATOR_AFFILIATE_ID` | Viator affiliate ID for booking links | — |

## Key features

- **Search & explore** (`pages/index.tsx`, `pages/explore.tsx`, `components/search`) —
  search places across London by category and area.
- **Personal lists** (`pages/my-list.tsx`, `components/my-list`) — save places, track
  what's done, and toggle a list's public visibility.
- **Map view** (`components/map`) — a Leaflet map of a list's places.
- **Public sharing** (`pages/list/[username]/[listId].tsx`, `components/share-buttons`) —
  shareable public list pages.
- **Billing** (`pages/pricing.tsx`, `components/upgrade-modal`) — Stripe-backed Pro
  upgrade flow.

## Scripts

| Command | Description |
|---|---|
| `yarn dev` | Start the dev server |
| `yarn build` | Production build |
| `yarn start` | Start the production server |
| `yarn lint` | Lint with Biome |
| `yarn ts-check` | Type-check with `tsc --noEmit` |
| `yarn check` | Lint + type-check |
| `yarn test` | Run unit tests (Jest) |
| `yarn test:coverage` | Run unit tests with coverage |
| `yarn test:e2e` | Run e2e tests (Playwright) |
| `yarn knip` | Find unused files/exports/dependencies |

## Learn more about Next.js

- [Next.js Documentation](https://nextjs.org/docs)
- [Learn Next.js](https://nextjs.org/learn)
