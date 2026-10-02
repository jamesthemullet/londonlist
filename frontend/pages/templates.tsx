import { gql } from '@apollo/client';
import { useMutation } from '@apollo/client/react';
import Head from 'next/head';
import Link from 'next/link';
import { useState } from 'react';
import UpgradeModal from '../components/upgrade-modal/upgrade-modal';
import { useAppContext } from '../context/AppContext';
import { useAuthHeader } from '../hooks/use-auth-header';
import { TEMPLATES } from '../lib/templates';
import type { Template, TemplateItem } from '../lib/templates';
import styles from './templates.module.css';

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || 'https://londonlist.vercel.app';

const CREATE_MY_LIST = gql`
  mutation TemplatesCreateMyList($name: String!) {
    createMyList(name: $name) {
      documentId
      name
    }
  }
`;

const CREATE_LIST_ITEM = gql`
  mutation TemplatesCreateListItem($osm_id: String!, $name: String!, $category: String, $list: ID) {
    createListItem(
      data: { osm_id: $osm_id, name: $name, category: $category, completed: false, list: $list }
    ) {
      documentId
    }
  }
`;

type CopyButtonProps = {
  template: Template;
  onLimitReached: () => void;
};

function CopyButton({ template, onLimitReached }: CopyButtonProps) {
  const { user } = useAppContext();
  const authHeader = useAuthHeader();
  const [copyState, setCopyState] = useState<'idle' | 'copying' | 'done' | 'error'>('idle');
  const [createMyList] = useMutation<{ createMyList: { documentId: string } }>(CREATE_MY_LIST);
  const [createListItem] = useMutation(CREATE_LIST_ITEM);

  async function handleCopy() {
    setCopyState('copying');
    try {
      const { data } = await createMyList({
        variables: { name: template.name },
        context: { headers: authHeader },
      });
      const newListId = data?.createMyList?.documentId;
      if (!newListId) throw new Error('Failed to create list');
      for (const item of template.items) {
        await createListItem({
          variables: {
            osm_id: item.osm_id,
            name: item.name,
            category: item.category,
            list: newListId,
          },
          context: { headers: authHeader },
        });
      }
      setCopyState('done');
    } catch (err) {
      const graphqlErr = err as { graphQLErrors?: Array<{ extensions?: { code?: string } }> };
      const code = graphqlErr.graphQLErrors?.[0]?.extensions?.code;
      if (code === 'FREE_LIST_LIMIT_REACHED') {
        setCopyState('idle');
        onLimitReached();
      } else {
        setCopyState('error');
      }
    }
  }

  if (!user) {
    return (
      <div className={styles.cardFooter}>
        <Link href="/register" className={styles.signInCta}>
          Sign up to copy this list
        </Link>
        <p className={styles.signInNote}>Free — no credit card needed</p>
      </div>
    );
  }

  if (copyState === 'done') {
    return (
      <div className={styles.cardFooter}>
        <p className={styles.copySuccess}>
          Copied!{' '}
          <Link href="/my-list" className={styles.copySuccessLink}>
            View your lists →
          </Link>
        </p>
      </div>
    );
  }

  return (
    <div className={styles.cardFooter}>
      <button
        type="button"
        className={styles.copyButton}
        onClick={handleCopy}
        disabled={copyState === 'copying'}
        aria-busy={copyState === 'copying'}
      >
        {copyState === 'copying' ? 'Copying…' : '+ Copy to my lists'}
      </button>
      {copyState === 'error' && (
        <p className={styles.copyError}>Something went wrong. Please try again.</p>
      )}
    </div>
  );
}

type TemplateCardProps = {
  template: Template;
  isPro?: boolean;
  onUpgradeClick?: () => void;
};

export function TemplateCard({ template, isPro = false, onUpgradeClick }: TemplateCardProps) {
  const [showUpgradeModal, setShowUpgradeModal] = useState(false);

  const handleUpgrade = () => {
    if (onUpgradeClick) {
      onUpgradeClick();
    } else {
      setShowUpgradeModal(true);
    }
  };

  const isLocked = template.proOnly && !isPro;

  return (
    <>
      <article
        className={`${styles.card}${isLocked ? ` ${styles.cardLocked}` : ''}`}
        aria-label={template.name}
      >
        <div className={styles.cardHeader}>
          <h2 className={styles.cardTitle}>
            {isLocked ? (
              <span className={styles.cardTitleLocked}>{template.name}</span>
            ) : (
              <Link href={`/templates/${template.id}`} className={styles.cardTitleLink}>
                {template.name}
              </Link>
            )}
            {template.proOnly && (
              <span className={styles.proBadge} aria-hidden="true">Pro</span>
            )}
          </h2>
          <p className={styles.cardDescription}>{template.description}</p>
        </div>

        <div className={styles.tags}>
          {template.tags.map((tag) => (
            <span key={tag} className={styles.tag}>
              {tag}
            </span>
          ))}
        </div>

        <div className={styles.places}>
          <p className={styles.placesHeading}>{template.items.length} places</p>
          <ul className={styles.placeList} aria-label="Places in this list">
            {template.items.slice(0, 5).map((item: TemplateItem) => (
              <li key={item.osm_id} className={`${styles.placeItem}${isLocked ? ` ${styles.placeItemBlurred}` : ''}`}>
                {item.name}
              </li>
            ))}
            {template.items.length > 5 && (
              <li className={styles.placeItem}>
                +{template.items.length - 5} more
              </li>
            )}
          </ul>
        </div>

        {isLocked ? (
          <div className={styles.cardFooter}>
            <button
              type="button"
              className={styles.proUpgradeButton}
              onClick={handleUpgrade}
            >
              Unlock with Pro
            </button>
            <p className={styles.proUpgradeNote}>
              <Link href="/pricing" className={styles.proUpgradeLink}>
                See what&apos;s included →
              </Link>
            </p>
          </div>
        ) : (
          <CopyButton template={template} onLimitReached={() => setShowUpgradeModal(true)} />
        )}
      </article>
      <UpgradeModal isOpen={showUpgradeModal} onClose={() => setShowUpgradeModal(false)} />
    </>
  );
}

export default function TemplatesPage() {
  const { user } = useAppContext();
  const [showUpgradeModal, setShowUpgradeModal] = useState(false);
  const isPro = user?.isPro ?? false;

  const freeTemplates = TEMPLATES.filter((t) => !t.proOnly);
  const proTemplates = TEMPLATES.filter((t) => t.proOnly);

  const ogTitle = 'London Starter Lists — London List';
  const ogDescription =
    'Ready-made London itineraries curated by locals. Copy one to your account and start exploring.';
  const ogUrl = `${SITE_URL}/templates`;

  return (
    <>
      <Head>
        <title>{ogTitle}</title>
        <meta name="description" content={ogDescription} />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <meta property="og:type" content="website" />
        <meta property="og:site_name" content="London List" />
        <meta property="og:title" content={ogTitle} />
        <meta property="og:description" content={ogDescription} />
        <meta property="og:url" content={ogUrl} />
        <meta name="twitter:card" content="summary" />
        <meta name="twitter:title" content={ogTitle} />
        <meta name="twitter:description" content={ogDescription} />
      </Head>
      <main className={styles.main}>
        <div className={styles.hero}>
          <h1 className={styles.heading}>Starter Lists</h1>
          <p className={styles.subheading}>
            Curated London itineraries — ready to copy and make your own. Pick one and start
            exploring.
          </p>
        </div>

        <ul className={styles.grid} aria-label="Template lists">
          {freeTemplates.map((template) => (
            <li key={template.id} className={styles.gridItem}>
              <TemplateCard template={template} isPro={isPro} />
            </li>
          ))}
        </ul>

        {proTemplates.length > 0 && (
          <section className={styles.proSection} aria-label="Pro templates">
            <div className={styles.proSectionHeader}>
              <h2 className={styles.proSectionHeading}>
                <span className={styles.proBadgeLarge}>Pro</span> Exclusive Templates
              </h2>
              <p className={styles.proSectionSubheading}>
                {isPro
                  ? 'Your Pro plan includes these exclusive curated itineraries.'
                  : 'Upgrade to Pro to unlock these specially curated itineraries.'}
              </p>
            </div>
            <ul className={styles.grid} aria-label="Pro template lists">
              {proTemplates.map((template) => (
                <li key={template.id} className={styles.gridItem}>
                  <TemplateCard
                    template={template}
                    isPro={isPro}
                    onUpgradeClick={() => setShowUpgradeModal(true)}
                  />
                </li>
              ))}
            </ul>
          </section>
        )}
      </main>
      <UpgradeModal isOpen={showUpgradeModal} onClose={() => setShowUpgradeModal(false)} />
    </>
  );
}
