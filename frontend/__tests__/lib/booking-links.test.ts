import { getBookingLinks } from '../../lib/booking-links';

describe('getBookingLinks — Viator (tours & tickets)', () => {
  it('returns a Viator link for museum category', () => {
    const links = getBookingLinks('British Museum', 'museum');
    expect(links).toHaveLength(1);
    expect(links[0].provider).toBe('Viator');
    expect(links[0].label).toBe('Find tours & tickets');
    expect(links[0].href).toContain('viator.com');
  });

  it('returns a Viator link for gallery category', () => {
    const links = getBookingLinks('Tate Modern', 'gallery');
    expect(links[0].provider).toBe('Viator');
  });

  it('returns a Viator link for art_gallery category', () => {
    const links = getBookingLinks('National Gallery', 'art_gallery');
    expect(links[0].provider).toBe('Viator');
  });

  it('returns a Viator link for theatre category', () => {
    const links = getBookingLinks('Old Vic', 'theatre');
    expect(links[0].provider).toBe('Viator');
  });

  it('returns a Viator link for cinema category', () => {
    const links = getBookingLinks('BFI Southbank', 'cinema');
    expect(links[0].provider).toBe('Viator');
  });

  it('returns a Viator link for attraction category', () => {
    const links = getBookingLinks('Tower of London', 'attraction');
    expect(links[0].provider).toBe('Viator');
  });

  it('returns a Viator link for tourist_attraction category', () => {
    const links = getBookingLinks('London Eye', 'tourist_attraction');
    expect(links[0].provider).toBe('Viator');
  });

  it('returns a Viator link for castle category', () => {
    const links = getBookingLinks('Windsor Castle', 'castle');
    expect(links[0].provider).toBe('Viator');
  });

  it('encodes the place name and city in the Viator URL query', () => {
    const links = getBookingLinks('British Museum', 'museum');
    expect(links[0].href).toContain(encodeURIComponent('British Museum London'));
  });

  it('appends the Viator partner ID when provided', () => {
    const links = getBookingLinks('British Museum', 'museum', 'P00012345');
    expect(links[0].href).toContain('pid=P00012345');
  });

  it('omits the partner ID param when viatorPartnerId is empty', () => {
    const links = getBookingLinks('British Museum', 'museum', '');
    expect(links[0].href).not.toContain('pid=');
  });
});

describe('getBookingLinks — OpenTable (dining)', () => {
  it('returns an OpenTable link for restaurant category', () => {
    const links = getBookingLinks('The Ivy', 'restaurant');
    expect(links).toHaveLength(1);
    expect(links[0].provider).toBe('OpenTable');
    expect(links[0].label).toBe('Reserve a table');
    expect(links[0].href).toContain('opentable.co.uk');
  });

  it('returns an OpenTable link for cafe category', () => {
    const links = getBookingLinks('Monmouth Coffee', 'cafe');
    expect(links[0].provider).toBe('OpenTable');
  });

  it('returns an OpenTable link for bar category', () => {
    const links = getBookingLinks('Sky Garden Bar', 'bar');
    expect(links[0].provider).toBe('OpenTable');
  });

  it('returns an OpenTable link for pub category', () => {
    const links = getBookingLinks('The George Inn', 'pub');
    expect(links[0].provider).toBe('OpenTable');
  });

  it('returns an OpenTable link for fast_food category', () => {
    const links = getBookingLinks('Five Guys', 'fast_food');
    expect(links[0].provider).toBe('OpenTable');
  });

  it('encodes the place name in the OpenTable URL query', () => {
    const links = getBookingLinks('The Ivy', 'restaurant');
    expect(links[0].href).toContain(encodeURIComponent('The Ivy'));
  });
});

describe('getBookingLinks — Booking.com (accommodation)', () => {
  it('returns a Booking.com link for hotel category', () => {
    const links = getBookingLinks('The Savoy', 'hotel');
    expect(links).toHaveLength(1);
    expect(links[0].provider).toBe('Booking.com');
    expect(links[0].label).toBe('Check availability');
    expect(links[0].href).toContain('booking.com');
  });

  it('returns a Booking.com link for hostel category', () => {
    const links = getBookingLinks('YHA London', 'hostel');
    expect(links[0].provider).toBe('Booking.com');
  });

  it('returns a Booking.com link for guest_house category', () => {
    const links = getBookingLinks('Garden Guest House', 'guest_house');
    expect(links[0].provider).toBe('Booking.com');
  });

  it('encodes the place name and city in the Booking.com URL', () => {
    const links = getBookingLinks('The Savoy', 'hotel');
    expect(links[0].href).toContain(encodeURIComponent('The Savoy London'));
  });

  it('appends the affiliate ID when provided', () => {
    const links = getBookingLinks('The Savoy', 'hotel', '', '1234567');
    expect(links[0].href).toContain('aid=1234567');
  });

  it('omits the affiliate ID param when bookingAffiliateId is empty', () => {
    const links = getBookingLinks('The Savoy', 'hotel', '', '');
    expect(links[0].href).not.toContain('aid=');
  });
});

describe('getBookingLinks — categories with no booking link', () => {
  it('returns empty array for park category', () => {
    expect(getBookingLinks('Hyde Park', 'park')).toHaveLength(0);
  });

  it('returns empty array for garden category', () => {
    expect(getBookingLinks('Kew Gardens', 'garden')).toHaveLength(0);
  });

  it('returns empty array for shop category', () => {
    expect(getBookingLinks('Harrods', 'shop')).toHaveLength(0);
  });

  it('returns empty array for null category', () => {
    expect(getBookingLinks('Some Place', null)).toHaveLength(0);
  });

  it('returns empty array for empty string category', () => {
    expect(getBookingLinks('Some Place', '')).toHaveLength(0);
  });

  it('returns empty array for unknown category', () => {
    expect(getBookingLinks('Some Place', 'waterfall')).toHaveLength(0);
  });
});

describe('getBookingLinks — case insensitivity', () => {
  it('matches Museum (capitalised) to Viator', () => {
    const links = getBookingLinks('National History Museum', 'Museum');
    expect(links[0].provider).toBe('Viator');
  });

  it('matches RESTAURANT (uppercase) to OpenTable', () => {
    const links = getBookingLinks('Nobu', 'RESTAURANT');
    expect(links[0].provider).toBe('OpenTable');
  });

  it('matches Hotel (title case) to Booking.com', () => {
    const links = getBookingLinks('Claridges', 'Hotel');
    expect(links[0].provider).toBe('Booking.com');
  });
});
