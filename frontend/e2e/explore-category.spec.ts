import { test, expect } from '@playwright/test';

test.describe('Explore category page', () => {
  test('renders the category heading and a card linking to the list detail page', async ({
    page,
    context,
  }) => {
    await context.clearCookies();

    await page.goto('/explore/museum');

    await expect(
      page.getByRole('heading', { name: 'London Museums Lists', level: 1 }),
    ).toBeVisible({ timeout: 5000 });

    const card = page.getByRole('link', { name: /E2E Fixture List/ });
    await expect(card).toBeVisible();
    await expect(card).toHaveAttribute('href', '/list/e2e-fixture-user/e2e-fixture-list');

    await card.click();

    await expect(page).toHaveURL(/\/list\/e2e-fixture-user\/e2e-fixture-list/, { timeout: 5000 });
    await expect(page.getByRole('heading', { name: 'E2E Fixture List', level: 1 })).toBeVisible({
      timeout: 5000,
    });
  });

  test('unknown category returns the 404 page', async ({ page, context }) => {
    await context.clearCookies();

    await page.goto('/explore/not-a-real-category');

    await expect(page.getByRole('heading', { name: 'Page not found', level: 1 })).toBeVisible({
      timeout: 5000,
    });
    await expect(page.getByRole('link', { name: 'Back to London List' })).toBeVisible();
  });
});
