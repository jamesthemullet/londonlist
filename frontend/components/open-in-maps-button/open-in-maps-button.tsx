import Link from 'next/link';
import {
  FREE_ROUTE_LIMIT,
  PRO_ROUTE_LIMIT,
  buildGoogleMapsRouteUrl,
  type RoutePlace,
} from '../../lib/route-url';
import styles from './open-in-maps-button.module.css';

type Props = {
  places: RoutePlace[];
  isPro?: boolean;
  className?: string;
};

export default function OpenInMapsButton({ places, isPro = false, className }: Props) {
  const limit = isPro ? PRO_ROUTE_LIMIT : FREE_ROUTE_LIMIT;
  const capped = places.slice(0, limit);
  const hasMore = !isPro && places.length > FREE_ROUTE_LIMIT;

  if (capped.length === 0) return null;

  const mapsUrl = buildGoogleMapsRouteUrl(capped);

  return (
    <div className={`${styles.wrapper} ${className ?? ''}`.trim()}>
      <a
        href={mapsUrl}
        className={styles.button}
        target="_blank"
        rel="noopener noreferrer"
        aria-label={`Plan a route for ${capped.length} place${capped.length === 1 ? '' : 's'} in Google Maps`}
      >
        <span aria-hidden="true">🗺</span> Plan route in Google Maps
        {hasMore && (
          <span className={styles.limitNote}>
            {' '}({capped.length} of {places.length} places)
          </span>
        )}
      </a>
      {hasMore && (
        <p className={styles.upgradeNote}>
          <Link href="/pricing" className={styles.upgradeLink}>
            Upgrade to Pro
          </Link>{' '}
          to plan your full route ({places.length} places).
        </p>
      )}
    </div>
  );
}
