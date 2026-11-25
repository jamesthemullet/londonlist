# London List

Browse, save and share the best of London. Search places across the city, build curated lists, track what you've visited, and share your London itineraries with others. Includes area and category browsing, templates, public profiles, place pages, booking links, and a Pro tier powered by Stripe.

Live: https://londonlist.vercel.app

## Tech stack

- **Frontend** — Next.js (React, TypeScript), Apollo Client, GraphQL
- **Backend** — Strapi (Node.js CMS with GraphQL API)

## Project structure

```
londonlist/
├── frontend/   # Next.js app (see frontend/README.md)
└── backend/    # Strapi CMS (see backend/README.md)
```

## Getting started

### Prerequisites

- Node.js 20.9–24 (24 recommended)
- yarn

### Backend

```bash
cd backend
yarn install
yarn develop
```

Strapi admin panel: http://localhost:1337/admin

### Frontend

```bash
cd frontend
yarn install
yarn dev
```

App: http://localhost:3000

See [`frontend/README.md`](frontend/README.md) and [`backend/README.md`](backend/README.md) for full setup and script references.
