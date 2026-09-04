import { gql } from '@apollo/client';
import { useMutation } from '@apollo/client/react';
import Head from 'next/head';
import Link from 'next/link';
import dynamic from 'next/dynamic';
import { useState } from 'react';
import type { GetServerSideProps } from 'next';
import { useAppContext } from '../../../context/AppContext';
import { useAuthHeader } from '../../../hooks/use-auth-header';
import ShareButtons from '../../../components/share-buttons/share-buttons';
import { buildOgImageUrl } from '../../../lib/og-image';
import BookingLinks from '../../../components/booking-links/booking-links';
import styles from '../[username].module.css';
import type { MapItem } from '../../../components/map/list-map';

const ListMap = dynamic(() => import('../../../components/map/list-map'), { ssr: false });

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || 'https://londonlist.vercel.app';

const API_URL = process.env.STRAPI_URL || 'http://127.0.0.1:1337';

type ListItem = {
  documentId: string;
  name: string;
  category: string | null;
  completed: boolean;
  osm_id: string;
  visitedAt: string | null;
  notes?: string | null;
  lat?: number | null;
  lng?: number | null;
};

type PublicListData = {
  data: ListItem[];
  username: string;
  listName: string;
  description?: string | null;
  viewCount?: number;
};

type OtherList = {
  documentId: string;
  name: string;
  itemCount: number;
};

type RelatedList = {
  documentId: string;
  name: string;
  username: string;
  itemCount: number;
  categories: string[];
};

type PublicExploreList = {
  documentId: string;
  name: string;
  username: string | null;
  itemCount: number;
  categories: string[];
};

type PageState = 'found' | 'private' | 'not_found';

type Props = {
  pageState: PageState;
  listData: PublicListData | null;
  username: string;
  listId: string;
  otherLists?: OtherList[];
  relatedLists?: RelatedList[];
};

export function selectRelatedLists(
  currentCategories: string[],
  currentListId: string,
  currentUsername: string,
  allLists: PublicExploreList[],
  limit = 3,
): RelatedList[] {
  const currentCategorySet = new Set(currentCategories.map((c) => c.toLowerCase()));

  return allLists
    .filter(
      (l) =>
        l.documentId !== currentListId &&
        l.username !== currentUsername &&
        l.username !== null &&
        l.itemCount > 0,
    )
    .map((l) => {
      const overlap = l.categories.filter((c) => currentCategorySet.has(c.toLowerCase())).length;
      return { list: l, overlap };
    })
    .filter(({ overlap }) => overlap > 0)
    .sort((a, b) => b.overlap - a.overlap || b.list.itemCount - a.list.itemCount)
    .slice(0, limit)
    .map(({ list }) => ({
      documentId: list.documentId,
      name: list.name,
      username: list.username as string,
      itemCount: list.itemCount,
      categories: list.categories,
    }));
}

const CREATE_MY_LIST = gql`
  mutation CopyListCreateMyList($name: String!) {
    createMyList(name: $name) {
      documentId
      name
    }
  }
`;

const COPY_LIST_ITEM = gql`
  mutation CopyListCreateListItem($osm_id: String!, $name: String!, $category: String, $list: ID) {
    createListItem(
      data: { osm_id: $osm_id, name: $name, category: $category, completed: false, list: $list }
    ) {
      documentId
    }
  }
`;

type CopyListButtonProps = {
  items: ListItem[];
  listName: string;
};

export function CopyListButton({ items, listName }: CopyListButtonProps) {
  const authHeader = useAuthHeader();
  const [copyState, setCopyState] = useState<'idle' | 'copying' | 'done' | 'error'>('idle');
  const [createMyList] = useMutation<{ createMyList: { documentId: string } }>(CREATE_MY_LIST);
  const [createListItem] = useMutation(COPY_LIST_ITEM);

  async function handleCopy() {
    setCopyState('copying');
    try {
      const { data } = await createMyList({
        variables: { name: listName },
        context: { headers: authHeader },
      });
      const newListId = data?.createMyList?.documentId;
      if (!newListId) throw new Error('Failed to create list');
      for (const item of items) {
        await createListItem({
          variables: {
            osm_id: item.osm_id,
            name: item.name,
            category: item.category ?? null,
            list: newListId,
          },
          context: { headers: authHeader },
        });
      }
      setCopyState('done');
    } catch {
      setCopyState('error');
    }
  }

  if (copyState === 'done') {
    return (
      <div className={styles.copySuccess}>
        List copied!{' '}
        <Link href="/my-list" className={styles.copySuccessLink}>
          View your lists →
        </Link>
      </div>
    );
  }

  return (
    <div className={styles.copyWrapper}>
      <button
        type="button"
        className={styles.copyButton}
        onClick={handleCopy}
        disabled={copyState === 'copying'}
        aria-busy={copyState === 'copying'}
      >
        {copyState === 'copying' ? 'Copying…' : '+ Copy this list'}
      </button>
      {copyState === 'error' && (
        <p className={styles.copyError}>Something went wrong. Please try again.</p>
      )}
    </div>
  );
}

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

export function buildOgDescription(listData: PublicListData): string {
  const { data: items, username, listName, description } = listData;
  if (description) return description;
  const total = items.length;
  const todo = items.filter((i) => !i.completed).length;
  const done = items.filter((i) => i.completed).length;
  const placeWord = total === 1 ? 'place' : 'places';
  if (total === 0) return `${username}'s London list: ${listName}`;
  return `${username}'s London list: ${total} ${placeWord} to explore — ${todo} to visit, ${done} done.`;
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

export default function PublicListPage({ pageState, listData, username, listId, otherLists = [], relatedLists = [] }: Props) {
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
  const ogImage = buildOgImageUrl(
    { title: listData?.listName ?? '', username, itemCount: items.length, doneCount: done.length },
    SITE_URL,
  );

  const mapItems: MapItem[] = items
    .filter((i): i is ListItem & { lat: number; lng: number } => i.lat != null && i.lng != null)
    .map((i) => ({
      documentId: i.documentId,
      name: i.name,
      lat: i.lat,
      lng: i.lng,
      completed: i.completed,
      category: i.category,
    }));

  const canonicalUrl = `${SITE_URL}/list/${username}/${listId}`;
  const pageTitle = `${listData?.listName} — ${username}'s London List`;
  const listDescription = listData?.description ?? null;
  const pageDescription =
    listDescription ??
    (items.length > 0
      ? `${username} is exploring London. ${items.length} place${items.length === 1 ? '' : 's'} on their "${listData?.listName}" list — ${todo.length} to do, ${done.length} done.`
      : `${username}'s London list: ${listData?.listName}`);

  return (
    <>
      <Head>
        <title>
          {listData?.listName} — {username}&apos;s London List
        </title>
        <meta name="description" content={pageDescription} />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <link rel="canonical" href={canonicalUrl} />
        <meta property="og:type" content="article" />
        <meta property="og:site_name" content="London List" />
        <meta property="og:title" content={pageTitle} />
        <meta property="og:description" content={pageDescription} />
        <meta property="og:url" content={canonicalUrl} />
        <meta property="og:image" content={ogImage} />
        <meta property="og:locale" content="en_GB" />
        <meta name="twitter:card" content="summary_large_image" />
        <meta name="twitter:title" content={pageTitle} />
        <meta name="twitter:description" content={pageDescription} />
        <meta name="twitter:image" content={ogImage} />
        {jsonLd && (
          // biome-ignore lint/security/noDangerouslySetInnerHtml: JSON-LD is server-generated; JSON.stringify output is XSS-safe
          <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
        )}
      </Head>
      <main className={styles.main}>
        <h1 className={styles.heading}>{listData?.listName}</h1>
        <div className={styles.metaRow}>
          <p className={styles.subtitle}>
            <Link href={`/profile/${username}`}>{username}&apos;s lists</Link>
          </p>
          {listData?.viewCount !== undefined && listData.viewCount > 0 && (
            <span className={styles.viewCount}>
              <span aria-hidden="true">👁</span>{' '}
              {listData.viewCount.toLocaleString()} {listData.viewCount === 1 ? 'view' : 'views'}
            </span>
          )}
        </div>
        {listDescription && (
          <p className={styles.listDescription}>{listDescription}</p>
        )}
        {mapItems.length > 0 && (
          <>
            <div className={styles.mapContainer}>
              <ListMap items={mapItems} />
            </div>
            <p className={styles.mapLegend}>
              <span className={styles.mapLegendItem}>
                <span className={styles.mapLegendDot} style={{ background: '#c724b1' }} aria-hidden="true" />
                To do
              </span>
              <span className={styles.mapLegendItem}>
                <span className={styles.mapLegendDot} style={{ background: '#22c55e' }} aria-hidden="true" />
                Done
              </span>
            </p>
          </>
        )}
        <ShareButtons url={canonicalUrl} title={pageTitle} />
        {initialized && user && items.length > 0 && (
          <CopyListButton items={items} listName={listData?.listName ?? 'Copied list'} />
        )}
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
                      <div className={styles.itemMain}>
                        <span className={styles.name}>{item.name}</span>
                        {item.category && (
                          <span className={styles.category}>{item.category}</span>
                        )}
                      </div>
                      {item.notes && <p className={styles.itemNotes}>{item.notes}</p>}
                      <BookingLinks name={item.name} category={item.category} />
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
                      <div className={styles.itemMain}>
                        <span className={styles.nameDone}>{item.name}</span>
                        {item.category && (
                          <span className={styles.category}>{item.category}</span>
                        )}
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
                      </div>
                      {item.notes && <p className={styles.itemNotes}>{item.notes}</p>}
                      <BookingLinks name={item.name} category={item.category} />
                    </li>
                  ))}
                </ul>
              </section>
            )}
          </div>
        )}
      </main>
      {otherLists.length > 0 && (
        <section className={styles.moreLists} aria-label={`More lists by ${username}`}>
          <h2 className={styles.moreListsHeading}>More by {username}</h2>
          <ul className={styles.moreListsGrid}>
            {otherLists.map((list) => (
              <li key={list.documentId}>
                <Link
                  href={`/list/${username}/${list.documentId}`}
                  className={styles.moreListCard}
                >
                  <span className={styles.moreListName}>{list.name}</span>
                  {list.itemCount > 0 && (
                    <span className={styles.moreListCount}>
                      {list.itemCount} {list.itemCount === 1 ? 'place' : 'places'}
                    </span>
                  )}
                </Link>
              </li>
            ))}
          </ul>
        </section>
      )}

      {relatedLists.length > 0 && (
        <section className={styles.relatedLists} aria-label="Related lists you might like">
          <h2 className={styles.moreListsHeading}>You might also like</h2>
          <ul className={styles.moreListsGrid}>
            {relatedLists.map((list) => (
              <li key={list.documentId}>
                <Link
                  href={`/list/${list.username}/${list.documentId}`}
                  className={styles.moreListCard}
                >
                  <span className={styles.moreListName}>{list.name}</span>
                  <span className={styles.moreListMeta}>
                    <span className={styles.moreListCount}>
                      {list.itemCount} {list.itemCount === 1 ? 'place' : 'places'}
                    </span>
                    <span className={styles.moreListAuthor}>by {list.username}</span>
                  </span>
                </Link>
              </li>
            ))}
          </ul>
          <p className={styles.relatedExploreLink}>
            <Link href="/explore">Browse all London lists →</Link>
          </p>
        </section>
      )}

      {initialized && !user && (
        <aside className={styles.conversionBanner}>
          <p className={styles.conversionHeadline}>
            {items.length > 0 ? (
              <>Copy {username}&apos;s list</>
            ) : (
              <>Inspired by {username}&apos;s list?</>
            )}
          </p>
          <p className={styles.conversionTagline}>
            {items.length > 0
              ? "Sign up free to copy this list and track your own London adventures."
              : "Build your own London bucket list — it’s free."}
          </p>
          <Link href="/register?ref=copy-list" className={styles.conversionCta}>
            {items.length > 0 ? "Copy this list" : "Create your list"}
          </Link>
        </aside>
      )}
    </>
  );
}

export const getServerSideProps: GetServerSideProps<Props> = async (context) => {
  const { username, listId } = context.params as { username: string; listId: string };

  try {
    const [listRes, profileRes, exploreRes] = await Promise.all([
      fetch(`${API_URL}/api/lists/public/${username}/${listId}`, {
        signal: AbortSignal.timeout(5000),
      }),
      fetch(`${API_URL}/api/lists/public/${username}`, {
        signal: AbortSignal.timeout(5000),
      }),
      fetch(`${API_URL}/api/lists/public?pageSize=50`, {
        signal: AbortSignal.timeout(5000),
      }),
    ]);

    if (listRes.status === 403) {
      return { props: { pageState: 'private', listData: null, username, listId, otherLists: [], relatedLists: [] } };
    }
    if (listRes.status === 404) {
      return { props: { pageState: 'not_found', listData: null, username, listId, otherLists: [], relatedLists: [] } };
    }
    if (listRes.ok) {
      const data: PublicListData = await listRes.json();

      let otherLists: OtherList[] = [];
      if (profileRes.ok) {
        const profileData: { lists: Array<{ documentId: string; name: string; itemCount: number }> } =
          await profileRes.json();
        otherLists = (profileData.lists ?? []).filter((l) => l.documentId !== listId);
      }

      let relatedLists: RelatedList[] = [];
      if (exploreRes.ok) {
        const exploreData: { data: PublicExploreList[] } = await exploreRes.json();
        const currentCategories = [...new Set(data.data.map((i) => i.category).filter((c): c is string => c !== null))];
        relatedLists = selectRelatedLists(currentCategories, listId, username, exploreData.data ?? []);
      }

      return { props: { pageState: 'found', listData: data, username, listId, otherLists, relatedLists } };
    }
    return { props: { pageState: 'not_found', listData: null, username, listId, otherLists: [], relatedLists: [] } };
  } catch {
    return { props: { pageState: 'not_found', listData: null, username, listId, otherLists: [], relatedLists: [] } };
  }
};
