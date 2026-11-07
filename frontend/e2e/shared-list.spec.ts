import { test, expect } from '@playwright/test';
import type { Route, Request as PlaywrightRequest } from '@playwright/test';

// Values must match the fixtures in e2e/mock-api/server.mjs
const FIXTURE_USERNAME = 'publicuser';
const FIXTURE_LIST_ID = 'list-public-abc123';
const FIXTURE_PRIVATE_LIST_ID = 'list-private-xyz789';

const GRAPHQL_URL = '**/graphql';

const MOCK_USER = {
  id: '1',
  documentId: 'doc_abc123',
  username: 'viewer',
  email: 'viewer@example.com',
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
      body: JSON.stringify({ data: { me: operations.__me } }),
    });
    return;
  }

  await route.continue();
}

test.describe('Public list detail page — found', () => {
  test.beforeEach(async ({ context }) => {
    await context.clearCookies();
  });

  test('renders the list name as a heading', async ({ page }) => {
    await page.route(GRAPHQL_URL, (route, request) =>
      handleGraphql(route, request, { __me: null }),
    );

    await page.goto(`/list/${FIXTURE_USERNAME}/${FIXTURE_LIST_ID}`);

    await expect(page.getByRole('heading', { level: 1 })).toContainText('London Highlights');
  });

  test('shows the list description', async ({ page }) => {
    await page.route(GRAPHQL_URL, (route, request) =>
      handleGraphql(route, request, { __me: null }),
    );

    await page.goto(`/list/${FIXTURE_USERNAME}/${FIXTURE_LIST_ID}`);

    await expect(page.getByText('Must-see spots in London')).toBeVisible();
  });

  test('shows to-do and done sections with the correct item names', async ({ page }) => {
    await page.route(GRAPHQL_URL, (route, request) =>
      handleGraphql(route, request, { __me: null }),
    );

    await page.goto(`/list/${FIXTURE_USERNAME}/${FIXTURE_LIST_ID}`);

    await expect(page.getByRole('heading', { name: /To do/i })).toBeVisible();
    await expect(page.getByRole('heading', { name: /Done/i })).toBeVisible();
    await expect(page.getByText('The British Museum')).toBeVisible();
    await expect(page.getByText('Covent Garden')).toBeVisible();
  });

  test('shows the Share this list section', async ({ page }) => {
    await page.route(GRAPHQL_URL, (route, request) =>
      handleGraphql(route, request, { __me: null }),
    );

    await page.goto(`/list/${FIXTURE_USERNAME}/${FIXTURE_LIST_ID}`);

    await expect(page.getByText('Share this list')).toBeVisible();
  });

  test('shows a link back to the author profile', async ({ page }) => {
    await page.route(GRAPHQL_URL, (route, request) =>
      handleGraphql(route, request, { __me: null }),
    );

    await page.goto(`/list/${FIXTURE_USERNAME}/${FIXTURE_LIST_ID}`);

    const profileLink = page.getByRole('link', { name: `${FIXTURE_USERNAME}'s lists` });
    await expect(profileLink).toBeVisible();
    await expect(profileLink).toHaveAttribute('href', `/profile/${FIXTURE_USERNAME}`);
  });

  test('renders the map container for items with coordinates', async ({ page }) => {
    await page.route(GRAPHQL_URL, (route, request) =>
      handleGraphql(route, request, { __me: null }),
    );

    await page.goto(`/list/${FIXTURE_USERNAME}/${FIXTURE_LIST_ID}`);

    await expect(page.locator('[role="region"][aria-label*="map" i]')).toBeVisible({ timeout: 5000 });
  });
});

test.describe('Public list detail page — logged-in user copy flow', () => {
  test('logged-in user sees the Copy this list button', async ({ page, context }) => {
    await context.addCookies([
      { name: 'token', value: 'fake_token', url: 'http://localhost:3000' },
    ]);

    await page.route(GRAPHQL_URL, (route, request) =>
      handleGraphql(route, request, {
        __me: MOCK_USER,
        GetMyLists: { myLists: [] },
      }),
    );

    await page.goto(`/list/${FIXTURE_USERNAME}/${FIXTURE_LIST_ID}`);

    await expect(page.getByRole('button', { name: /Copy this list/i })).toBeVisible();
  });

  test('copying a list shows success state and a link to /my-list', async ({ page, context }) => {
    await context.addCookies([
      { name: 'token', value: 'fake_token', url: 'http://localhost:3000' },
    ]);

    await page.route(GRAPHQL_URL, (route, request) =>
      handleGraphql(route, request, {
        __me: MOCK_USER,
        GetMyLists: { myLists: [] },
        CopyListCreateMyList: { createMyList: { documentId: 'new-list-id', name: 'London Highlights' } },
        CopyListCreateListItem: { createListItem: { documentId: 'new-item-id' } },
      }),
    );

    await page.goto(`/list/${FIXTURE_USERNAME}/${FIXTURE_LIST_ID}`);

    await page.getByRole('button', { name: /Copy this list/i }).click();

    await expect(page.getByText('List copied!')).toBeVisible({ timeout: 5000 });
    await expect(page.getByRole('link', { name: /View your lists/i })).toHaveAttribute('href', '/my-list');
  });
});

test.describe('Public list detail page — private list', () => {
  test('shows "This list is private." for a private list', async ({ page }) => {
    await page.route(GRAPHQL_URL, (route, request) =>
      handleGraphql(route, request, { __me: null }),
    );

    await page.goto(`/list/${FIXTURE_USERNAME}/${FIXTURE_PRIVATE_LIST_ID}`);

    await expect(page.getByText('This list is private.')).toBeVisible({ timeout: 5000 });
  });
});

test.describe('Public list detail page — not found', () => {
  test('shows "List not found." for an unknown list', async ({ page }) => {
    await page.route(GRAPHQL_URL, (route, request) =>
      handleGraphql(route, request, { __me: null }),
    );

    await page.goto('/list/unknown-user/unknown-list-id');

    await expect(page.getByText('List not found.')).toBeVisible({ timeout: 5000 });
  });
});
