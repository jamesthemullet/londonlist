import Head from 'next/head';
import Link from 'next/link';
import type { GetServerSideProps } from 'next';
import type { ReactNode } from 'react';
import type { NextPageWithLayout } from '../../_app';
import styles from './[listId].module.css';

const API_URL = process.env.STRAPI_URL || 'http://127.0.0.1:1337';
const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || 'https://londonlist.co.uk';

type ListItem = {
  documentId: string;
  name: string;
  category: string | null;
  completed: boolean;
  visitedAt: string | null;
};

type EmbedListData = {
  data: ListItem[];
  listName: string;
  username: string;
  description?: string | null;
};

type PageState = 'found' | 'private' | 'not_found';

type Props = {
  pageState: PageState;
  listData: EmbedListData | null;
  username: string;
  listId: string;
};

export function buildEmbedCode(username: string, listId: string, siteUrl: string): string {
  const src = `${siteUrl}/embed/${username}/${listId}`;
  return `<iframe src="${src}" width="100%" height="520" frameborder="0" title="London List — ${username}'s list" style="border:1px solid #e5e7eb;border-radius:8px;"></iframe>`;
}

const EmbedPage: NextPageWithLayout<Props> = ({ pageState, listData, username, listId }) => {
  const fullUrl = `${SITE_URL}/list/${username}/${listId}`;

  if (pageState === 'not_found') {
    return (
      <div className={styles.widget}>
        <p className={styles.message}>List not found.</p>
      </div>
    );
  }

  if (pageState === 'private') {
    return (
      <div className={styles.widget}>
        <p className={styles.message}>This list is private.</p>
      </div>
    );
  }

  const items = listData?.data ?? [];
  const todo = items.filter((i) => !i.completed);
  const done = items.filter((i) => i.completed);

  return (
    <>
      <Head>
        <title>{listData?.listName} — London List</title>
        <meta name="robots" content="noindex" />
      </Head>
      <div className={styles.widget}>
        <div className={styles.header}>
          <h1 className={styles.title}>
            <Link href={fullUrl} target="_blank" rel="noopener noreferrer" className={styles.titleLink}>
              {listData?.listName}
            </Link>
          </h1>
          <p className={styles.meta}>by {username}</p>
        </div>

        {listData?.description && (
          <p className={styles.description}>{listData.description}</p>
        )}

        {items.length === 0 ? (
          <p className={styles.message}>This list is empty.</p>
        ) : (
          <div className={styles.lists}>
            {todo.length > 0 && (
              <section>
                <h2 className={styles.sectionLabel}>To do ({todo.length})</h2>
                <ul className={styles.list}>
                  {todo.map((item) => (
                    <li key={item.documentId} className={styles.item}>
                      <span className={styles.bullet} aria-hidden="true" />
                      <span className={styles.name}>{item.name}</span>
                      {item.category && <span className={styles.category}>{item.category}</span>}
                    </li>
                  ))}
                </ul>
              </section>
            )}
            {done.length > 0 && (
              <section>
                <h2 className={styles.sectionLabel}>Done ({done.length})</h2>
                <ul className={styles.list}>
                  {done.map((item) => (
                    <li key={item.documentId} className={`${styles.item} ${styles.itemDone}`}>
                      <span className={styles.checkmark} aria-hidden="true">✓</span>
                      <span className={styles.nameDone}>{item.name}</span>
                      {item.category && <span className={styles.category}>{item.category}</span>}
                    </li>
                  ))}
                </ul>
              </section>
            )}
          </div>
        )}

        <div className={styles.footer}>
          <Link href={fullUrl} target="_blank" rel="noopener noreferrer" className={styles.footerLink}>
            View full list on London List →
          </Link>
        </div>
      </div>
    </>
  );
};

EmbedPage.getLayout = (page: ReactNode) => page;

export default EmbedPage;

export const getServerSideProps: GetServerSideProps<Props> = async ({ params, res }) => {
  const { username, listId } = params as { username: string; listId: string };

  try {
    const response = await fetch(`${API_URL}/api/lists/public/${username}/${listId}`, {
      signal: AbortSignal.timeout(5000),
    });

    if (response.status === 403) {
      return { props: { pageState: 'private', listData: null, username, listId } };
    }
    if (response.status === 404 || !response.ok) {
      return { props: { pageState: 'not_found', listData: null, username, listId } };
    }

    const data: EmbedListData = await response.json();
    res.setHeader('Cache-Control', 'public, s-maxage=60, stale-while-revalidate=300');
    return { props: { pageState: 'found', listData: data, username, listId } };
  } catch {
    return { props: { pageState: 'not_found', listData: null, username, listId } };
  }
};
