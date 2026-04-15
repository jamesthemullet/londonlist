import Head from 'next/head';
import { useRouter } from 'next/router';
import { useEffect } from 'react';
import { useAppContext } from '../context/AppContext';
import PlaceSearch from '../components/search/place-search';
import MyList from '../components/my-list/my-list';
import styles from './my-list.module.css';

export default function MyListPage() {
  const { user } = useAppContext();
  const router = useRouter();

  useEffect(() => {
    if (user === null) {
      router.push('/login');
    }
  }, [user, router]);

  if (!user) return null;

  return (
    <>
      <Head>
        <title>My List — London List</title>
        <meta name="description" content="Your London to-do list" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
      </Head>
      <main className={styles.main}>
        <h1 className={styles.heading}>My List</h1>
        <section className={styles.section}>
          <h2 className={styles.subheading}>Add a place</h2>
          <PlaceSearch />
        </section>
        <section className={styles.section}>
          <MyList userId={user.id} />
        </section>
      </main>
    </>
  );
}
