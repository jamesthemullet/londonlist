import { test, expect } from '@playwright/test';
import type { Route, Request as PlaywrightRequest } from '@playwright/test';

const GRAPHQL_URL = '**/graphql';
const PHOTON_URL = 'https://photon.komoot.io/api/**';

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

const PHOTON_RESULT = {
  features: [
    {
      type: 'Feature',
      geometry: { type: 'Point', coordinates: [-0.1246, 51.5007] },
      properties: {
        osm_id: 12345,
        osm_type: 'N',
        name: 'Big Ben',
        street: 'Bridge Street',
        city: 'London',
        osm_key: 'tourism',
        osm_value: 'attraction',
      },
    },
  ],
};

const MOCK_ITEM = {
  documentId: 'item_1',
  name: 'Big Ben',
  category: 'attraction',
  completed: false,
  osm_id: 'node/12345',
  visitedAt: null,
  notes: null,
  lat: 51.5007,
  lng: -0.1246,
};

/**
 * Intercepts /graphql POST requests and responds based on operationName, falling
 * through to `route.continue()` for anything not listed. The '__me' key answers
 * the anonymous AppContext `me` query, which is sent without an operationName.
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

test.describe('My list management', () => {
  test.beforeEach(async ({ context, page }) => {
    await context.clearCookies();
    await context.addCookies([
      { name: 'token', value: 'fake_token', url: 'http://localhost:3000' },
    ]);
    await page.route(PHOTON_URL, (route) =>
      route.fulfill({ contentType: 'application/json', body: JSON.stringify(PHOTON_RESULT) }),
    );
  });

  test('search results can be added to the list', async ({ page }) => {
    let listItems: Array<typeof MOCK_ITEM> = [];

    await page.route(GRAPHQL_URL, (route, request) =>
      handleGraphql(route, request, {
        __me: MOCK_USER,
        GetMyLists: { myLists: [MOCK_LIST] },
        GetMyList: { listItems },
        CreateListItem: { createListItem: { documentId: MOCK_ITEM.documentId, name: MOCK_ITEM.name } },
      }),
    );

    await page.goto('/my-list');

    await expect(page.getByText('Your list is empty.')).toBeVisible();

    await page.getByLabel('Search for a place in London').fill('Big Ben');
    await expect(page.getByRole('button', { name: /Add to list/ })).toBeVisible({ timeout: 5000 });

    // The next GetMyList refetch (triggered by the add mutation) returns the new item.
    listItems = [MOCK_ITEM];
    await page.getByRole('button', { name: /Add to list/ }).click();

    await expect(page.getByRole('heading', { name: 'To do (1)' })).toBeVisible({ timeout: 5000 });
    await expect(page.getByText('Big Ben').last()).toBeVisible();
  });

  test('an item can be removed from the list', async ({ page }) => {
    let listItems: Array<typeof MOCK_ITEM> = [MOCK_ITEM];

    await page.route(GRAPHQL_URL, (route, request) =>
      handleGraphql(route, request, {
        __me: MOCK_USER,
        GetMyLists: { myLists: [MOCK_LIST] },
        GetMyList: { listItems },
        DeleteListItem: { deleteListItem: { documentId: MOCK_ITEM.documentId } },
      }),
    );

    await page.goto('/my-list');

    await expect(page.getByRole('heading', { name: 'To do (1)' })).toBeVisible();
    await expect(page.getByText('Big Ben')).toBeVisible();

    // The next GetMyList refetch (triggered by the delete mutation) returns no items.
    listItems = [];
    await page.getByRole('button', { name: 'Remove Big Ben' }).click();

    await expect(page.getByText('Your list is empty.')).toBeVisible({ timeout: 5000 });
  });

  test('toggling visibility reveals the share link', async ({ page }) => {
    let list = { ...MOCK_LIST };

    await page.route(GRAPHQL_URL, (route, request) =>
      handleGraphql(route, request, {
        __me: MOCK_USER,
        GetMyLists: { myLists: [list] },
        GetMyList: { listItems: [] },
        UpdateMyList: { updateMyList: { ...list, isPublic: true } },
      }),
    );

    await page.goto('/my-list');

    await expect(page.getByText('Make this list public to share it with others.')).toBeVisible();

    // The next GetMyLists refetch (triggered by the update mutation) returns isPublic: true.
    list = { ...MOCK_LIST, isPublic: true };
    // The checkbox itself is visually hidden behind a styled toggle; click the
    // wrapping label (the real interactive surface) instead.
    await page.getByText(/^Make .* public$/).click();

    await expect(page.getByText('Share your list:')).toBeVisible({ timeout: 5000 });
    await expect(page.getByLabel('Public list URL')).toHaveValue(
      `http://localhost:3000/list/${MOCK_USER.username}/${MOCK_LIST.documentId}`,
    );
  });
});
