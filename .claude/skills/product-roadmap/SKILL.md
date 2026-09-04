---
name: product-roadmap
description: Build or refresh a product roadmap for London List — new features, pages, and content, PLUS making existing content easier to find, SEO, and improvements to features/pages that already exist — grounded in what the app already has. Writes a plain markdown ROADMAP.md at the repo root, grouped into Now/Next/Later, with each feature broken into a sequence of ~15-minute-reviewable PR steps. Use when the user asks for a roadmap, growth ideas, "what should we build next", or to update/rescope the existing roadmap.
---

# Product roadmap

Produces (or refreshes) **`ROADMAP.md`** at the repo root for `londonlist`: a Next.js (Pages
Router, TypeScript, Apollo Client/GraphQL) frontend with a Strapi CMS backend, letting users
search London places, save them to a personal to-do list, and track what they want to do. Roadmap
items are scored against what actually grows and deepens engagement. Covers more than new
features:

- **Findability** — making London places easier to discover: better search, related/nearby
  places, browsing by area or category.
- **SEO** — individual place pages, structured data, indexability.
- **Improving what already exists** — the search + save-to-list core loop is real and live;
  extending it is often cheaper than a new feature.

## Grounding the roadmap in the real app

- `README.md` — "Search for places across London, save them to a personal list, and track what
  you want to see and do." Monorepo: `frontend/` (Next.js) + `backend/` (Strapi CMS/GraphQL API).
- `AUDIT.md` if present — don't duplicate known bugs/gaps as roadmap features.
- `frontend/package.json` — Apollo Client + GraphQL against the Strapi backend; check for
  auth/persistence packages before assuming what exists.
- `frontend/pages/`, `frontend/components/`, `frontend/context/`, `frontend/hooks/`,
  `frontend/lib/` — real structure to extend.

## Output format

Plain markdown. Write directly to `ROADMAP.md` at the repo root, overwriting the previous
version. Structure: intro + 4 goal-tag lenses (Acquisition/Engagement/Retention/Fun) →
PR-sequence explainer → Now/Next/Later sections, each feature as `### N. Name — *Goal tags*` +
description + numbered PR-step list → Mise en place table (if any infra proposed) → footer
`*London List — product roadmap, <date>*`.

## Breaking a feature into PR steps

Sequence data/logic → UI → wiring, splitting wherever a step could stand alone:

- A GraphQL query/pure function plus its unit tests is its own step.
- New UI (a page/component) is its own step.
- A step needing new content (place write-ups, category taxonomy) belongs in the Strapi CMS —
  raise it as a GitHub issue via `mcp__github__create_issue` rather than a PR.
- No feature-flag system exists here — don't propose gating behind flags.
- If a feature is small enough that splitting produces nothing independently reviewable, write
  **"One PR."** instead.

## Notes

- This is an early-stage project (per its own description, still being built out) — keep
  proposals proportionate to the current maturity; don't propose "Later" bets that assume a
  polished, high-traffic product yet.
- Don't re-propose anything already tracked as an open item in `AUDIT.md`.
- Do not commit, push, or open a PR for `ROADMAP.md` changes unless the user explicitly asks.
