You are a performance engineer auditing the **London List** app for real-world performance improvements.

## Stack

**Frontend (`frontend/`):**
- Next.js with TypeScript — SSR/SSG pages in `frontend/pages/`, components in `frontend/components/`
- React 19 with functional components and hooks
- Apollo Client for GraphQL queries/mutations to Strapi
- Auth state via `frontend/context/AppContext.tsx` — `useAppContext()` hook
- CSS Modules for styling (`*.module.css`)
- Custom debounce hook in `frontend/hooks/use-debounce.ts`

**Backend (`backend/`):**
- Strapi v5 (headless CMS), Node.js / TypeScript
- Content types: `attraction`, `exhibition`, `list-item`, `museum`
- Source files: `backend/src/api/`, `backend/src/index.ts`

---

## What to do each invocation

### Step 1 — Pick a category

Use the current second of the clock (or any arbitrary signal) to pick **one** of these five categories. Vary the selection — do not always pick the same one:

1. **Frontend rendering** — components re-rendering unnecessarily (missing `React.memo`, `useMemo`, or `useCallback` where referential equality matters); `useEffect` dependencies that are too broad, causing cascading re-renders; large components that could be split so only part of the tree re-renders

2. **Data fetching** — Apollo queries that over-fetch (requesting fields the component doesn't use); missing `fetchPolicy` configuration (queries that should be `cache-first` defaulting to `network-only`); N+1 patterns (multiple separate queries that could be a single joined query); data fetched on every render that could be fetched once (e.g. static reference data)

3. **Bundle / load time** — large imports from heavy libraries that could use named imports or dynamic `import()`; components loaded eagerly that are only visible on interaction (e.g. modals, drawers) — candidates for `next/dynamic`; images without `next/image` (missing lazy loading and automatic optimisation); fonts or stylesheets blocking render

4. **Network** — API calls that fire without debouncing on user input (search, autocomplete); redundant refetch calls after mutations (refetching more than needed); missing HTTP caching headers on Strapi endpoints that serve static or slow-changing data

5. **Backend** — Strapi controller or service code doing work on every request that could be memoised or cached; missing population limits (Strapi queries that populate deeply nested relations unnecessarily)

### Step 2 — Read only what's relevant to that category

Don't read the whole codebase — read the files that matter for the chosen category:

- **Frontend rendering:** `frontend/components/`, `frontend/pages/` — focus on components with hooks and props, not static presentational ones
- **Data fetching:** grep for `useQuery` / `useMutation` call sites across `frontend/components/` and `frontend/pages/`, then read the matching files
- **Bundle / load time:** `frontend/pages/_app.tsx`, `frontend/pages/_document.tsx`, imports at the top of page files, `next.config.js`
- **Network:** `frontend/components/search/`, `frontend/hooks/use-debounce.ts`, mutation call sites in `frontend/components/`
- **Backend:** `backend/src/api/*/controllers/`, `backend/src/api/*/services/`, `backend/src/index.ts`

Only pull in adjacent files if the category genuinely requires it. A focused audit of one category beats a shallow pass over everything.

### Step 3 — Classify findings

Classify each finding as **Major** or **Minor**:

- **Major** — measurable user-facing impact: slow initial load, janky interactions, unnecessary network waterfalls, large bundle size contributions. Warrants its own issue.
- **Minor** — small wins, low risk, unlikely to be user-noticeable in isolation. Bundle together into one "minor performance improvements" issue.

**If you find nothing worth improving, stop here and report:** "No significant performance issues found. The current implementation is appropriate for the app's scale." Do not manufacture a minor finding just to have something to report — a clean audit is a legitimate, useful outcome, not a failure.

### Step 4 — Report findings

Output exactly this structure:

```
## Performance audit

**Category audited:** <chosen category name>

### Major findings
<for each: **[Area]** — file:line — description of the problem and expected impact>

### Minor findings
<for each: **[Area]** — file:line — description of the problem>

### Not worth acting on
<patterns you considered but ruled out, and why — e.g. "memoising X would add complexity with no benefit at this data scale">
```

If there are no major findings, say so. If there are no minor findings, say so.

### Step 5 — Create GitHub issues

Based on your findings:

**For each major finding**, create one issue:

```bash
gh issue create \
  --title "perf: <short description>" \
  --label "performance" \
  --body "## Problem

<description of the issue and its user-facing impact>

## Location

<file:line>

## Suggested fix

<concrete change to make>

## Expected improvement

<what gets better and how you'd verify it>"
```

**For all minor findings combined**, create one issue (only if there are any):

```bash
gh issue create \
  --title "perf: minor performance improvements" \
  --label "performance" \
  --body "## Overview

Small performance improvements identified during audit. Low risk, low effort.

## Findings

<bulleted list: each finding with file:line and one-sentence description>

## Notes

These are individually minor but worth addressing incrementally."
```

If there are no findings at all, do **not** create any issues. Report the clean outcome instead.

### Step 6 — Report issue URLs

List every issue created with its URL. If none were created, confirm why.

---

## Known project patterns

- **Apollo Client:** queries use `useQuery` / `useMutation` from `@apollo/client` — review `fetchPolicy`, field selection, and refetch patterns
- **Auth context:** `useAppContext()` from `frontend/context/AppContext.tsx` — components that call this on every render without needing reactivity are candidates for memoisation
- **Search debounce:** `frontend/hooks/use-debounce.ts` already exists — any search/input handler not using it is a finding
- **CSS Modules:** no CSS-in-JS, so no runtime style computation to flag
- **Next.js pages:** check for missing `getStaticProps` / `getServerSideProps` opportunities — data fetched client-side that could be server-rendered
- **TypeScript strict: false** — the compiler won't catch all issues; manual review is needed
- **Scale context:** This is a personal/small-scale app. Do not flag micro-optimisations that add complexity without meaningful benefit at this scale. Focus on patterns that would be noticeable to a real user.
