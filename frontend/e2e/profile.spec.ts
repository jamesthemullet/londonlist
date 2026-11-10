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

test.describe('Profile page', () => {
  test('logged-out user sees lists and register CTA', async ({ page, context }) => {
    await context.clearCookies();

    await page.route(GRAPHQL_URL, (route, request) =>
      handleGraphql(route, request, { __me: null }),
    );

    await page.goto('/profile/e2e-fixture-user');

    await expect(
      page.getByRole('heading', { name: "e2e-fixture-user's London Lists", level: 1 }),
    ).toBeVisible({ timeout: 5000 });

    // List card links to the correct list detail page
    const listCard = page.getByRole('link', { name: /E2E Fixture List/ });
    await expect(listCard).toBeVisible();
    await expect(listCard).toHaveAttribute('href', '/list/e2e-fixture-user/e2e-fixture-list');

    // Conversion CTA is shown to logged-out users
    const registerCta = page.getByRole('link', { name: 'Create your list' });
    await expect(registerCta).toBeVisible({ timeout: 3000 });
    await expect(registerCta).toHaveAttribute('href', '/register?ref=profile');
  });

  test('logged-in user sees lists but no register CTA', async ({ page, context }) => {
    await context.clearCookies();

    await page.route(GRAPHQL_URL, (route, request) =>
      handleGraphql(route, request, { __me: MOCK_USER }),
    );

    await context.addCookies([
      { name: 'token', value: 'fake_token', url: 'http://localhost:3000' },
    ]);

    await page.goto('/profile/e2e-fixture-user');

    await expect(
      page.getByRole('heading', { name: "e2e-fixture-user's London Lists", level: 1 }),
    ).toBeVisible({ timeout: 5000 });

    const listCard = page.getByRole('link', { name: /E2E Fixture List/ });
    await expect(listCard).toBeVisible();

    // Conversion CTA must not appear for authenticated users
    await expect(page.getByRole('link', { name: 'Create your list' })).not.toBeVisible();
  });

  test('unknown user shows 404 page', async ({ page, context }) => {
    await context.clearCookies();

    await page.goto('/profile/unknown-user-that-does-not-exist-xyz');

    await expect(
      page.getByRole('heading', { name: 'Page not found', level: 1 }),
    ).toBeVisible({ timeout: 5000 });
  });
});
