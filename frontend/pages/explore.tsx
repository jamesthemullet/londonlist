import Head from 'next/head';
import Link from 'next/link';
import type { GetServerSideProps } from 'next';
import { useMemo, useState } from 'react';
import { useAppContext } from '../context/AppContext';
import styles from './explore.module.css';

const API_URL = process.env.STRAPI_URL || 'http://127.0.0.1:1337';

type PublicList = {
  documentId: string;
  name: string;
  username: string | null;
};

type Props = {
  lists: PublicList[];
};

export default function ExplorePage({ lists }: Props) {
  const { user, initialized } = useAppContext();
  const [query, setQuery] = useState('');

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return lists;
    return lists.filter(
      (l) =>
        l.name.toLowerCase().includes(q) ||
        l.username?.toLowerCase().includes(q)
    );
  }, [lists, query]);

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

        {filtered.length === 0 ? (
          <p className={styles.empty}>
            {query ? `No lists match "${query}".` : 'No public lists yet — be the first!'}
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
                    {list.username && (
                      <span className={styles.author}>by {list.username}</span>
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
