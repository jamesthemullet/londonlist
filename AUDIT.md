# Site Audit

Living checklist maintained by the `/full-audit` skill. Findings are appended, never rewritten;
check an item off (`- [x]`) once you've fixed it and it won't be touched again. Re-running the
audit adds new findings to the bottom of each section and leaves checked items alone.

## Run log

- 2026-09-01 — initial audit: 34 findings (5 test coverage, 5 SEO, 4 responsive/UX, 5 security, 5 README/alignment, 7 code quality, 3 performance)

## 1. Test coverage — unit gaps and e2e

- [x] `frontend/jest.config.js`'s `collectCoverageFrom` excludes `pages/**` entirely, so `pages/museum/[id].tsx`, `my-list.tsx`, `login.tsx`, `register.tsx`, `reset-password.tsx`, `account.tsx`, `list/[username]/[listId].tsx`, `explore.tsx` etc. have unmeasured unit coverage — add `pages/**/*.{ts,tsx}` (excluding `_app.tsx`/`_document.tsx`/`api/**`) to surface real numbers (found: 2026-09-01) (fixed: 2026-09-01)
- [ ] `frontend/components/upgrade-modal/upgrade-modal.tsx` is at 94.44% stmts / 85.71% funcs, uncovered line 49 — add a test for the untested branch/callback (Stripe-adjacent UI) (found: 2026-09-01)
- [x] Backend has zero test files under `backend/src` and no `test` script in `backend/package.json` — start with `backend/src/api/stripe/controllers/stripe.ts` (custom checkout/webhook logic, highest priority given it handles money) (found: 2026-09-01) (fixed: 2026-09-03)
- [ ] Add unit tests for `backend/src/api/list/controllers/list.ts` (140 lines of custom ownership/visibility logic, currently untested) (found: 2026-09-01)
- [ ] Add unit tests for `backend/src/api/account/controllers/account.ts` and `backend/src/api/list-setting/controllers/list-setting.ts` (custom logic, currently untested) (found: 2026-09-01)
- [ ] No e2e spec covers register → login → reset-password happy path — add `frontend/e2e/auth-flow.spec.ts` (existing specs `auth.spec.ts`/`public-pages.spec.ts` only test logged-out redirects and form validation, not a real submit) (found: 2026-09-01)
- [ ] No e2e spec covers `pages/museum/[id].tsx` — add `frontend/e2e/museum-detail.spec.ts` navigating from explore/search into a museum detail page and asserting content renders (found: 2026-09-01)
- [ ] No e2e spec covers personal list building (add/remove item, visibility toggle) — add `frontend/e2e/my-list-management.spec.ts` for `pages/my-list.tsx` / `components/list-visibility-toggle` (found: 2026-09-01)
- [ ] No e2e spec covers the Leaflet map (`components/map/list-map.tsx`) — add `frontend/e2e/list-map.spec.ts` for pin rendering and click-through to a detail page (found: 2026-09-01)
- [ ] No e2e spec covers the Stripe upgrade/checkout trigger (`components/upgrade-modal`, `pages/pricing.tsx`) — add `frontend/e2e/upgrade-checkout.spec.ts` covering the modal trigger and redirect to Stripe Checkout (can stop at the redirect boundary) (found: 2026-09-01)

## 2. Accessibility

- [ ] List page (`pages/list/[username]/[listId].tsx`) `<h1>` renders as a bare number (e.g. "2") when no descriptive list name is set — screen-reader users navigating by heading get no context; default to something like "Untitled list" when name is empty (found: 2026-09-01)
- [ ] `pages/museum/[id].tsx` error state ("Error Loading Exhibitions") has no heading semantics, no retry action, and no link back to Explore when the GraphQL query fails — see also item under Responsive/UX below (found: 2026-09-01)

## 3. Performance

- [ ] `.github/lighthouse/budget.json` exists (200KB script budget, 4 third-party resource limit) but nothing in `.github/workflows/` (`ci.yml` or `pull_request_audit.yml`) references Lighthouse or this file — either wire in `@lhci/cli` or remove the dead config (found: 2026-09-01)
- [ ] `frontend/pages/museum/[id].tsx:5,68-75` has a fully commented-out `next/image` block for `ExhibitionCard` — exhibitions currently render no image at all; either restore the image or remove the dead code (found: 2026-09-01)
- [ ] `next build` (Turbopack) prints no per-route First Load JS bundle sizes, so route-by-route comparison against the 200KB script budget isn't currently possible from build output alone — would need `next build --profile` or a bundle analyzer to get real numbers if the budget above is ever enforced (found: 2026-09-01)

## 4. SEO / metadata

- [ ] `frontend/pages/museum/[id].tsx` has no per-route `<Head>`/title/description/OG tags at all — falls back to the generic "London List" default; add a title using `museum.data.attributes.name` (highest-impact single fix, most shareable/indexable page type) (found: 2026-09-01)
- [ ] `frontend/pages/museum/[id].tsx` has no JSON-LD structured data — add a `Place`/`TouristAttraction` schema.org block mirroring the pattern already used in `list/[username]/[listId].tsx:332` (found: 2026-09-01)
- [ ] `frontend/pages/login.tsx` and `reset-password.tsx` have no `<Head>`/title override, falling back to the generic "London List" title — add short per-page titles (e.g. "Log in — London List") for browser tab/history clarity (found: 2026-09-01)
- [ ] `frontend/pages/pricing.tsx:117-123` has a `<title>` but no meta description or OG tags, unlike every other content page — add them for consistency (found: 2026-09-01)
- [ ] `frontend/pages/museum/[id].tsx` uses `<h3>` for exhibition subheadings (line 77) with no `<h2>` in between, skipping a heading level — fix alongside the title/JSON-LD work above (found: 2026-09-01)

## 5. Responsive / UX

- [ ] `pages/list/[username]/[listId].tsx` — on a hard/direct navigation (full page load, not client-side routing) the Leaflet map and its To Do/Done legend fail to render entirely, leaving an empty gap, while the list below loads fine; reproduced twice on fresh reloads. This breaks the primary list-sharing use case (opening a shared link directly) (found: 2026-09-01)
- [ ] `pages/museum/[id].tsx` — loads indefinitely ("Loading...") then settles into a raw, unstyled "Error Loading Exhibitions" message with no retry button or link back to Explore, for at least museum id `1` — a raw GraphQL-style error is surfaced directly to the user instead of a friendly not-found/error state (found: 2026-09-01)
- [ ] Header auth state (Log In/Sign Up vs. My List/email/Log Out) flickers inconsistently across consecutive reloads of the same URL on `/login`, `/register`, `/reset-password`, and hard-navigated list pages for the same unchanged session — suggests the client-side auth check races with hydration rather than reading a reliable source of truth (found: 2026-09-01)
- [ ] Logged-in users can still fully access and submit `/login`, `/register`, `/reset-password` — no redirect to their list occurs; minor UX confusion, not a security issue (found: 2026-09-01)

## 6. Security

- [ ] `backend/config/env/production/plugins.js:6-11` sets `playgroundAlways: true` and `apolloServer.introspection: true`, exposing the full GraphQL schema and an interactive query UI at `/graphql` in production — set `playgroundAlways: false` and `introspection: env('NODE_ENV') !== 'production'` (found: 2026-09-01)
- [ ] `backend/config/middlewares.ts:1,15,19` — CORS falls back to `http://localhost:3000` and to `allowedOrigins[0]` if `FRONTEND_URL` is unset in production; add a startup assertion so a misconfigured prod deploy fails loudly instead of silently allowing localhost (found: 2026-09-01)
- [ ] Backend `yarn audit` reports 29 issues (8 High, 12 Moderate, 9 Low), all transitive via `@strapi/strapi > ... > browserslist` (advisories 1153171/1153172, unbounded memory growth / prototype-write crash from untrusted `browserslist-stats.json`) — build-tool-time only, not runtime-reachable from user input, but track for resolution via a Strapi/browserslist upgrade (found: 2026-09-01)

## 7. README / feature alignment

- [ ] `frontend/README.md` is unmodified `create-next-app` boilerplate — doesn't describe London List, its map/list features, or the Strapi backend it depends on (found: 2026-09-01)
- [ ] `backend/README.md` is unmodified default Strapi boilerplate — doesn't describe London List's actual content types or how it fits the frontend (found: 2026-09-01)
- [ ] The `attraction` Strapi content type (`backend/src/api/attraction/` — full schema, controller, route, service) appears to have no corresponding GraphQL query/usage anywhere in `frontend/` — confirm whether it's still needed or should be removed/wired up (found: 2026-09-01)

## 8. Code quality

- [ ] `backend/src/api/account/controllers/account.ts:3,15,21`, `backend/src/api/list/controllers/list.ts` (9 occurrences incl. `as unknown as never` at line 114), and `backend/src/api/stripe/controllers/stripe.ts:28,33,62,67,82,97` rely on repeated inline `as {...}` casts of `ctx.state.user`/`ctx.request.body` instead of Strapi's generated types — introduce a shared `AuthenticatedUser` type and typed body helper (one small PR per file) (found: 2026-09-01)
- [ ] Identical `strapi.db.query('plugin::users-permissions.user').findMany({ where: { username } })` lookup is duplicated in `backend/src/api/list/controllers/list.ts:49,87` and `backend/src/api/list-setting/controllers/list-setting.ts:25` — extract to a shared `findUserByUsername` service helper (found: 2026-09-01)
- [ ] `FREE_LIST_LIMIT = 3` / `FREE_ITEM_LIMIT = 20` are independently declared in `backend/src/index.ts:11-12` and `frontend/pages/my-list.tsx:71-72` and can silently drift — centralize via a shared config/API endpoint (found: 2026-09-01)
- [ ] `GET_MY_LISTS`/`CREATE_MY_LIST`/`UPDATE_MY_LIST` in `frontend/pages/my-list.tsx:28-63` all request the same list fields (`documentId, name, description, isPublic, viewCount`) — extract to a shared Apollo fragment (found: 2026-09-01)
- [ ] `SITE_URL` fallback is copy-pasted across 7 files; 6 correctly fall back to `https://londonlist.vercel.app` but `frontend/pages/list/[username]/[listId].tsx:18` falls back to `https://londonlist.co.uk` — a domain the project does not own. Fix the one-line mismatch and consider extracting `SITE_URL` to one shared constant module (also surfaced independently by the browser audit: share buttons on the list page build links using `londonlist.co.uk`) (found: 2026-09-01)
- [ ] `frontend/components/meta/meta.tsx:3-23` has a 21-line commented-out `seoProps` type block no longer referenced anywhere — delete it (found: 2026-09-01)
- [ ] `frontend/pages/museum/[id].tsx:62` has a vague leftover `// will add some logic here` placeholder comment with no tracking issue — clean up (found: 2026-09-01)
