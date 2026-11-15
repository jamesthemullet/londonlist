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

const MOCK_LIST_SLIM = {
  documentId: 'list_abc123',
  name: 'My List',
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

test.describe('Place detail page', () => {
  test('shows name, breadcrumb, OSM link and related places', async ({ page, context }) => {
    await context.clearCookies();

    await page.goto('/place/node/1');

    await expect(page.getByRole('heading', { name: 'Tate Modern', level: 1 })).toBeVisible({
      timeout: 5000,
    });

    const breadcrumb = page.getByRole('navigation', { name: 'Breadcrumb' });
    await expect(breadcrumb.getByRole('link', { name: 'Explore' })).toHaveAttribute(
      'href',
      '/explore',
    );
    await expect(breadcrumb.getByText('Tate Modern')).toBeVisible();

    const osmLink = page.getByRole('link', { name: 'View on OpenStreetMap (opens in new tab)' });
    await expect(osmLink).toHaveAttribute('href', 'https://www.openstreetmap.org/node/1');

    const relatedSection = page.getByRole('region', { name: 'Related places you might like' });
    await expect(relatedSection.getByRole('heading', { name: 'You might also like' })).toBeVisible();
    await expect(relatedSection.getByRole('link', { name: 'British Museum' })).toHaveAttribute(
      'href',
      '/place/node/2',
    );
  });

  test('logged-in user adds the place to a list', async ({ page, context }) => {
    await context.clearCookies();

    await page.route(GRAPHQL_URL, (route, request) =>
      handleGraphql(route, request, {
        __me: MOCK_USER,
        GetMyListsSlim: { myLists: [MOCK_LIST_SLIM] },
        CreateListItemFromDetail: { createListItem: { documentId: 'item_1', name: 'Tate Modern' } },
      }),
    );

    await page.context().addCookies([
      { name: 'token', value: 'fake_token', url: 'http://localhost:3000' },
    ]);

    await page.goto('/place/node/1');

    const addButton = page.getByRole('button', { name: 'Add Tate Modern to my list' });
    await expect(addButton).toBeVisible({ timeout: 5000 });
    await addButton.click();

    await expect(page.getByText('Added to your list')).toBeVisible({ timeout: 5000 });
    await expect(page.getByRole('link', { name: 'View my list →' })).toHaveAttribute(
      'href',
      '/my-list',
    );
  });

  test('unknown id returns the 404 page', async ({ page, context }) => {
    await context.clearCookies();

    const response = await page.goto('/place/node/does-not-exist');

    expect(response?.status()).toBe(404);
    await expect(page.getByRole('heading', { name: 'Page not found', level: 1 })).toBeVisible({
      timeout: 5000,
    });
  });

  test('clicking a list item navigates to its place page', async ({ page, context }) => {
    await context.clearCookies();

    await page.goto('/list/e2e-fixture-user/e2e-fixture-list');

    await expect(page.getByRole('heading', { name: 'E2E Fixture List', level: 1 })).toBeVisible({
      timeout: 5000,
    });

    await page.getByRole('link', { name: 'Tate Modern', exact: true }).click();

    await expect(page).toHaveURL(/\/place\/node\/1$/, { timeout: 5000 });
    await expect(page.getByRole('heading', { name: 'Tate Modern', level: 1 })).toBeVisible({
      timeout: 5000,
    });
  });
});
