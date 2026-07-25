import Head from 'next/head';
import type { GetServerSideProps } from 'next';
import styles from './[username].module.css';

const API_URL = process.env.STRAPI_URL || 'http://127.0.0.1:1337';

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

export default function PublicListPage({ pageState, listData, username }: Props) {
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

  return (
    <>
      <Head>
        <title>{username}&apos;s London List</title>
        <meta name="description" content={`${username}'s London to-do list`} />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
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
