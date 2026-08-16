import Head from 'next/head';
import Link from 'next/link';
import type { GetServerSideProps } from 'next';
import { useAppContext } from '../../context/AppContext';
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

type CategoryMeta = {
  label: string;
  description: string;
};

export const CATEGORY_META: Record<string, CategoryMeta> = {
  museum: {
    label: 'Museums',
    description:
      'Curated museum trails and collection guides across London — from the V&A to the British Museum.',
  },
  restaurant: {
    label: 'Restaurants',
    description:
      'London restaurant lists — from neighbourhood favourites to Michelin-starred dining.',
  },
  cafe: {
    label: 'Cafes',
    description:
      'Coffee shop trails and café guides for London — independent spots, roasters, and hidden gems.',
  },
  bar: {
    label: 'Bars & Pubs',
    description:
      'London bar and pub lists — from Victorian boozers to craft beer bars and cocktail dens.',
  },
  park: {
    label: 'Parks & Green Spaces',
    description:
      'London park and garden lists — from Hyde Park to lesser-known green escapes.',
  },
  gallery: {
    label: 'Art Galleries',
    description:
      'Art gallery trails in London — from the Tate Modern to independent exhibition spaces.',
  },
  theatre: {
    label: 'Theatres',
    description:
      'Theatre and performing arts venue lists for London — West End, fringe, and beyond.',
  },
  cinema: {
    label: 'Cinemas',
    description:
      'Cinema venue lists in London — arthouse screens, luxury cinemas, and film club picks.',
  },
  hotel: {
    label: 'Hotels',
    description:
      'London hotel and accommodation lists — boutique stays, budget finds, and local picks.',
  },
  library: {
    label: 'Libraries',
    description:
      'Library and reading room lists in London — from the British Library to neighbourhood gems.',
  },
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
        <meta name="twitter:card" content="summary" />
        <meta name="twitter:title" content={`London ${meta.label} Lists`} />
        <meta name="twitter:description" content={meta.description} />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        {jsonLd && (
          // biome-ignore lint/security/noDangerouslySetInnerHtml: JSON-LD is server-generated; JSON.stringify output is XSS-safe
          <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
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
