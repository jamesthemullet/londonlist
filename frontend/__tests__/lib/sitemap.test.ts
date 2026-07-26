import { buildSitemapEntries, generateSitemapXml } from '../../lib/sitemap';

const SITE_URL = 'https://londonlist.co.uk';

describe('buildSitemapEntries', () => {
  it('includes the homepage entry', () => {
    const entries = buildSitemapEntries([]);
    const home = entries.find((e) => e.loc === '/');
    expect(home).toBeDefined();
    expect(home?.priority).toBe('1.0');
    expect(home?.changefreq).toBe('daily');
  });

  it('includes static pages (explore, register, login)', () => {
    const entries = buildSitemapEntries([]);
    const locs = entries.map((e) => e.loc);
    expect(locs).toContain('/explore');
    expect(locs).toContain('/register');
    expect(locs).toContain('/login');
  });

  it('includes a public list entry with the correct path', () => {
    const lists = [{ documentId: 'doc-abc', username: 'alice' }];
    const entries = buildSitemapEntries(lists);
    const listEntry = entries.find((e) => e.loc === '/list/alice/doc-abc');
    expect(listEntry).toBeDefined();
    expect(listEntry?.changefreq).toBe('weekly');
    expect(listEntry?.priority).toBe('0.7');
  });

  it('excludes lists with a null username', () => {
    const lists = [
      { documentId: 'doc-1', username: null },
      { documentId: 'doc-2', username: 'bob' },
    ];
    const entries = buildSitemapEntries(lists);
    const locs = entries.map((e) => e.loc);
    expect(locs).not.toContain('/list/null/doc-1');
    expect(locs).toContain('/list/bob/doc-2');
  });

  it('returns only static pages when the list is empty', () => {
    const entries = buildSitemapEntries([]);
    expect(entries.length).toBe(4); // homepage, explore, register, login
  });

  it('returns static pages plus one profile entry and one list entry per valid list', () => {
    const lists = [
      { documentId: 'a', username: 'alice' },
      { documentId: 'b', username: 'bob' },
    ];
    const entries = buildSitemapEntries(lists);
    expect(entries.length).toBe(8); // 4 static + 2 profiles + 2 lists
  });

  it('includes a profile entry for each unique username', () => {
    const lists = [
      { documentId: 'a', username: 'alice' },
      { documentId: 'b', username: 'alice' },
    ];
    const entries = buildSitemapEntries(lists);
    const profileEntries = entries.filter((e) => e.loc.startsWith('/profile/'));
    expect(profileEntries.length).toBe(1);
    expect(profileEntries[0].loc).toBe('/profile/alice');
  });

  it('sets priority 0.6 and weekly changefreq on profile entries', () => {
    const lists = [{ documentId: 'a', username: 'alice' }];
    const entries = buildSitemapEntries(lists);
    const profileEntry = entries.find((e) => e.loc === '/profile/alice');
    expect(profileEntry?.priority).toBe('0.6');
    expect(profileEntry?.changefreq).toBe('weekly');
  });

  it('excludes profile entries for null usernames', () => {
    const lists = [{ documentId: 'x', username: null }];
    const entries = buildSitemapEntries(lists);
    const profileEntries = entries.filter((e) => e.loc.startsWith('/profile/'));
    expect(profileEntries.length).toBe(0);
  });
});

describe('generateSitemapXml', () => {
  it('produces a valid XML declaration and urlset root', () => {
    const xml = generateSitemapXml([], SITE_URL);
    expect(xml).toContain('<?xml version="1.0" encoding="UTF-8"?>');
    expect(xml).toContain('<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">');
    expect(xml).toContain('</urlset>');
  });

  it('includes the full absolute URL for each entry', () => {
    const entries = [{ loc: '/', changefreq: 'daily' as const, priority: '1.0' }];
    const xml = generateSitemapXml(entries, SITE_URL);
    expect(xml).toContain('<loc>https://londonlist.co.uk/</loc>');
  });

  it('includes changefreq and priority tags', () => {
    const entries = [{ loc: '/', changefreq: 'daily' as const, priority: '1.0' }];
    const xml = generateSitemapXml(entries, SITE_URL);
    expect(xml).toContain('<changefreq>daily</changefreq>');
    expect(xml).toContain('<priority>1.0</priority>');
  });

  it('includes lastmod when provided', () => {
    const entries = [
      { loc: '/', changefreq: 'daily' as const, priority: '1.0', lastmod: '2026-07-01' },
    ];
    const xml = generateSitemapXml(entries, SITE_URL);
    expect(xml).toContain('<lastmod>2026-07-01</lastmod>');
  });

  it('omits lastmod when not provided', () => {
    const entries = [{ loc: '/', changefreq: 'daily' as const, priority: '1.0' }];
    const xml = generateSitemapXml(entries, SITE_URL);
    expect(xml).not.toContain('<lastmod>');
  });

  it('produces one <url> block per entry', () => {
    const entries = [
      { loc: '/', changefreq: 'daily' as const, priority: '1.0' },
      { loc: '/register', changefreq: 'monthly' as const, priority: '0.5' },
    ];
    const xml = generateSitemapXml(entries, SITE_URL);
    const urlCount = (xml.match(/<url>/g) ?? []).length;
    expect(urlCount).toBe(2);
  });

  it('produces an empty urlset when given no entries', () => {
    const xml = generateSitemapXml([], SITE_URL);
    expect(xml).not.toContain('<url>');
    expect(xml).toContain('<urlset');
  });

  it('uses the provided siteUrl as the base for all locs', () => {
    const entries = [{ loc: '/test', changefreq: 'monthly' as const, priority: '0.5' }];
    const xml = generateSitemapXml(entries, 'https://example.com');
    expect(xml).toContain('<loc>https://example.com/test</loc>');
    expect(xml).not.toContain('londonlist.co.uk');
  });

  it('renders list page URLs correctly when built end-to-end', () => {
    const lists = [{ documentId: 'abc123', username: 'alice' }];
    const entries = buildSitemapEntries(lists);
    const xml = generateSitemapXml(entries, SITE_URL);
    expect(xml).toContain('<loc>https://londonlist.co.uk/list/alice/abc123</loc>');
  });
});
