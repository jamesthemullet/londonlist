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
  __typename: 'List',
  documentId: 'list_abc123',
  name: 'My List',
  description: null,
  isPublic: false,
  viewCount: 0,
  itemCount: 2,
  completedCount: 1,
};

const MOCK_ITEM_TODO = {
  __typename: 'ListItem',
  documentId: 'item_1',
  name: 'Tate Modern',
  category: 'museum',
  completed: false,
  osm_id: 'node/123',
  visitedAt: null,
  notes: null,
  lat: 51.5076,
  lng: -0.0994,
};

const MOCK_ITEM_DONE = {
  __typename: 'ListItem',
  documentId: 'item_2',
  name: 'Borough Market',
  category: 'market',
  completed: true,
  osm_id: 'node/456',
  visitedAt: '2026-01-01T00:00:00.000Z',
  notes: null,
  lat: 51.5055,
  lng: -0.091,
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

test.describe('List map', () => {
  test.beforeEach(async ({ context, page }) => {
    await context.clearCookies();

    await page.route(GRAPHQL_URL, (route, request) =>
      handleGraphql(route, request, {
        __me: MOCK_USER,
        GetMyLists: { myLists: [MOCK_LIST] },
        GetMyList: { listItems: [MOCK_ITEM_TODO, MOCK_ITEM_DONE] },
      }),
    );

    await page.context().addCookies([
      { name: 'token', value: 'fake_token', url: 'http://localhost:3000' },
    ]);
  });

  test('renders a pin for each list item with coordinates', async ({ page }) => {
    await page.goto('/my-list');

    await expect(page.locator('.leaflet-container')).toBeVisible({ timeout: 5000 });
    await expect(page.locator('.leaflet-marker-icon')).toHaveCount(2);
  });

  test('clicking a pin shows that place in a popup', async ({ page }) => {
    await page.goto('/my-list');

    await expect(page.locator('.leaflet-marker-icon')).toHaveCount(2);

    await page.locator('.leaflet-marker-icon').first().click();

    const popup = page.locator('.leaflet-popup-content');
    await expect(popup).toBeVisible();
    await expect(popup).toContainText('Tate Modern');
    await expect(popup).toContainText('museum');
  });
});
