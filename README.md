# London List

Build your London to-do list. Search for places across London, save them to a personal list, and track what you want to see and do.

## Tech stack

- **Frontend** — Next.js (React, TypeScript), Apollo Client, GraphQL
- **Backend** — Strapi (Node.js CMS with GraphQL API)

## Project structure

```
londonlist/
├── frontend/   # Next.js app
└── backend/    # Strapi CMS
```

## Getting started

### Prerequisites

- Node.js 18+
- npm or yarn

### Backend

```bash
cd backend
npm install
npm run develop
```

Strapi admin panel: http://localhost:1337/admin

### Frontend

```bash
cd frontend
npm install
npm run dev
```

App: http://localhost:3000

## Frontend scripts

| Command | Description |
|---|---|
| `npm run dev` | Start dev server |
| `npm run build` | Production build |
| `npm run lint` | Run ESLint |
| `npm run typecheck` | Run TypeScript checks |
| `npm test` | Run tests |
| `npm run test:coverage` | Run tests with coverage |
