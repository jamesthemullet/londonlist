import { test, expect } from '@playwright/test';

const GRAPHQL_URL = '**/graphql';
const OSM_TILES = 'https://*.tile.openstreetmap.org/**';

test.describe('Leaflet list map', () => {
  test.beforeEach(async ({ page }) => {
    // Return a logged-out user context so the nav doesn't block
    await page.route(GRAPHQL_URL, async (route, request) => {
      const body = request.postDataJSON() as { query?: string } | null;
      if (body?.query?.includes('me {')) {
        await route.fulfill({
          contentType: 'application/json',
          body: JSON.stringify({ data: { me: null } }),
        });
        return;
      }
      await route.continue();
    });

    // Abort tile requests to avoid flaky network calls in CI
    await page.route(OSM_TILES, (route) => route.abort());

    await page.goto('/test/list-map');
  });

  test('renders the map container', async ({ page }) => {
    await expect(page.locator('[aria-label="Map showing list places"]')).toBeVisible({
      timeout: 10000,
    });
  });

  test('renders a pin for each item', async ({ page }) => {
    await expect(page.locator('[aria-label="Map showing list places"]')).toBeVisible({
      timeout: 10000,
    });
    await expect(page.locator('.leaflet-marker-icon')).toHaveCount(2, { timeout: 10000 });
  });

  test('clicking a marker opens a popup with the place name and status', async ({ page }) => {
    await expect(page.locator('[aria-label="Map showing list places"]')).toBeVisible({
      timeout: 10000,
    });
    const markers = page.locator('.leaflet-marker-icon');
    await expect(markers.first()).toBeVisible({ timeout: 10000 });

    await markers.first().click();

    const popup = page.locator('.leaflet-popup-content');
    await expect(popup).toBeVisible({ timeout: 5000 });
    await expect(popup).toContainText(/(Tate Modern|Borough Market)/);
    await expect(popup).toContainText(/(○ To do|✓ Done)/);
  });

  test('shows To do status in popup for the incomplete item', async ({ page }) => {
    await expect(page.locator('[aria-label="Map showing list places"]')).toBeVisible({
      timeout: 10000,
    });
    const markers = page.locator('.leaflet-marker-icon');
    await expect(markers).toHaveCount(2, { timeout: 10000 });

    // Click each marker until we find Tate Modern (the incomplete item)
    for (let i = 0; i < 2; i++) {
      await markers.nth(i).click();
      const popup = page.locator('.leaflet-popup-content');
      await expect(popup).toBeVisible({ timeout: 3000 });
      const text = await popup.textContent();
      if (text?.includes('Tate Modern')) {
        await expect(popup).toContainText('○ To do');
        return;
      }
      await page.keyboard.press('Escape');
      await expect(popup).toBeHidden({ timeout: 3000 });
    }
    throw new Error('Tate Modern marker not found');
  });

  test('shows Done status in popup for the completed item', async ({ page }) => {
    await expect(page.locator('[aria-label="Map showing list places"]')).toBeVisible({
      timeout: 10000,
    });
    const markers = page.locator('.leaflet-marker-icon');
    await expect(markers).toHaveCount(2, { timeout: 10000 });

    // Click each marker until we find Borough Market (the completed item)
    for (let i = 0; i < 2; i++) {
      await markers.nth(i).click();
      const popup = page.locator('.leaflet-popup-content');
      await expect(popup).toBeVisible({ timeout: 3000 });
      const text = await popup.textContent();
      if (text?.includes('Borough Market')) {
        await expect(popup).toContainText('✓ Done');
        return;
      }
      await page.keyboard.press('Escape');
      await expect(popup).toBeHidden({ timeout: 3000 });
    }
    throw new Error('Borough Market marker not found');
  });
});
