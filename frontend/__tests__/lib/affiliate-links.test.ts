import { getAffiliateLinks } from '../../lib/affiliate-links';

describe('getAffiliateLinks — no affiliate IDs', () => {
  it('returns an OpenTable link for a restaurant', () => {
    const links = getAffiliateLinks('Dishoom', 'restaurant');
    expect(links).toHaveLength(1);
    expect(links[0].provider).toBe('OpenTable');
    expect(links[0].label).toBe('Book a table');
    expect(links[0].href).toContain('opentable.co.uk');
    expect(links[0].href).toContain('Dishoom');
  });

  it('returns an OpenTable link for a cafe', () => {
    const links = getAffiliateLinks('Monmouth Coffee', 'cafe');
    expect(links).toHaveLength(1);
    expect(links[0].provider).toBe('OpenTable');
  });

  it('returns an OpenTable link for a pub', () => {
    const links = getAffiliateLinks('The Grapes', 'pub');
    expect(links[0].provider).toBe('OpenTable');
  });

  it('returns a Booking.com link for a hotel', () => {
    const links = getAffiliateLinks('The Savoy', 'hotel');
    expect(links).toHaveLength(1);
    expect(links[0].provider).toBe('Booking.com');
    expect(links[0].label).toBe('Check availability');
    expect(links[0].href).toContain('booking.com');
    expect(links[0].href).toContain('The+Savoy+London');
  });

  it('returns a Viator link for a museum', () => {
    const links = getAffiliateLinks('British Museum', 'museum');
    expect(links).toHaveLength(1);
    expect(links[0].provider).toBe('Viator');
    expect(links[0].label).toBe('Book tickets');
    expect(links[0].href).toContain('viator.com');
    expect(links[0].href).toContain('British%20Museum%20London');
  });

  it('returns a Viator link for a theatre', () => {
    const links = getAffiliateLinks('National Theatre', 'theatre');
    expect(links[0].provider).toBe('Viator');
  });

  it('returns a Viator link for a gallery', () => {
    const links = getAffiliateLinks('Tate Modern', 'gallery');
    expect(links[0].provider).toBe('Viator');
  });

  it('returns a Viator link for a cinema', () => {
    const links = getAffiliateLinks('BFI Southbank', 'cinema');
    expect(links[0].provider).toBe('Viator');
  });

  it('returns empty array for a park', () => {
    const links = getAffiliateLinks('Hyde Park', 'park');
    expect(links).toHaveLength(0);
  });

  it('returns empty array for a null category', () => {
    const links = getAffiliateLinks('Some Place', null);
    expect(links).toHaveLength(0);
  });

  it('returns empty array for an unknown category', () => {
    const links = getAffiliateLinks('Random Place', 'library');
    expect(links).toHaveLength(0);
  });

  it('is case-insensitive for category matching', () => {
    const links = getAffiliateLinks('The Wolseley', 'Restaurant');
    expect(links).toHaveLength(1);
    expect(links[0].provider).toBe('OpenTable');
  });

  it('does not include affiliate param in OpenTable URL when no ID provided', () => {
    const links = getAffiliateLinks('Dishoom', 'restaurant');
    expect(links[0].href).not.toContain('affiliate=');
  });

  it('does not include aid param in Booking.com URL when no ID provided', () => {
    const links = getAffiliateLinks('The Savoy', 'hotel');
    expect(links[0].href).not.toContain('aid=');
  });

  it('does not include pid param in Viator URL when no ID provided', () => {
    const links = getAffiliateLinks('British Museum', 'museum');
    expect(links[0].href).not.toContain('pid=');
  });
});

describe('getAffiliateLinks — with affiliate IDs', () => {
  const IDS = { opentableId: 'ot-test-123', bookingId: 'bk-456', viatorId: 'vt-789' };

  it('appends affiliate ID to OpenTable URL', () => {
    const links = getAffiliateLinks('Dishoom', 'restaurant', IDS);
    expect(links[0].href).toContain('affiliate=ot-test-123');
  });

  it('appends aid to Booking.com URL', () => {
    const links = getAffiliateLinks('The Savoy', 'hotel', IDS);
    expect(links[0].href).toContain('aid=bk-456');
  });

  it('appends pid to Viator URL', () => {
    const links = getAffiliateLinks('British Museum', 'museum', IDS);
    expect(links[0].href).toContain('pid=vt-789');
  });

  it('uses only relevant IDs per category', () => {
    const restaurantLinks = getAffiliateLinks('Dishoom', 'restaurant', IDS);
    expect(restaurantLinks[0].href).not.toContain('bk-456');
    expect(restaurantLinks[0].href).not.toContain('vt-789');
  });
});

describe('getAffiliateLinks — URL format', () => {
  it('encodes place names with spaces for OpenTable', () => {
    const links = getAffiliateLinks('The Ivy Market Grill', 'restaurant');
    expect(links[0].href).toContain('The+Ivy+Market+Grill');
  });

  it('encodes place names with spaces for Booking.com', () => {
    const links = getAffiliateLinks('The Dorchester', 'hotel');
    expect(links[0].href).toContain('The+Dorchester+London');
  });

  it('encodes place names with special characters for Viator', () => {
    const links = getAffiliateLinks("Victoria & Albert Museum", 'museum');
    expect(links[0].href).toContain('Victoria');
    expect(links[0].href).toContain('Museum');
  });

  it('returns a hostel link via Booking.com', () => {
    const links = getAffiliateLinks('St. Christopher\'s Hostel', 'hostel');
    expect(links[0].provider).toBe('Booking.com');
  });

  it('returns a Viator link for arts_centre', () => {
    const links = getAffiliateLinks('Barbican Centre', 'arts_centre');
    expect(links[0].provider).toBe('Viator');
  });
});
