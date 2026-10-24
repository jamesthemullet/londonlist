import { getAffiliateLinks } from './affiliate-links';

describe('getAffiliateLinks', () => {
  describe('restaurant categories', () => {
    const restaurantCategories = ['restaurant', 'cafe', 'fast_food', 'pub', 'bar'];

    it.each(restaurantCategories)('returns OpenTable link for category "%s"', (cat) => {
      const links = getAffiliateLinks('Nandos', cat, {});
      expect(links).toHaveLength(1);
      expect(links[0].provider).toBe('OpenTable');
      expect(links[0].label).toBe('Book a table');
      expect(links[0].href).toContain('opentable.co.uk');
      expect(links[0].href).toContain('Nandos');
    });

    it('includes affiliate id when opentableId is provided', () => {
      const links = getAffiliateLinks('Wahaca', 'restaurant', { opentableId: 'aff123' });
      expect(links[0].href).toContain('affiliate=aff123');
    });

    it('omits affiliate param when opentableId is undefined', () => {
      const links = getAffiliateLinks('Wahaca', 'restaurant', {});
      expect(links[0].href).not.toContain('affiliate=');
    });

    it('includes covers=2 in the OpenTable URL', () => {
      const links = getAffiliateLinks('The Ivy', 'restaurant', {});
      expect(links[0].href).toContain('covers=2');
    });
  });

  describe('hotel categories', () => {
    const hotelCategories = ['hotel', 'hostel', 'motel', 'guest_house'];

    it.each(hotelCategories)('returns Booking.com link for category "%s"', (cat) => {
      const links = getAffiliateLinks('Travelodge', cat, {});
      expect(links).toHaveLength(1);
      expect(links[0].provider).toBe('Booking.com');
      expect(links[0].label).toBe('Check availability');
      expect(links[0].href).toContain('booking.com');
    });

    it('includes affiliate aid when bookingId is provided', () => {
      const links = getAffiliateLinks('Premier Inn', 'hotel', { bookingId: 'bk999' });
      expect(links[0].href).toContain('aid=bk999');
    });

    it('omits aid param when bookingId is undefined', () => {
      const links = getAffiliateLinks('Premier Inn', 'hotel', {});
      expect(links[0].href).not.toContain('aid=');
    });

    it('appends London to the search term', () => {
      const links = getAffiliateLinks('Citizen M', 'hotel', {});
      expect(links[0].href).toContain('Citizen+M+London');
    });
  });

  describe('experience categories', () => {
    const experienceCategories = ['museum', 'gallery', 'theatre', 'cinema', 'attraction', 'arts_centre', 'theme_park'];

    it.each(experienceCategories)('returns Viator link for category "%s"', (cat) => {
      const links = getAffiliateLinks('Tate Modern', cat, {});
      expect(links).toHaveLength(1);
      expect(links[0].provider).toBe('Viator');
      expect(links[0].label).toBe('Book tickets');
      expect(links[0].href).toContain('viator.com');
    });

    it('includes pid param when viatorId is provided', () => {
      const links = getAffiliateLinks('Natural History Museum', 'museum', { viatorId: 'v42' });
      expect(links[0].href).toContain('pid=v42');
    });

    it('omits pid param when viatorId is undefined', () => {
      const links = getAffiliateLinks('Natural History Museum', 'museum', {});
      expect(links[0].href).not.toContain('pid=');
    });

    it('URL-encodes the place name', () => {
      const links = getAffiliateLinks('Science & Tech Museum', 'museum', {});
      expect(links[0].href).toContain(encodeURIComponent('Science & Tech Museum London'));
    });
  });

  describe('unknown categories', () => {
    it('returns empty array for unrecognised category', () => {
      const links = getAffiliateLinks('Some Place', 'park', {});
      expect(links).toHaveLength(0);
    });

    it('returns empty array for null category', () => {
      const links = getAffiliateLinks('Some Place', null, {});
      expect(links).toHaveLength(0);
    });

    it('returns empty array for empty string category', () => {
      const links = getAffiliateLinks('Some Place', '', {});
      expect(links).toHaveLength(0);
    });
  });

  describe('case insensitivity', () => {
    it('matches category in upper case', () => {
      const links = getAffiliateLinks('Sketch', 'RESTAURANT', {});
      expect(links).toHaveLength(1);
      expect(links[0].provider).toBe('OpenTable');
    });

    it('matches category in mixed case', () => {
      const links = getAffiliateLinks('Citizen M', 'Hotel', {});
      expect(links).toHaveLength(1);
      expect(links[0].provider).toBe('Booking.com');
    });
  });

  describe('ids default to empty object', () => {
    it('works when ids argument is omitted', () => {
      const links = getAffiliateLinks('Nandos', 'restaurant');
      expect(links).toHaveLength(1);
      expect(links[0].href).not.toContain('affiliate=');
    });
  });
});
