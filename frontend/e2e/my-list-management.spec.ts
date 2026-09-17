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
  documentId: 'list_abc123',
  name: 'My List',
  description: null,
  isPublic: false,
  viewCount: 0,
  itemCount: 0,
  completedCount: 0,
};

const MOCK_LIST_2 = {
  documentId: 'list_def456',
  name: 'Weekend Plans',
  description: null,
  isPublic: false,
  viewCount: 0,
  itemCount: 0,
  completedCount: 0,
};

const MOCK_LIST_3 = {
  documentId: 'list_ghi789',
  name: 'Hidden Gems',
  description: null,
  isPublic: false,
  viewCount: 0,
  itemCount: 0,
  completedCount: 0,
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

test.describe('My list management', () => {
  test.beforeEach(async ({ context }) => {
    await context.clearCookies();
  });

  test('shows existing lists and free-tier usage banner', async ({ page }) => {
    await page.route(GRAPHQL_URL, (route, request) =>
      handleGraphql(route, request, {
        __me: MOCK_USER,
        GetMyLists: { myLists: [MOCK_LIST] },
      }),
    );
    await page.context().addCookies([
      { name: 'token', value: 'fake_token', url: 'http://localhost:3000' },
    ]);

    await page.goto('/my-list');

    await expect(page.getByRole('tab', { name: 'My List' })).toBeVisible({ timeout: 5000 });
    await expect(page.getByLabel('List usage')).toContainText('1/3 lists used');
    await expect(page.getByRole('button', { name: '+ New list' })).toBeVisible();
  });

  test('can create a new list', async ({ page }) => {
    const newList = { ...MOCK_LIST_2 };
    let listCount = 1;

    await page.route(GRAPHQL_URL, async (route, request) => {
      const body = request.postDataJSON() as { operationName?: string } | null;
      const op = body?.operationName ?? null;
      const query = (request.postDataJSON() as { query?: string } | null)?.query ?? '';

      if (op === 'GetMyLists') {
        await route.fulfill({
          contentType: 'application/json',
          body: JSON.stringify({
            data: {
              myLists: listCount === 1 ? [MOCK_LIST] : [MOCK_LIST, newList],
            },
          }),
        });
      } else if (op === 'CreateMyList') {
        listCount = 2;
        await route.fulfill({
          contentType: 'application/json',
          body: JSON.stringify({ data: { createMyList: newList } }),
        });
      } else if (op === null && query.includes('me {')) {
        await route.fulfill({
          contentType: 'application/json',
          body: JSON.stringify({ data: { me: MOCK_USER } }),
        });
      } else {
        await route.continue();
      }
    });

    await page.context().addCookies([
      { name: 'token', value: 'fake_token', url: 'http://localhost:3000' },
    ]);

    await page.goto('/my-list');
    await expect(page.getByRole('tab', { name: 'My List' })).toBeVisible({ timeout: 5000 });

    await page.getByRole('button', { name: '+ New list' }).click();

    const nameInput = page.getByLabel('New list name');
    await expect(nameInput).toBeVisible();
    await nameInput.fill('Weekend Plans');
    await page.getByRole('button', { name: 'Create' }).click();

    await expect(page.getByRole('tab', { name: 'Weekend Plans' })).toBeVisible({ timeout: 5000 });
  });

  test('cancelling new-list form hides the input', async ({ page }) => {
    await page.route(GRAPHQL_URL, (route, request) =>
      handleGraphql(route, request, {
        __me: MOCK_USER,
        GetMyLists: { myLists: [MOCK_LIST] },
      }),
    );
    await page.context().addCookies([
      { name: 'token', value: 'fake_token', url: 'http://localhost:3000' },
    ]);

    await page.goto('/my-list');
    await expect(page.getByRole('tab', { name: 'My List' })).toBeVisible({ timeout: 5000 });

    await page.getByRole('button', { name: '+ New list' }).click();
    await expect(page.getByLabel('New list name')).toBeVisible();

    await page.getByRole('button', { name: 'Cancel' }).click();
    await expect(page.getByLabel('New list name')).not.toBeVisible();
    await expect(page.getByRole('button', { name: '+ New list' })).toBeVisible();
  });

  test('free user at the 3-list limit sees upgrade button instead of new-list', async ({ page }) => {
    await page.route(GRAPHQL_URL, (route, request) =>
      handleGraphql(route, request, {
        __me: MOCK_USER,
        GetMyLists: { myLists: [MOCK_LIST, MOCK_LIST_2, MOCK_LIST_3] },
      }),
    );
    await page.context().addCookies([
      { name: 'token', value: 'fake_token', url: 'http://localhost:3000' },
    ]);

    await page.goto('/my-list');
    await expect(page.getByRole('tab', { name: 'My List' })).toBeVisible({ timeout: 5000 });

    await expect(
      page.getByRole('button', { name: 'Upgrade to Pro to create more lists' }),
    ).toBeVisible();
    await expect(page.getByRole('button', { name: '+ New list' })).not.toBeVisible();
  });

  test('clicking upgrade button at list limit opens the upgrade modal', async ({ page }) => {
    await page.route(GRAPHQL_URL, (route, request) =>
      handleGraphql(route, request, {
        __me: MOCK_USER,
        GetMyLists: { myLists: [MOCK_LIST, MOCK_LIST_2, MOCK_LIST_3] },
      }),
    );
    await page.context().addCookies([
      { name: 'token', value: 'fake_token', url: 'http://localhost:3000' },
    ]);

    await page.goto('/my-list');
    await expect(page.getByRole('tab', { name: 'My List' })).toBeVisible({ timeout: 5000 });

    await page
      .getByRole('button', { name: 'Upgrade to Pro to create more lists' })
      .click();

    await expect(page.getByRole('dialog')).toBeVisible({ timeout: 3000 });
  });

  test('free user banner shows correct remaining slots', async ({ page }) => {
    await page.route(GRAPHQL_URL, (route, request) =>
      handleGraphql(route, request, {
        __me: MOCK_USER,
        GetMyLists: { myLists: [MOCK_LIST, MOCK_LIST_2] },
      }),
    );
    await page.context().addCookies([
      { name: 'token', value: 'fake_token', url: 'http://localhost:3000' },
    ]);

    await page.goto('/my-list');
    await expect(page.getByRole('tab', { name: 'My List' })).toBeVisible({ timeout: 5000 });

    const banner = page.getByLabel('List usage');
    await expect(banner).toContainText('2/3 lists used');
    await expect(banner).toContainText('1 remaining on the free plan');
  });

  test('can rename the active list', async ({ page }) => {
    await page.route(GRAPHQL_URL, (route, request) =>
      handleGraphql(route, request, {
        __me: MOCK_USER,
        GetMyLists: { myLists: [MOCK_LIST] },
        UpdateMyList: {
          updateMyList: { ...MOCK_LIST, name: 'Renamed List' },
        },
      }),
    );
    await page.context().addCookies([
      { name: 'token', value: 'fake_token', url: 'http://localhost:3000' },
    ]);

    await page.goto('/my-list');
    await expect(page.getByRole('tab', { name: 'My List' })).toBeVisible({ timeout: 5000 });

    await page.getByRole('button', { name: 'Rename list' }).click();

    const renameInput = page.getByLabel(/New name for/);
    await expect(renameInput).toBeVisible();
    await renameInput.fill('Renamed List');
    await page.getByRole('button', { name: 'Save' }).click();

    await expect(renameInput).not.toBeVisible();
  });

  test('can delete a list when multiple lists exist', async ({ page }) => {
    await page.route(GRAPHQL_URL, (route, request) =>
      handleGraphql(route, request, {
        __me: MOCK_USER,
        GetMyLists: { myLists: [MOCK_LIST, MOCK_LIST_2] },
        DeleteMyList: { deleteMyList: true },
      }),
    );
    await page.context().addCookies([
      { name: 'token', value: 'fake_token', url: 'http://localhost:3000' },
    ]);

    await page.goto('/my-list');
    await expect(page.getByRole('tab', { name: 'My List' })).toBeVisible({ timeout: 5000 });

    await page.getByRole('button', { name: 'Delete list' }).click();

    await expect(page.getByRole('alertdialog')).toBeVisible();
    await page.getByRole('button', { name: 'Yes, delete' }).click();

    await expect(page.getByRole('alertdialog')).not.toBeVisible({ timeout: 3000 });
  });

  test('delete list button is hidden when only one list exists', async ({ page }) => {
    await page.route(GRAPHQL_URL, (route, request) =>
      handleGraphql(route, request, {
        __me: MOCK_USER,
        GetMyLists: { myLists: [MOCK_LIST] },
      }),
    );
    await page.context().addCookies([
      { name: 'token', value: 'fake_token', url: 'http://localhost:3000' },
    ]);

    await page.goto('/my-list');
    await expect(page.getByRole('tab', { name: 'My List' })).toBeVisible({ timeout: 5000 });

    await expect(page.getByRole('button', { name: 'Delete list' })).not.toBeVisible();
  });

  test('unauthenticated user is redirected away from /my-list', async ({ page }) => {
    await page.route(GRAPHQL_URL, (route, request) =>
      handleGraphql(route, request, {
        __me: null,
      }),
    );

    await page.goto('/my-list');

    await expect(page).not.toHaveURL(/\/my-list/, { timeout: 5000 });
  });
});
