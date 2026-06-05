---
name: accessibility
description: Audit and fix accessibility issues in the London List app. Use when you want to find and fix WCAG violations, missing ARIA attributes, keyboard navigation gaps, or colour-contrast problems in the Next.js frontend.
---

You are running an incremental accessibility improvement session for the **London List** project — a Next.js / React / TypeScript frontend with a Strapi v5 CMS backend.

## Stack

**Frontend (`frontend/`):**
- Next.js with TypeScript
- React 19 with functional components and hooks
- CSS Modules (`*.module.css`) — no CSS-in-JS
- Source files: `frontend/components/`, `frontend/context/`, `frontend/pages/`, `frontend/hooks/`

---

## What to do each invocation

### Step 1 — Pick a category

Use the current second of the clock (or any arbitrary signal) to pick **one** of these five categories. Vary the selection — do not always pick the same one:

1. **Missing ARIA labels** — look for: interactive elements (`<button>`, `<a>`, `<input>`) without accessible names, icon-only buttons without `aria-label`, images without meaningful `alt` text (or missing `alt=""` for decorative images), `<input>` elements not associated with a `<label>` via `htmlFor`/`id`, search inputs without `role="search"` or `aria-label`

2. **Keyboard navigation** — look for: elements using `onClick` without keyboard equivalents (`onKeyDown`/`onKeyUp`), non-interactive elements (e.g. `<div>`, `<li>`) used as interactive controls without `role` + `tabIndex={0}`, focus traps in modals/drawers without proper `focus-trap` handling, missing `:focus-visible` styles (check `*.module.css` files), links that open in a new tab without `aria-label` warning users

3. **Semantic HTML** — look for: `<div>` or `<span>` used where a semantic element exists (`<button>`, `<nav>`, `<main>`, `<section>`, `<article>`, `<header>`, `<footer>`, `<ul>/<li>` for lists), missing landmark roles on page sections (`<main>`, `<nav>`, `<aside>`), heading hierarchy violations (e.g. jumping from `<h1>` to `<h3>`, or multiple `<h1>` per page), form elements missing `<fieldset>`/`<legend>` for grouped inputs

4. **Colour contrast & visual** — look for: CSS custom properties or hardcoded colour values in `*.module.css` files where text/background combinations may fall below WCAG AA ratio (4.5:1 for normal text, 3:1 for large text), `color` declarations without a paired `background-color`, focus indicators removed with `outline: none` without a replacement, content that relies solely on colour to convey meaning

5. **Dynamic content & state** — look for: loading/error states not announced to screen readers (missing `role="status"`, `role="alert"`, or `aria-live` regions), list results rendered without announcing the count to assistive technology, form validation errors not linked to their inputs via `aria-describedby`, toggle buttons missing `aria-pressed` or `aria-expanded`, modal/dialog elements missing `role="dialog"` and `aria-modal="true"`

### Step 2 — Find the best candidate

Read the relevant source files. Focus on:
- `frontend/pages/` — page-level landmark structure, `<Head>` titles, heading hierarchy
- `frontend/components/search/` — search inputs, result lists, dynamic announcements
- `frontend/components/core/` — reusable buttons and form controls
- `frontend/components/my-list/` — interactive list items, toggle controls
- `frontend/components/attractions/` — add/list controls with dynamic state
- `frontend/components/layout/` — nav, skip links, landmark regions

Identify the **single clearest, most impactful** instance of the chosen category. Prefer issues that:
- Affect frequently-used interactive elements (search, add-to-list, navigation)
- Have an unambiguous fix
- Are in components used across multiple pages

### Step 3 — Fix it

Make the fix. Keep scope tight — one issue, one or two files. Do not refactor beyond what is needed to address the specific accessibility finding.

**Common fix patterns:**

```tsx
// Missing aria-label on icon button
<button aria-label="Remove item from list">
  <svg aria-hidden="true" focusable="false">...</svg>
</button>

// Input without associated label
<label htmlFor="search-input">Search places</label>
<input id="search-input" type="text" ... />

// Keyboard handler for div/li acting as button
<div
  role="button"
  tabIndex={0}
  onClick={handleClick}
  onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') handleClick(); }}
>

// Live region for dynamic results
<div role="status" aria-live="polite" aria-atomic="true">
  {resultCount !== null && `${resultCount} results found`}
</div>

// Skip link (add to layout)
<a href="#main-content" className={styles.skipLink}>Skip to main content</a>
<main id="main-content">...</main>
```

**CSS for visually-hidden but screen-reader-accessible text:**
```css
.srOnly {
  position: absolute;
  width: 1px;
  height: 1px;
  padding: 0;
  margin: -1px;
  overflow: hidden;
  clip: rect(0, 0, 0, 0);
  white-space: nowrap;
  border: 0;
}
```

### Step 4 — Report

Output exactly this structure:

```
## Accessibility improvement

**Category:** <chosen category name>
**WCAG criterion:** <e.g. 1.1.1 Non-text Content (Level A), 2.1.1 Keyboard (Level A)>
**File:** <path:line>
**Issue:** <one sentence describing the problem>
**Fix:** <what was changed and why>
**Next suggestion:** <the next accessibility candidate worth tackling, with file path>
```

---

## Known project patterns

- **Search component:** `frontend/components/search/place-search.tsx` renders a live results list — check for `aria-live` announcements and `role="listbox"`/`role="option"` on results
- **Loader:** `frontend/components/Loader.tsx` — verify it uses `role="status"` and an accessible label, not just a visual spinner
- **Toggle:** `frontend/components/list-visibility-toggle/list-visibility-toggle.tsx` — check for `aria-pressed` on the toggle control
- **Forms:** `frontend/pages/login.tsx`, `register.tsx`, `reset-password.tsx` — verify all inputs have associated labels and error messages are linked via `aria-describedby`
- **Layout:** `frontend/components/layout/layout.tsx` — verify skip-to-main link exists and landmark regions are correct (`<nav>`, `<main>`, `<footer>`)
- **Museum page:** `frontend/pages/museum/[id].tsx` — images should have descriptive `alt` text, not empty or filename-derived strings
- **CSS Modules:** Accessibility-related styles (`.srOnly`, focus rings) belong in the relevant component's `*.module.css` file, not inline styles
- **No axe-core installed:** Automated axe checks are not currently wired into tests — findings come from manual code review; flag if installing `jest-axe` would be useful
