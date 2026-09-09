import { gql } from '@apollo/client';
import { useMutation } from '@apollo/client/react';
import Head from 'next/head';
import Link from 'next/link';
import { useState } from 'react';
import type { GetStaticPaths, GetStaticProps } from 'next';
import { TEMPLATES } from '../../lib/templates';
import type { Template } from '../../lib/templates';
import { useAppContext } from '../../context/AppContext';
import { useAuthHeader } from '../../hooks/use-auth-header';
import styles from './[id].module.css';

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || 'https://londonlist.co.uk';

const CREATE_MY_LIST = gql`
  mutation TemplateDetailCreateMyList($name: String!) {
    createMyList(name: $name) {
      documentId
      name
    }
  }
`;

const CREATE_LIST_ITEM = gql`
  mutation TemplateDetailCreateListItem($osm_id: String!, $name: String!, $category: String, $list: ID) {
    createListItem(
      data: { osm_id: $osm_id, name: $name, category: $category, completed: false, list: $list }
    ) {
      documentId
    }
  }
`;

type Props = {
  template: Template;
  relatedTemplates: Template[];
};

export function buildTemplateJsonLd(template: Template, siteUrl: string): object {
  return {
    '@context': 'https://schema.org',
    '@type': 'ItemList',
    name: `${template.name} — London Starter List`,
    description: template.description,
    url: `${siteUrl}/templates/${template.id}`,
    numberOfItems: template.items.length,
    itemListElement: template.items.map((item, index) => ({
      '@type': 'ListItem',
      position: index + 1,
      name: item.name,
    })),
  };
}

type CopyButtonProps = {
  template: Template;
};

export function CopyButton({ template }: CopyButtonProps) {
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
      <div className={styles.copySection}>
        <Link href="/register" className={styles.signInCta}>
          Sign up free to copy this list
        </Link>
        <p className={styles.signInNote}>No credit card needed · Cancel anytime</p>
      </div>
    );
  }

  if (copyState === 'done') {
    return (
      <div className={styles.copySection}>
        <p className={styles.copySuccess}>
          List copied!{' '}
          <Link href="/my-list" className={styles.copySuccessLink}>
            View your lists →
          </Link>
        </p>
      </div>
    );
  }

  return (
    <div className={styles.copySection}>
      <button
        type="button"
        className={styles.copyButton}
        onClick={handleCopy}
        disabled={copyState === 'copying'}
        aria-busy={copyState === 'copying'}
      >
        {copyState === 'copying' ? 'Copying…' : '+ Copy this list to my account'}
      </button>
      {copyState === 'error' && (
        <p className={styles.copyError}>Something went wrong. Please try again.</p>
      )}
    </div>
  );
}

export default function TemplateDetailPage({ template, relatedTemplates }: Props) {
  const jsonLd = buildTemplateJsonLd(template, SITE_URL);
  const pageTitle = `${template.name} — London Starter List`;
  const canonicalUrl = `${SITE_URL}/templates/${template.id}`;

  return (
    <>
      <Head>
        <title>{pageTitle} — London List</title>
        <meta name="description" content={template.description} />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <link rel="canonical" href={canonicalUrl} />
        <meta property="og:type" content="article" />
        <meta property="og:site_name" content="London List" />
        <meta property="og:title" content={pageTitle} />
        <meta property="og:description" content={template.description} />
        <meta property="og:url" content={canonicalUrl} />
        <meta name="twitter:card" content="summary" />
        <meta name="twitter:title" content={pageTitle} />
        <meta name="twitter:description" content={template.description} />
        <script
          type="application/ld+json"
          // biome-ignore lint/security/noDangerouslySetInnerHtml: JSON-LD is server-generated; JSON.stringify output is XSS-safe
          dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
        />
      </Head>
      <main className={styles.main}>
        <nav className={styles.breadcrumb} aria-label="Breadcrumb">
          <Link href="/templates" className={styles.breadcrumbLink}>
            Starter Lists
          </Link>
          <span className={styles.breadcrumbSep} aria-hidden="true">
            ›
          </span>
          <span aria-current="page">{template.name}</span>
        </nav>

        <div className={styles.hero}>
          <h1 className={styles.heading}>{template.name}</h1>
          <p className={styles.description}>{template.description}</p>
          <div className={styles.tags}>
            {template.tags.map((tag) => (
              <span key={tag} className={styles.tag}>
                {tag}
              </span>
            ))}
          </div>
        </div>

        <CopyButton template={template} />

        <section className={styles.placesSection}>
          <h2 className={styles.placesHeading}>
            {template.items.length} place{template.items.length === 1 ? '' : 's'} in this list
          </h2>
          <ul className={styles.placeList} aria-label="Places in this list">
            {template.items.map((item, index) => (
              <li key={item.osm_id} className={styles.placeItem}>
                <span className={styles.placeNumber} aria-hidden="true">
                  {index + 1}
                </span>
                <div className={styles.placeInfo}>
                  <span className={styles.placeName}>{item.name}</span>
                  {item.category && (
                    <span className={styles.placeCategory}>{item.category}</span>
                  )}
                </div>
              </li>
            ))}
          </ul>
        </section>

        <CopyButton template={template} />
      </main>

      {relatedTemplates.length > 0 && (
        <section className={styles.relatedSection} aria-label="More starter lists">
          <h2 className={styles.relatedHeading}>More starter lists</h2>
          <ul className={styles.relatedGrid}>
            {relatedTemplates.map((related) => (
              <li key={related.id}>
                <Link href={`/templates/${related.id}`} className={styles.relatedCard}>
                  <span className={styles.relatedName}>{related.name}</span>
                  <span className={styles.relatedCount}>
                    {related.items.length} place{related.items.length === 1 ? '' : 's'}
                  </span>
                </Link>
              </li>
            ))}
          </ul>
          <p className={styles.allTemplatesLink}>
            <Link href="/templates">Browse all starter lists →</Link>
          </p>
        </section>
      )}
    </>
  );
}

export const getStaticPaths: GetStaticPaths = () => {
  return {
    paths: TEMPLATES.map((t) => ({ params: { id: t.id } })),
    fallback: false,
  };
};

export const getStaticProps: GetStaticProps<Props> = ({ params }) => {
  const id = params?.id as string;
  const template = TEMPLATES.find((t) => t.id === id);
  if (!template) {
    return { notFound: true };
  }
  const relatedTemplates = TEMPLATES.filter((t) => t.id !== id).slice(0, 3);
  return {
    props: { template, relatedTemplates },
  };
};
