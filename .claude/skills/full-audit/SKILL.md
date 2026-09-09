---
name: full-audit
description: Run a full audit of London List (Next.js/TypeScript frontend + Strapi/GraphQL backend) covering test coverage (unit + e2e gaps), accessibility, performance, SEO, responsive/UX, security, code quality (typing, duplication, bad patterns, dead code), and README/feature alignment. Appends new findings to a persistent AUDIT.md checklist in the repo (existing checked-off items are preserved). Use when the user asks to audit, review the health of, or find improvements for the whole site — not for reviewing a single PR/diff (use /code-review for that).
---

# Full site audit

Produces a holistic health report for London List: `frontend` (Next.js/TypeScript, Apollo/GraphQL
client, Leaflet maps) + `backend` (Strapi 5 headless CMS, GraphQL plugin, users-permissions auth,
Stripe integration). This is NOT a PR/diff review — `yarn ts-check`, `yarn lint` (Biome), `yarn
test`, and `yarn knip` are already enforced as CI gates on every frontend PR (`.github/workflows/
ci.yml`), and Biome/Knip run on the backend too — so **do not re-check whether the app
lints/type-checks/builds/has dead exports per knip — it already does**. This audit looks at things
no single PR's gates catch: coverage gaps on untouched files, e2e coverage of real user flows
beyond what Playwright already exercises, cross-cutting site quality (a11y, perf, SEO, security,
UX), and code quality issues that a passing type-check/lint/knip run doesn't guarantee (e.g. `any`
casts and prop-drilled duplication still pass cleanly — see category 8).

## When to run this

User asks to "audit the site", "find ways to improve the website", "do a full review of the app",
or similar whole-app requests. If they ask about a single PR or the current diff, use
`/code-review` instead.

## Output

Findings live in a single persistent file at the repo root: **`AUDIT.md`**. This is not a
one-off report — it's a living checklist that accumulates across runs. Each run **appends**,
never replaces:

- `AUDIT.md` has one `## <n>. <Category>` section per category below, in the same order, each
  containing a flat markdown checklist (`- [ ] finding text (found: YYYY-MM-DD)`).
- **Before writing anything**, read the current `AUDIT.md` in full (create it from the template
  below if it doesn't exist yet).
- For each category, compare this run's findings against what's already listed in that section:
  - If a finding already exists (same issue, same file/route — wording may differ slightly),
    **do not duplicate it**. Leave the existing line untouched.
  - If an existing unchecked item no longer reproduces (verify, don't assume — re-check it),
    check it off and add `(resolved: YYYY-MM-DD, verified during audit)` rather than deleting
    the line, so there's a record.
  - **Never touch a line that's already checked off (`- [x]`)** — those are the user's own
    record of completed work. Leave them exactly as-is, in place.
  - Genuinely new findings get appended to the bottom of that section's list as new `- [ ]`
    items, dated.
- Add a line to the `## Run log` section at the top with today's date and a one-line summary
  (e.g. "2026-08-30 — 4 new findings (2 a11y, 1 security, 1 code quality), 1 item resolved").
- Do not renumber, reorder, or rewrite prose outside the checklists — this file is meant to be
  readable as a diff over time.

Do not modify application code during the audit unless the user explicitly asks you to fix
something after seeing the report — this skill is read-only/diagnostic aside from editing
`AUDIT.md` itself.

### AUDIT.md template (use this structure if the file doesn't exist yet)

```markdown
# Site Audit

Living checklist maintained by the `/full-audit` skill. Findings are appended, never rewritten;
check an item off (`- [x]`) once you've fixed it and it won't be touched again. Re-running the
audit adds new findings to the bottom of each section and leaves checked items alone.

## Run log

- YYYY-MM-DD — initial audit

## 1. Test coverage — unit gaps and e2e

## 2. Accessibility

## 3. Performance

## 4. SEO / metadata

## 5. Responsive / UX

## 6. Security

## 7. README / feature alignment

## 8. Code quality
```

## How to run it

Fan out the categories below as parallel forks or a general-purpose subagent per category (they
are independent and read-heavy — keep the raw output out of your main context). Have each one
**report findings back as text**, not write to `AUDIT.md` directly — only you should touch that
file, in a single merge pass at the end, so the dedup/checked-item rules above are applied
consistently in one place. Categories needing the browser (a11y/perf/responsive/e2e-walkthrough)
should run together in one browser-driving pass since they all need the app running.

Before starting, check whether a dev server is already running; if not, start `backend`
(`yarn develop`, port 1337 — Strapi admin/GraphQL) and `frontend` (`yarn dev`, port 3000) yourself
for the duration of the audit, and stop them when done unless the user is already running them.
The frontend expects `NEXT_PUBLIC_API_URL` pointing at the backend (defaults to
`http://localhost:1337` per `.env.development`).

### 1. Test coverage — unit gaps and e2e

- Run `yarn test:coverage` in `frontend` (Jest + Testing Library). Even though coverage isn't
  enforced at 100%, list files sitting at 0% or notably low coverage, especially
  `components/`, `context/AppContext.tsx`, and `pages/*` (auth pages, museum detail, list pages).
- `backend` has no `test` script and no test files under `backend/src` — treat "no backend test
  coverage at all" as a single finding, and separately assess risk by listing which
  controllers/services have custom logic worth testing (e.g. `src/api/stripe/controllers/
  stripe.ts`, `src/api/account/controllers/account.ts`, `src/api/list-item`, `src/api/list`,
  `src/api/list-setting` custom routes) versus auto-generated Strapi CRUD that needs none.
- **E2e coverage**: Playwright (`yarn test:e2e` in `frontend`, run in CI) already exists — read
  the specs under `frontend/e2e` (or wherever they live) to see which flows are actually covered,
  then walk the app in the browser via `claude-in-chrome` to find flows that aren't:
  - Register → login → reset password (users-permissions auth flow)
  - Browsing museums/attractions/exhibitions, viewing a museum detail page (`pages/museum/[id]`)
  - Building/editing a personal list (add/remove list items, list settings)
  - Map interactions (Leaflet/react-leaflet) — pin rendering, clicking through to detail pages
  - Any Stripe-backed flow (checkout/payment) if one is live in the UI
  For each flow, report whether it currently has a Playwright spec, and if not, propose a
  specific new spec file/test name rather than a vague "add e2e for X".

### 2. Accessibility

- The `pull_request_audit.yml` workflow already runs `axe-core` against `http://localhost:3000/`
  on every PR — treat that as covering the homepage only. Re-run an automated pass (axe via
  browser console injection, or Lighthouse a11y score through `claude-in-chrome`) on every other
  route: login, register, reset-password, museum list, museum detail, list pages.
- Manual: color contrast, focus order/visible focus states, form labels on auth forms, map
  keyboard/screen-reader alternatives (Leaflet maps are notoriously inaccessible — check for a
  non-map fallback list of locations), keyboard-only completion of list-building flows.

### 3. Performance

- Lighthouse performance score and Core Web Vitals (LCP, CLS, INP) per route, checked against
  the budgets already declared in `.github/lighthouse/budget.json` (3500ms interactive, 1000ms
  FCP, 2800ms LCP, 200KB script budget, max 4 third-party resources) — flag any route that would
  blow those budgets even though nothing currently enforces this file in CI (verify whether a
  Lighthouse CI workflow actually reads it; if not, that's itself a finding).
- Next.js build output: bundle size (`next build` output), unused JS/CSS, image optimization
  (are museum/attraction images using `next/image`?), Leaflet bundle weight, GraphQL query
  over-fetching (Apollo Client queries pulling more fields than a page renders).
- Backend: response time on key GraphQL/REST endpoints (museum list, list CRUD) under a simple
  manual check; note the DB in use (`better-sqlite3` locally vs `pg` in prod per
  `backend/config/database.ts`) since performance characteristics differ.

### 4. SEO / metadata

- Per-route `<title>`/meta description via the `components/meta` component — confirm every page
  under `pages/` actually uses it with unique, relevant content (not a single hardcoded default).
- Open Graph tags, presence of `sitemap.xml`/`robots.txt` (note: `backend/public/robots.txt`
  exists — check whether the *frontend* also serves one, since that's what search engines will
  hit), semantic heading structure per route, whether museum/attraction/exhibition detail pages
  have structured data (schema.org `Place`/`LocalBusiness`) given they're location-based content.

### 5. Responsive / UX

- Screenshot each route at ~375px and ~1280px via `claude-in-chrome` — pay particular attention
  to the Leaflet map component and list-building UI, which are the most layout-fragile parts of
  the app — look for anything that's drifted or was never verified holistically.
- Console errors on load/navigation (`read_console_messages`), broken links, dead-end states,
  GraphQL error states surfaced ungracefully to the user.

### 6. Security

- Auth flow review: Strapi `users-permissions` plugin config, session/JWT handling, password
  reset token flow, any secrets or API keys exposed client-side (check `NEXT_PUBLIC_*` env vars
  for anything that shouldn't be public).
- CORS: `backend/config/middlewares.ts` restricts origins via `FRONTEND_URL` plus a regex for
  Vercel preview URLs — verify the regex can't be trivially bypassed and that `FRONTEND_URL` is
  actually set in production (not falling back to `localhost:3000`).
- Stripe integration (`backend/src/api/stripe`): verify webhook signature verification is
  present, no secret keys logged or exposed to the frontend, amounts/prices aren't trusted from
  client input.
- Dependency vulnerabilities: `yarn audit` (or check Renovate's open PR backlog — there's an
  active `renovate-in-correct-place` branch) in both `frontend` and `backend`.
- Strapi admin panel exposure: confirm `/admin` isn't reachable without auth in production and
  default/example files (`src/admin/app.example.tsx`, `webpack.config.example.js`) aren't
  accidentally active.

### 7. README / feature alignment

There's no ROADMAP.md in this repo. Instead, diff each package's `README.md` and any stated
purpose against what's actually live in `main`:
- `frontend/README.md` is still the default `create-next-app` boilerplate — flag this itself as
  a finding (doesn't describe London List, the map/list features, or the Strapi backend it
  depends on).
- `backend/README.md` is still the default Strapi boilerplate — same finding for the backend.
- Beyond the READMEs, check the Strapi content types actually defined (`attraction`, `exhibition`,
  `museum`, `list`, `list-item`, `list-setting`, `account`, `stripe`) against what's exposed and
  functional in the frontend UI — flag any content type with no corresponding frontend usage
  (dead backend surface) or any frontend feature with no backing content type (should already
  fail elsewhere, but worth cross-checking).

### 8. Code quality

A passing lint/type-check/knip run only proves the code compiles cleanly, is Biome-clean, and has
no *unused* exports — not that it's precisely typed, non-duplicated, or free of bad patterns.
That's what this category covers, across both the TypeScript frontend and the TypeScript Strapi
backend.

- **Strict typing** — explicit `any`, unsafe `as Type` casts, missing return type annotations on
  exported functions/controllers, non-null assertions (`!`) that could be replaced with a proper
  guard, params typed as `object`/`{}`, Strapi controller/service functions using loosely-typed
  `ctx` params instead of the generated types.
- **Code duplication** — repeated logic across `frontend/components/` (e.g. list-item rendering
  logic duplicated between `attractions-add`/`attractions-list`), duplicated Apollo Client query
  definitions that should share a `.graphql`/fragment, duplicated Strapi controller boilerplate
  across `attraction`/`exhibition`/`museum` that could share a base controller, values inlined 3+
  times that should be a named constant (e.g. API URLs, Leaflet tile config).
- **Bad patterns** — `useEffect` with missing or overly broad dependency arrays, magic
  numbers/strings, large inline functions that obscure intent, inline `style=` props in `.tsx`
  files that should use CSS Modules (the project already has `styles/pages.module.css` —
  inconsistent use of it is itself a finding), prop drilling through `AppContext` that could be
  narrowed.
- **Dead code** — since Knip already catches unused *exports* in CI, focus on what it doesn't:
  commented-out code blocks left in files, unreachable branches, Strapi content-type fields
  defined in `schema.json` but never read in the frontend, unused GraphQL query fields.

## Notes

- This is a personal/small project — keep findings proportionate. Don't recommend enterprise-
  scale tooling (e.g. a full CI a11y pipeline, when `pull_request_audit.yml`'s axe check already
  covers the homepage) as a "blocker"; note it as a "nice to have" instead unless it's actually
  broken for a real user.
- Cite every finding with a route, file:line, or screenshot — no vague "could be improved"
  entries.
- **Every checklist item must be independently reviewable as one small PR** — same spirit as this
  project's CI, which gates each PR on its own lint/type-check/test/knip run. If a finding is
  actually a bundle of unrelated or large changes (e.g. "add Playwright e2e coverage", "improve
  accessibility across the app", "harden auth"), split it into several separate `- [ ]` lines,
  each scoped to a single reviewable change (e.g. one line per flow's e2e spec, one line per
  route's a11y fix, one line per security issue). Never write a checklist item a reviewer
  couldn't approve or reject on its own without also weighing in on unrelated changes bundled
  into it.
