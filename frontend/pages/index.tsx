import { gql } from '@apollo/client';
import { useQuery } from '@apollo/client/react';
import Head from 'next/head';
import Link from 'next/link';
import { useEffect, useState } from 'react';
import StreakBadge from '../components/streak-badge/streak-badge';
import PlaceSearch from '../components/search/place-search';
import { useAppContext } from '../context/AppContext';
import { useAuthHeader } from '../hooks/use-auth-header';
import { useStreak } from '../hooks/use-streak';
import styles from './index.module.css';

const API_URL = process.env.STRAPI_URL || 'http://127.0.0.1:1337';
const SITE_URL = 'https://londonlist.vercel.app';

type PublicList = {
  documentId: string;
  name: string;
  username: string | null;
};

const FEATURES = [
  {
    icon: '📍',
    heading: 'Discover London',
    text: 'Search hundreds of places — museums, restaurants, parks, and hidden gems.',
  },
  {
    icon: '✓',
    heading: 'Track your visits',
    text: 'Tick off places as you explore and watch your London adventures grow.',
  },
  {
    icon: '🔗',
    heading: 'Share with friends',
    text: 'Make your list public and inspire others to explore the city.',
  },
];

const GET_ALL_MY_ITEMS = gql`
  query GetAllMyItems {
    listItems {
      completed
      visitedAt
    }
  }
`;

type BannerItem = { completed: boolean; visitedAt: string | null };

function nextMilestoneMessage(total: number, done: number): string | null {
  if (total === 0) return null;
  const pct = (done / total) * 100;
  if (pct >= 100) return 'London conquered — every place ticked off!';
  const milestones = [25, 50, 75, 100];
  for (const m of milestones) {
    if (pct < m) {
      const needed = Math.ceil((m / 100) * total) - done;
      if (needed <= 0) continue;
      return needed === 1
        ? `You're 1 place from ${m}% of your list`
        : `You're ${needed} places from ${m}% of your list`;
    }
  }
  return null;
}

export default function Home() {
  const { user } = useAppContext();
  const [publicLists, setPublicLists] = useState<PublicList[]>([]);

  useEffect(() => {
    fetch(`${API_URL}/api/lists/public`)
      .then((res) => res.json())
      .then((json) => setPublicLists(json.data ?? []))
      .catch(() => {});
  }, []);

  return (
    <>
      <Head>
        <title>London List — Your London Bucket List App</title>
        <meta
          name="description"
          content="Build your London bucket list. Add places to visit, track your adventures, and share curated lists with friends. Free to use."
        />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <link rel="icon" href="/favicon.ico" />
        <meta property="og:title" content="London List — Your London Bucket List App" />
        <meta
          property="og:description"
          content="Add places, track visits, and share your London adventures with friends. Create your free bucket list today."
        />
        <meta property="og:type" content="website" />
        <meta property="og:url" content={`${SITE_URL}/`} />
        <meta name="twitter:card" content="summary_large_image" />
        <meta name="twitter:title" content="London List — Your London Bucket List App" />
        <meta
          name="twitter:description"
          content="Add places, track visits, and share your London adventures. Free to use."
        />
      </Head>
      <main className={styles.main}>
        {user ? (
          <LoggedInHero />
        ) : (
          <LoggedOutHero />
        )}

        {publicLists.length > 0 && (
          <section className={styles.publicLists}>
            <h2 className={styles.sectionHeading}>Community lists</h2>
            <ul className={styles.listGrid}>
              {publicLists.map((list) => (
                <li key={list.documentId}>
                  <Link
                    href={`/list/${list.username}/${list.documentId}`}
                    className={styles.listCard}>
                    <span className={styles.listName}>{list.name}</span>
                    {list.username && (
                      <Link
                        href={`/profile/${list.username}`}
                        className={styles.listAuthor}
                        onClick={(e) => e.stopPropagation()}
                      >
                        by {list.username}
                      </Link>
                    )}
                  </Link>
                </li>
              ))}
            </ul>
          </section>
        )}
      </main>
    </>
  );
}

function LoggedOutHero() {
  return (
    <>
      <section className={styles.hero}>
        <h1 className={styles.heading}>Your London bucket list, beautifully organised</h1>
        <p className={styles.subheading}>
          Add places, track visits, and share your London adventures with friends and family.
        </p>
        <div className={styles.heroCtas}>
          <Link href="/register" className={styles.ctaPrimary}>
            Create your free list
          </Link>
          <Link href="/login" className={styles.ctaSecondary}>
            Log in
          </Link>
        </div>
      </section>

      <section className={styles.features} aria-label="Features">
        {FEATURES.map((f) => (
          <div key={f.heading} className={styles.feature}>
            <span className={styles.featureIcon} aria-hidden="true">{f.icon}</span>
            <h2 className={styles.featureHeading}>{f.heading}</h2>
            <p className={styles.featureText}>{f.text}</p>
          </div>
        ))}
      </section>
    </>
  );
}

function LoggedInHero() {
  const authHeader = useAuthHeader();
  const { data } = useQuery<{ listItems: BannerItem[] }>(GET_ALL_MY_ITEMS, {
    context: { headers: authHeader },
    fetchPolicy: 'cache-and-network',
  });
  const items = data?.listItems ?? [];
  const { streak, atRisk } = useStreak(items);
  const done = items.filter((i) => i.completed).length;
  const total = items.length;
  const milestoneMsg = nextMilestoneMessage(total, done);
  const showBanner = total > 0 || atRisk;

  return (
    <>
      <div className={styles.hero}>
        <h1 className={styles.heading}>What do you want to do in London?</h1>
        <p className={styles.subheading}>Search for a place and add it to your list.</p>
      </div>
      {showBanner && (
        <section className={styles.welcomeBanner} aria-label="Your progress">
          <StreakBadge streak={streak} atRisk={atRisk} />
          {milestoneMsg && (
            <p className={styles.welcomeBannerMilestone}>{milestoneMsg}</p>
          )}
          <Link href="/my-list" className={styles.welcomeBannerLink}>
            Continue exploring &rarr;
          </Link>
        </section>
      )}
      <PlaceSearch />
      <p className={styles.loginPrompt}>
        <Link href="/my-list">View your list &rarr;</Link>
      </p>
    </>
  );
}
