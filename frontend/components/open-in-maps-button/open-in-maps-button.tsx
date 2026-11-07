import {
  MAX_ROUTE_PLACES,
  buildGoogleMapsRouteUrl,
  orderRoute,
  type RoutePlace,
} from '../../lib/route-url';
import styles from './open-in-maps-button.module.css';

type Props = {
  places: RoutePlace[];
  className?: string;
};

export default function OpenInMapsButton({ places, className }: Props) {
  const capped = orderRoute(places).slice(0, MAX_ROUTE_PLACES);
  const hasMore = places.length > MAX_ROUTE_PLACES;

  if (capped.length === 0) return null;

  const mapsUrl = buildGoogleMapsRouteUrl(capped);

  return (
    <div className={`${styles.wrapper} ${className ?? ''}`.trim()}>
      <a
        href={mapsUrl}
        className={styles.button}
        target="_blank"
        rel="noopener noreferrer"
        aria-label={`Plan a route for ${capped.length} place${capped.length === 1 ? '' : 's'} in Google Maps (opens in new tab)`}
      >
        <span aria-hidden="true">🗺</span> Plan route in Google Maps
        {hasMore && (
          <span className={styles.limitNote}>
            {' '}({capped.length} of {places.length} places)
          </span>
        )}
      </a>
    </div>
  );
}
