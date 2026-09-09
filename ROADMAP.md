# Product Roadmap — London List

The core loop already works: search places, save to a list, track what you want to do. What's
missing is anything that makes a saved place easy to revisit or discover more of — no related
places, no browsing by area, no way to see a place's own page. Everything below is scored
against four jobs:

- **Acquisition** — brings new visitors in
- **Engagement** — deepens a single visit
- **Retention** — earns a repeat visit
- **Fun** — no metric, just delight

Every feature is broken into a **PR sequence** — each step small enough for a human to review in
about 15 minutes. Genuinely atomic changes are left as one PR.

## Now (ship in weeks — reuses existing infra)

### 1. Individual place pages — *Acquisition, SEO*
Each place currently only exists inside search results and the saved list — give each one its
own crawlable, shareable URL.

1. GraphQL query for a single place by slug/ID — pure function + tests, reusing the existing
   Apollo Client setup against the Strapi API.
2. A place detail page (`pages/place/[slug].tsx`) rendering it.

### 2. Related/nearby places — *Engagement, Retention*
Once individual place pages exist (feature 1), surface a few nearby or same-category places at
the bottom.

1. GraphQL query: places sharing category/area with a given place — pure function + tests.
2. Component rendering the related-places list on the place detail page.

### 3. Browse by area — *Acquisition, Engagement*
A dedicated way to browse places by London area/borough, rather than only via search.

1. GraphQL query: places filtered by area — pure function + tests.
2. An area listing page + area filter UI, reusing the search results component's rendering.

## Next (this quarter — moderate new build)

### 4. List sharing — *Acquisition, Fun*
Let a user share their personal to-do list (or a subset of it) via a public link.

1. A shareable-slug field/endpoint for a user's list — pure function + tests.
2. A read-only shared-list page rendering it.
3. A "share my list" UI action generating and copying the link.

---
*London List — product roadmap, 2 September 2026*
