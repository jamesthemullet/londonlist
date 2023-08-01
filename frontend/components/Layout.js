import Head from "next/head";
import Link from "next/link";
import { useRouter } from "next/router";
import { useAppContext } from "../context/AppContext";
import Cookie from "js-cookie";

function Navigation() {
  const { user, setUser } = useAppContext();
  const router = useRouter();

  function handleLogout() {
    setUser(null);
    Cookie.remove("token");
    router.push("/");
  }
  return (
    <nav>
      <div>
        <div>
          <Link href='/'>My App</Link>
        </div>

        <div>
          <div>
            <Link href='/'>Home</Link>
            <div>
              {user ? (
                <div>
                  <span>{user.username}</span>
                  <button onClick={handleLogout}>Log Out</button>
                </div>
              ) : (
                <div>
                  <Link href='/login'>Log In</Link>
                  <Link href='/register'>Sign Up</Link>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </nav>
  );
}

export default function Layout(props) {
  const title = "Welcome to Nextjs";

  return (
    <div>
      <Head>
        <title>{title}</title>
        <meta charSet='utf-8' />
        <meta name='viewport' content='initial-scale=1.0, width=device-width' />
      </Head>
      <Navigation />
      <div>{props.children}</div>
    </div>
  );
}
