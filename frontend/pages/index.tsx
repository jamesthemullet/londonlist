import Head from 'next/head';
import Link from 'next/link';
import PlaceSearch from '../components/search/place-search';
import { useAppContext } from '../context/AppContext';
import styles from './index.module.css';

export default function Home() {
  const { user } = useAppContext();

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
          <p className={styles.subheading}>
            Search for a place and add it to your list.
          </p>
        </div>
        <PlaceSearch />
        {!user && (
          <p className={styles.loginPrompt}>
            <Link href="/login">Log in</Link> or <Link href="/register">sign up</Link> to save places to your list.
          </p>
        )}
        {user && (
          <p className={styles.loginPrompt}>
            <Link href="/my-list">View your list &rarr;</Link>
          </p>
        )}
      </main>
    </>
  );
}
