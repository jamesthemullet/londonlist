import { getAffiliateLinks } from '../../lib/affiliate-links';
import styles from './booking-links.module.css';

type Props = {
  name: string;
  category: string | null;
};

export default function BookingLinks({ name, category }: Props) {
  const links = getAffiliateLinks(name, category, {
    opentableId: process.env.NEXT_PUBLIC_OPENTABLE_AFFILIATE_ID,
    bookingId: process.env.NEXT_PUBLIC_BOOKING_AFFILIATE_ID,
    viatorId: process.env.NEXT_PUBLIC_VIATOR_AFFILIATE_ID,
  });

  if (links.length === 0) return null;

  return (
    <div className={styles.links}>
      {links.map((link) => (
        <a
          key={link.provider}
          href={link.href}
          className={styles.link}
          target="_blank"
          rel="noopener noreferrer sponsored"
          aria-label={`${link.label} at ${name} via ${link.provider}`}
        >
          {link.label} <span className={styles.provider}>via {link.provider}</span>
          <span className={styles.arrow} aria-hidden="true"> ↗</span>
        </a>
      ))}
    </div>
  );
}
