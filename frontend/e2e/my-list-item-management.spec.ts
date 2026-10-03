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
  documentId: 'list_abc123',
  name: 'My List',
  description: null,
  isPublic: false,
  viewCount: 0,
  itemCount: 0,
  completedCount: 0,
};

const MOCK_ITEM = {
  documentId: 'item_abc123',
  name: 'Hyde Park',
  category: 'park',
  completed: false,
  osm_id: 'relation/12345',
  visitedAt: null,
  notes: null,
  lat: 51.5073,
  lng: -0.1657,
};

const PHOTON_FEATURE = {
  type: 'Feature',
  geometry: { type: 'Point', coordinates: [-0.1657, 51.5073] },
  properties: {
    osm_id: 12345,
    osm_type: 'R' as const,
    name: 'Hyde Park',
    district: 'Westminster',
    city: 'London',
    osm_key: 'leisure',
    osm_value: 'park',
  },
};

async function mockPhotonSearch(page: import('@playwright/test').Page) {
  await page.route(PHOTON_URL, async (route) => {
    await route.fulfill({
      contentType: 'application/json',
      body: JSON.stringify({ features: [PHOTON_FEATURE] }),
    });
  });
}

async function loginAs(page: import('@playwright/test').Page) {
  await page.context().addCookies([
    { name: 'token', value: 'fake_token', url: 'http://localhost:3000' },
  ]);
}

function fulfillMe(route: Route) {
  return route.fulfill({
    contentType: 'application/json',
    body: JSON.stringify({ data: { me: MOCK_USER } }),
  });
}

test.describe('My list item management', () => {
  test.beforeEach(async ({ context }) => {
    await context.clearCookies();
  });

  test('can add a place to the list via search', async ({ page }) => {
    await mockPhotonSearch(page);
    let itemAdded = false;

    await page.route(GRAPHQL_URL, async (route, request: PlaywrightRequest) => {
      const body = request.postDataJSON() as { operationName?: string | null; query?: string } | null;
      const op = body?.operationName ?? null;
      const query = body?.query ?? '';

      if (op === 'GetMyLists') {
        await route.fulfill({
          contentType: 'application/json',
          body: JSON.stringify({ data: { myLists: [MOCK_LIST] } }),
        });
      } else if (op === 'GetMyList') {
        await route.fulfill({
          contentType: 'application/json',
          body: JSON.stringify({ data: { listItems: itemAdded ? [MOCK_ITEM] : [] } }),
        });
      } else if (op === 'CreateListItem') {
        itemAdded = true;
        await route.fulfill({
          contentType: 'application/json',
          body: JSON.stringify({
            data: { createListItem: { documentId: MOCK_ITEM.documentId, name: MOCK_ITEM.name } },
          }),
        });
      } else if (op === null && query.includes('me {')) {
        await fulfillMe(route);
      } else {
        await route.continue();
      }
    });

    await loginAs(page);
    await page.goto('/my-list');
    await expect(page.getByRole('tab', { name: 'My List' })).toBeVisible({ timeout: 5000 });
    await expect(page.getByText('Your list is empty.')).toBeVisible();

    await page.getByLabel('Search for a place in London').fill('Hyde Park');
    const addButton = page.getByRole('button', { name: '+ Add to list' });
    await expect(addButton).toBeVisible({ timeout: 5000 });
    await addButton.click();

    await expect(page.getByRole('button', { name: 'Added ✓' })).toBeVisible({ timeout: 5000 });
    const todoHeading = page.getByRole('heading', { name: 'To do (1)' });
    await expect(todoHeading).toBeVisible({ timeout: 5000 });
    const todoSection = page.locator('section').filter({ has: todoHeading });
    await expect(todoSection.getByText('Hyde Park', { exact: true })).toBeVisible();
  });

  test('can remove an item from the list', async ({ page }) => {
    let itemDeleted = false;

    await page.route(GRAPHQL_URL, async (route, request: PlaywrightRequest) => {
      const body = request.postDataJSON() as { operationName?: string | null; query?: string } | null;
      const op = body?.operationName ?? null;
      const query = body?.query ?? '';

      if (op === 'GetMyLists') {
        await route.fulfill({
          contentType: 'application/json',
          body: JSON.stringify({ data: { myLists: [{ ...MOCK_LIST, itemCount: 1 }] } }),
        });
      } else if (op === 'GetMyList') {
        await route.fulfill({
          contentType: 'application/json',
          body: JSON.stringify({ data: { listItems: itemDeleted ? [] : [MOCK_ITEM] } }),
        });
      } else if (op === 'DeleteListItem') {
        itemDeleted = true;
        await route.fulfill({
          contentType: 'application/json',
          body: JSON.stringify({ data: { deleteListItem: { documentId: MOCK_ITEM.documentId } } }),
        });
      } else if (op === null && query.includes('me {')) {
        await fulfillMe(route);
      } else {
        await route.continue();
      }
    });

    await loginAs(page);
    await page.goto('/my-list');
    await expect(page.getByRole('tab', { name: 'My List' })).toBeVisible({ timeout: 5000 });
    await expect(page.getByRole('heading', { name: 'To do (1)' })).toBeVisible({ timeout: 5000 });

    await page.getByRole('button', { name: `Remove ${MOCK_ITEM.name}` }).click();

    await expect(page.getByText('Your list is empty.')).toBeVisible({ timeout: 5000 });
  });

  test('can toggle a list to public and see the share link', async ({ page }) => {
    let listIsPublic = false;

    await page.route(GRAPHQL_URL, async (route, request: PlaywrightRequest) => {
      const body = request.postDataJSON() as { operationName?: string | null; query?: string } | null;
      const op = body?.operationName ?? null;
      const query = body?.query ?? '';

      if (op === 'GetMyLists') {
        await route.fulfill({
          contentType: 'application/json',
          body: JSON.stringify({ data: { myLists: [{ ...MOCK_LIST, isPublic: listIsPublic }] } }),
        });
      } else if (op === 'GetMyList') {
        await route.fulfill({
          contentType: 'application/json',
          body: JSON.stringify({ data: { listItems: [] } }),
        });
      } else if (op === 'UpdateMyList') {
        listIsPublic = true;
        await route.fulfill({
          contentType: 'application/json',
          body: JSON.stringify({ data: { updateMyList: { ...MOCK_LIST, isPublic: true } } }),
        });
      } else if (op === null && query.includes('me {')) {
        await fulfillMe(route);
      } else {
        await route.continue();
      }
    });

    await loginAs(page);
    await page.goto('/my-list');
    await expect(page.getByRole('tab', { name: 'My List' })).toBeVisible({ timeout: 5000 });
    await expect(page.getByText('Make this list public to share it with others.')).toBeVisible();

    // The checkbox is visually hidden by a custom toggle-switch style; click its visible label text.
    await page.getByText(/^Make .* public$/).click();

    await expect(page.getByLabel('Public list URL')).toHaveValue(
      `http://localhost:3000/list/${MOCK_USER.username}/${MOCK_LIST.documentId}`,
      { timeout: 5000 },
    );
    await expect(page.getByText(/Share your list:/)).toBeVisible();
  });
});
