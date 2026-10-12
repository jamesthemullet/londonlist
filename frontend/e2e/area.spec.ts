import { test, expect } from '@playwright/test';

test.describe('Area index page', () => {
  test('renders the main heading', async ({ page }) => {
    await page.goto('/area');

    await expect(
      page.getByRole('heading', { level: 1, name: 'Browse London by Area' }),
    ).toBeVisible();
  });

  test('shows the subheading description', async ({ page }) => {
    await page.goto('/area');

    await expect(
      page.getByText(/Explore places across London/i),
    ).toBeVisible();
  });

  test('has a breadcrumb link back to Explore', async ({ page }) => {
    await page.goto('/area');

    const breadcrumb = page.getByRole('navigation', { name: 'Breadcrumb' });
    const exploreLink = breadcrumb.getByRole('link', { name: 'Explore' });
    await expect(exploreLink).toBeVisible();
    await expect(exploreLink).toHaveAttribute('href', '/explore');
  });

  test('shows the London areas grid with named area cards', async ({ page }) => {
    await page.goto('/area');

    const grid = page.getByRole('list', { name: 'London areas' });
    await expect(grid).toBeVisible();
    await expect(grid.getByRole('link', { name: /Bloomsbury/i })).toBeVisible();
    await expect(grid.getByRole('link', { name: /Camden/i })).toBeVisible();
    await expect(grid.getByRole('link', { name: /Shoreditch/i })).toBeVisible();
    await expect(grid.getByRole('link', { name: /South Bank/i })).toBeVisible();
  });

  test('area card links point to the correct slugged URLs', async ({ page }) => {
    await page.goto('/area');

    const bloomsburyLink = page
      .getByRole('list', { name: 'London areas' })
      .getByRole('link', { name: /Bloomsbury/i });
    await expect(bloomsburyLink).toHaveAttribute('href', '/area/bloomsbury');

    const southBankLink = page
      .getByRole('list', { name: 'London areas' })
      .getByRole('link', { name: /South Bank/i });
    await expect(southBankLink).toHaveAttribute('href', '/area/south-bank');
  });

  test('shows registration CTA for logged-out users', async ({ page, context }) => {
    await context.clearCookies();
    await page.goto('/area');

    await expect(
      page.getByRole('link', { name: /Build your own London list/i }),
    ).toBeVisible();
  });

  test('clicking an area card navigates to its detail page', async ({ page }) => {
    await page.goto('/area');

    await page
      .getByRole('list', { name: 'London areas' })
      .getByRole('link', { name: /Bloomsbury/i })
      .click();

    await expect(page).toHaveURL('/area/bloomsbury');
  });
});

test.describe('Area detail page', () => {
  test('renders the area heading', async ({ page }) => {
    await page.goto('/area/bloomsbury');

    await expect(
      page.getByRole('heading', { level: 1, name: 'Places in Bloomsbury' }),
    ).toBeVisible();
  });

  test('shows area description in the subheading', async ({ page }) => {
    await page.goto('/area/bloomsbury');

    await expect(page.getByText(/Museums, bookshops/i)).toBeVisible();
  });

  test('has a full breadcrumb hierarchy', async ({ page }) => {
    await page.goto('/area/bloomsbury');

    const breadcrumb = page.getByRole('navigation', { name: 'Breadcrumb' });
    await expect(breadcrumb.getByRole('link', { name: 'Explore' })).toBeVisible();
    await expect(breadcrumb.getByRole('link', { name: 'Browse by area' })).toBeVisible();
    await expect(breadcrumb.getByText('Bloomsbury')).toBeVisible();
  });

  test('shows the empty state when no places are available', async ({ page }) => {
    await page.goto('/area/bloomsbury');

    await expect(page.getByText('No places saved in Bloomsbury yet.')).toBeVisible();
  });

  test('empty state includes a registration prompt', async ({ page }) => {
    await page.goto('/area/bloomsbury');

    await expect(
      page.getByRole('link', { name: /Be the first to add places here/i }),
    ).toBeVisible();
  });

  test('has navigation links back to areas list and explore', async ({ page }) => {
    await page.goto('/area/bloomsbury');

    await expect(
      page.getByRole('link', { name: /All London areas/i }),
    ).toBeVisible();
    await expect(
      page.getByRole('link', { name: /Browse all public lists/i }),
    ).toBeVisible();
  });

  test('shows registration CTA banner for logged-out users', async ({ page, context }) => {
    await context.clearCookies();
    await page.goto('/area/bloomsbury');

    await expect(
      page.getByRole('link', { name: /Add it to your London list/i }),
    ).toBeVisible();
  });

  test('works with multi-word area slugs', async ({ page }) => {
    await page.goto('/area/south-bank');

    await expect(
      page.getByRole('heading', { level: 1, name: 'Places in South Bank' }),
    ).toBeVisible();
  });

  test('works with space-in-name areas like Covent Garden', async ({ page }) => {
    await page.goto('/area/covent-garden');

    await expect(
      page.getByRole('heading', { level: 1, name: 'Places in Covent Garden' }),
    ).toBeVisible();
  });

  test('returns 404 for an unknown area slug', async ({ page }) => {
    const response = await page.goto('/area/made-up-place-xyz');

    expect(response?.status()).toBe(404);
  });
});
