import { gql } from '@apollo/client';
import { useQuery } from '@apollo/client/react';
import Head from 'next/head';
import Link from 'next/link';
import { useRouter } from 'next/router';

import Loader from '../../components/Loader';

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || 'https://londonlist.vercel.app';

type ExhibitionItem = {
  id: string;
  attributes: {
    name: string;
    description: string;
    startdate: string;
    enddate: string;
  };
};

type MuseumExhibitionsQueryData = {
  museum: {
    data: {
      id: string;
      attributes: {
        name: string;
        exhibitions: {
          data: ExhibitionItem[];
        };
      };
    } | null;
  };
};

type MuseumExhibitionsQueryVars = {
  id: string;
};

const GET_MUSEUM_EXHIBITIONS = gql`
  query ($id: ID!) {
    museum(id: $id) {
      data {
        id
        attributes {
          name
          exhibitions {
            data {
              id
              attributes {
                name
                description
                startdate
                enddate
              }
            }
          }
        }
      }
    }
  }
`;

function ExhibitionCard({ data }: { data: ExhibitionItem }) {
  return (
    <div>
      <div>
        <div>
          <h2>{data.attributes.name}</h2>
          <p>{data.attributes.description}</p>
        </div>
      </div>
    </div>
  );
}

function buildMuseumJsonLd(name: string, museumId: string) {
  return {
    '@context': 'https://schema.org',
    '@type': 'TouristAttraction',
    name,
    url: `${SITE_URL}/museum/${museumId}`,
    address: {
      '@type': 'PostalAddress',
      addressLocality: 'London',
      addressCountry: 'GB',
    },
  };
}

export default function Museum() {
  const router = useRouter();
  const museumId = Array.isArray(router.query.id) ? router.query.id[0] : router.query.id;

  const { loading, error, data } = useQuery<MuseumExhibitionsQueryData, MuseumExhibitionsQueryVars>(
    GET_MUSEUM_EXHIBITIONS,
    {
      variables: { id: museumId ?? '' },
      skip: !museumId,
    },
  );

  const exhibitions = data?.museum?.data?.attributes?.exhibitions?.data ?? [];

  if (!museumId) return <Loader />;

  if (loading) return <Loader />;

  if (error || !data?.museum?.data) {
    return (
      <>
        <Head>
          <title>Museum not found — London List</title>
        </Head>
        <main>
          <h1>Museum not found</h1>
          <p>We couldn&apos;t load this museum&apos;s exhibitions.</p>
          <Link href="/explore">Back to Explore</Link>
        </main>
      </>
    );
  }

  const museum = data.museum;
  const museumName = museum.data?.attributes.name ?? 'Museum';
  const pageTitle = `${museumName} — London List`;
  const pageDescription = `Explore exhibitions at ${museumName} on London List — your guide to things to do in London.`;
  const canonicalUrl = `${SITE_URL}/museum/${museumId}`;
  const jsonLd = museumId ? buildMuseumJsonLd(museumName, museumId) : null;

  if (!museum.data) {
    return (
      <>
        <Head>
          <title>No exhibitions found — London List</title>
        </Head>
        <main>
          <h1>No exhibitions found</h1>
          <Link href="/explore">Back to Explore</Link>
        </main>
      </>
    );
  }

  return (
    <>
      <Head>
        <title>{pageTitle}</title>
        <meta name="description" content={pageDescription} />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <link rel="canonical" href={canonicalUrl} />
        <meta property="og:type" content="website" />
        <meta property="og:site_name" content="London List" />
        <meta property="og:title" content={pageTitle} />
        <meta property="og:description" content={pageDescription} />
        <meta property="og:url" content={canonicalUrl} />
        <meta property="og:locale" content="en_GB" />
        <meta name="twitter:card" content="summary" />
        <meta name="twitter:title" content={pageTitle} />
        <meta name="twitter:description" content={pageDescription} />
        {jsonLd && (
          // biome-ignore lint/security/noDangerouslySetInnerHtml: JSON-LD is server-generated; JSON.stringify output is XSS-safe
          <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
        )}
      </Head>
      <main>
        <h1>{museumName}</h1>
        {exhibitions.length === 0 ? (
          <p>No current exhibitions.</p>
        ) : (
          <div>
            {exhibitions.map((res) => (
              <ExhibitionCard key={res.id} data={res} />
            ))}
          </div>
        )}
      </main>
    </>
  );
}
