import { test, expect } from '@playwright/test';

const PHOTON_MOCK: object = {
  features: [
    {
      type: 'Feature',
      geometry: { type: 'Point', coordinates: [-0.1419, 51.5014] },
      properties: {
        osm_id: 2179645,
        osm_type: 'W',
        name: 'Buckingham Palace',
        street: 'Buckingham Palace Road',
        district: "St. James's",
        city: 'London',
        osm_key: 'tourism',
        osm_value: 'palace',
      },
    },
    {
      type: 'Feature',
      geometry: { type: 'Point', coordinates: [-0.1396, 51.5009] },
      properties: {
        osm_id: 123456,
        osm_type: 'N',
        name: 'Buckingham Gate',
        street: 'Buckingham Gate',
        city: 'London',
        osm_key: 'highway',
        osm_value: 'street',
      },
    },
  ],
};

test.describe('Place search', () => {
  test.beforeEach(async ({ page }) => {
    await page.route('https://photon.komoot.io/api/**', (route) => {
      route.fulfill({ contentType: 'application/json', body: JSON.stringify(PHOTON_MOCK) });
    });
    await page.goto('/');
  });

  test('shows results when the user types a partial name', async ({ page }) => {
    await page.getByPlaceholder('Search for a place in London...').fill('buckingh');
    await expect(page.getByText('Buckingham Palace')).toBeVisible();
    await expect(page.getByText('Buckingham Gate')).toBeVisible();
  });

  test('shows street and district on a separate line from the name', async ({ page }) => {
    await page.getByPlaceholder('Search for a place in London...').fill('buckingh');

    const item = page.locator('li').filter({ hasText: 'Buckingham Palace' });
    const name = item.locator('[class*="resultName"]');
    const subtitle = item.locator('[class*="resultSubtitle"]');

    await expect(name).toHaveText('Buckingham Palace');
    await expect(subtitle).toContainText("St. James's");
    await expect(subtitle).toContainText('London');
  });

  test('shows osm_value as type tag', async ({ page }) => {
    await page.getByPlaceholder('Search for a place in London...').fill('buckingh');

    const item = page.locator('li').filter({ hasText: 'Buckingham Palace' });
    await expect(item.locator('[class*="resultType"]')).toHaveText('palace');
  });

  test('shows no results message when query returns nothing', async ({ page }) => {
    await page.route('https://photon.komoot.io/api/**', (route) => {
      route.fulfill({ contentType: 'application/json', body: JSON.stringify({ features: [] }) });
    });

    await page.getByPlaceholder('Search for a place in London...').fill('zzznomatch');
    await expect(page.getByText(/No places found in London/)).toBeVisible();
  });

  test('does not search with fewer than 3 characters', async ({ page }) => {
    let requestMade = false;
    await page.route('https://photon.komoot.io/api/**', (route) => {
      requestMade = true;
      route.fulfill({ contentType: 'application/json', body: JSON.stringify(PHOTON_MOCK) });
    });

    await page.getByPlaceholder('Search for a place in London...').fill('bu');
    await page.waitForTimeout(600);
    expect(requestMade).toBe(false);
  });
});
