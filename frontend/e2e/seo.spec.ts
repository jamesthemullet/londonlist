import { test, expect } from '@playwright/test';

test.describe('Sitemap', () => {
  test('/sitemap.xml returns XML containing area, template and explore-category URLs', async ({
    request,
  }) => {
    const response = await request.get('/sitemap.xml');

    expect(response.status()).toBe(200);
    expect(response.headers()['content-type']).toContain('text/xml');

    const xml = await response.text();

    expect(xml).toContain('<?xml');
    expect(xml).toContain('<urlset');
    expect(xml).toContain('<loc>');
    expect(xml).toContain('/area/bloomsbury');
    expect(xml).toContain('/templates/london-weekend-icons');
    expect(xml).toContain('/explore/museum');
  });
});
