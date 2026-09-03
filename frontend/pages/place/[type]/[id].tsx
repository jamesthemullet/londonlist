import { useQuery } from '@apollo/client/react';
import Head from 'next/head';
import Link from 'next/link';
import { useRouter } from 'next/router';
import Loader from '../../../components/Loader';
import { GET_PLACE, extractPlace } from '../../../lib/place';
import type { GetPlaceData, GetPlaceVars } from '../../../lib/place';
import styles from './[id].module.css';

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || 'https://londonlist.co.uk';

export function buildOsmId(type: string | string[] | undefined, id: string | string[] | undefined): string | null {
  const typeStr = Array.isArray(type) ? type[0] : type;
  const idStr = Array.isArray(id) ? id[0] : id;
  if (!typeStr || !idStr) return null;
  return `${typeStr}/${idStr}`;
}

export default function PlaceDetailPage() {
  const router = useRouter();
  const osmId = buildOsmId(router.query.type, router.query.id);

  const { loading, error, data } = useQuery<GetPlaceData, GetPlaceVars>(GET_PLACE, {
    variables: { osm_id: osmId ?? '' },
    skip: !osmId,
  });

  const place = extractPlace(data);

  if (!osmId || loading) return <Loader />;
  if (error) return <p>Error loading this place.</p>;
  if (!place) return <p>Place not found.</p>;

  const pageTitle = `${place.name} — London List`;
  const canonicalUrl = `${SITE_URL}/place/${place.osm_id}`;
  const pageDescription = place.category
    ? `${place.name} — a ${place.category} in London, saved on London List.`
    : `${place.name} — saved on London List.`;

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
        {place.category && <span className={styles.category}>{place.category}</span>}
        {place.lat != null && place.lng != null && (
          <a
            className={styles.mapLink}
            href={`https://www.openstreetmap.org/${place.osm_id}`}
            target="_blank"
            rel="noopener noreferrer"
          >
            View on OpenStreetMap
          </a>
        )}
      </main>
    </>
  );
}
