import Link from 'next/link';
import { useRouter } from 'next/router';
import { useAppContext } from '../../context/AppContext';
import Cookie from 'js-cookie';

import { Crimson_Text } from 'next/font/google';
import Footer from '../footer/footer';
import Meta from '../meta/meta';
import { Button } from '../core/button/button';
const crimsonText = Crimson_Text({ weight: '400', subsets: ['latin'] });
import styles from './layout.module.css';

type AppContextType = {
  // update later
  user: any;
  setUser: any;
};

function Navigation() {
  const { user, setUser } = useAppContext() as AppContextType;

  const router = useRouter();

  function handleLogout() {
    setUser(null);
    Cookie.remove('token');
    router.push('/');
  }
  return (
    <header className={crimsonText.className}>
      <nav className={styles.nav}>
        <div>
          <Link href="/">London List</Link>
        </div>

        <div>
          {user ? (
            <div>
              <span>{user.username}</span>
              <Button onClick={handleLogout}>Log Out</Button>
            </div>
          ) : (
            <div>
              <Link href="/login">
                <Button>Log In</Button>
              </Link>
              <Link href="/register">
                <Button>Sign Up</Button>
              </Link>
            </div>
          )}
        </div>
      </nav>
      <h1>London List</h1>
    </header>
  );
}

export default function Layout(props) {
  const router = useRouter();
  const currentUrl = router.asPath ?? '';

  return (
    <>
      <Meta currentUrl={currentUrl} />
      <Navigation />
      <div className={styles.pageContainer}>{props.children}</div>
      <Footer />
    </>
  );
}
