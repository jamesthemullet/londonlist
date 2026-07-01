export type SitemapEntry = {
  loc: string;
  changefreq: 'always' | 'hourly' | 'daily' | 'weekly' | 'monthly' | 'yearly' | 'never';
  priority: string;
  lastmod?: string;
};

export type PublicListForSitemap = {
  documentId: string;
  username: string | null;
};

const STATIC_PAGES: SitemapEntry[] = [
  { loc: '/', changefreq: 'daily', priority: '1.0' },
  { loc: '/register', changefreq: 'monthly', priority: '0.5' },
  { loc: '/login', changefreq: 'monthly', priority: '0.3' },
];

export function buildSitemapEntries(lists: PublicListForSitemap[]): SitemapEntry[] {
  const listEntries: SitemapEntry[] = lists
    .filter((l) => l.username !== null)
    .map((l) => ({
      loc: `/list/${l.username}/${l.documentId}`,
      changefreq: 'weekly',
      priority: '0.7',
    }));
  return [...STATIC_PAGES, ...listEntries];
}

export function generateSitemapXml(entries: SitemapEntry[], siteUrl: string): string {
  const urls = entries
    .map((entry) => {
      const lastmod = entry.lastmod ? `\n    <lastmod>${entry.lastmod}</lastmod>` : '';
      return `  <url>
    <loc>${siteUrl}${entry.loc}</loc>${lastmod}
    <changefreq>${entry.changefreq}</changefreq>
    <priority>${entry.priority}</priority>
  </url>`;
    })
    .join('\n');

  return `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${urls}
</urlset>`;
}
