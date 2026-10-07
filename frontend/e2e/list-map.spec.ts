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

const TODO_ITEM = {
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

const DONE_ITEM = {
  __typename: 'ListItem',
  documentId: 'item_2',
  name: 'Tower of London',
  category: 'attraction',
  completed: true,
  osm_id: 'node/456',
  visitedAt: '2026-01-01T00:00:00.000Z',
  notes: null,
  lat: 51.5081,
  lng: -0.0759,
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
        GetMyList: { listItems: [TODO_ITEM, DONE_ITEM] },
      }),
    );
    await page.context().addCookies([
      { name: 'token', value: 'fake_token', url: 'http://localhost:3000' },
    ]);
  });

  test('renders a pin for every list item with coordinates', async ({ page }) => {
    await page.goto('/my-list');

    const map = page.locator('.leaflet-container');
    await expect(map).toBeVisible({ timeout: 5000 });

    await expect(page.locator('.leaflet-marker-icon')).toHaveCount(2);
  });

  test('clicking a pin opens a popup with that place\'s details', async ({ page }) => {
    await page.goto('/my-list');

    await expect(page.locator('.leaflet-container')).toBeVisible({ timeout: 5000 });
    const markers = page.locator('.leaflet-marker-icon');
    await expect(markers).toHaveCount(2);

    await expect(page.locator('.leaflet-popup')).toHaveCount(0);

    await markers.first().click();

    const popup = page.locator('.leaflet-popup');
    await expect(popup).toBeVisible({ timeout: 5000 });
    await expect(popup).toContainText('Tate Modern');
    await expect(popup).toContainText('○ To do');
  });
});
