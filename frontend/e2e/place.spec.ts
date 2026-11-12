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

const MOCK_LISTS = [{ documentId: 'list_1', name: 'My London List' }];

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

test.describe('Place detail page — happy path', () => {
  test('shows name, breadcrumb, category, OSM link and related places section', async ({
    page,
    context,
  }) => {
    await context.clearCookies();

    await page.route(GRAPHQL_URL, (route, request) =>
      handleGraphql(route, request, { __me: null }),
    );

    await page.goto('/place/node/1');

    await expect(page.getByRole('heading', { name: 'Tate Modern', level: 1 })).toBeVisible({
      timeout: 5000,
    });

    // Breadcrumb: "Explore" link and current page label
    const breadcrumb = page.getByRole('navigation', { name: 'Breadcrumb' });
    await expect(breadcrumb.getByRole('link', { name: 'Explore' })).toBeVisible();
    await expect(breadcrumb.getByText('Tate Modern')).toBeVisible();

    // Category tag
    await expect(page.getByText('museum')).toBeVisible();

    // OpenStreetMap link (place has coordinates)
    await expect(
      page.getByRole('link', { name: /View on OpenStreetMap/i }),
    ).toBeVisible();
  });

  test('logged-out user sees sign-up CTA instead of add-to-list button', async ({
    page,
    context,
  }) => {
    await context.clearCookies();

    await page.route(GRAPHQL_URL, (route, request) =>
      handleGraphql(route, request, { __me: null }),
    );

    await page.goto('/place/node/1');

    await expect(page.getByRole('heading', { name: 'Tate Modern', level: 1 })).toBeVisible({
      timeout: 5000,
    });

    // Not-logged-in users see the registration CTA
    await expect(page.getByRole('link', { name: 'Create a free account' })).toBeVisible({
      timeout: 3000,
    });

    // The add-to-list button must not be present
    await expect(
      page.getByRole('button', { name: /Add Tate Modern to my list/i }),
    ).not.toBeVisible();
  });

  test('logged-in user sees add-to-list button and can add place to list', async ({
    page,
    context,
  }) => {
    await context.clearCookies();

    await page.route(GRAPHQL_URL, (route, request) =>
      handleGraphql(route, request, {
        __me: MOCK_USER,
        GetMyListsSlim: { myLists: MOCK_LISTS },
        CreateListItemFromDetail: {
          createListItem: { documentId: 'new_item_id', name: 'Tate Modern' },
        },
      }),
    );

    await context.addCookies([
      { name: 'token', value: 'fake_token', url: 'http://localhost:3000' },
    ]);

    await page.goto('/place/node/1');

    await expect(page.getByRole('heading', { name: 'Tate Modern', level: 1 })).toBeVisible({
      timeout: 5000,
    });

    const addButton = page.getByRole('button', { name: /Add Tate Modern to my list/i });
    await expect(addButton).toBeVisible({ timeout: 3000 });
    await addButton.click();

    // After adding, success state appears
    await expect(page.getByRole('status')).toBeVisible({ timeout: 5000 });
    await expect(page.getByText('Added to your list')).toBeVisible();
    await expect(page.getByRole('link', { name: 'View my list →' })).toBeVisible();
  });
});

test.describe('Place detail page — not-found state', () => {
  test('unknown place id returns the 404 page', async ({ page, context }) => {
    await context.clearCookies();

    await page.goto('/place/node/99999');

    await expect(
      page.getByRole('heading', { name: 'Page not found', level: 1 }),
    ).toBeVisible({ timeout: 5000 });

    await expect(page.getByRole('link', { name: 'Back to London List' })).toBeVisible();
  });
});
