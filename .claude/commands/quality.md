You are running an incremental code quality improvement session for the **London List** project — a Next.js / React / TypeScript frontend with a Strapi v5 CMS backend in the same repo.

## Stack

**Frontend (`frontend/`):**
- Next.js with TypeScript (`tsconfig.json` — `strict: false`, so explicit `any` and unsafe casts are still findable)
- React 19 with functional components and hooks
- Apollo Client for GraphQL queries/mutations to Strapi
- Auth state managed via `context/AppContext.tsx` — `useAppContext()` hook exposes user + setter
- CSS Modules for styling (`*.module.css`) — no CSS-in-JS
- Custom debounce hook in `hooks/use-debounce.ts`
- Source files: `frontend/components/`, `frontend/context/`, `frontend/pages/`, `frontend/hooks/`

**Backend (`backend/`):**
- Strapi v5 (headless CMS), Node.js / TypeScript
- Content types: `attraction`, `exhibition`, `list-item`, `museum`
- Source files: `backend/src/api/`, `backend/src/index.ts`
- Thin controller/service/route pattern — business logic should live in services, not controllers

---

## What to do each invocation

### Step 1 — Pick a category

Use the current second of the clock (or any arbitrary signal) to pick **one** of these five categories. Vary the selection — do not always pick the same one:

1. **Strict typing** — look for: explicit `any`, unsafe `as Type` casts, missing return type annotations on exported functions, non-null assertions (`!`) that could be replaced with proper guards, props typed as `object` or `{}`, implicit `any` from untyped event handlers
2. **Code duplication** — look for: repeated logic blocks across components, identical conditional rendering patterns, Apollo query/mutation strings duplicated across files, values inlined 3+ times that should be a named constant
3. **Bad patterns** — look for: `useEffect` with missing or overly broad dependency arrays, inline `style=` props (use CSS Modules instead), magic numbers/strings, prop drilling more than 2 levels deep when `useAppContext()` already exists, Apollo queries defined inline in components that would be cleaner as a custom hook, backend business logic in controllers that should live in services
4. **Dead code** — look for: exported symbols not imported anywhere in the project, commented-out code blocks left in files, unused imports, unused variables/parameters
5. **Backend quality** — look for: missing TypeScript types in `backend/src/api/` controllers or services, controller methods doing more than delegating to a service, hardcoded strings in routes or services that should be constants, missing or overly permissive Strapi route policies

### Step 2 — Find the best candidate

Read the relevant source files in the appropriate directories. For frontend quality issues, focus on `frontend/components/`, `frontend/context/`, `frontend/pages/`, `frontend/hooks/`. For backend issues, focus on `backend/src/api/` and `backend/src/index.ts`.

Identify the **single clearest, most impactful** instance of the chosen category. Prefer issues that:
- Are in frequently-used files (e.g., layout, auth context, shared components)
- Have an unambiguous fix
- Won't require changes across many files

### Step 3 — Fix it

Make the fix. Keep scope tight — one issue, one or two files. Do not refactor beyond what is needed to address the specific finding.

### Step 4 — Report

Output exactly this structure:

```
## Quality improvement

**Category:** <chosen category name>
**File:** <path:line>
**Issue:** <one sentence describing the problem>
**Fix:** <what was changed and why>
**Next suggestion:** <the next candidate worth tackling in this category, with file path>
```

---

## Known project patterns

- **Auth context:** `useAppContext()` from `frontend/context/AppContext.tsx` provides `{ user, setUser }` — prop drilling user/auth state past 2 levels is a smell since this hook exists
- **Apollo:** Queries and mutations should be typed with generated or hand-written TypeScript types; untyped `useQuery` / `useMutation` calls are a finding
- **CSS Modules:** Styling should use `styles.className` from `*.module.css` imports — inline `style={{ ... }}` props are a pattern to flag
- **Strapi backend:** Controllers should only call `super.findOne(...)` / `super.find(...)` or delegate to a service — logic that belongs in a service is a finding
- **No knip.json:** Dead code detection requires grep-based analysis — search for export names across the project to confirm they are unused before flagging
- **TypeScript strict is `false`:** The compiler won't catch many issues automatically — manual review is needed for explicit `any` and unsafe casts
- **`utils/` (frontend):** No `utils/` directory currently exists — if one appears, it is not excluded from coverage; do not flag missing utils as a quality issue
