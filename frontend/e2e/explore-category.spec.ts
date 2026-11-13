import { test, expect } from '@playwright/test';
import type { Route, Request as PlaywrightRequest } from '@playwright/test';

const GRAPHQL_URL = '**/graphql';

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

test.describe('Explore category page', () => {
  test('category page renders heading and links cards to list detail', async ({
    page,
    context,
  }) => {
    await context.clearCookies();

    await page.route(GRAPHQL_URL, (route, request) =>
      handleGraphql(route, request, { __me: null }),
    );

    await page.goto('/explore/museum');

    await expect(
      page.getByRole('heading', { name: 'London Museums Lists', level: 1 }),
    ).toBeVisible({ timeout: 5000 });

    const listCard = page.getByRole('link', { name: /E2E Fixture List/ });
    await expect(listCard).toBeVisible();
    await expect(listCard).toHaveAttribute('href', '/list/e2e-fixture-user/e2e-fixture-list');
  });

  test('unknown category returns 404', async ({ page, context }) => {
    await context.clearCookies();

    await page.goto('/explore/not-a-real-category');

    await expect(
      page.getByRole('heading', { name: 'Page not found', level: 1 }),
    ).toBeVisible({ timeout: 5000 });
  });
});
