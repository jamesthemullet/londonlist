import { test, expect } from '@playwright/test';
import type { Route, Request as PlaywrightRequest } from '@playwright/test';

// Values must match the fixtures in e2e/mock-api/server.mjs
const FIXTURE_USERNAME = 'publicuser';
const FIXTURE_LIST_ID = 'list-public-abc123';

const GRAPHQL_URL = '**/graphql';

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

test.describe('Profile page — found', () => {
  test.beforeEach(async ({ context }) => {
    await context.clearCookies();
  });

  test('renders the username heading', async ({ page }) => {
    await page.route(GRAPHQL_URL, (route, request) =>
      handleGraphql(route, request, { __me: null }),
    );

    await page.goto(`/profile/${FIXTURE_USERNAME}`);

    await expect(page.getByRole('heading', { level: 1 })).toContainText(
      `${FIXTURE_USERNAME}'s London Lists`,
    );
  });

  test('shows public list cards with item counts', async ({ page }) => {
    await page.route(GRAPHQL_URL, (route, request) =>
      handleGraphql(route, request, { __me: null }),
    );

    await page.goto(`/profile/${FIXTURE_USERNAME}`);

    const listCard = page.getByRole('link', { name: /London Highlights/i });
    await expect(listCard).toBeVisible();
    await expect(listCard).toHaveAttribute(
      'href',
      `/list/${FIXTURE_USERNAME}/${FIXTURE_LIST_ID}`,
    );
  });

  test('list card shows the description', async ({ page }) => {
    await page.route(GRAPHQL_URL, (route, request) =>
      handleGraphql(route, request, { __me: null }),
    );

    await page.goto(`/profile/${FIXTURE_USERNAME}`);

    await expect(page.getByText('Must-see spots in London')).toBeVisible();
  });

  test('shows the list stats summary', async ({ page }) => {
    await page.route(GRAPHQL_URL, (route, request) =>
      handleGraphql(route, request, { __me: null }),
    );

    await page.goto(`/profile/${FIXTURE_USERNAME}`);

    // 1 public list · 2 places · 1 visited
    await expect(page.getByText(/1 public list/)).toBeVisible();
    await expect(page.getByText(/2 places/)).toBeVisible();
  });

  test('logged-out user sees the register CTA', async ({ page }) => {
    await page.route(GRAPHQL_URL, (route, request) =>
      handleGraphql(route, request, { __me: null }),
    );

    await page.goto(`/profile/${FIXTURE_USERNAME}`);

    await expect(page.getByRole('link', { name: /Create your list/i })).toBeVisible();
  });

  test('logged-in user does not see the register CTA', async ({ page, context }) => {
    await context.addCookies([
      { name: 'token', value: 'fake_token', url: 'http://localhost:3000' },
    ]);

    await page.route(GRAPHQL_URL, (route, request) =>
      handleGraphql(route, request, {
        __me: { id: '1', documentId: 'doc1', username: 'otheruser', email: 'other@example.com', isPro: false },
      }),
    );

    await page.goto(`/profile/${FIXTURE_USERNAME}`);

    await expect(page.getByRole('heading', { level: 1 })).toContainText(
      `${FIXTURE_USERNAME}'s London Lists`,
    );
    await expect(page.getByRole('link', { name: /Create your list/i })).not.toBeVisible();
  });
});

test.describe('Profile page — not found', () => {
  test('shows "User not found." for an unknown username', async ({ page }) => {
    await page.route(GRAPHQL_URL, (route, request) =>
      handleGraphql(route, request, { __me: null }),
    );

    await page.goto('/profile/unknown-user-xyz');

    await expect(page.getByText('User not found.')).toBeVisible({ timeout: 5000 });
  });

  test('header navigation remains visible on a not-found profile', async ({ page }) => {
    await page.route(GRAPHQL_URL, (route, request) =>
      handleGraphql(route, request, { __me: null }),
    );

    await page.goto('/profile/unknown-user-xyz');

    await expect(page.getByRole('link', { name: /London List/i }).first()).toBeVisible();
    await expect(page.getByRole('banner').getByRole('link', { name: /Explore/i })).toBeVisible();
  });
});
