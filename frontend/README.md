# London List — frontend

The Next.js (React, TypeScript) frontend for London List: build a to-do list of places to
see and do in London, plot them on a map, and share your list with others.

This app is a GraphQL client only — all content, authentication and Stripe billing logic
live in the [Strapi backend](../backend) (`../backend`). The frontend cannot run
meaningfully on its own; start the backend first.

## Features

- Search for places across London and add them to a personal list
- Track progress (to do / done) on each list item
- View your list plotted on a Leaflet map, with a to-do/done legend
- Public/private list visibility and sharing by username
- Explore other public lists, sorted by recency or view count
- List templates and area guides
- Stripe-powered Pro subscription (`pages/pricing.tsx`, `components/upgrade-modal`)

## Getting started

### Prerequisites

- Node.js 18+
- yarn
- The [backend](../backend) running locally (Strapi + GraphQL API)

### Install and run

```bash
yarn install
yarn dev
```

App: http://localhost:3000

### Environment variables

| Variable | Description |
|---|---|
| `STRAPI_URL` | Base URL of the Strapi backend (defaults to `http://127.0.0.1:1337`) |
| `NEXT_PUBLIC_SITE_URL` | Public site URL, used for canonical links and share URLs |
| `NEXT_PUBLIC_BOOKING_AFFILIATE_ID` | Affiliate ID for Booking.com links |
| `NEXT_PUBLIC_OPENTABLE_AFFILIATE_ID` | Affiliate ID for OpenTable links |
| `NEXT_PUBLIC_VIATOR_AFFILIATE_ID` | Affiliate ID for Viator links |

## Scripts

| Command | Description |
|---|---|
| `yarn dev` | Start the Next.js dev server |
| `yarn build` | Production build |
| `yarn start` | Start the production server |
| `yarn lint` | Lint with Biome |
| `yarn ts-check` | Type-check with `tsc --noEmit` |
| `yarn check` | Run lint and type-check |
| `yarn test` | Run unit tests (Jest + React Testing Library) |
| `yarn test:coverage` | Run unit tests with coverage |
| `yarn test:e2e` | Run end-to-end tests (Playwright) |
