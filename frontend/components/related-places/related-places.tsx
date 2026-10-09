import Link from 'next/link';
import type { PublicPlace } from '../../lib/place';
import styles from './related-places.module.css';

type Props = {
  places: PublicPlace[];
};

export default function RelatedPlaces({ places }: Props) {
  if (places.length === 0) return null;

  return (
    <section className={styles.container} aria-label="Related places you might like">
      <h2 className={styles.heading}>You might also like</h2>
      <ul className={styles.grid}>
        {places.map((place) => (
          <li key={place.osm_id} className={styles.card}>
            <Link href={`/place/${place.osm_id}`} className={styles.link}>
              <span className={styles.name}>{place.name}</span>
              {place.category && <span className={styles.category}>{place.category}</span>}
            </Link>
          </li>
        ))}
      </ul>
    </section>
  );
}
