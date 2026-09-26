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

const makeMockList = (n: number) => ({
  documentId: `list_${n}`,
  name: `List ${n}`,
  description: null,
  isPublic: false,
  viewCount: 0,
  itemCount: 0,
  completedCount: 0,
});

const MOCK_LISTS_AT_LIMIT = [makeMockList(1), makeMockList(2), makeMockList(3)];

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

test.describe('Upgrade modal — my-list page at free limit', () => {
  test.beforeEach(async ({ context, page }) => {
    await context.clearCookies();
    await context.addCookies([
      { name: 'token', value: 'fake_auth_token', url: 'http://localhost:3000' },
    ]);

    await page.route(GRAPHQL_URL, (route, request) =>
      handleGraphql(route, request, {
        __me: MOCK_USER,
        GetMyLists: { myLists: MOCK_LISTS_AT_LIMIT },
      }),
    );
  });

  test('shows 3/3 lists used banner when at free limit', async ({ page }) => {
    await page.goto('/my-list');

    await expect(page.getByText('3/3 lists used')).toBeVisible({ timeout: 5000 });
  });

  test('banner shows "Upgrade now" link to /pricing when at free limit', async ({ page }) => {
    await page.goto('/my-list');

    const upgradeLink = page.getByRole('link', { name: 'Upgrade now' });
    await expect(upgradeLink).toBeVisible({ timeout: 5000 });
    await expect(upgradeLink).toHaveAttribute('href', '/pricing');
  });

  test('shows "+ New list (Pro)" button when at free limit', async ({ page }) => {
    await page.goto('/my-list');

    await expect(
      page.getByRole('button', { name: 'Upgrade to Pro to create more lists' }),
    ).toBeVisible({ timeout: 5000 });
  });

  test('clicking "+ New list (Pro)" opens the upgrade modal', async ({ page }) => {
    await page.goto('/my-list');

    await page.getByRole('button', { name: 'Upgrade to Pro to create more lists' }).click();

    await expect(page.getByRole('dialog')).toBeVisible({ timeout: 3000 });
    await expect(
      page.getByRole('heading', { name: /You.ve hit the free limit/ }),
    ).toBeVisible();
  });

  test('upgrade modal shows Pro benefits list', async ({ page }) => {
    await page.goto('/my-list');
    await page.getByRole('button', { name: 'Upgrade to Pro to create more lists' }).click();

    await expect(page.getByText('Unlimited lists — no cap, ever')).toBeVisible();
    await expect(page.getByText('View counts on all your public lists')).toBeVisible();
    await expect(page.getByText('14-day free trial · Cancel anytime')).toBeVisible();
  });

  test('upgrade modal has "See Pro plans" link pointing to /pricing', async ({ page }) => {
    await page.goto('/my-list');
    await page.getByRole('button', { name: 'Upgrade to Pro to create more lists' }).click();

    const proPlansLink = page.getByRole('link', { name: 'See Pro plans' });
    await expect(proPlansLink).toBeVisible();
    await expect(proPlansLink).toHaveAttribute('href', '/pricing');
  });

  test('"See Pro plans" link navigates to /pricing', async ({ page }) => {
    await page.goto('/my-list');
    await page.getByRole('button', { name: 'Upgrade to Pro to create more lists' }).click();

    await page.getByRole('link', { name: 'See Pro plans' }).click();

    await expect(page).toHaveURL(/\/pricing/, { timeout: 5000 });
  });

  test('"Maybe later" button dismisses the upgrade modal', async ({ page }) => {
    await page.goto('/my-list');
    await page.getByRole('button', { name: 'Upgrade to Pro to create more lists' }).click();

    await expect(page.getByRole('dialog')).toBeVisible();

    await page.getByRole('button', { name: 'Maybe later' }).click();

    await expect(page.getByRole('dialog')).not.toBeVisible();
  });

  test('close button (✕) dismisses the upgrade modal', async ({ page }) => {
    await page.goto('/my-list');
    await page.getByRole('button', { name: 'Upgrade to Pro to create more lists' }).click();

    await expect(page.getByRole('dialog')).toBeVisible();

    await page.getByRole('button', { name: 'Close upgrade modal' }).click();

    await expect(page.getByRole('dialog')).not.toBeVisible();
  });

  test('Escape key dismisses the upgrade modal', async ({ page }) => {
    await page.goto('/my-list');
    await page.getByRole('button', { name: 'Upgrade to Pro to create more lists' }).click();

    await expect(page.getByRole('dialog')).toBeVisible();

    await page.keyboard.press('Escape');

    await expect(page.getByRole('dialog')).not.toBeVisible();
  });

  test('clicking the backdrop dismisses the upgrade modal', async ({ page }) => {
    await page.goto('/my-list');
    await page.getByRole('button', { name: 'Upgrade to Pro to create more lists' }).click();

    await expect(page.getByRole('dialog')).toBeVisible();

    // Click outside the dialog (top-left corner of the overlay)
    await page.mouse.click(10, 10);

    await expect(page.getByRole('dialog')).not.toBeVisible();
  });
});

