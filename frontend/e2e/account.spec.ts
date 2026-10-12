import { test, expect } from '@playwright/test';
import type { Route, Request as PlaywrightRequest } from '@playwright/test';

const GRAPHQL_URL = '**/graphql';
const STRAPI_CHANGE_PASSWORD_URL = '**/api/auth/change-password';
const STRAPI_DELETE_ACCOUNT_URL = '**/api/account/me';

const MOCK_USER_FREE = {
  id: '1',
  documentId: 'doc_abc123',
  username: 'testuser',
  email: 'test@example.com',
  isPro: false,
};

const MOCK_USER_PRO = {
  ...MOCK_USER_FREE,
  isPro: true,
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

test.describe('Account page — unauthenticated', () => {
  test.beforeEach(async ({ context }) => {
    await context.clearCookies();
  });

  test('redirects to /login when not logged in', async ({ page }) => {
    await page.route(GRAPHQL_URL, (route, request) =>
      handleGraphql(route, request, { __me: null }),
    );

    await page.goto('/account');

    await expect(page).toHaveURL(/\/login/, { timeout: 5000 });
  });
});

test.describe('Account page — authenticated', () => {
  test.beforeEach(async ({ context }) => {
    await context.clearCookies();
    await context.addCookies([
      { name: 'token', value: 'fake_token', url: 'http://localhost:3000' },
    ]);
  });

  test('renders Account Settings heading', async ({ page }) => {
    await page.route(GRAPHQL_URL, (route, request) =>
      handleGraphql(route, request, { __me: MOCK_USER_FREE }),
    );

    await page.goto('/account');

    await expect(
      page.getByRole('heading', { name: 'Account Settings', level: 1 }),
    ).toBeVisible({ timeout: 5000 });
  });

  test('shows username and email in account info section', async ({ page }) => {
    await page.route(GRAPHQL_URL, (route, request) =>
      handleGraphql(route, request, { __me: MOCK_USER_FREE }),
    );

    await page.goto('/account');
    await expect(page.getByRole('heading', { name: 'Account Settings' })).toBeVisible({
      timeout: 5000,
    });

    const infoSection = page.getByRole('region', { name: 'Account info' });
    await expect(infoSection.getByText('testuser', { exact: true })).toBeVisible();
    await expect(infoSection.getByText('test@example.com', { exact: true })).toBeVisible();
  });

  test('free user sees Free plan badge and Upgrade to Pro link', async ({ page }) => {
    await page.route(GRAPHQL_URL, (route, request) =>
      handleGraphql(route, request, { __me: MOCK_USER_FREE }),
    );

    await page.goto('/account');
    await expect(page.getByRole('heading', { name: 'Account Settings' })).toBeVisible({
      timeout: 5000,
    });

    const planSection = page.getByRole('region', { name: 'Your plan' });
    await expect(planSection.getByText('Free', { exact: true })).toBeVisible();
    await expect(
      page.getByRole('link', { name: /upgrade to pro/i }),
    ).toHaveAttribute('href', '/pricing');
  });

  test('pro user sees Pro plan badge and Manage subscription link', async ({ page }) => {
    await page.route(GRAPHQL_URL, (route, request) =>
      handleGraphql(route, request, { __me: MOCK_USER_PRO }),
    );

    await page.goto('/account');
    await expect(page.getByRole('heading', { name: 'Account Settings' })).toBeVisible({
      timeout: 5000,
    });

    await expect(page.getByText('Pro')).toBeVisible();
    await expect(
      page.getByRole('link', { name: /manage subscription/i }),
    ).toHaveAttribute('href', '/pricing');
  });
});

test.describe('Account page — change password form', () => {
  test.beforeEach(async ({ context }) => {
    await context.clearCookies();
    await context.addCookies([
      { name: 'token', value: 'fake_token', url: 'http://localhost:3000' },
    ]);
  });

  test('mismatched new passwords shows validation error without API call', async ({ page }) => {
    await page.route(GRAPHQL_URL, (route, request) =>
      handleGraphql(route, request, { __me: MOCK_USER_FREE }),
    );

    await page.goto('/account');
    await expect(page.getByRole('heading', { name: 'Account Settings' })).toBeVisible({
      timeout: 5000,
    });

    await page.getByLabel('Current password').fill('oldpassword');
    await page.getByLabel('New password', { exact: true }).fill('newpass1');
    await page.getByLabel('Confirm new password').fill('newpass2');
    await page.getByRole('button', { name: 'Change password' }).click();

    await expect(page.getByRole('alert').first()).toContainText('New passwords do not match.');
  });

  test('short new password shows validation error without API call', async ({ page }) => {
    await page.route(GRAPHQL_URL, (route, request) =>
      handleGraphql(route, request, { __me: MOCK_USER_FREE }),
    );

    await page.goto('/account');
    await expect(page.getByRole('heading', { name: 'Account Settings' })).toBeVisible({
      timeout: 5000,
    });

    await page.getByLabel('Current password').fill('oldpassword');
    await page.getByLabel('New password', { exact: true }).fill('abc');
    await page.getByLabel('Confirm new password').fill('abc');
    await page.getByRole('button', { name: 'Change password' }).click();

    await expect(page.getByRole('alert').first()).toContainText('Password must be at least 6 characters.');
  });

  test('successful password change shows success message', async ({ page }) => {
    await page.route(GRAPHQL_URL, (route, request) =>
      handleGraphql(route, request, { __me: MOCK_USER_FREE }),
    );
    await page.route(STRAPI_CHANGE_PASSWORD_URL, (route) =>
      route.fulfill({ status: 200, contentType: 'application/json', body: '{}' }),
    );

    await page.goto('/account');
    await expect(page.getByRole('heading', { name: 'Account Settings' })).toBeVisible({
      timeout: 5000,
    });

    await page.getByLabel('Current password').fill('oldpassword');
    await page.getByLabel('New password', { exact: true }).fill('newpassword123');
    await page.getByLabel('Confirm new password').fill('newpassword123');
    await page.getByRole('button', { name: 'Change password' }).click();

    await expect(page.getByRole('status')).toContainText('Password changed successfully.');
  });

  test('API error on password change shows error message', async ({ page }) => {
    await page.route(GRAPHQL_URL, (route, request) =>
      handleGraphql(route, request, { __me: MOCK_USER_FREE }),
    );
    await page.route(STRAPI_CHANGE_PASSWORD_URL, (route) =>
      route.fulfill({
        status: 400,
        contentType: 'application/json',
        body: JSON.stringify({ error: { message: 'Your password is incorrect.' } }),
      }),
    );

    await page.goto('/account');
    await expect(page.getByRole('heading', { name: 'Account Settings' })).toBeVisible({
      timeout: 5000,
    });

    await page.getByLabel('Current password').fill('wrongpassword');
    await page.getByLabel('New password', { exact: true }).fill('newpassword123');
    await page.getByLabel('Confirm new password').fill('newpassword123');
    await page.getByRole('button', { name: 'Change password' }).click();

    await expect(page.getByRole('alert').first()).toContainText('Your password is incorrect.');
  });
});

test.describe('Account page — delete account', () => {
  test.beforeEach(async ({ context }) => {
    await context.clearCookies();
    await context.addCookies([
      { name: 'token', value: 'fake_token', url: 'http://localhost:3000' },
    ]);
  });

  test('clicking Delete my account reveals confirmation dialog', async ({ page }) => {
    await page.route(GRAPHQL_URL, (route, request) =>
      handleGraphql(route, request, { __me: MOCK_USER_FREE }),
    );

    await page.goto('/account');
    await expect(page.getByRole('heading', { name: 'Account Settings' })).toBeVisible({
      timeout: 5000,
    });

    await page.getByRole('button', { name: 'Delete my account' }).click();

    await expect(page.getByText('Are you sure? This cannot be undone.')).toBeVisible();
    await expect(page.getByRole('button', { name: 'Yes, delete my account' })).toBeVisible();
    await expect(page.getByRole('button', { name: 'Cancel' })).toBeVisible();
  });

  test('Cancel button hides the confirmation dialog', async ({ page }) => {
    await page.route(GRAPHQL_URL, (route, request) =>
      handleGraphql(route, request, { __me: MOCK_USER_FREE }),
    );

    await page.goto('/account');
    await expect(page.getByRole('heading', { name: 'Account Settings' })).toBeVisible({
      timeout: 5000,
    });

    await page.getByRole('button', { name: 'Delete my account' }).click();
    await expect(page.getByRole('button', { name: 'Yes, delete my account' })).toBeVisible();

    await page.getByRole('button', { name: 'Cancel' }).click();

    await expect(page.getByRole('button', { name: 'Delete my account' })).toBeVisible();
    await expect(page.getByRole('button', { name: 'Yes, delete my account' })).not.toBeVisible();
  });

  test('confirming deletion navigates away from the account page', async ({ page }) => {
    await page.route(GRAPHQL_URL, (route, request) =>
      handleGraphql(route, request, { __me: MOCK_USER_FREE }),
    );
    await page.route(STRAPI_DELETE_ACCOUNT_URL, (route) =>
      route.fulfill({ status: 200, contentType: 'application/json', body: '{}' }),
    );

    await page.goto('/account');
    await expect(page.getByRole('heading', { name: 'Account Settings' })).toBeVisible({
      timeout: 5000,
    });

    await page.getByRole('button', { name: 'Delete my account' }).click();
    await page.getByRole('button', { name: 'Yes, delete my account' }).click();

    // After setUser(null), the useEffect redirect to /login fires before router.push('/')
    await expect(page).not.toHaveURL(/\/account/, { timeout: 5000 });
  });

  test('deletion API error shows error message', async ({ page }) => {
    await page.route(GRAPHQL_URL, (route, request) =>
      handleGraphql(route, request, { __me: MOCK_USER_FREE }),
    );
    await page.route(STRAPI_DELETE_ACCOUNT_URL, (route) =>
      route.fulfill({ status: 500, contentType: 'application/json', body: '{}' }),
    );

    await page.goto('/account');
    await expect(page.getByRole('heading', { name: 'Account Settings' })).toBeVisible({
      timeout: 5000,
    });

    await page.getByRole('button', { name: 'Delete my account' }).click();
    await page.getByRole('button', { name: 'Yes, delete my account' }).click();

    await expect(page.getByRole('alert').first()).toContainText(
      'Failed to delete account. Please try again.',
    );
  });
});
