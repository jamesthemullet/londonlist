import Head from 'next/head';
import Link from 'next/link';
import type { GetServerSideProps } from 'next';
import { useAppContext } from '../../context/AppContext';
import styles from './[username].module.css';

const API_URL = process.env.STRAPI_URL || 'http://127.0.0.1:1337';
const SITE_URL = 'https://londonlist.vercel.app';

type PublicList = {
  documentId: string;
  name: string;
  itemCount: number;
  completedCount: number;
};

type ProfileData = {
  username: string;
  lists: PublicList[];
};

type PageState = 'found' | 'not_found';

type Props = {
  pageState: PageState;
  profileData: ProfileData | null;
  username: string;
};

export default function ProfilePage({ pageState, profileData, username }: Props) {
  const { user, initialized } = useAppContext();

  if (pageState === 'not_found') {
    return (
      <main className={styles.main}>
        <p>User not found.</p>
      </main>
    );
  }

  const lists = profileData?.lists ?? [];
  const totalPlaces = lists.reduce((sum, l) => sum + l.itemCount, 0);
  const totalVisited = lists.reduce((sum, l) => sum + l.completedCount, 0);
  const listWord = lists.length === 1 ? 'list' : 'lists';
  const placeWord = totalPlaces === 1 ? 'place' : 'places';

  const ogTitle = `${username}'s London Lists`;
  const ogDescription = `${username} has ${lists.length} public ${listWord} on London List — ${totalPlaces} ${placeWord}, ${totalVisited} visited.`;
  const ogUrl = `${SITE_URL}/profile/${username}`;

  return (
    <>
      <Head>
        <title>{ogTitle} — London List</title>
        <meta name="description" content={ogDescription} />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <link rel="canonical" href={ogUrl} />
        <meta property="og:title" content={ogTitle} />
        <meta property="og:description" content={ogDescription} />
        <meta property="og:url" content={ogUrl} />
        <meta property="og:type" content="profile" />
        <meta name="twitter:card" content="summary" />
        <meta name="twitter:title" content={ogTitle} />
        <meta name="twitter:description" content={ogDescription} />
      </Head>
      <main className={styles.main}>
        <h1 className={styles.heading}>{username}&apos;s London Lists</h1>
        <p className={styles.stats}>
          {lists.length} public {listWord} &middot; {totalPlaces} {placeWord} &middot;{' '}
          {totalVisited} visited
        </p>

        {lists.length === 0 ? (
          <p className={styles.empty}>No public lists yet.</p>
        ) : (
          <ul className={styles.listGrid}>
            {lists.map((list) => {
              const todoCount = list.itemCount - list.completedCount;
              return (
                <li key={list.documentId}>
                  <Link
                    href={`/list/${username}/${list.documentId}`}
                    className={styles.listCard}
                    aria-label={`${list.name} — ${list.itemCount} places`}
                  >
                    <span className={styles.listName}>{list.name}</span>
                    <span className={styles.listMeta}>
                      {todoCount > 0 && (
                        <span className={styles.todoCount}>{todoCount} to do</span>
                      )}
                      {list.completedCount > 0 && (
                        <span className={styles.doneCount}>{list.completedCount} done</span>
                      )}
                      {list.itemCount === 0 && (
                        <span className={styles.emptyCount}>empty</span>
                      )}
                    </span>
                  </Link>
                </li>
              );
            })}
          </ul>
        )}
      </main>

      {initialized && !user && (
        <aside className={styles.conversionBanner}>
          <p className={styles.conversionHeadline}>
            Inspired by {username}&apos;s lists?
          </p>
          <p className={styles.conversionTagline}>
            Build your own London bucket list — it&apos;s free.
          </p>
          <Link href="/register?ref=profile" className={styles.conversionCta}>
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
    const res = await fetch(`${API_URL}/api/lists/public/${username}`);
    if (res.status === 404) {
      return { props: { pageState: 'not_found', profileData: null, username } };
    }
    if (res.ok) {
      const data: ProfileData = await res.json();
      return { props: { pageState: 'found', profileData: data, username } };
    }
    return { props: { pageState: 'not_found', profileData: null, username } };
  } catch {
    return { props: { pageState: 'not_found', profileData: null, username } };
  }
};
