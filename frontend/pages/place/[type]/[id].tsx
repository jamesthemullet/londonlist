import type { GetServerSideProps } from 'next';
import Head from 'next/head';
import Link from 'next/link';
import RelatedPlaces from '../../../components/related-places/related-places';
import type { PublicPlace } from '../../../lib/place';
import styles from './[id].module.css';

const API_URL = process.env.STRAPI_URL || 'http://127.0.0.1:1337';
const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || 'https://londonlist.vercel.app';

const PLACE_QUERY = `
  query GetPlace($osm_id: String!) {
    place(osm_id: $osm_id) {
      osm_id
      name
      category
      lat
      lng
    }
  }
`;

const RELATED_PLACES_QUERY = `
  query GetRelatedPlaces($osm_id: String!, $limit: Int) {
    relatedPlaces(osm_id: $osm_id, limit: $limit) {
      osm_id
      name
      category
      lat
      lng
    }
  }
`;

export function buildPlaceJsonLd(place: PublicPlace, siteUrl: string): object {
  const jsonLd: Record<string, unknown> = {
    '@context': 'https://schema.org',
    '@type': 'TouristAttraction',
    name: place.name,
    url: `${siteUrl}/place/${place.osm_id}`,
    containedInPlace: {
      '@type': 'City',
      name: 'London',
    },
  };
  if (place.category) {
    jsonLd.description = `A ${place.category} in London`;
  }
  if (place.lat != null && place.lng != null) {
    jsonLd.geo = {
      '@type': 'GeoCoordinates',
      latitude: place.lat,
      longitude: place.lng,
    };
  }
  return jsonLd;
}

type Props = {
  place: PublicPlace;
  relatedPlaces: PublicPlace[];
};

export default function PlaceDetailPage({ place, relatedPlaces }: Props) {
  const pageTitle = `${place.name} — London List`;
  const pageDescription = place.category
    ? `${place.name} is a ${place.category} in London. Add it to your bucket list on London List.`
    : `${place.name} is a place in London. Add it to your bucket list on London List.`;
  const canonicalUrl = `${SITE_URL}/place/${place.osm_id}`;
  const jsonLd = buildPlaceJsonLd(place, SITE_URL);

  return (
    <>
      <Head>
        <title>{pageTitle}</title>
        <meta name="description" content={pageDescription} />
        <link rel="canonical" href={canonicalUrl} />
        <meta property="og:type" content="place" />
        <meta property="og:site_name" content="London List" />
        <meta property="og:title" content={pageTitle} />
        <meta property="og:description" content={pageDescription} />
        <meta property="og:url" content={canonicalUrl} />
        <script
          type="application/ld+json"
          // biome-ignore lint/security/noDangerouslySetInnerHtml: structured data, not user content
          dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
        />
      </Head>
      <main className={styles.main}>
        <nav className={styles.breadcrumb} aria-label="Breadcrumb">
          <Link href="/explore" className={styles.breadcrumbLink}>
            Explore
          </Link>
          <span className={styles.breadcrumbSep} aria-hidden="true">
            ›
          </span>
          <span aria-current="page">{place.name}</span>
        </nav>
        <h1 className={styles.heading}>{place.name}</h1>
        {place.category && (
          <span className={styles.category}>{place.category}</span>
        )}
        {place.lat != null && place.lng != null && (
          <a
            className={styles.mapLink}
            href={`https://www.openstreetmap.org/${place.osm_id}`}
            target="_blank"
            rel="noopener noreferrer"
          >
            View on OpenStreetMap ↗
          </a>
        )}
        <RelatedPlaces places={relatedPlaces} />
      </main>
    </>
  );
}

export const getServerSideProps: GetServerSideProps<Props> = async (context) => {
  const { type, id } = context.params as { type: string; id: string };
  const osmId = `${type}/${id}`;

  try {
    const res = await fetch(`${API_URL}/graphql`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        query: PLACE_QUERY,
        variables: { osm_id: osmId },
      }),
      signal: AbortSignal.timeout(5000),
    });

    if (!res.ok) return { notFound: true };

    const json = await res.json();
    const place: PublicPlace | null = json?.data?.place ?? null;
    if (!place) return { notFound: true };

    let relatedPlaces: PublicPlace[] = [];
    try {
      const relRes = await fetch(`${API_URL}/graphql`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          query: RELATED_PLACES_QUERY,
          variables: { osm_id: osmId, limit: 6 },
        }),
        signal: AbortSignal.timeout(5000),
      });
      if (relRes.ok) {
        const relJson = await relRes.json();
        relatedPlaces = relJson?.data?.relatedPlaces ?? [];
      }
    } catch {
      // non-critical
    }

    return { props: { place, relatedPlaces } };
  } catch {
    return { notFound: true };
  }
};
