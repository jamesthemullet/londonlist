import { test, expect } from '@playwright/test';

test.describe('Authentication guard', () => {
  test('redirects unauthenticated users from /my-list to /login', async ({ page, context }) => {
    // Ensure no auth cookie is present
    await context.clearCookies();

    await page.goto('/my-list');

    // The AppContext resolves with no user (no token cookie → no GraphQL call)
    // and my-list.tsx redirects to /login once initialized
    await expect(page).toHaveURL(/\/login/, { timeout: 5000 });
  });

  test('login page renders email and password fields', async ({ page }) => {
    await page.goto('/login');

    await expect(page.getByLabel('Email')).toBeVisible();
    await expect(page.getByLabel('Password')).toBeVisible();
    await expect(page.getByRole('button', { name: 'Login' })).toBeVisible();
  });

  test('login submit button is disabled when email is empty', async ({ page }) => {
    await page.goto('/login');

    // Button is disabled while email field is empty / invalid
    await expect(page.getByRole('button', { name: 'Login' })).toBeDisabled();
  });

  test('login submit button becomes enabled once a valid email is entered', async ({ page }) => {
    await page.goto('/login');

    await page.getByLabel('Email').fill('test@example.com');

    await expect(page.getByRole('button', { name: 'Login' })).toBeEnabled();
  });
});
