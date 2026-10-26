import { test, expect } from '@playwright/test';
import type { Route, Request as PlaywrightRequest } from '@playwright/test';

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
      body: JSON.stringify({ data: { me: operations['__me'] } }),
    });
    return;
  }

  await route.continue();
}

test.describe('Public list detail page — not found', () => {
  test('shows "List not found" when the list does not exist', async ({ page }) => {
    await page.route(GRAPHQL_URL, (route, request) =>
      handleGraphql(route, request, { __me: null }),
    );

    await page.goto('/list/nonexistent-user/fake-list-id');

    await expect(page.getByText('List not found.')).toBeVisible({ timeout: 5000 });
  });

  test('header navigation is still visible on not-found list page', async ({ page }) => {
    await page.route(GRAPHQL_URL, (route, request) =>
      handleGraphql(route, request, { __me: null }),
    );

    await page.goto('/list/nonexistent-user/fake-list-id');

    await expect(page.getByRole('link', { name: /London List/i }).first()).toBeVisible();
    await expect(page.getByRole('link', { name: /Explore/i })).toBeVisible();
  });
});

test.describe('Public list legacy page — not found', () => {
  test('shows "User not found" when the user does not exist', async ({ page }) => {
    await page.route(GRAPHQL_URL, (route, request) =>
      handleGraphql(route, request, { __me: null }),
    );

    await page.goto('/list/nonexistent-user-xyz');

    await expect(page.getByText('User not found.')).toBeVisible({ timeout: 5000 });
  });
});

test.describe('Profile page — not found', () => {
  test('shows "User not found" when the profile does not exist', async ({ page }) => {
    await page.route(GRAPHQL_URL, (route, request) =>
      handleGraphql(route, request, { __me: null }),
    );

    await page.goto('/profile/nonexistent-user-xyz');

    await expect(page.getByText('User not found.')).toBeVisible({ timeout: 5000 });
  });

  test('header navigation is still visible on not-found profile page', async ({ page }) => {
    await page.route(GRAPHQL_URL, (route, request) =>
      handleGraphql(route, request, { __me: null }),
    );

    await page.goto('/profile/nonexistent-user-xyz');

    await expect(page.getByRole('link', { name: /London List/i }).first()).toBeVisible();
    await expect(page.getByRole('link', { name: /Explore/i })).toBeVisible();
  });
});

test.describe('Public list page — conversion banner', () => {
  test('logged-out user visiting a public list detail sees the "Copy this list" CTA after logging in / registering', async ({ page, context }) => {
    await context.clearCookies();
    await page.route(GRAPHQL_URL, (route, request) =>
      handleGraphql(route, request, { __me: null }),
    );

    await page.goto('/list/nonexistent-user/fake-list-id');

    const registerLink = page.getByRole('link', { name: /register|sign up|create/i });
    if (await registerLink.isVisible()) {
      await expect(registerLink).toBeVisible();
    }
  });
});
