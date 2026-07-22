import Cookie from 'js-cookie';
import Head from 'next/head';
import Link from 'next/link';
import { useRouter } from 'next/router';
import { useEffect, useState } from 'react';
import { useAppContext } from '../context/AppContext';
import styles from './pricing.module.css';

const API_URL = process.env.STRAPI_URL || 'http://127.0.0.1:1337';

const FREE_FEATURES = [
  'Up to 3 lists',
  'Public & private lists',
  'Place search across London',
  'Progress tracking & completion',
  'Monthly explorer streak',
  'Share your list with friends',
];

const PRO_FEATURES = [
  'Everything in Free',
  'Unlimited lists',
  'View counts on your public lists',
  'Early access to new features',
  'Priority support',
];

export default function PricingPage() {
  const { user, setUser } = useAppContext();
  const router = useRouter();
  const [isRedirecting, setIsRedirecting] = useState(false);
  const [checkoutError, setCheckoutError] = useState<string | null>(null);
  const checkoutStatus = router.query.checkout;
  const sessionId = router.query.session_id;

  useEffect(() => {
    if (checkoutStatus !== 'success' || typeof sessionId !== 'string' || !user || user.isPro) {
      return;
    }

    const token = Cookie.get('token');
    if (!token) return;

    fetch(`${API_URL}/api/stripe/confirm-checkout-session`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
      body: JSON.stringify({ sessionId }),
    })
      .then((response) => response.json())
      .then((data) => {
        if (data?.isPro) setUser({ ...user, isPro: true });
      })
      .catch(() => {});
  }, [checkoutStatus, sessionId, user, setUser]);

  const handleUpgrade = async () => {
    const token = Cookie.get('token');
    if (!token) {
      router.push('/login');
      return;
    }

    setCheckoutError(null);
    setIsRedirecting(true);
    try {
      const response = await fetch(`${API_URL}/api/stripe/create-checkout-session`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!response.ok) throw new Error('Failed to start checkout');
      const { url } = await response.json();
      if (!url) throw new Error('Failed to start checkout');
      window.location.href = url;
    } catch {
      setCheckoutError('Something went wrong starting checkout. Please try again.');
      setIsRedirecting(false);
    }
  };

  return (
    <>
      <Head>
        <title>Pricing — London List</title>
        <meta
          name="description"
          content="Simple pricing for London List. Start free, upgrade to Pro for unlimited lists and analytics."
        />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
      </Head>
      <main className={styles.main}>
        <div className={styles.hero}>
          <h1 className={styles.heading}>Simple, honest pricing</h1>
          <p className={styles.subheading}>
            Start free. Upgrade when you need more.
          </p>
          {checkoutStatus === 'success' && (
            <p className={styles.ctaNote}>
              Payment successful! It may take a moment for Pro features to unlock.
            </p>
          )}
        </div>

        <div className={styles.cards}>
          <div className={styles.card}>
            <div className={styles.cardHeader}>
              <h2 className={styles.tierName}>Free</h2>
              <div className={styles.price}>
                <span className={styles.amount}>£0</span>
                <span className={styles.period}>forever</span>
              </div>
            </div>
            <ul className={styles.featureList}>
              {FREE_FEATURES.map((feature) => (
                <li key={feature} className={styles.featureItem}>
                  <span className={styles.checkIcon} aria-hidden="true">✓</span>
                  {feature}
                </li>
              ))}
            </ul>
            <div className={styles.cardCta}>
              {user ? (
                <Link href="/my-list" className={styles.ctaSecondary}>
                  Go to My Lists
                </Link>
              ) : (
                <Link href="/register" className={styles.ctaSecondary}>
                  Get started free
                </Link>
              )}
            </div>
          </div>

          <div className={`${styles.card} ${styles.cardPro}`}>
            {user?.isPro && <div className={styles.badge}>Your plan</div>}
            <div className={styles.cardHeader}>
              <h2 className={styles.tierName}>Pro</h2>
              <div className={styles.price}>
                <span className={styles.amount}>£3.99</span>
                <span className={styles.period}>/month</span>
              </div>
            </div>
            <ul className={styles.featureList}>
              {PRO_FEATURES.map((feature) => (
                <li key={feature} className={styles.featureItem}>
                  <span className={styles.checkIcon} aria-hidden="true">✓</span>
                  {feature}
                </li>
              ))}
            </ul>
            <div className={styles.cardCta}>
              {user?.isPro ? (
                <p className={styles.ctaNote}>You&rsquo;re already on Pro. Thank you!</p>
              ) : (
                <>
                  <button
                    type="button"
                    className={styles.ctaPrimary}
                    onClick={handleUpgrade}
                    disabled={isRedirecting}
                  >
                    {isRedirecting ? 'Redirecting…' : 'Start 14-day free trial'}
                  </button>
                  <p className={styles.trialNote}>14 days free — then £3.99/month. Cancel anytime.</p>
                  {!user && (
                    <p className={styles.ctaNote}>You&rsquo;ll need to sign in first.</p>
                  )}
                  {checkoutStatus === 'cancelled' && (
                    <p className={styles.ctaNote}>Checkout cancelled — no charge was made.</p>
                  )}
                  {checkoutError && <p className={styles.ctaNote}>{checkoutError}</p>}
                </>
              )}
            </div>
          </div>
        </div>

        <div className={styles.faq}>
          <h2 className={styles.faqHeading}>Common questions</h2>
          <dl className={styles.faqList}>
            <div className={styles.faqItem}>
              <dt className={styles.faqQuestion}>How does the 14-day free trial work?</dt>
              <dd className={styles.faqAnswer}>
                Click &ldquo;Start 14-day free trial&rdquo; and you will get full Pro access
                immediately — no charge today. Your card is only billed after the 14 days are up.
                Cancel before the trial ends and you will never be charged.
              </dd>
            </div>
            <div className={styles.faqItem}>
              <dt className={styles.faqQuestion}>Can I try London List for free?</dt>
              <dd className={styles.faqAnswer}>
                Yes — the Free plan is unlimited in time. Create up to 3 lists,
                track your London adventures, and share them with friends at no cost.
              </dd>
            </div>
            <div className={styles.faqItem}>
              <dt className={styles.faqQuestion}>Can I cancel anytime?</dt>
              <dd className={styles.faqAnswer}>
                Yes — there is no lock-in. If you cancel, you will keep Pro
                access until the end of your current billing period.
              </dd>
            </div>
            <div className={styles.faqItem}>
              <dt className={styles.faqQuestion}>What counts as a list?</dt>
              <dd className={styles.faqAnswer}>
                Each named collection of places is one list — for example
                &ldquo;Weekend Museums&rdquo; or &ldquo;Hidden Pubs&rdquo;. You can add as many places
                as you like to each list.
              </dd>
            </div>
          </dl>
        </div>
      </main>
    </>
  );
}
