import { test, expect } from '@playwright/test';
import type { Route, Request as PlaywrightRequest } from '@playwright/test';

const GRAPHQL_URL = '**/graphql';

const MOCK_USER = {
  id: '1',
  documentId: 'doc_abc123',
  username: 'testuser',
  email: 'test@example.com',
  isPro: false,
};

const MOCK_LIST = {
  documentId: 'list_abc123',
  name: 'My List',
  description: null,
  isPublic: false,
  viewCount: 0,
  itemCount: 0,
  completedCount: 0,
};

/**
 * Intercepts all /graphql POST requests and responds based on operationName.
 * Falls through to network for any operation not listed in `operations`.
 * Use the special key '__me' to respond to the anonymous AppContext `me` query.
 */
async function handleGraphql(
  route: Route,
  request: PlaywrightRequest,
  operations: Record<string, unknown>,
) {
  const body = request.postDataJSON() as { operationName?: string | null; query?: string } | null;
  const op = body?.operationName ?? null;
  const query = body?.query ?? '';

  if (op !== null && op in operations) {
    await route.fulfill({
      contentType: 'application/json',
      body: JSON.stringify({ data: operations[op] }),
    });
    return;
  }

  if (op === null && query.includes('me {') && '__me' in operations) {
    await route.fulfill({
      contentType: 'application/json',
      body: JSON.stringify({ data: { me: operations['__me'] } }),
    });
    return;
  }

  await route.continue();
}

test.describe('Auth flow — register', () => {
  test.beforeEach(async ({ context }) => {
    await context.clearCookies();
  });

  test('happy path: valid credentials create account and redirect to /my-list', async ({ page }) => {
    await page.route(GRAPHQL_URL, (route, request) =>
      handleGraphql(route, request, {
        Register: { register: { jwt: 'fake_jwt_token', user: MOCK_USER } },
        GetMyLists: { myLists: [MOCK_LIST] },
      }),
    );

    await page.goto('/register');
    await page.getByLabel('Username').fill('testuser');
    await page.getByLabel('Email').fill('test@example.com');
    await page.getByLabel('Password').fill('securepass123');
    await page.locator('#main-content').getByRole('button', { name: 'Sign Up' }).click();

    await expect(page).toHaveURL(/\/my-list/, { timeout: 5000 });
  });

  test('shows error message when registration fails', async ({ page }) => {
    await page.route(GRAPHQL_URL, async (route, request) => {
      const body = request.postDataJSON() as { operationName?: string } | null;
      if (body?.operationName === 'Register') {
        await route.fulfill({
          contentType: 'application/json',
          body: JSON.stringify({
            errors: [{ message: 'Email is already taken', extensions: { code: 'VALIDATION_ERROR' } }],
          }),
        });
      } else {
        await route.continue();
      }
    });

    await page.goto('/register');
    await page.getByLabel('Username').fill('testuser');
    await page.getByLabel('Email').fill('taken@example.com');
    await page.getByLabel('Password').fill('securepass123');
    await page.locator('#main-content').getByRole('button', { name: 'Sign Up' }).click();

    await expect(page.getByRole('alert')).toContainText('Error:', { timeout: 5000 });
    await expect(page).toHaveURL(/\/register/);
  });
});

test.describe('Auth flow — login', () => {
  test.beforeEach(async ({ context }) => {
    await context.clearCookies();
  });

  test('happy path: valid credentials authenticate and redirect to home', async ({ page }) => {
    await page.route(GRAPHQL_URL, (route, request) =>
      handleGraphql(route, request, {
        Login: { login: { jwt: 'fake_jwt_token', user: MOCK_USER } },
      }),
    );

    await page.goto('/login');
    await page.getByLabel('Email').fill('test@example.com');
    await page.getByLabel('Password').fill('securepass123');
    await page.getByRole('button', { name: 'Login' }).click();

    await expect(page).toHaveURL(/^http:\/\/localhost:3000\/$/, { timeout: 5000 });
  });

  test('shows error message for invalid credentials', async ({ page }) => {
    await page.route(GRAPHQL_URL, async (route, request) => {
      const body = request.postDataJSON() as { operationName?: string } | null;
      if (body?.operationName === 'Login') {
        await route.fulfill({
          contentType: 'application/json',
          body: JSON.stringify({
            errors: [{ message: 'Invalid identifier or password', extensions: { code: 'VALIDATION_ERROR' } }],
          }),
        });
      } else {
        await route.continue();
      }
    });

    await page.goto('/login');
    await page.getByLabel('Email').fill('wrong@example.com');
    await page.getByLabel('Password').fill('wrongpassword');
    await page.getByRole('button', { name: 'Login' }).click();

    await expect(page.getByRole('alert')).toContainText('Error:', { timeout: 5000 });
    await expect(page).toHaveURL(/\/login/);
  });

  test('already-logged-in user is redirected from /login to /my-list', async ({ page }) => {
    await page.route(GRAPHQL_URL, (route, request) =>
      handleGraphql(route, request, {
        __me: MOCK_USER,
        GetMyLists: { myLists: [MOCK_LIST] },
      }),
    );

    await page.context().addCookies([
      { name: 'token', value: 'existing_fake_token', url: 'http://localhost:3000' },
    ]);
    await page.goto('/login');

    await expect(page).toHaveURL(/\/my-list/, { timeout: 5000 });
  });
});

test.describe('Auth flow — forgot password', () => {
  test.beforeEach(async ({ context }) => {
    await context.clearCookies();
  });

  test('happy path: submitting email shows inbox confirmation', async ({ page }) => {
    await page.route(GRAPHQL_URL, (route, request) =>
      handleGraphql(route, request, {
        forgotPassword: { forgotPassword: { ok: true } },
      }),
    );

    await page.goto('/reset-password');
    await page.getByLabel('Email').fill('user@example.com');
    await page.getByRole('button', { name: 'Reset Password' }).click();

    await expect(page.getByText('Check your inbox')).toBeVisible({ timeout: 5000 });
  });

  test('stays on reset-password page after submission', async ({ page }) => {
    await page.route(GRAPHQL_URL, (route, request) =>
      handleGraphql(route, request, {
        forgotPassword: { forgotPassword: { ok: true } },
      }),
    );

    await page.goto('/reset-password');
    await page.getByLabel('Email').fill('user@example.com');
    await page.getByRole('button', { name: 'Reset Password' }).click();

    await expect(page).toHaveURL(/\/reset-password/);
  });
});
