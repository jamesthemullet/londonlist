import Head from 'next/head';
import Link from 'next/link';
import { useEffect, useState } from 'react';
import PlaceSearch from '../components/search/place-search';
import { useAppContext } from '../context/AppContext';
import styles from './index.module.css';

const API_URL = process.env.STRAPI_URL || 'http://127.0.0.1:1337';
const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || 'https://londonlist.vercel.app';

export function buildWebSiteJsonLd(siteUrl: string): object {
  return {
    '@context': 'https://schema.org',
    '@graph': [
      {
        '@type': 'WebSite',
        name: 'London List',
        url: siteUrl,
        description:
          'Build your London bucket list. Add places to visit, track your adventures, and share curated lists with friends.',
        potentialAction: {
          '@type': 'SearchAction',
          target: `${siteUrl}/explore?q={search_term_string}`,
          'query-input': 'required name=search_term_string',
        },
      },
      {
        '@type': 'Organization',
        name: 'London List',
        url: siteUrl,
      },
    ],
  };
}

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
        {buildWebSiteJsonLd(SITE_URL) && (
          // biome-ignore lint/security/noDangerouslySetInnerHtml: JSON-LD is server-generated; JSON.stringify output is XSS-safe
          <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(buildWebSiteJsonLd(SITE_URL)) }} />
        )}
      </Head>
      <main className={styles.main}>
        {user ? (
          <LoggedInHero isPro={user.isPro} />
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

function LoggedInHero({ isPro }: { isPro: boolean }) {
  return (
    <>
      <div className={styles.hero}>
        <h1 className={styles.heading}>What do you want to do in London?</h1>
        <p className={styles.subheading}>Search for a place and add it to your list.</p>
      </div>
      <PlaceSearch />
      <p className={styles.loginPrompt}>
        <Link href="/my-list">View your list &rarr;</Link>
      </p>
      {!isPro && (
        <aside className={styles.proNudge} aria-label="Upgrade to Pro">
          <p className={styles.proNudgeText}>
            <strong>Free plan:</strong> up to 3 lists.{' '}
            <Link href="/pricing" className={styles.proNudgeLink}>
              Upgrade to Pro for unlimited lists &rarr;
            </Link>
          </p>
        </aside>
      )}
    </>
  );
}
