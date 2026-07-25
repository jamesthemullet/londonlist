import Head from 'next/head';
import Link from 'next/link';
import { useEffect, useState } from 'react';
import PlaceSearch from '../components/search/place-search';
import { useAppContext } from '../context/AppContext';
import styles from './index.module.css';

const API_URL = process.env.STRAPI_URL || 'http://127.0.0.1:1337';

type PublicList = {
  documentId: string;
  name: string;
  username: string | null;
};

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
        <title>London List</title>
        <meta name="description" content="Build your London to-do list" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <link rel="icon" href="/favicon.ico" />
      </Head>
      <main className={styles.main}>
        <div className={styles.hero}>
          <h1 className={styles.heading}>What do you want to do in London?</h1>
          <p className={styles.subheading}>Search for a place and add it to your list.</p>
        </div>
        <PlaceSearch />
        {!user && (
          <p className={styles.loginPrompt}>
            <Link href="/login">Log in</Link> or <Link href="/register">sign up</Link> to save
            places to your list.
          </p>
        )}
        {user && (
          <p className={styles.loginPrompt}>
            <Link href="/my-list">View your list &rarr;</Link>
          </p>
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
