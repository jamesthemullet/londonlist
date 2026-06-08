---
name: security
description: Audit the London List app for security vulnerabilities, create GitHub issues for findings, and open PRs with fixes — one PR per major issue, one combined PR for all minor issues.
---

You are a security engineer auditing the **London List** app for real-world vulnerabilities.

## Stack

**Frontend (`frontend/`):**
- Next.js with TypeScript — SSR/SSG pages in `frontend/pages/`, components in `frontend/components/`
- React 19 with functional components and hooks
- Apollo Client for GraphQL queries/mutations to Strapi
- Auth state via `frontend/context/AppContext.tsx` — `useAppContext()` hook
- CSS Modules for styling (`*.module.css`)

**Backend (`backend/`):**
- Strapi v5 (headless CMS), Node.js / TypeScript
- Content types: `attraction`, `exhibition`, `list-item`, `museum`
- Source files: `backend/src/api/`, `backend/src/index.ts`
- Thin controller/service/route pattern

---

## What to do each invocation

### Step 1 — Read the codebase

Read these files thoroughly before drawing any conclusions:

- `frontend/pages/` — all page components (auth flows, forms, data rendering)
- `frontend/components/` — all component files
- `frontend/context/AppContext.tsx` — auth state management
- `frontend/hooks/` — custom hooks
- `backend/src/index.ts` — server bootstrap, middleware, CORS config
- `backend/src/api/` — all controllers, services, and routes
- `backend/.env` / `.env.example` / `frontend/.env` / `.env.example` — environment variable patterns
- `backend/config/` — Strapi config files (middlewares, plugins, server)
- Root-level config files: `next.config.js`, `package.json`, `backend/package.json`

Build a complete picture before drawing conclusions.

### Step 2 — Identify security issues

Audit across these categories:

**Authentication & authorisation:**
- Strapi routes without a policy (e.g. `auth: false` with no further restriction) that should be protected
- JWT tokens stored in `localStorage` instead of `httpOnly` cookies (XSS-accessible)
- Missing or overly permissive CORS configuration in `backend/src/index.ts` or Strapi config
- Auth checks done client-side only (trusting the frontend to gate access)
- Password reset flows that leak whether an email is registered (user enumeration)
- Missing rate limiting on login, register, or password-reset endpoints

**Injection & output encoding:**
- GraphQL queries or REST calls where user input is interpolated into the query string rather than passed as a variable
- `dangerouslySetInnerHTML` used without sanitisation
- Dynamic `href` or `src` built from user-controlled values without validation (`javascript:` injection)
- Template literals constructing SQL or Strapi filter strings from unvalidated input

**Secrets & environment variables:**
- Secrets, API keys, or tokens committed directly in source files (not in `.env`)
- `.env` files tracked by git (check `.gitignore`)
- `NEXT_PUBLIC_` prefixed variables that expose secrets to the browser bundle
- `console.log` statements that print sensitive values (tokens, passwords, full user objects)

**HTTP security headers:**
- Missing `Content-Security-Policy`, `X-Frame-Options`, `X-Content-Type-Options`, `Referrer-Policy`, or `Permissions-Policy` headers in Next.js config or Strapi middleware
- `next.config.js` not setting security headers via the `headers()` export

**Dependency & supply-chain:**
- Run `npm audit --audit-level=high` in both `frontend/` and `backend/` and report critical/high CVEs
- Packages with known vulnerabilities that have a patched version available

**Data exposure:**
- Strapi endpoints returning more fields than the client needs (over-fetching sensitive data)
- User objects in Apollo cache or context that include fields like `password`, `resetPasswordToken`, or other internal fields
- Error messages that leak stack traces or internal details to the client

**Input validation:**
- Form inputs (login, register, search) with no length limits or type constraints — potential for oversized payloads
- File upload endpoints (if any) without MIME type or size validation

### Step 3 — Classify findings

Classify each finding as **Major** or **Minor**:

- **Major** — direct, exploitable vulnerability or serious data exposure risk. Examples: exposed secrets, missing auth on sensitive routes, XSS via `dangerouslySetInnerHTML`, unauthenticated access to user data, high-severity CVEs. Each warrants its own issue and PR.
- **Minor** — defence-in-depth improvement, hardening, or low-exploitability concern. Examples: missing security headers, verbose error messages, overly broad CORS on a public endpoint, low-severity CVEs. Bundle all minor findings into one issue and one PR.

**If you find nothing worth improving, stop here and report:** "No significant security issues found. The current implementation is appropriate for the app's scale."

### Step 4 — Report findings

Output exactly this structure:

```
## Security audit

### Major findings
<for each: **[Category]** — file:line — description of the vulnerability and its risk>

### Minor findings
<for each: **[Category]** — file:line — description of the hardening opportunity>

### Checked and ruled out
<patterns you audited but found acceptable — e.g. "CORS is restricted to the frontend origin", "no dangerouslySetInnerHTML usages found">
```

If there are no major findings, say so. If there are no minor findings, say so.

### Step 5 — Create GitHub issues

**For each major finding**, create one issue:

```bash
gh issue create \
  --title "security: <short description>" \
  --label "security" \
  --body "## Vulnerability

<description of the issue, how it could be exploited, and the risk>

## Location

<file:line>

## Suggested fix

<concrete change to make>

## Severity

Major — warrants immediate attention."
```

**For all minor findings combined**, create one issue (only if there are any):

```bash
gh issue create \
  --title "security: minor hardening improvements" \
  --label "security" \
  --body "## Overview

Security hardening improvements identified during audit. Low exploitability individually, but worth addressing for defence in depth.

## Findings

<bulleted list: each finding with file:line and one-sentence description>

## Notes

These are individually low-risk but collectively improve the security posture."
```

If there are no findings at all, do **not** create any issues. Report the clean outcome instead.

### Step 6 — Fix and open PRs

Work through each finding and create pull requests with fixes.

**For each major finding** — fix it, then create a separate PR:

1. Create a branch: `git checkout -b security/<short-slug>`
2. Make the targeted fix (one issue, one or two files — do not refactor beyond what is needed)
3. Stage and commit: `git add <files> && git commit -m "security: <one-line description>"`
4. Push and open a PR:

```bash
gh pr create \
  --title "security: <short description>" \
  --body "## Summary

<what was fixed and why it matters>

## Changes

<file:line — one-sentence description of each change>

## Closes

Closes #<issue-number>"
```

**For all minor findings combined** — fix them all on one branch, then create one PR:

1. Create a branch: `git checkout -b security/minor-hardening`
2. Apply all minor fixes
3. Commit: `git commit -m "security: minor hardening improvements"`
4. Push and open a PR:

```bash
gh pr create \
  --title "security: minor hardening improvements" \
  --body "## Summary

Security hardening improvements — defence in depth, low individual risk.

## Changes

<bulleted list: file:line — one-sentence description per fix>

## Closes

Closes #<minor-issue-number>"
```

If a finding has no clear safe automated fix (e.g. a CVE requiring a major version bump with breaking changes), note it in the issue but skip the PR — flag it to the user instead.

### Step 7 — Report issue and PR URLs

List every issue and PR created with its URL. If none were created, confirm why.

---

## Known project patterns

- **Auth context:** `useAppContext()` from `frontend/context/AppContext.tsx` exposes `{ user, setUser }` — check what fields are stored on the user object; sensitive fields should not be cached client-side
- **Apollo Client:** queries use `useQuery` / `useMutation` — verify user input is always passed as GraphQL variables, never string-interpolated into query documents
- **Strapi routes:** each route in `backend/src/api/*/routes/` has a `policies` array — an empty array with `auth: false` on a write endpoint is a red flag
- **Strapi middleware config:** `backend/config/middlewares.ts` controls security headers and CORS — this is the primary place to add `strapi::security` and CORS settings
- **Next.js headers:** security headers for the frontend belong in `next.config.js` under the `headers()` async function
- **Environment variables:** `NEXT_PUBLIC_` prefix exposes variables to the browser — only non-secret values (e.g. public API URLs) should use this prefix
- **TypeScript strict: false** — the compiler won't catch all unsafe patterns; manual review is required
- **Scale context:** This is a personal/small-scale app. Do not raise theoretical vulnerabilities that require physical access or admin-level compromise as major issues. Focus on realistic attack surface.
- **No file uploads currently:** Do not flag missing upload validation unless an upload endpoint is found in the codebase
