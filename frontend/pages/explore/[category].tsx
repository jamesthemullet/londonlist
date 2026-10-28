import Head from 'next/head';
import Link from 'next/link';
import type { GetServerSideProps } from 'next';
import { useAppContext } from '../../context/AppContext';
import { buildOgImageUrl } from '../../lib/og-image';
import { safeJsonLd } from '../../lib/json-ld';
import { CATEGORY_META } from '../../lib/category-meta';
import type { CategoryMeta } from '../../lib/category-meta';
import styles from '../explore.module.css';

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

export function buildCategoryJsonLd(
  category: string,
  meta: CategoryMeta,
  lists: PublicList[],
  siteUrl: string,
): object {
  return {
    '@context': 'https://schema.org',
    '@type': 'CollectionPage',
    name: `London ${meta.label} Lists`,
    description: meta.description,
    url: `${siteUrl}/explore/${category}`,
    mainEntity: {
      '@type': 'ItemList',
      name: `London ${meta.label} Lists`,
      numberOfItems: lists.length,
      itemListElement: lists.map((list, index) => ({
        '@type': 'ListItem',
        position: index + 1,
        name: list.name,
        url: `${siteUrl}/list/${list.username}/${list.documentId}`,
      })),
    },
  };
}

type Props = {
  lists: PublicList[];
  category: string;
  meta: CategoryMeta;
};

export default function CategoryExplorePage({ lists, category, meta }: Props) {
  const { user, initialized } = useAppContext();

  const pageTitle = `London ${meta.label} Lists — London List`;
  const ogUrl = `${SITE_URL}/explore/${category}`;
  const jsonLd = buildCategoryJsonLd(category, meta, lists, SITE_URL);
  const ogImage = buildOgImageUrl({ title: pageTitle }, SITE_URL);

  return (
    <>
      <Head>
        <title>{pageTitle}</title>
        <meta name="description" content={meta.description} />
        <link rel="canonical" href={ogUrl} />
        <meta property="og:title" content={`London ${meta.label} Lists`} />
        <meta property="og:description" content={meta.description} />
        <meta property="og:url" content={ogUrl} />
        <meta property="og:type" content="website" />
        <meta property="og:image" content={ogImage} />
        <meta name="twitter:card" content="summary_large_image" />
        <meta name="twitter:title" content={`London ${meta.label} Lists`} />
        <meta name="twitter:description" content={meta.description} />
        <meta name="twitter:image" content={ogImage} />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        {jsonLd && (
          // biome-ignore lint/security/noDangerouslySetInnerHtml: JSON-LD structured data; safeJsonLd escapes </script> to prevent XSS
          <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: safeJsonLd(jsonLd) }} />
        )}
      </Head>
      <main className={styles.main}>
        <nav aria-label="Breadcrumb" className={styles.breadcrumb}>
          <Link href="/explore">Explore</Link>
          {' › '}
          <span aria-current="page">{meta.label}</span>
        </nav>

        <div className={styles.hero}>
          <h1 className={styles.heading}>London {meta.label} Lists</h1>
          <p className={styles.subheading}>{meta.description}</p>
        </div>

        {initialized && !user && (
          <div className={styles.ctaBanner}>
            <p className={styles.ctaText}>
              Inspired by what you see?{' '}
              <Link href={`/register?ref=explore-${category}`}>
                Build your own list — it&apos;s free.
              </Link>
            </p>
          </div>
        )}

        {lists.length === 0 ? (
          <p className={styles.empty}>
            No public {meta.label.toLowerCase()} lists yet —{' '}
            <Link href="/register">be the first!</Link>
          </p>
        ) : (
          <>
            <p className={styles.count} aria-live="polite">
              {lists.length} list{lists.length !== 1 ? 's' : ''}
            </p>
            <ul className={styles.grid}>
              {lists.map((list) => (
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
                  </Link>
                </li>
              ))}
            </ul>
          </>
        )}

        {initialized && user && !user.isPro && (
          <aside className={styles.proNudge} aria-label="Upgrade to Pro">
            <p className={styles.proNudgeText}>
              Want your list to stand out?{' '}
              <Link href={`/pricing?ref=category-nudge-${category}`} className={styles.proNudgeLink}>
                Upgrade to Pro
              </Link>{' '}
              to get a Featured badge on all your public lists.
            </p>
          </aside>
        )}

        <Link href="/explore" className={styles.backLink}>
          ← All lists
        </Link>
      </main>
    </>
  );
}

export const getServerSideProps: GetServerSideProps<Props> = async (context) => {
  const { category } = context.params as { category: string };

  const meta = CATEGORY_META[category];
  if (!meta) {
    return { notFound: true };
  }

  try {
    const res = await fetch(`${API_URL}/api/lists/public?pageSize=100`, {
      signal: AbortSignal.timeout(5000),
    });
    if (!res.ok) return { props: { lists: [], category, meta } };
    const json = await res.json();
    const allLists: PublicList[] = json.data ?? [];
    const filtered = allLists.filter((l) => l.categories.includes(category));
    return { props: { lists: filtered, category, meta } };
  } catch {
    return { props: { lists: [], category, meta } };
  }
};
