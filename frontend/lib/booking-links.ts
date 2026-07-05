export type BookingLink = {
  label: string;
  href: string;
  provider: string;
};

const VIATOR_CATS = new Set([
  'museum',
  'gallery',
  'art_gallery',
  'theatre',
  'cinema',
  'attraction',
  'tourist_attraction',
  'viewpoint',
  'artwork',
  'historic',
  'castle',
  'manor',
  'monument',
  'archaeological_site',
]);

const DINING_CATS = new Set([
  'restaurant',
  'cafe',
  'bar',
  'pub',
  'fast_food',
  'food_court',
]);

const HOTEL_CATS = new Set(['hotel', 'hostel', 'guest_house', 'motel']);

export function getBookingLinks(
  name: string,
  category: string | null,
  viatorPartnerId = '',
  bookingAffiliateId = '',
): BookingLink[] {
  const cat = (category ?? '').toLowerCase();
  const links: BookingLink[] = [];

  if (VIATOR_CATS.has(cat)) {
    const q = encodeURIComponent(`${name} London`);
    const base = `https://www.viator.com/search?q=${q}`;
    links.push({
      label: 'Find tours & tickets',
      href: viatorPartnerId ? `${base}&pid=${encodeURIComponent(viatorPartnerId)}` : base,
      provider: 'Viator',
    });
  }

  if (DINING_CATS.has(cat)) {
    const q = encodeURIComponent(name);
    links.push({
      label: 'Reserve a table',
      href: `https://www.opentable.co.uk/s/?term=${q}`,
      provider: 'OpenTable',
    });
  }

  if (HOTEL_CATS.has(cat)) {
    const q = encodeURIComponent(`${name} London`);
    const base = `https://www.booking.com/searchresults.html?ss=${q}`;
    links.push({
      label: 'Check availability',
      href: bookingAffiliateId ? `${base}&aid=${encodeURIComponent(bookingAffiliateId)}` : base,
      provider: 'Booking.com',
    });
  }

  return links;
}
