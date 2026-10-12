import { test, expect } from '@playwright/test';
import type { Route, Request as PlaywrightRequest } from '@playwright/test';

const GRAPHQL_URL = '**/graphql';

// First template from lib/templates.ts used as a stable fixture
const FIRST_TEMPLATE_ID = 'london-weekend-icons';
const FIRST_TEMPLATE_NAME = 'London Weekend Icons';

const MOCK_USER = {
  id: '1',
  documentId: 'doc_abc123',
  username: 'testuser',
  email: 'test@example.com',
  isPro: false,
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

test.describe('Templates index page', () => {
  test.beforeEach(async ({ context }) => {
    await context.clearCookies();
  });

  test('renders the Starter Lists heading', async ({ page }) => {
    await page.goto('/templates');

    await expect(page.getByRole('heading', { name: 'Starter Lists', level: 1 })).toBeVisible({
      timeout: 5000,
    });
  });

  test('shows at least one template card', async ({ page }) => {
    await page.goto('/templates');

    await expect(
      page.getByRole('article', { name: FIRST_TEMPLATE_NAME }),
    ).toBeVisible({ timeout: 5000 });
  });

  test('logged-out user sees sign-up CTA on each card, not a copy button', async ({ page }) => {
    await page.route(GRAPHQL_URL, (route, request) =>
      handleGraphql(route, request, { __me: null }),
    );

    await page.goto('/templates');
    await expect(
      page.getByRole('article', { name: FIRST_TEMPLATE_NAME }),
    ).toBeVisible({ timeout: 5000 });

    const card = page.getByRole('article', { name: FIRST_TEMPLATE_NAME });
    await expect(card.getByRole('link', { name: /sign up to copy this list/i })).toBeVisible();
    await expect(card.getByRole('button', { name: /copy/i })).not.toBeVisible();
  });

  test('sign-up CTA links to /register', async ({ page }) => {
    await page.route(GRAPHQL_URL, (route, request) =>
      handleGraphql(route, request, { __me: null }),
    );

    await page.goto('/templates');
    const card = page.getByRole('article', { name: FIRST_TEMPLATE_NAME });
    await expect(card).toBeVisible({ timeout: 5000 });

    const ctaLink = card.getByRole('link', { name: /sign up to copy this list/i });
    await expect(ctaLink).toHaveAttribute('href', /\/register/);
  });

  test('template card title links to the detail page', async ({ page }) => {
    await page.goto('/templates');
    await expect(
      page.getByRole('article', { name: FIRST_TEMPLATE_NAME }),
    ).toBeVisible({ timeout: 5000 });

    const card = page.getByRole('article', { name: FIRST_TEMPLATE_NAME });
    const titleLink = card.getByRole('link', { name: FIRST_TEMPLATE_NAME });
    await expect(titleLink).toHaveAttribute('href', `/templates/${FIRST_TEMPLATE_ID}`);
  });

  test('logged-in user sees copy button instead of sign-up CTA', async ({ page }) => {
    await page.route(GRAPHQL_URL, (route, request) =>
      handleGraphql(route, request, { __me: MOCK_USER }),
    );
    await page.context().addCookies([
      { name: 'token', value: 'fake_token', url: 'http://localhost:3000' },
    ]);

    await page.goto('/templates');
    const card = page.getByRole('article', { name: FIRST_TEMPLATE_NAME });
    await expect(card).toBeVisible({ timeout: 5000 });

    await expect(card.getByRole('button', { name: /\+ copy to my lists/i })).toBeVisible();
    await expect(card.getByRole('link', { name: /sign up/i })).not.toBeVisible();
  });

  test('logged-in user can copy a template and sees success state', async ({ page }) => {
    await page.route(GRAPHQL_URL, (route, request) =>
      handleGraphql(route, request, {
        __me: MOCK_USER,
        TemplatesCreateMyList: { createMyList: { documentId: 'new-list-1' } },
        TemplatesCreateListItem: { createListItem: { documentId: 'new-item-1' } },
      }),
    );
    await page.context().addCookies([
      { name: 'token', value: 'fake_token', url: 'http://localhost:3000' },
    ]);

    await page.goto('/templates');
    const card = page.getByRole('article', { name: FIRST_TEMPLATE_NAME });
    await expect(card).toBeVisible({ timeout: 5000 });

    await card.getByRole('button', { name: /\+ copy to my lists/i }).click();

    await expect(card.getByText(/copied!/i)).toBeVisible({ timeout: 5000 });
    await expect(
      card.getByRole('link', { name: /view your lists/i }),
    ).toHaveAttribute('href', '/my-list');
  });
});

test.describe('Template detail page', () => {
  test.beforeEach(async ({ context }) => {
    await context.clearCookies();
  });

  test('renders the template name as a heading', async ({ page }) => {
    await page.goto(`/templates/${FIRST_TEMPLATE_ID}`);

    await expect(
      page.getByRole('heading', { name: FIRST_TEMPLATE_NAME, level: 1 }),
    ).toBeVisible({ timeout: 5000 });
  });

  test('shows the full place list', async ({ page }) => {
    await page.goto(`/templates/${FIRST_TEMPLATE_ID}`);

    await expect(page.getByRole('list', { name: 'Places in this list' })).toBeVisible({
      timeout: 5000,
    });
    await expect(page.getByText('British Museum')).toBeVisible();
    await expect(page.getByText('Tower of London')).toBeVisible();
  });

  test('breadcrumb links back to /templates', async ({ page }) => {
    await page.goto(`/templates/${FIRST_TEMPLATE_ID}`);
    await expect(
      page.getByRole('navigation', { name: 'Breadcrumb' }),
    ).toBeVisible({ timeout: 5000 });

    const breadcrumbLink = page
      .getByRole('navigation', { name: 'Breadcrumb' })
      .getByRole('link', { name: 'Starter Lists' });
    await expect(breadcrumbLink).toHaveAttribute('href', '/templates');
  });

  test('logged-out user sees sign-up CTA, not copy button', async ({ page }) => {
    await page.route(GRAPHQL_URL, (route, request) =>
      handleGraphql(route, request, { __me: null }),
    );

    await page.goto(`/templates/${FIRST_TEMPLATE_ID}`);
    await expect(
      page.getByRole('heading', { name: FIRST_TEMPLATE_NAME }),
    ).toBeVisible({ timeout: 5000 });

    await expect(
      page.getByRole('link', { name: /sign up free to copy this list/i }).first(),
    ).toBeVisible();
    await expect(page.getByRole('button', { name: /copy this list/i })).not.toBeVisible();
  });

  test('sign-up CTA on detail page links to /register', async ({ page }) => {
    await page.route(GRAPHQL_URL, (route, request) =>
      handleGraphql(route, request, { __me: null }),
    );

    await page.goto(`/templates/${FIRST_TEMPLATE_ID}`);
    await expect(
      page.getByRole('heading', { name: FIRST_TEMPLATE_NAME }),
    ).toBeVisible({ timeout: 5000 });

    const ctaLink = page.getByRole('link', { name: /sign up free to copy this list/i }).first();
    await expect(ctaLink).toHaveAttribute('href', /\/register/);
  });

  test('logged-in user sees copy button on detail page', async ({ page }) => {
    await page.route(GRAPHQL_URL, (route, request) =>
      handleGraphql(route, request, { __me: MOCK_USER }),
    );
    await page.context().addCookies([
      { name: 'token', value: 'fake_token', url: 'http://localhost:3000' },
    ]);

    await page.goto(`/templates/${FIRST_TEMPLATE_ID}`);
    await expect(
      page.getByRole('heading', { name: FIRST_TEMPLATE_NAME }),
    ).toBeVisible({ timeout: 5000 });

    await expect(
      page.getByRole('button', { name: /\+ copy this list to my account/i }).first(),
    ).toBeVisible();
  });

  test('logged-in user copies template and sees success message', async ({ page }) => {
    await page.route(GRAPHQL_URL, (route, request) =>
      handleGraphql(route, request, {
        __me: MOCK_USER,
        TemplateDetailCreateMyList: { createMyList: { documentId: 'new-list-1' } },
        TemplateDetailCreateListItem: { createListItem: { documentId: 'new-item-1' } },
      }),
    );
    await page.context().addCookies([
      { name: 'token', value: 'fake_token', url: 'http://localhost:3000' },
    ]);

    await page.goto(`/templates/${FIRST_TEMPLATE_ID}`);
    await expect(
      page.getByRole('heading', { name: FIRST_TEMPLATE_NAME }),
    ).toBeVisible({ timeout: 5000 });

    await page.getByRole('button', { name: /\+ copy this list to my account/i }).first().click();

    await expect(page.getByText(/list copied!/i)).toBeVisible({ timeout: 5000 });
    await expect(
      page.getByRole('link', { name: /view your lists/i }),
    ).toHaveAttribute('href', '/my-list');
  });

  test('related templates section links to other template pages', async ({ page }) => {
    await page.goto(`/templates/${FIRST_TEMPLATE_ID}`);

    const relatedSection = page.getByRole('region', { name: 'More starter lists' });
    await expect(relatedSection).toBeVisible({ timeout: 5000 });

    const relatedLinks = relatedSection.getByRole('link');
    await expect(relatedLinks.first()).toHaveAttribute('href', /\/templates\//);
  });

  test('"Browse all starter lists" link returns to /templates', async ({ page }) => {
    await page.goto(`/templates/${FIRST_TEMPLATE_ID}`);
    await expect(
      page.getByRole('region', { name: 'More starter lists' }),
    ).toBeVisible({ timeout: 5000 });

    await expect(
      page.getByRole('link', { name: /browse all starter lists/i }),
    ).toHaveAttribute('href', '/templates');
  });
});
