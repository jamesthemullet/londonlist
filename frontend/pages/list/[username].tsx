import Head from 'next/head';
import Link from 'next/link';
import type { GetServerSideProps } from 'next';
import { useAppContext } from '../../context/AppContext';
import styles from './[username].module.css';

const API_URL = process.env.STRAPI_URL || 'http://127.0.0.1:1337';
const SITE_URL = 'https://londonlist.vercel.app';

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

  return (
    <>
      <Head>
        <title>{username}&apos;s London List</title>
        <meta name="description" content={ogDescription} />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <meta property="og:type" content="website" />
        <meta property="og:site_name" content="London List" />
        <meta property="og:title" content={ogTitle} />
        <meta property="og:description" content={ogDescription} />
        <meta property="og:url" content={ogUrl} />
        <meta name="twitter:card" content="summary" />
        <meta name="twitter:title" content={ogTitle} />
        <meta name="twitter:description" content={ogDescription} />
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
    const res = await fetch(`${API_URL}/api/list-settings/public/${username}`);
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
