import Head from 'next/head';
import { useRouter } from 'next/router';
import { useEffect, useState } from 'react';
import styles from '../[username].module.css';

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
  listName: string;
};

type PageState = 'loading' | 'found' | 'private' | 'not_found';

export default function PublicListPage() {
  const router = useRouter();
  const { username, listId } = router.query;
  const [listData, setListData] = useState<PublicListData | null>(null);
  const [pageState, setPageState] = useState<PageState>('loading');

  const API_URL = process.env.STRAPI_URL || 'http://127.0.0.1:1337';

  useEffect(() => {
    if (!username || typeof username !== 'string' || !listId || typeof listId !== 'string') return;

    setPageState('loading');

    const fetchPublicList = async () => {
      try {
        const res = await fetch(`${API_URL}/api/lists/public/${username}/${listId}`);
        if (res.status === 403) {
          setPageState('private');
        } else if (res.status === 404) {
          setPageState('not_found');
        } else if (res.ok) {
          const data: PublicListData = await res.json();
          setListData(data);
          setPageState('found');
        } else {
          setPageState('not_found');
        }
      } catch {
        setPageState('not_found');
      }
    };

    fetchPublicList();
  }, [username, listId, API_URL]);

  if (pageState === 'loading') {
    return (
      <main className={styles.main}>
        <p>Loading...</p>
      </main>
    );
  }

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

  return (
    <>
      <Head>
        <title>
          {listData?.listName} — {username}&apos;s London List
        </title>
        <meta name="description" content={`${username}'s London list: ${listData?.listName}`} />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
      </Head>
      <main className={styles.main}>
        <h1 className={styles.heading}>{listData?.listName}</h1>
        <p className={styles.subtitle}>{username}&apos;s list</p>
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
