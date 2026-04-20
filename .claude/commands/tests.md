You are improving test coverage for the **London List** project — a Next.js (TypeScript) frontend + Strapi v5 CMS backend.

## Project layout
- `frontend/` — Next.js app with Apollo GraphQL, React, TypeScript
- `backend/` — Strapi v5 CMS (Node.js/TypeScript)

---

## Step 1 — Audit what's installed

Read `frontend/package.json` and `backend/package.json`. Check for:

**Frontend unit testing:** `jest`, `jest-environment-jsdom`, `@testing-library/react`, `@testing-library/jest-dom`, `@types/jest`, `babel-jest`, `@babel/preset-env`, `@babel/preset-react`, `@babel/preset-typescript`

**Frontend e2e:** `@playwright/test`

**Backend testing:** `jest`, `@types/jest`

Also check whether `frontend/jest.config.ts` (or `.js`) and `frontend/playwright.config.ts` exist.

Count existing test files in `frontend/` and `backend/` (patterns: `**/*.test.ts`, `**/*.test.tsx`, `**/*.spec.ts`, `**/*.spec.tsx`, `**/e2e/**/*.ts`).

---

## Step 2 — Install missing libraries

### If Playwright is not installed:
Run these commands:
```bash
cd frontend && yarn add --dev @playwright/test
npx playwright install chromium --with-deps
```
Then create `frontend/playwright.config.ts` if it doesn't exist:
```ts
import { defineConfig, devices } from '@playwright/test';

export default defineConfig({
  testDir: './e2e',
  fullyParallel: false,
  retries: 0,
  use: {
    baseURL: 'http://localhost:3000',
    trace: 'on-first-retry',
  },
  projects: [{ name: 'chromium', use: { ...devices['Desktop Chrome'] } }],
  webServer: {
    command: 'yarn dev',
    url: 'http://localhost:3000',
    reuseExistingServer: !process.env.CI,
    timeout: 120000,
  },
});
```
Add a test script to `frontend/package.json`: `"test:e2e": "playwright test"`.

**After successfully installing Playwright and creating the config, edit this skill file (`.claude/commands/tests.md`) to remove the entire "If Playwright is not installed" block above (from the `### If Playwright is not installed:` heading through the closing paragraph), replacing it with a single line: `### Playwright: already installed`.**

### If frontend unit testing libraries are missing:
Install Jest + React Testing Library:
```bash
cd frontend && yarn add --dev jest jest-environment-jsdom @testing-library/react @testing-library/jest-dom @testing-library/user-event @types/jest babel-jest @babel/preset-env @babel/preset-react @babel/preset-typescript
```
Create `frontend/jest.config.ts`:
```ts
import type { Config } from 'jest';

const config: Config = {
  testEnvironment: 'jsdom',
  setupFilesAfterFramework: ['<rootDir>/jest.setup.ts'],
  moduleNameMapper: {
    '^@/(.*)$': '<rootDir>/$1',
  },
  transform: {
    '^.+\\.(t|j)sx?$': ['babel-jest', { presets: ['next/babel'] }],
  },
  testPathPattern: ['**/*.test.ts', '**/*.test.tsx'],
  collectCoverageFrom: ['components/**/*.{ts,tsx}', 'hooks/**/*.ts', 'context/**/*.tsx'],
};

export default config;
```
Create `frontend/jest.setup.ts`:
```ts
import '@testing-library/jest-dom';
```
Add test scripts to `frontend/package.json`:
```json
"test": "jest",
"test:coverage": "jest --coverage"
```

---

## Step 3 — Decide: unit test or e2e test?

Use this decision tree:

1. **If there are no unit tests AND no e2e tests** → write a **unit test**. Unit tests are faster, require no running server, and are foundational. Start with a component or hook.

2. **If there are unit tests but no e2e tests** → write an **e2e test**. Pick a meaningful user flow (see candidates below).

3. **If both exist** → look at what's least covered. Prefer e2e if critical flows (auth, list management) have no coverage. Prefer unit if there are complex hooks or components untested.

4. **If coverage already looks solid for a given area** → pick the other type, or report that no improvement is clearly justifiable.

---

## Step 4 — Write the incremental improvement

Write **one focused test or test suite** — don't try to cover everything at once.

### Unit test candidates (frontend)
These are the highest-value unit tests, in priority order:

1. **`hooks/use-debounce.ts`** — pure hook, easy to test in isolation. Verify debounce delay with fake timers.
2. **`context/AppContext.tsx`** — test that it reads a cookie token on mount and makes the `me` GraphQL query; that it exposes user state and a setter.
3. **`components/core/form/form.tsx`** — test email validation logic: valid email passes, invalid email shows error; form submit callback called with correct values.
4. **`components/core/button/button.tsx`** — renders correctly, onClick fires, type prop is passed through.
5. **`components/my-list/my-list.tsx`** — test rendering of to-do and done sections; toggle complete triggers mutation; delete triggers mutation.
6. **`components/search/place-search.tsx`** — test that typing triggers debounced search; results are shown; selecting a result calls the add mutation.

### E2e test candidates (functionality flows, NOT visual)
These flows test real behaviour — do NOT write tests that just check if something is visible without interacting:

1. **Authentication flow** — register a new user, then log in; verify JWT cookie is set and the user sees `/my-list`.
2. **Add and manage list items** — log in, search for a London place, add it to the list; verify it appears in "To Do"; mark it complete; verify it moves to "Done"; delete it.
3. **Protected route redirect** — navigate to `/my-list` when logged out; verify redirect to `/login`.
4. **Place search** — on the home page, type a London place name; verify search results appear; verify results are filtered to London/UK.
5. **Museum detail page** — navigate to a museum; verify exhibitions are listed with dates.

### Backend unit test candidates
If you choose to add backend tests, use Jest directly on utility/service logic. Strapi controllers are thin wrappers — prefer e2e API tests or focus on frontend for now unless there is custom logic.

---

## Step 5 — Verify the test works

After writing the test:
- For unit tests: run `cd frontend && yarn test` (or `yarn test -- --testPathPattern=<file>` for just the new file). Fix any failures.
- For e2e tests: run `cd frontend && yarn test:e2e` if the dev server can be started. If not (e.g., backend not running), at minimum verify the test file is syntactically valid with `npx tsc --noEmit` inside `frontend/`.

Report what you wrote, why you chose it, and the test result (pass/fail/not-runnable).

---

## What counts as a good e2e test

A good e2e test:
- Navigates to a page, interacts with it (fills form, clicks button, waits for response)
- Asserts on **state changes** — a new item in a list, a redirect, a success message, data persisted
- Does NOT just assert `expect(page.getByText('Welcome')).toBeVisible()` — that's a visual check, not a functionality check
- Mocks external APIs (Nominatim, LocationIQ) with `page.route()` if needed to avoid flaky network calls

A good unit test:
- Isolates the unit under test; mocks GraphQL hooks/Apollo with `MockedProvider` or `jest.mock`
- Tests behaviour, not implementation — what the component does when props change, not internal state
