import { test, expect } from '@playwright/test';

test.describe('Explore category page', () => {
  test('renders the category heading and a list card linking to the list detail page', async ({
    page,
    context,
  }) => {
    await context.clearCookies();

    await page.goto('/explore/museum');

    await expect(
      page.getByRole('heading', { name: 'London Museums Lists', level: 1 }),
    ).toBeVisible({ timeout: 5000 });

    const listCard = page.getByRole('link', { name: /E2E Fixture List/ });
    await expect(listCard).toBeVisible();
    await expect(listCard).toHaveAttribute('href', '/list/e2e-fixture-user/e2e-fixture-list');
  });

  test('unknown category returns the 404 page', async ({ page, context }) => {
    await context.clearCookies();

    const response = await page.goto('/explore/not-a-real-category-xyz');

    expect(response?.status()).toBe(404);
    await expect(
      page.getByRole('heading', { name: 'Page not found', level: 1 }),
    ).toBeVisible({ timeout: 5000 });
  });
});
