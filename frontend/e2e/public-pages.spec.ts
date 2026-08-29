import { test, expect } from '@playwright/test';

test.describe('Homepage — logged-out view', () => {
  test('renders hero heading and primary CTA', async ({ page }) => {
    await page.goto('/');

    await expect(page.getByRole('heading', { level: 1 })).toContainText(
      'Your London bucket list, beautifully organised',
    );
    await expect(page.getByRole('link', { name: 'Create your free list' })).toBeVisible();
  });

  test('shows feature cards', async ({ page }) => {
    await page.goto('/');

    const features = page.getByRole('region', { name: 'Features' });
    await expect(features).toBeVisible();
    await expect(features.getByRole('heading', { name: 'Discover London' })).toBeVisible();
    await expect(features.getByRole('heading', { name: 'Track your visits' })).toBeVisible();
    await expect(features.getByRole('heading', { name: 'Share with friends' })).toBeVisible();
  });

  test('"Create your free list" navigates to /register', async ({ page }) => {
    await page.goto('/');

    await page.getByRole('link', { name: 'Create your free list' }).click();

    await expect(page).toHaveURL(/\/register/);
  });
});

test.describe('Register page', () => {
  test('renders sign-up heading and all form fields', async ({ page }) => {
    await page.goto('/register');

    await expect(page.getByRole('heading', { name: 'Sign Up' })).toBeVisible();
    await expect(page.getByLabel('Username')).toBeVisible();
    await expect(page.getByLabel('Email')).toBeVisible();
    await expect(page.getByLabel('Password')).toBeVisible();
    // Scope to #main-content to avoid matching the nav's "Sign Up" button
    await expect(page.locator('#main-content').getByRole('button', { name: 'Sign Up' })).toBeVisible();
  });

  test('submit button is disabled when all fields are empty', async ({ page }) => {
    await page.goto('/register');

    await expect(page.locator('#main-content').getByRole('button', { name: 'Sign Up' })).toBeDisabled();
  });

  test('submit button remains disabled with only a valid email', async ({ page }) => {
    await page.goto('/register');

    await page.getByLabel('Email').fill('user@example.com');

    await expect(page.locator('#main-content').getByRole('button', { name: 'Sign Up' })).toBeDisabled();
  });

  test('submit button remains disabled with a password shorter than 8 characters', async ({ page }) => {
    await page.goto('/register');

    await page.getByLabel('Username').fill('testuser');
    await page.getByLabel('Email').fill('user@example.com');
    await page.getByLabel('Password').fill('short');

    await expect(page.locator('#main-content').getByRole('button', { name: 'Sign Up' })).toBeDisabled();
  });

  test('submit button enables when username, email, and password are all valid', async ({ page }) => {
    await page.goto('/register');

    await page.getByLabel('Username').fill('testuser');
    await page.getByLabel('Email').fill('user@example.com');
    await page.getByLabel('Password').fill('securepassword123');

    await expect(page.locator('#main-content').getByRole('button', { name: 'Sign Up' })).toBeEnabled();
  });

  test('submit button remains disabled with an invalid username (too short)', async ({ page }) => {
    await page.goto('/register');

    await page.getByLabel('Username').fill('ab');
    await page.getByLabel('Email').fill('user@example.com');
    await page.getByLabel('Password').fill('securepassword123');

    await expect(page.locator('#main-content').getByRole('button', { name: 'Sign Up' })).toBeDisabled();
  });

  test('shows username hint about character rules', async ({ page }) => {
    await page.goto('/register');

    await expect(
      page.getByText('3–20 characters: letters, numbers, underscores, hyphens.'),
    ).toBeVisible();
  });
});

test.describe('Explore page', () => {
  test('renders heading and search input', async ({ page }) => {
    await page.goto('/explore');

    await expect(
      page.getByRole('heading', { level: 1, name: 'Explore London Lists' }),
    ).toBeVisible();
    await expect(page.getByRole('searchbox', { name: 'Search lists' })).toBeVisible();
  });

  test('shows a call-to-action to create a list for logged-out users', async ({ page, context }) => {
    await context.clearCookies();
    await page.goto('/explore');

    await expect(page.getByRole('link', { name: /Build your own list/i })).toBeVisible();
  });

  test('search input shows no-match message for an unrecognised term', async ({ page }) => {
    await page.goto('/explore');

    const searchInput = page.getByRole('searchbox', { name: 'Search lists' });
    await searchInput.fill('zzz_no_match_zzz_unique');

    await expect(page.getByText('No lists match your filters.')).toBeVisible();
  });
});

test.describe('Pricing page', () => {
  test('renders the main pricing heading', async ({ page }) => {
    await page.goto('/pricing');

    await expect(
      page.getByRole('heading', { level: 1, name: 'Simple, honest pricing' }),
    ).toBeVisible();
  });

  test('shows Free and Pro tier headings', async ({ page }) => {
    await page.goto('/pricing');

    await expect(page.getByRole('heading', { name: 'Free' })).toBeVisible();
    await expect(page.getByRole('heading', { name: 'Pro' })).toBeVisible();
  });
});

test.describe('Site navigation', () => {
  test('Explore link in header navigates to /explore', async ({ page }) => {
    await page.goto('/');

    await page.getByRole('banner').getByRole('link', { name: 'Explore' }).click();

    await expect(page).toHaveURL(/\/explore/);
  });
});
