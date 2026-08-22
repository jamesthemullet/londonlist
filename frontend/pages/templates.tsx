import { gql } from '@apollo/client';
import { useMutation } from '@apollo/client/react';
import Head from 'next/head';
import Link from 'next/link';
import { useState } from 'react';
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
};

function CopyButton({ template }: CopyButtonProps) {
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
    } catch {
      setCopyState('error');
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
};

export function TemplateCard({ template }: TemplateCardProps) {
  return (
    <article className={styles.card} aria-label={template.name}>
      <div className={styles.cardHeader}>
        <h2 className={styles.cardTitle}>{template.name}</h2>
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
            <li key={item.osm_id} className={styles.placeItem}>
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

      <CopyButton template={template} />
    </article>
  );
}

export default function TemplatesPage() {
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
          {TEMPLATES.map((template) => (
            <li key={template.id} className={styles.gridItem}>
              <TemplateCard template={template} />
            </li>
          ))}
        </ul>
      </main>
    </>
  );
}
