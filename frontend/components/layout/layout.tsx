import Cookie from 'js-cookie';
import Link from 'next/link';
import { useRouter } from 'next/router';
import type React from 'react';
import { useEffect, useRef, useState } from 'react';
import { useAppContext } from '../../context/AppContext';

import { Crimson_Text } from 'next/font/google';
import { Button } from '../core/button/button';
import Footer from '../footer/footer';
import Meta from '../meta/meta';
const crimsonText = Crimson_Text({ weight: '400', subsets: ['latin'] });
import styles from './layout.module.css';

function Navigation() {
  const { user, setUser } = useAppContext();
  const router = useRouter();
  const [menuOpen, setMenuOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);
  const hamburgerRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    if (!menuOpen) return;
    function handleKey(e: KeyboardEvent) {
      if (e.key === 'Escape') {
        setMenuOpen(false);
        /* istanbul ignore next */
        hamburgerRef.current?.focus();
      }
    }
    document.addEventListener('keydown', handleKey);
    return () => document.removeEventListener('keydown', handleKey);
  }, [menuOpen]);

  // biome-ignore lint/correctness/useExhaustiveDependencies: router.asPath change is the intended trigger to close the menu
  useEffect(() => {
    setMenuOpen(false);
  }, [router.asPath]);

  function handleLogout() {
    setUser(null);
    Cookie.remove('token');
    router.push('/');
  }

  return (
    <header>
      <nav className={`${styles.nav} ${crimsonText.className}`}>
        <div className={styles.navBrand}>
          <Link href="/" aria-label="London List — home">London List</Link>
          <Link href="/explore">Explore</Link>
          <Link href="/templates">Starter Lists</Link>
        </div>

        <button
          ref={hamburgerRef}
          type="button"
          className={styles.hamburger}
          aria-label={menuOpen ? 'Close menu' : 'Open menu'}
          aria-expanded={menuOpen}
          aria-controls="nav-menu"
          onClick={() => setMenuOpen((prev) => !prev)}
        >
          <span className={styles.hamburgerLine} aria-hidden="true" />
          <span className={styles.hamburgerLine} aria-hidden="true" />
          <span className={styles.hamburgerLine} aria-hidden="true" />
        </button>

        <div
          id="nav-menu"
          ref={menuRef}
          className={`${styles.navMenu} ${menuOpen ? styles.navMenuOpen : ''}`}
        >
          {user ? (
            <div className={styles.navLinks}>
              <Link href="/my-list" onClick={() => setMenuOpen(false)}>My List</Link>
              <Link href="/pricing" onClick={() => setMenuOpen(false)}>Pricing</Link>
              <span>{user.username}</span>
              <Button onClick={handleLogout}>Log Out</Button>
            </div>
          ) : (
            <div className={styles.navLinks}>
              <Link href="/pricing" onClick={() => setMenuOpen(false)}>Pricing</Link>
              <Link href="/login" onClick={() => setMenuOpen(false)}>
                <Button>Log In</Button>
              </Link>
              <Link href="/register" onClick={() => setMenuOpen(false)}>
                <Button>Sign Up</Button>
              </Link>
            </div>
          )}
        </div>
      </nav>
    </header>
  );
}

export default function Layout({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const currentUrl = router.asPath ?? '';

  return (
    <div className={styles.wrapper}>
      <a href="#main-content" className={styles.skipLink}>
        Skip to main content
      </a>
      <Meta currentUrl={currentUrl} />
      <Navigation />
      <div id="main-content" className={styles.pageContainer}>{children}</div>
      <Footer />
    </div>
  );
}
