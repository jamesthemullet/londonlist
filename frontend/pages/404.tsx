import Head from 'next/head';
import Link from 'next/link';
import styles from './404.module.css';

export default function NotFoundPage() {
  return (
    <>
      <Head>
        <title>Page not found — London List</title>
        <meta name="robots" content="noindex" />
      </Head>
      <main className={styles.main}>
        <h1 className={styles.heading}>Page not found</h1>
        <p className={styles.message}>
          The page you&apos;re looking for doesn&apos;t exist or has been removed.
        </p>
        <Link href="/" className={styles.homeLink}>
          Back to London List
        </Link>
      </main>
    </>
  );
}
