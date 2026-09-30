import { test, expect } from '@playwright/test';
import type { Route, Request as PlaywrightRequest } from '@playwright/test';

const GRAPHQL_URL = '**/graphql';
const PHOTON_URL = '**://photon.komoot.io/api/**';

const MOCK_USER = {
  id: '1',
  documentId: 'doc_abc123',
  username: 'testuser',
  email: 'test@example.com',
  isPro: false,
};

const BASE_LIST = {
  documentId: 'list_abc123',
  name: 'My List',
  description: null,
  isPublic: false,
  viewCount: 0,
  itemCount: 0,
  completedCount: 0,
};

const PHOTON_FEATURE = {
  type: 'Feature',
  geometry: { type: 'Point', coordinates: [-0.0754, 51.5055] },
  properties: {
    osm_id: 98765,
    osm_type: 'N',
    name: 'Tower Bridge',
    street: 'Tower Bridge Road',
    city: 'London',
    osm_key: 'tourism',
    osm_value: 'attraction',
  },
};

type MockItem = {
  documentId: string;
  name: string;
  category: string | null;
  completed: boolean;
  osm_id: string;
  visitedAt: string | null;
  notes: string | null;
  lat: number | null;
  lng: number | null;
};

test.describe('My list management', () => {
  let currentList: typeof BASE_LIST;
  let items: MockItem[];

  test.beforeEach(async ({ context, page }) => {
    currentList = { ...BASE_LIST };
    items = [];

    await context.clearCookies();
    await context.addCookies([
      { name: 'token', value: 'fake_jwt_token', url: 'http://localhost:3000' },
    ]);

    await page.route(PHOTON_URL, async (route) => {
      await route.fulfill({
        contentType: 'application/json',
        body: JSON.stringify({ features: [PHOTON_FEATURE] }),
      });
    });

    await page.route(GRAPHQL_URL, async (route: Route, request: PlaywrightRequest) => {
      const body = request.postDataJSON() as {
        operationName?: string | null;
        query?: string;
        variables?: Record<string, unknown>;
      } | null;
      const op = body?.operationName ?? null;
      const query = body?.query ?? '';
      const variables = body?.variables ?? {};

      if (op === null && query.includes('me {')) {
        await route.fulfill({
          contentType: 'application/json',
          body: JSON.stringify({ data: { me: MOCK_USER } }),
        });
        return;
      }

      if (op === 'GetMyLists') {
        await route.fulfill({
          contentType: 'application/json',
          body: JSON.stringify({ data: { myLists: [currentList] } }),
        });
        return;
      }

      if (op === 'GetMyList') {
        await route.fulfill({
          contentType: 'application/json',
          body: JSON.stringify({ data: { listItems: items } }),
        });
        return;
      }

      if (op === 'CreateListItem') {
        const newItem: MockItem = {
          documentId: `item_${items.length + 1}`,
          name: variables.name as string,
          category: (variables.category as string) || null,
          completed: false,
          osm_id: variables.osm_id as string,
          visitedAt: null,
          notes: null,
          lat: (variables.lat as number) ?? null,
          lng: (variables.lng as number) ?? null,
        };
        items.push(newItem);
        currentList.itemCount += 1;
        await route.fulfill({
          contentType: 'application/json',
          body: JSON.stringify({
            data: { createListItem: { documentId: newItem.documentId, name: newItem.name } },
          }),
        });
        return;
      }

      if (op === 'DeleteListItem') {
        const documentId = variables.documentId as string;
        items = items.filter((i) => i.documentId !== documentId);
        currentList.itemCount = Math.max(0, currentList.itemCount - 1);
        await route.fulfill({
          contentType: 'application/json',
          body: JSON.stringify({ data: { deleteListItem: { documentId } } }),
        });
        return;
      }

      if (op === 'ToggleComplete') {
        const documentId = variables.documentId as string;
        const item = items.find((i) => i.documentId === documentId);
        if (item) {
          item.completed = variables.completed as boolean;
          item.visitedAt = (variables.visitedAt as string | null) ?? null;
        }
        await route.fulfill({
          contentType: 'application/json',
          body: JSON.stringify({
            data: {
              updateListItem: {
                documentId,
                completed: item?.completed ?? false,
                visitedAt: item?.visitedAt ?? null,
              },
            },
          }),
        });
        return;
      }

      if (op === 'UpdateMyList') {
        if ('isPublic' in variables) currentList.isPublic = variables.isPublic as boolean;
        if (variables.name) currentList.name = variables.name as string;
        if ('description' in variables) currentList.description = variables.description as string | null;
        await route.fulfill({
          contentType: 'application/json',
          body: JSON.stringify({ data: { updateMyList: currentList } }),
        });
        return;
      }

      await route.continue();
    });
  });

  test('can search for a place and add it to the list', async ({ page }) => {
    await page.goto('/my-list');

    await expect(page.getByRole('tab', { name: 'My List' })).toBeVisible();

    await page.getByLabel('Search for a place in London').fill('Tower Bridge');
    await expect(page.getByRole('button', { name: '+ Add to list' })).toBeVisible({ timeout: 5000 });
    await page.getByRole('button', { name: '+ Add to list' }).click();

    await expect(page.getByRole('button', { name: 'Added ✓' })).toBeVisible();
    const todoHeading = page.getByRole('heading', { name: 'To do (1)' });
    await expect(todoHeading).toBeVisible({ timeout: 5000 });
    const todoList = todoHeading.locator('xpath=following-sibling::ul[1]');
    await expect(todoList.getByText('Tower Bridge')).toBeVisible();
  });

  test('can remove a place from the list', async ({ page }) => {
    items.push({
      documentId: 'item_existing',
      name: 'Tower Bridge',
      category: 'attraction',
      completed: false,
      osm_id: 'node/98765',
      visitedAt: null,
      notes: null,
      lat: 51.5055,
      lng: -0.0754,
    });
    currentList.itemCount = 1;

    await page.goto('/my-list');

    await expect(page.getByRole('heading', { name: 'To do (1)' })).toBeVisible();
    await page.getByRole('button', { name: 'Remove Tower Bridge' }).click();

    await expect(page.getByText('Your list is empty.')).toBeVisible({ timeout: 5000 });
  });

  test('can toggle list visibility to public and see a share link', async ({ page }) => {
    await page.goto('/my-list');

    await expect(page.getByText('Make this list public to share it with others.')).toBeVisible();

    // The checkbox itself is visually hidden and positioned off-screen (custom toggle-switch
    // styling), so dispatch a native click directly rather than relying on Playwright's
    // viewport-bound pointer actions.
    await page.getByLabel(/Make .* public/).evaluate((el) => (el as HTMLInputElement).click());

    await expect(page.getByLabel('Public list URL')).toBeVisible({ timeout: 5000 });
  });
});
