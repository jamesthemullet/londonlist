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

test.describe('Public list page — happy path', () => {
  test('shows items, map and copy button; logged-in user copies list and is sent to /my-list', async ({
    page,
    context,
  }) => {
    await context.clearCookies();

    await page.route(GRAPHQL_URL, (route, request) =>
      handleGraphql(route, request, {
        __me: MOCK_USER,
        CopyListCreateMyList: { createMyList: { documentId: 'new_list_id', name: 'E2E Fixture List' } },
        CopyListCreateListItem: { createListItem: { documentId: 'new_item_id' } },
      }),
    );

    await page.context().addCookies([
      { name: 'token', value: 'fake_token', url: 'http://localhost:3000' },
    ]);

    await page.goto('/list/e2e-fixture-user/e2e-fixture-list');

    await expect(page.getByRole('heading', { name: 'E2E Fixture List', level: 1 })).toBeVisible({
      timeout: 5000,
    });
    await expect(page.getByRole('heading', { name: 'To do (1)' })).toBeVisible();
    await expect(page.getByText('Tate Modern')).toBeVisible();

    await expect(page.locator('.leaflet-container')).toBeVisible({ timeout: 5000 });
    await expect(page.locator('.leaflet-marker-icon')).toHaveCount(1);

    const copyButton = page.getByRole('button', { name: '+ Copy this list' });
    await expect(copyButton).toBeVisible();
    await copyButton.click();

    const viewListsLink = page.getByRole('link', { name: 'View your lists →' });
    await expect(viewListsLink).toBeVisible({ timeout: 5000 });
    await viewListsLink.click();

    await expect(page).toHaveURL(/\/my-list/, { timeout: 5000 });
  });
});

test.describe('Public list page — private or unknown list', () => {
  test('private list shows a "this list is private" message, not its items', async ({ page, context }) => {
    await context.clearCookies();

    await page.route(GRAPHQL_URL, (route, request) => handleGraphql(route, request, { __me: null }));

    await page.goto('/list/e2e-fixture-user/e2e-fixture-private-list');

    await expect(
      page.getByRole('heading', { name: "e2e-fixture-user's List", level: 1 }),
    ).toBeVisible({ timeout: 5000 });
    await expect(page.getByText('This list is private.')).toBeVisible();
  });

  test('unknown list shows the 404 not-found page', async ({ page, context }) => {
    await context.clearCookies();

    await page.route(GRAPHQL_URL, (route, request) => handleGraphql(route, request, { __me: null }));

    await page.goto('/list/e2e-fixture-user/does-not-exist');

    await expect(page.getByRole('heading', { name: /page not found/i })).toBeVisible({ timeout: 5000 });
  });
});
