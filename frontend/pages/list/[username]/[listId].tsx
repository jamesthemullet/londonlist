import Head from 'next/head';
import Link from 'next/link';
import type { GetServerSideProps } from 'next';
import { useAppContext } from '../../../context/AppContext';
import ShareButtons from '../../../components/share-buttons/share-buttons';
import styles from '../[username].module.css';

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || 'https://londonlist.vercel.app';
const DEFAULT_OG_IMAGE = `${SITE_URL}/images/temp-seo-image.jpg`;

const API_URL = process.env.STRAPI_URL || 'http://127.0.0.1:1337';

type ListItem = {
  documentId: string;
  name: string;
  category: string | null;
  completed: boolean;
  osm_id: string;
  visitedAt: string | null;
};

type PublicListData = {
  data: ListItem[];
  username: string;
  listName: string;
};

type PageState = 'found' | 'private' | 'not_found';

type Props = {
  pageState: PageState;
  listData: PublicListData | null;
  username: string;
  listId: string;
};

const SCHEMA_TYPE_MAP: Record<string, string> = {
  museum: 'Museum',
  restaurant: 'Restaurant',
  cafe: 'CafeOrCoffeeShop',
  bar: 'BarOrPub',
  park: 'Park',
  hotel: 'Hotel',
  theatre: 'PerformingArtsTheater',
  cinema: 'MovieTheater',
  gallery: 'ArtGallery',
  library: 'Library',
};

function schemaTypeForCategory(category: string | null): string {
  if (!category) return 'TouristAttraction';
  return SCHEMA_TYPE_MAP[category.toLowerCase()] ?? 'TouristAttraction';
}

export function buildItemListJsonLd(
  listData: PublicListData,
  username: string,
  listId: string,
): object {
  const items = listData.data;
  const todo = items.filter((i) => !i.completed);
  const done = items.filter((i) => i.completed);
  const placeWord = items.length === 1 ? 'place' : 'places';
  const description = `${username} is exploring London. ${items.length} ${placeWord} on their ${listData.listName} list — ${todo.length} to do, ${done.length} done.`;

  return {
    '@context': 'https://schema.org',
    '@type': 'ItemList',
    name: `${listData.listName} — ${username}'s London List`,
    description,
    url: `${SITE_URL}/list/${username}/${listId}`,
    author: {
      '@type': 'Person',
      name: username,
    },
    numberOfItems: items.length,
    itemListElement: items.map((item, index) => ({
      '@type': 'ListItem',
      position: index + 1,
      name: item.name,
      item: {
        '@type': schemaTypeForCategory(item.category),
        name: item.name,
        url: `https://www.openstreetmap.org/${item.osm_id}`,
      },
    })),
  };
}

export default function PublicListPage({ pageState, listData, username, listId }: Props) {
  const { user, initialized } = useAppContext();
  if (pageState === 'not_found') {
    return (
      <main className={styles.main}>
        <p>List not found.</p>
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
  const jsonLd = listData ? buildItemListJsonLd(listData, username, listId) : null;

  const canonicalUrl = `${SITE_URL}/list/${username}/${listId}`;
  const pageTitle = `${listData?.listName} — ${username}'s London List`;
  const pageDescription =
    items.length > 0
      ? `${username} is exploring London. ${items.length} place${items.length === 1 ? '' : 's'} on their "${listData?.listName}" list — ${todo.length} to do, ${done.length} done.`
      : `${username}'s London list: ${listData?.listName}`;

  return (
    <>
      <Head>
        <title>{pageTitle}</title>
        <meta name="description" content={pageDescription} />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <link rel="canonical" href={canonicalUrl} />
        <meta property="og:type" content="article" />
        <meta property="og:site_name" content="London List" />
        <meta property="og:title" content={pageTitle} />
        <meta property="og:description" content={pageDescription} />
        <meta property="og:url" content={canonicalUrl} />
        <meta property="og:image" content={DEFAULT_OG_IMAGE} />
        <meta property="og:locale" content="en_GB" />
        <meta name="twitter:card" content="summary_large_image" />
        <meta name="twitter:title" content={pageTitle} />
        <meta name="twitter:description" content={pageDescription} />
        <meta name="twitter:image" content={DEFAULT_OG_IMAGE} />
        {jsonLd && (
          // biome-ignore lint/security/noDangerouslySetInnerHtml: JSON-LD is server-generated; JSON.stringify output is XSS-safe
          <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
        )}
      </Head>
      <main className={styles.main}>
        <h1 className={styles.heading}>{listData?.listName}</h1>
        <p className={styles.subtitle}>{username}&apos;s list</p>
        <ShareButtons url={canonicalUrl} title={pageTitle} />
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
                      <span className={styles.name}>{item.name}</span>
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
                      <span className={styles.nameDone}>{item.name}</span>
                      {item.category && <span className={styles.category}>{item.category}</span>}
                      {item.visitedAt && (
                        <time className={styles.visitedAt} dateTime={item.visitedAt}>
                          Visited{' '}
                          {new Date(item.visitedAt).toLocaleDateString('en-GB', {
                            day: 'numeric',
                            month: 'long',
                            year: 'numeric',
                          })}
                        </time>
                      )}
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
          <Link href="/register?ref=shared-list" className={styles.conversionCta}>
            Create your list
          </Link>
        </aside>
      )}
    </>
  );
}

export const getServerSideProps: GetServerSideProps<Props> = async (context) => {
  const { username, listId } = context.params as { username: string; listId: string };

  try {
    const res = await fetch(`${API_URL}/api/lists/public/${username}/${listId}`);
    if (res.status === 403) {
      return { props: { pageState: 'private', listData: null, username, listId } };
    }
    if (res.status === 404) {
      return { props: { pageState: 'not_found', listData: null, username, listId } };
    }
    if (res.ok) {
      const data: PublicListData = await res.json();
      return { props: { pageState: 'found', listData: data, username, listId } };
    }
    return { props: { pageState: 'not_found', listData: null, username, listId } };
  } catch {
    return { props: { pageState: 'not_found', listData: null, username, listId } };
  }
};
