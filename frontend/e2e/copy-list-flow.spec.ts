import { test, expect } from '@playwright/test';
import type { Route, Request as PlaywrightRequest } from '@playwright/test';

const GRAPHQL_URL = '**/graphql';

const MOCK_USER = {
  id: '1',
  documentId: 'doc_abc123',
  username: 'newuser',
  email: 'newuser@example.com',
  isPro: false,
};

const MOCK_LIST = {
  __typename: 'ListEntity',
  documentId: 'list_abc123',
  name: 'My List',
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

test.describe('Copy-list registration flow — banner display', () => {
  test.beforeEach(async ({ context }) => {
    await context.clearCookies();
  });

  test('shows copy-list context banner when accessed with ref=copy-list query params', async ({ page }) => {
    await page.goto('/register?ref=copy-list&srcUsername=alice&srcListId=list_xyz');

    const banner = page.getByRole('complementary', { name: 'Copy list context' });
    await expect(banner).toBeVisible({ timeout: 5000 });
    await expect(banner).toContainText("You're copying alice's London list");
    await expect(banner).toContainText("Sign up free and it'll be added to your account automatically.");
  });

  test('banner shows the correct source username', async ({ page }) => {
    await page.goto('/register?ref=copy-list&srcUsername=london_explorer&srcListId=list_xyz');

    await expect(
      page.getByRole('complementary', { name: 'Copy list context' }),
    ).toContainText("You're copying london_explorer's London list");
  });

  test('does NOT show copy-list banner on plain /register', async ({ page }) => {
    await page.goto('/register');

    await expect(
      page.getByRole('complementary', { name: 'Copy list context' }),
    ).not.toBeVisible();
  });

  test('does NOT show copy-list banner when ref is present but srcUsername is missing', async ({ page }) => {
    await page.goto('/register?ref=copy-list&srcListId=list_xyz');

    await expect(
      page.getByRole('complementary', { name: 'Copy list context' }),
    ).not.toBeVisible();
  });

  test('register form is still visible alongside the copy-list banner', async ({ page }) => {
    await page.goto('/register?ref=copy-list&srcUsername=alice&srcListId=list_xyz');

    await expect(page.getByLabel('Username')).toBeVisible();
    await expect(page.getByLabel('Email')).toBeVisible();
    await expect(page.getByLabel('Password')).toBeVisible();
  });
});

test.describe('Copy-list registration flow — happy path', () => {
  test.beforeEach(async ({ context }) => {
    await context.clearCookies();
  });

  test('registers and calls CopyPublicList mutation, then redirects to /my-list', async ({ page }) => {
    const copyMutationCalls: unknown[] = [];

    await page.route(GRAPHQL_URL, async (route, request) => {
      const body = request.postDataJSON() as { operationName?: string } | null;
      if (body?.operationName === 'CopyPublicList') {
        copyMutationCalls.push(body);
        await route.fulfill({
          contentType: 'application/json',
          body: JSON.stringify({ data: { copyPublicList: { documentId: 'new_list_id' } } }),
        });
        return;
      }
      await handleGraphql(route, request, {
        Register: { register: { jwt: 'fake_jwt_token', user: MOCK_USER } },
        GetMyLists: { myLists: [MOCK_LIST] },
      });
    });

    await page.goto('/register?ref=copy-list&srcUsername=alice&srcListId=list_xyz');

    await page.getByLabel('Username').fill('newuser');
    await page.getByLabel('Email').fill('newuser@example.com');
    await page.getByLabel('Password').fill('securepass123');
    await page.locator('#main-content').getByRole('button', { name: 'Sign Up' }).click();

    await expect(page).toHaveURL(/\/my-list/, { timeout: 5000 });
    expect(copyMutationCalls.length).toBe(1);
  });

  test('redirects to /my-list even when CopyPublicList mutation fails', async ({ page }) => {
    await page.route(GRAPHQL_URL, async (route, request) => {
      const body = request.postDataJSON() as { operationName?: string } | null;
      if (body?.operationName === 'CopyPublicList') {
        await route.fulfill({
          contentType: 'application/json',
          body: JSON.stringify({ errors: [{ message: 'Source list not found' }] }),
        });
        return;
      }
      await handleGraphql(route, request, {
        Register: { register: { jwt: 'fake_jwt_token', user: MOCK_USER } },
        GetMyLists: { myLists: [MOCK_LIST] },
      });
    });

    await page.goto('/register?ref=copy-list&srcUsername=alice&srcListId=list_xyz');

    await page.getByLabel('Username').fill('newuser');
    await page.getByLabel('Email').fill('newuser@example.com');
    await page.getByLabel('Password').fill('securepass123');
    await page.locator('#main-content').getByRole('button', { name: 'Sign Up' }).click();

    await expect(page).toHaveURL(/\/my-list/, { timeout: 5000 });
  });

  test('does NOT call CopyPublicList mutation on plain registration', async ({ page }) => {
    const copyMutationCalls: unknown[] = [];

    await page.route(GRAPHQL_URL, async (route, request) => {
      const body = request.postDataJSON() as { operationName?: string } | null;
      if (body?.operationName === 'CopyPublicList') {
        copyMutationCalls.push(body);
        await route.fulfill({
          contentType: 'application/json',
          body: JSON.stringify({ data: { copyPublicList: { documentId: 'new_list_id' } } }),
        });
        return;
      }
      await handleGraphql(route, request, {
        Register: { register: { jwt: 'fake_jwt_token', user: MOCK_USER } },
        GetMyLists: { myLists: [MOCK_LIST] },
      });
    });

    await page.goto('/register');

    await page.getByLabel('Username').fill('newuser');
    await page.getByLabel('Email').fill('newuser@example.com');
    await page.getByLabel('Password').fill('securepass123');
    await page.locator('#main-content').getByRole('button', { name: 'Sign Up' }).click();

    await expect(page).toHaveURL(/\/my-list/, { timeout: 5000 });
    expect(copyMutationCalls.length).toBe(0);
  });
});
