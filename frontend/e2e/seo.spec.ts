import { test, expect } from '@playwright/test';

test.describe('Sitemap', () => {
  test('/sitemap.xml returns XML containing area, template and explore-category URLs', async ({
    request,
  }) => {
    const response = await request.get('/sitemap.xml');

    expect(response.status()).toBe(200);
    expect(response.headers()['content-type']).toContain('text/xml');

    const body = await response.text();

    expect(body).toContain('<?xml version="1.0" encoding="UTF-8"?>');
    expect(body).toContain('<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">');
    expect(body).toContain('<loc>https://londonlist.vercel.app/area/bloomsbury</loc>');
    expect(body).toContain('<loc>https://londonlist.vercel.app/templates/london-weekend-icons</loc>');
    expect(body).toContain('<loc>https://londonlist.vercel.app/explore/museum</loc>');
  });
});
