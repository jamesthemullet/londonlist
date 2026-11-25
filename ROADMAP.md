# Product Roadmap — London List

The core product is now live at https://londonlist.vercel.app. Users can search places,
save them to named lists, browse by area or category, share lists publicly, copy templates,
and upgrade to Pro via Stripe. The focus shifts to monetisation, deeper engagement, and
SEO-driven acquisition.

Every feature is scored against four jobs:

- **Acquisition** — brings new visitors in
- **Engagement** — deepens a single visit
- **Retention** — earns a repeat visit
- **Monetisation** — generates revenue

## Shipped

### Individual place pages — *Acquisition, SEO*
- [x] GraphQL query for a single place by slug/ID.
- [x] Place detail page (`pages/place/[type]/[id].tsx`) with structured data and add-to-list.

### Related/nearby places — *Engagement, Retention*
- [x] GraphQL query: places sharing category/area with a given place.
- [x] Related-places component on the place detail page.

### Browse by area — *Acquisition, Engagement*
- [x] GraphQL query: places filtered by area.
- [x] Area listing page + area filter UI (`pages/area/[area].tsx`).

### List sharing — *Acquisition, Fun*
- [x] Shareable-slug field/endpoint for a user's list.
- [x] Read-only shared-list page (`pages/list/[username]/[listId].tsx`).
- [x] "Share my list" UI — copy link and social share buttons.

## Now (highest priority)

### Affiliate revenue activation — *Monetisation*
Booking links (OpenTable, Booking.com, Viator) are wired but inactive until affiliate
accounts are registered. See GitHub issue #239 (`needs-human`).

### Upgrade conversion — *Monetisation*
- [ ] Near-limit upgrade nudge when a free user approaches the place or list limit.
- [ ] Annual plan option on the pricing page alongside the monthly plan.

### Discovery & SEO — *Acquisition*
- [ ] Schema.org `BreadcrumbList` on place and area pages.
- [ ] `hreflang` / language meta once internationalisation is considered.
- [ ] Proper HTTP 404 for every unknown slug (currently some pages soft-404 with 200).

---
*London List — product roadmap, updated November 2026*
