import type { GetServerSideProps } from 'next';
import { buildSitemapEntries, generateSitemapXml } from '../lib/sitemap';
import type { PublicPlaceForSitemap } from '../lib/sitemap';

const API_URL = process.env.STRAPI_URL || 'http://127.0.0.1:1337';
const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || 'https://londonlist.vercel.app';

const ALL_PLACES_QUERY = `
  query AllPlacesForSitemap {
    allPlaces(limit: 5000) {
      osm_id
    }
  }
`;

export default function SitemapPage() {
  return null;
}

export const getServerSideProps: GetServerSideProps = async ({ res }) => {
  let publicLists: { documentId: string; username: string | null }[] = [];
  let publicPlaces: PublicPlaceForSitemap[] = [];

  try {
    const response = await fetch(`${API_URL}/api/lists/public?pageSize=500`, {
      signal: AbortSignal.timeout(5000),
    });
    if (response.ok) {
      const json = await response.json();
      publicLists = json.data ?? [];
    }
  } catch {
    // Serve static pages only if the backend is unreachable
  }

  try {
    const placesRes = await fetch(`${API_URL}/graphql`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ query: ALL_PLACES_QUERY }),
      signal: AbortSignal.timeout(10000),
    });
    if (placesRes.ok) {
      const placesJson = await placesRes.json();
      publicPlaces = placesJson?.data?.allPlaces ?? [];
    }
  } catch {
    // Non-critical — serve without individual place URLs
  }

  const entries = buildSitemapEntries(publicLists, publicPlaces);
  const xml = generateSitemapXml(entries, SITE_URL);

  res.setHeader('Content-Type', 'text/xml; charset=utf-8');
  res.setHeader('Cache-Control', 'public, s-maxage=3600, stale-while-revalidate=86400');
  res.write(xml);
  res.end();

  return { props: {} };
};
