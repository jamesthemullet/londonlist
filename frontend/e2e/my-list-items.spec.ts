import { test, expect } from '@playwright/test';
import type { Route, Request as PlaywrightRequest } from '@playwright/test';

const GRAPHQL_URL = '**/graphql';
const PHOTON_URL = 'https://photon.komoot.io/**';

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
  itemCount: 1,
  completedCount: 0,
};

const MOCK_ITEM = {
  __typename: 'ListItem',
  documentId: 'item_1',
  name: 'Tate Modern',
  category: 'museum',
  completed: false,
  osm_id: 'node/123',
  visitedAt: null,
  notes: null,
  lat: null,
  lng: null,
};

const PHOTON_FEATURE = {
  type: 'Feature',
  geometry: { type: 'Point', coordinates: [-0.1276, 51.5194] },
  properties: {
    osm_id: 456,
    osm_type: 'N',
    name: 'Tate Modern',
    street: 'Bankside',
    city: 'London',
    osm_key: 'tourism',
    osm_value: 'museum',
  },
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

test.describe('My list item management', () => {
  test.beforeEach(async ({ context, page }) => {
    await context.clearCookies();
    await page.route(PHOTON_URL, (route) =>
      route.fulfill({
        contentType: 'application/json',
        body: JSON.stringify({ features: [PHOTON_FEATURE] }),
      }),
    );
  });

  test('can add a place to the list via search', async ({ page }) => {
    let itemAdded = false;

    await page.route(GRAPHQL_URL, (route, request) =>
      handleGraphql(route, request, {
        __me: MOCK_USER,
        GetMyLists: { myLists: [MOCK_LIST] },
        GetMyList: { listItems: itemAdded ? [MOCK_ITEM] : [] },
        CreateListItem: {
          createListItem: { documentId: 'item_1', name: 'Tate Modern' },
        },
      }),
    );
    await page.route(GRAPHQL_URL, async (route, request) => {
      const body = request.postDataJSON() as { operationName?: string } | null;
      if (body?.operationName === 'CreateListItem') itemAdded = true;
      await route.fallback();
    });

    await page.context().addCookies([
      { name: 'token', value: 'fake_token', url: 'http://localhost:3000' },
    ]);

    await page.goto('/my-list');
    await expect(page.getByRole('tab', { name: 'My List' })).toBeVisible({ timeout: 5000 });
    await expect(page.getByText('Your list is empty.')).toBeVisible();

    await page.getByLabel('Search for a place in London').fill('Tate Modern');
    await expect(page.getByRole('button', { name: '+ Add to list' })).toBeVisible({
      timeout: 5000,
    });

    await page.getByRole('button', { name: '+ Add to list' }).click();
    await expect(page.getByRole('button', { name: 'Added ✓' })).toBeVisible();

    await expect(page.getByRole('heading', { name: 'To do (1)' })).toBeVisible({ timeout: 5000 });
  });

  test('can remove an item from the list', async ({ page }) => {
    let deleted = false;

    await page.route(GRAPHQL_URL, (route, request) =>
      handleGraphql(route, request, {
        __me: MOCK_USER,
        GetMyLists: { myLists: [MOCK_LIST] },
        GetMyList: { listItems: deleted ? [] : [MOCK_ITEM] },
        DeleteListItem: { deleteListItem: { documentId: MOCK_ITEM.documentId } },
      }),
    );
    await page.route(GRAPHQL_URL, async (route, request) => {
      const body = request.postDataJSON() as { operationName?: string } | null;
      if (body?.operationName === 'DeleteListItem') deleted = true;
      await route.fallback();
    });

    await page.context().addCookies([
      { name: 'token', value: 'fake_token', url: 'http://localhost:3000' },
    ]);

    await page.goto('/my-list');
    await expect(page.getByText('Tate Modern')).toBeVisible({ timeout: 5000 });

    await page.getByRole('button', { name: 'Remove Tate Modern' }).click();

    await expect(page.getByText('Your list is empty.')).toBeVisible({ timeout: 5000 });
  });

  test('toggling a list to public reveals the shareable link', async ({ page }) => {
    let isPublic = false;

    await page.route(GRAPHQL_URL, (route, request) =>
      handleGraphql(route, request, {
        __me: MOCK_USER,
        GetMyLists: { myLists: [{ ...MOCK_LIST, isPublic }] },
        GetMyList: { listItems: [MOCK_ITEM] },
        UpdateMyList: { updateMyList: { ...MOCK_LIST, isPublic: true } },
      }),
    );
    await page.route(GRAPHQL_URL, async (route, request) => {
      const body = request.postDataJSON() as { operationName?: string } | null;
      if (body?.operationName === 'UpdateMyList') isPublic = true;
      await route.fallback();
    });

    await page.context().addCookies([
      { name: 'token', value: 'fake_token', url: 'http://localhost:3000' },
    ]);

    await page.goto('/my-list');
    await expect(page.getByRole('tab', { name: 'My List' })).toBeVisible({ timeout: 5000 });

    await expect(page.getByText('Make this list public to share it with others.')).toBeVisible();

    await page.getByText(/Make .My List. public/).click();

    await expect(page.getByLabel('Public list URL')).toBeVisible({ timeout: 5000 });
  });
});
