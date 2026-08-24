import Head from 'next/head';
import Link from 'next/link';
import type { GetServerSideProps } from 'next';
import { useMemo, useState } from 'react';
import { useAppContext } from '../context/AppContext';
import styles from './explore.module.css';

const API_URL = process.env.STRAPI_URL || 'http://127.0.0.1:1337';
const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || 'https://londonlist.vercel.app';

type PublicList = {
  documentId: string;
  name: string;
  description?: string | null;
  username: string | null;
  itemCount: number;
  categories: string[];
};

type Props = {
  lists: PublicList[];
};

export function buildExplorePageJsonLd(lists: PublicList[], siteUrl: string): object {
  return {
    '@context': 'https://schema.org',
    '@type': 'CollectionPage',
    name: 'Explore London Lists',
    description:
      'Browse curated lists of things to do in London — hidden gems, restaurants, museums, parks, and more.',
    url: `${siteUrl}/explore`,
    hasPart: lists
      .filter((l) => l.username)
      .map((list) => ({
        '@type': 'ItemList',
        name: list.name,
        url: `${siteUrl}/list/${list.username}/${list.documentId}`,
        numberOfItems: list.itemCount,
      })),
  };
}

export function deriveAllCategories(lists: PublicList[]): string[] {
  const seen = new Set<string>();
  for (const list of lists) {
    for (const cat of list.categories) {
      seen.add(cat);
    }
  }
  return [...seen].sort();
}

export default function ExplorePage({ lists }: Props) {
  const { user, initialized } = useAppContext();
  const [query, setQuery] = useState('');
  const [activeCategory, setActiveCategory] = useState<string | null>(null);

  const allCategories = useMemo(() => deriveAllCategories(lists), [lists]);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return lists.filter((l) => {
      const matchesQuery =
        !q ||
        l.name.toLowerCase().includes(q) ||
        l.username?.toLowerCase().includes(q);
      const matchesCategory =
        !activeCategory || l.categories.includes(activeCategory);
      return matchesQuery && matchesCategory;
    });
  }, [lists, query, activeCategory]);

  return (
    <>
      <Head>
        <title>Explore London Lists — London List</title>
        <meta
          name="description"
          content="Browse curated lists of things to do in London — hidden gems, restaurants, museums, parks, and more."
        />
        <meta property="og:title" content="Explore London Lists" />
        <meta
          property="og:description"
          content="Browse curated lists of things to do in London — hidden gems, restaurants, museums, parks, and more."
        />
        <meta property="og:type" content="website" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        {lists.length > 0 && (
          // biome-ignore lint/security/noDangerouslySetInnerHtml: JSON-LD is server-generated; JSON.stringify output is XSS-safe
          <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(buildExplorePageJsonLd(lists, SITE_URL)) }} />
        )}
      </Head>
      <main className={styles.main}>
        <div className={styles.hero}>
          <h1 className={styles.heading}>Explore London Lists</h1>
          <p className={styles.subheading}>
            Browse curated lists of things to do in London — hidden gems, restaurants, museums,
            parks, and more.
          </p>
        </div>

        {initialized && !user && (
          <div className={styles.ctaBanner}>
            <p className={styles.ctaText}>
              Inspired by what you see?{' '}
              <Link href="/register?ref=explore">Build your own list — it&apos;s free.</Link>
            </p>
          </div>
        )}

        <div className={styles.searchRow}>
          <input
            type="search"
            placeholder="Search by list name or creator…"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            className={styles.searchInput}
            aria-label="Search lists"
          />
        </div>

        {allCategories.length > 0 && (
          <fieldset className={styles.categoryRow}>
            <legend className={styles.categoryLegend}>Filter by category</legend>
            <button
              type="button"
              className={activeCategory === null ? styles.categoryChipActive : styles.categoryChip}
              onClick={() => setActiveCategory(null)}
              aria-pressed={activeCategory === null}
            >
              All
            </button>
            {allCategories.map((cat) => (
              <button
                key={cat}
                type="button"
                className={activeCategory === cat ? styles.categoryChipActive : styles.categoryChip}
                onClick={() => setActiveCategory(activeCategory === cat ? null : cat)}
                aria-pressed={activeCategory === cat}
              >
                {cat}
              </button>
            ))}
          </fieldset>
        )}

        {filtered.length === 0 ? (
          <p className={styles.empty}>
            {query || activeCategory
              ? 'No lists match your filters.'
              : 'No public lists yet — be the first!'}
          </p>
        ) : (
          <>
            <p className={styles.count} aria-live="polite">
              {filtered.length} list{filtered.length !== 1 ? 's' : ''}
            </p>
            <ul className={styles.grid}>
              {filtered.map((list) => (
                <li key={list.documentId}>
                  <Link
                    href={`/list/${list.username}/${list.documentId}`}
                    className={styles.card}
                  >
                    <span className={styles.listName}>{list.name}</span>
                    {list.description && (
                      <span className={styles.listDescription}>{list.description}</span>
                    )}
                    {list.username && (
                      <span className={styles.author}>by {list.username}</span>
                    )}
                    {list.itemCount > 0 && (
                      <span className={styles.itemCount}>
                        {list.itemCount} {list.itemCount === 1 ? 'place' : 'places'}
                      </span>
                    )}
                    {list.categories.length > 0 && (
                      <span className={styles.categoryList}>
                        {list.categories.slice(0, 4).join(' · ')}
                      </span>
                    )}
                  </Link>
                </li>
              ))}
            </ul>
          </>
        )}
      </main>
    </>
  );
}

export const getServerSideProps: GetServerSideProps<Props> = async () => {
  try {
    const res = await fetch(`${API_URL}/api/lists/public?pageSize=100`, {
      signal: AbortSignal.timeout(5000),
    });
    if (!res.ok) return { props: { lists: [] } };
    const json = await res.json();
    return { props: { lists: json.data ?? [] } };
  } catch {
    return { props: { lists: [] } };
  }
};
