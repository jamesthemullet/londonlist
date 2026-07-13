import Link from 'next/link';
import styles from './footer.module.css';

export default function Footer() {
  const year = new Date().getFullYear();
  return (
    <footer className={styles.footer}>
      <div className={styles.inner}>
        <div className={styles.brand}>
          <Link href="/" className={styles.brandLink}>London List</Link>
          <p className={styles.tagline}>Your London bucket list, beautifully organised.</p>
        </div>
        <nav aria-label="Footer navigation" className={styles.nav}>
          <Link href="/" className={styles.link}>Home</Link>
          <Link href="/register" className={styles.link}>Sign up free</Link>
          <Link href="/login" className={styles.link}>Log in</Link>
        </nav>
      </div>
      <p className={styles.copy}>&copy; {year} London List. All rights reserved.</p>
    </footer>
  );
}
