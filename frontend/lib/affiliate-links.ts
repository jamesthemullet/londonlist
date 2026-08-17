export type AffiliateLink = {
  label: string;
  href: string;
  provider: string;
};

export type AffiliateIds = {
  opentableId?: string;
  bookingId?: string;
  viatorId?: string;
};

const RESTAURANT_CATEGORIES = new Set([
  'restaurant',
  'cafe',
  'fast_food',
  'pub',
  'bar',
]);

const HOTEL_CATEGORIES = new Set([
  'hotel',
  'hostel',
  'motel',
  'guest_house',
]);

const EXPERIENCE_CATEGORIES = new Set([
  'museum',
  'gallery',
  'theatre',
  'cinema',
  'attraction',
  'arts_centre',
  'theme_park',
]);

export function getAffiliateLinks(
  name: string,
  category: string | null,
  ids: AffiliateIds = {},
): AffiliateLink[] {
  const links: AffiliateLink[] = [];
  const cat = (category ?? '').toLowerCase();

  if (RESTAURANT_CATEGORIES.has(cat)) {
    const params = new URLSearchParams({ covers: '2', term: name });
    if (ids.opentableId) params.set('affiliate', ids.opentableId);
    links.push({
      label: 'Book a table',
      href: `https://www.opentable.co.uk/s?${params.toString()}`,
      provider: 'OpenTable',
    });
  }

  if (HOTEL_CATEGORIES.has(cat)) {
    const params = new URLSearchParams({ ss: `${name} London` });
    if (ids.bookingId) params.set('aid', ids.bookingId);
    links.push({
      label: 'Check availability',
      href: `https://www.booking.com/searchresults.html?${params.toString()}`,
      provider: 'Booking.com',
    });
  }

  if (EXPERIENCE_CATEGORIES.has(cat)) {
    const encoded = encodeURIComponent(`${name} London`);
    const href = ids.viatorId
      ? `https://www.viator.com/search/${encoded}?pid=${encodeURIComponent(ids.viatorId)}`
      : `https://www.viator.com/search/${encoded}`;
    links.push({
      label: 'Book tickets',
      href,
      provider: 'Viator',
    });
  }

  return links;
}
