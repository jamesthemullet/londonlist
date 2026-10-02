# London List — Frontend

A Next.js app for building and sharing personal to-do lists of things to do in London. Users can
search for places, add them to private or public lists, track progress, and upgrade to a Pro account
for unlimited lists and analytics.

## Tech stack

- **Framework**: Next.js (Pages Router, TypeScript)
- **Data**: Apollo Client → Strapi GraphQL backend
- **Maps**: Leaflet (loaded via `react-leaflet`)
- **Auth**: JWT stored in a cookie, managed by `AppContext`
- **Payments**: Stripe Checkout (redirect flow)
- **Styling**: CSS Modules
- **Tests**: Jest + React Testing Library (unit), Playwright (e2e)

## Prerequisites

- Node.js 20+
- The Strapi backend running locally (see `../backend/README.md`)

## Getting started

```bash
cd frontend
yarn install
yarn dev          # http://localhost:3000
```

Set environment variables (copy `.env.local.example` if one exists, or create `.env.local`):

```
NEXT_PUBLIC_API_URL=http://127.0.0.1:1337   # Strapi GraphQL endpoint base
NEXT_PUBLIC_SITE_URL=http://localhost:3000  # Used for OG/share URLs
STRAPI_URL=http://127.0.0.1:1337           # Server-side API URL (OG image generation)
```

## Key pages

| Route | Description |
|---|---|
| `/` | Home / landing |
| `/explore` | Browse places by category |
| `/area/[area]` | Places in a specific London area |
| `/my-list` | Authenticated user's lists |
| `/list/[username]/[listId]` | Public view of a shared list (with map) |
| `/profile/[username]` | A user's public lists |
| `/templates` | Starter list templates |
| `/pricing` | Free vs Pro tier comparison + Stripe checkout |
| `/login`, `/register`, `/reset-password` | Auth pages |
| `/account` | Account settings |

## Running tests

```bash
# Unit tests
yarn test

# Unit tests with coverage
yarn test:coverage

# e2e (requires dev server running on :3000)
yarn test:e2e
```

## Linting

```bash
yarn lint
yarn knip        # dead exports / unused dependencies
```
