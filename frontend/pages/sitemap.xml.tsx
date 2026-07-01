import type { GetServerSideProps } from 'next';
import { buildSitemapEntries, generateSitemapXml } from '../lib/sitemap';

const API_URL = process.env.STRAPI_URL || 'http://127.0.0.1:1337';
const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || 'https://londonlist.co.uk';

export default function SitemapPage() {
  return null;
}

export const getServerSideProps: GetServerSideProps = async ({ res }) => {
  let publicLists: { documentId: string; username: string | null }[] = [];

  try {
    const response = await fetch(`${API_URL}/api/lists/public?pageSize=500`);
    if (response.ok) {
      const json = await response.json();
      publicLists = json.data ?? [];
    }
  } catch {
    // Serve static pages only if the backend is unreachable
  }

  const entries = buildSitemapEntries(publicLists);
  const xml = generateSitemapXml(entries, SITE_URL);

  res.setHeader('Content-Type', 'text/xml; charset=utf-8');
  res.setHeader('Cache-Control', 'public, s-maxage=3600, stale-while-revalidate=86400');
  res.write(xml);
  res.end();

  return { props: {} };
};
