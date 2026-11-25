# London List — frontend

The Next.js (React, TypeScript) app for [London List](../README.md): build a personal
to-do list of places to see and do in London, search and browse places on an interactive
map, and share public lists with others.

This app talks to the Strapi CMS in [`../backend`](../backend) over GraphQL (via Apollo
Client) and REST for auth, list sharing, and Stripe billing.

## Prerequisites

- Node.js 20.9–24 (24 recommended)
- The backend running locally (see [`../backend/README.md`](../backend/README.md)) — the
  frontend needs a running Strapi instance to fetch places, lists, and user data.

## Getting started

```bash
yarn install
yarn dev
```

Open [http://localhost:3000](http://localhost:3000) to see the app.

## Configuration

The frontend reads these environment variables (copy `.env.example` to `.env.local` to
set local overrides):

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
- **Area browsing** (`pages/area/[area].tsx`) — browse all places saved in a specific
  London area or borough.
- **Category explore** (`pages/explore/[category].tsx`) — browse lists by category
  (museums, restaurants, parks, etc.).
- **Templates** (`pages/templates.tsx`, `pages/templates/[id].tsx`) — ready-made London
  itineraries that users can copy to their own list.
- **Personal lists** (`pages/my-list.tsx`) — save places, rename lists, write notes,
  track what's done, toggle public visibility, and share via a link.
- **Map view** (`components/map`) — interactive Leaflet map of a list's places.
- **Place pages** (`pages/place/[type]/[id].tsx`) — dedicated crawlable page for each
  place, with related places and add-to-list action.
- **Public profiles** (`pages/profile/[username].tsx`) — a user's public lists in one
  place, with register CTA for logged-out visitors.
- **Public sharing** (`pages/list/[username]/[listId].tsx`, `components/share-buttons`) —
  shareable list pages with copy-list and social share actions.
- **Booking links** (`components/booking-links`) — affiliate links to OpenTable,
  Booking.com and Viator on place and list pages.
- **Account & milestones** (`pages/account.tsx`) — delete account; milestone/streak
  display and welcome checklist on the dashboard.
- **Dynamic OG images** (`pages/api/og.tsx`, `lib/og-image.ts`) — per-page social preview
  images generated at request time.
- **Sitemap** (`pages/sitemap.xml.tsx`, `lib/sitemap.ts`) — auto-generated XML sitemap
  for all public pages.
- **Billing** (`pages/pricing.tsx`, `components/upgrade-modal`) — Stripe-backed Pro
  upgrade flow with trial, upgrade nudges and usage limits.

## Scripts

| Command | Description |
|---|---|
| `yarn dev` | Start the dev server |
| `yarn build` | Production build |
| `yarn start` | Start the production server |
| `yarn analyze` | Production build with bundle analyser (`ANALYZE=true`) |
| `yarn lint` | Lint with Biome |
| `yarn lint:fix` | Lint and auto-fix with Biome |
| `yarn format` | Format files with Biome |
| `yarn ts-check` | Type-check with `tsc --noEmit` |
| `yarn check` | Lint + type-check |
| `yarn check:fix` | Lint, format and auto-fix with Biome |
| `yarn test` | Run unit tests (Jest) |
| `yarn test:coverage` | Run unit tests with coverage |
| `yarn test:e2e` | Run e2e tests (Playwright) |
| `yarn knip` | Find unused files/exports/dependencies |

## Learn more about Next.js

- [Next.js Documentation](https://nextjs.org/docs)
- [Learn Next.js](https://nextjs.org/learn)
