import { test, expect } from '@playwright/test';

test.describe('Explore page search', () => {
  test('searching a known term shows matching results that navigate to the result', async ({
    page,
  }) => {
    await page.goto('/explore');

    const searchInput = page.getByRole('searchbox', { name: 'Search lists' });
    await searchInput.fill('E2E Fixture List');

    const resultLink = page.getByRole('link', { name: /E2E Fixture List/ });
    await expect(resultLink).toBeVisible();
    await expect(page.getByText('No lists match your filters.')).toHaveCount(0);

    await resultLink.click();

    await expect(page).toHaveURL('/list/e2e-fixture-user/e2e-fixture-list');
  });
});
