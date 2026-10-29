import Head from 'next/head';
import Link from 'next/link';
import type { GetServerSideProps } from 'next';
import { useAppContext } from '../../context/AppContext';
import { buildOgImageUrl } from '../../lib/og-image';
import styles from './[username].module.css';

const API_URL = process.env.STRAPI_URL || 'http://127.0.0.1:1337';
const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || 'https://londonlist.vercel.app';

type ListItem = {
  documentId: string;
  name: string;
  category: string | null;
  completed: boolean;
  osm_id: string;
};

type PublicListData = {
  data: ListItem[];
  username: string;
};

type PageState = 'found' | 'private' | 'not_found';

type Props = {
  pageState: PageState;
  listData: PublicListData | null;
  username: string;
};

export function buildListJsonLd(
  username: string,
  items: ListItem[],
  ogUrl: string,
  siteUrl: string,
): object {
  return {
    '@context': 'https://schema.org',
    '@type': 'ItemList',
    name: `${username}'s London List`,
    url: ogUrl,
    numberOfItems: items.length,
    itemListElement: items.map((item, index) => ({
      '@type': 'ListItem',
      position: index + 1,
      name: item.name,
      url: `${siteUrl}/place/${item.osm_id}`,
    })),
  };
}

export function buildProfileOgDescription(listData: PublicListData): string {
  const { data: items, username } = listData;
  const total = items.length;
  const done = items.filter((i) => i.completed).length;
  const todo = total - done;
  const placeWord = total === 1 ? 'place' : 'places';
  if (total === 0) return `${username}'s London list`;
  return `${username}'s London list: ${total} ${placeWord} to explore — ${todo} to visit, ${done} done.`;
}

export default function PublicProfilePage({ pageState, listData, username }: Props) {
  const { user, initialized } = useAppContext();

  if (pageState === 'not_found') {
    return (
      <main className={styles.main}>
        <p>User not found.</p>
      </main>
    );
  }

  if (pageState === 'private') {
    return (
      <>
        <Head>
          <title>{username}&apos;s List — London List</title>
        </Head>
        <main className={styles.main}>
          <h1 className={styles.heading}>{username}&apos;s List</h1>
          <p className={styles.privateMessage}>This list is private.</p>
        </main>
      </>
    );
  }

  const items = listData?.data ?? [];
  const todo = items.filter((i) => !i.completed);
  const done = items.filter((i) => i.completed);
  const ogTitle = `${username}'s London List`;
  const ogDescription = listData ? buildProfileOgDescription(listData) : `${username}'s London list`;
  const ogUrl = `${SITE_URL}/list/${username}`;
  const ogImage = buildOgImageUrl(
    { title: ogTitle, username, itemCount: items.length, doneCount: done.length },
    SITE_URL,
  );
  const jsonLd = buildListJsonLd(username, items, ogUrl, SITE_URL);

  return (
    <>
      <Head>
        <title>{username}&apos;s London List</title>
        <meta name="description" content={ogDescription} />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <link rel="canonical" href={ogUrl} />
        <meta property="og:type" content="website" />
        <meta property="og:site_name" content="London List" />
        <meta property="og:title" content={ogTitle} />
        <meta property="og:description" content={ogDescription} />
        <meta property="og:url" content={ogUrl} />
        <meta property="og:image" content={ogImage} />
        <meta name="twitter:card" content="summary_large_image" />
        <meta name="twitter:title" content={ogTitle} />
        <meta name="twitter:description" content={ogDescription} />
        <meta name="twitter:image" content={ogImage} />
        {/* biome-ignore lint/security/noDangerouslySetInnerHtml: JSON-LD structured data, not user content */}
        <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
      </Head>
      <main className={styles.main}>
        <h1 className={styles.heading}>{username}&apos;s List</h1>
        {items.length === 0 ? (
          <p className={styles.empty}>This list is empty.</p>
        ) : (
          <div className={styles.container}>
            {todo.length > 0 && (
              <section>
                <h2 className={styles.sectionHeading}>To do ({todo.length})</h2>
                <ul className={styles.list}>
                  {todo.map((item) => (
                    <li key={item.documentId} className={styles.item}>
                      <Link href={`/place/${item.osm_id}`} className={styles.name}>{item.name}</Link>
                      {item.category && <span className={styles.category}>{item.category}</span>}
                    </li>
                  ))}
                </ul>
              </section>
            )}
            {done.length > 0 && (
              <section>
                <h2 className={styles.sectionHeading}>Done ({done.length})</h2>
                <ul className={styles.list}>
                  {done.map((item) => (
                    <li key={item.documentId} className={styles.item}>
                      <Link href={`/place/${item.osm_id}`} className={styles.nameDone}>{item.name}</Link>
                      {item.category && <span className={styles.category}>{item.category}</span>}
                    </li>
                  ))}
                </ul>
              </section>
            )}
          </div>
        )}
      </main>
      {initialized && !user && (
        <aside className={styles.conversionBanner}>
          <p className={styles.conversionHeadline}>Inspired by {username}&apos;s list?</p>
          <p className={styles.conversionTagline}>Build your own London bucket list — it&apos;s free.</p>
          <Link href="/register?ref=shared-profile" className={styles.conversionCta}>
            Create your list
          </Link>
        </aside>
      )}
    </>
  );
}

export const getServerSideProps: GetServerSideProps<Props> = async (context) => {
  const { username } = context.params as { username: string };

  try {
    const res = await fetch(`${API_URL}/api/list-settings/public/${username}`, {
      signal: AbortSignal.timeout(5000),
    });
    if (res.status === 403) {
      return { props: { pageState: 'private', listData: null, username } };
    }
    if (res.status === 404) {
      return { props: { pageState: 'not_found', listData: null, username } };
    }
    if (res.ok) {
      const data: PublicListData = await res.json();
      return { props: { pageState: 'found', listData: data, username } };
    }
    return { props: { pageState: 'not_found', listData: null, username } };
  } catch {
    return { props: { pageState: 'not_found', listData: null, username } };
  }
};
