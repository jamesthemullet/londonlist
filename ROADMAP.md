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
about 15 minutes. Genuinely atomic changes are left as one PR. Tick a step off once its PR merges.

## Now (ship in weeks — reuses existing infra)

### 1. Individual place pages — *Acquisition, SEO*
Each place currently only exists inside search results and the saved list — give each one its
own crawlable, shareable URL.

- [x] GraphQL query for a single place by slug/ID — pure function + tests, reusing the existing
  Apollo Client setup against the Strapi API.
- [x] A place detail page (`pages/place/[slug].tsx`) rendering it.

### 2. Related/nearby places — *Engagement, Retention*
Once individual place pages exist (feature 1), surface a few nearby or same-category places at
the bottom.

- [x] GraphQL query: places sharing category/area with a given place — pure function + tests.
- [x] Component rendering the related-places list on the place detail page.

### 3. Browse by area — *Acquisition, Engagement*
A dedicated way to browse places by London area/borough, rather than only via search.

- [x] GraphQL query: places filtered by area — pure function + tests.
- [x] An area listing page + area filter UI, reusing the search results component's rendering.

## Next (this quarter — moderate new build)

### 4. List sharing — *Acquisition, Fun*
Let a user share their personal to-do list (or a subset of it) via a public link.

- [x] A shareable-slug field/endpoint for a user's list — pure function + tests.
- [x] A read-only shared-list page rendering it.
- [x] A "share my list" UI action generating and copying the link.

---
*London List — product roadmap, 2 September 2026*
