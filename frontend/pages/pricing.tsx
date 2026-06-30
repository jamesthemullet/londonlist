import Head from 'next/head';
import Link from 'next/link';
import { useAppContext } from '../context/AppContext';
import styles from './pricing.module.css';

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
  const { user } = useAppContext();

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
            <div className={styles.badge}>Coming soon</div>
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
              <button type="button" className={styles.ctaPrimary} disabled aria-disabled="true">
                Upgrade to Pro
              </button>
              <p className={styles.ctaNote}>Payments coming soon — join the waitlist below.</p>
            </div>
          </div>
        </div>

        <div className={styles.faq}>
          <h2 className={styles.faqHeading}>Common questions</h2>
          <dl className={styles.faqList}>
            <div className={styles.faqItem}>
              <dt className={styles.faqQuestion}>Can I try London List for free?</dt>
              <dd className={styles.faqAnswer}>
                Yes — the Free plan is unlimited in time. Create up to 3 lists,
                track your London adventures, and share them with friends at no cost.
              </dd>
            </div>
            <div className={styles.faqItem}>
              <dt className={styles.faqQuestion}>When will Pro launch?</dt>
              <dd className={styles.faqAnswer}>
                We are working on it. Sign up for a free account and we will let
                you know as soon as Pro is available.
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
