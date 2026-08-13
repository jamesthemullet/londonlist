import { render, screen } from '@testing-library/react';
import BookingLinks from '../../../components/booking-links/booking-links';

jest.mock('../../../lib/affiliate-links', () => ({
  getAffiliateLinks: jest.fn(),
}));

import { getAffiliateLinks } from '../../../lib/affiliate-links';
const mockGetAffiliateLinks = getAffiliateLinks as jest.Mock;

beforeEach(() => {
  jest.resetAllMocks();
});

describe('BookingLinks', () => {
  it('renders nothing when there are no links', () => {
    mockGetAffiliateLinks.mockReturnValue([]);
    const { container } = render(<BookingLinks name="Hyde Park" category="park" />);
    expect(container.firstChild).toBeNull();
  });

  it('renders a link when one affiliate link is returned', () => {
    mockGetAffiliateLinks.mockReturnValue([
      { label: 'Book a table', href: 'https://opentable.co.uk/s?term=Dishoom', provider: 'OpenTable' },
    ]);
    render(<BookingLinks name="Dishoom" category="restaurant" />);
    const link = screen.getByRole('link', { name: /Book a table at Dishoom via OpenTable/ });
    expect(link).toBeInTheDocument();
    expect(link).toHaveAttribute('href', 'https://opentable.co.uk/s?term=Dishoom');
  });

  it('opens links in a new tab with noopener and sponsored rel', () => {
    mockGetAffiliateLinks.mockReturnValue([
      { label: 'Book tickets', href: 'https://viator.com/search/British+Museum', provider: 'Viator' },
    ]);
    render(<BookingLinks name="British Museum" category="museum" />);
    const link = screen.getByRole('link', { name: /Book tickets/ });
    expect(link).toHaveAttribute('target', '_blank');
    expect(link).toHaveAttribute('rel', 'noopener noreferrer sponsored');
  });

  it('renders multiple links when multiple affiliate links are returned', () => {
    mockGetAffiliateLinks.mockReturnValue([
      { label: 'Book a table', href: 'https://opentable.co.uk', provider: 'OpenTable' },
      { label: 'Check availability', href: 'https://booking.com', provider: 'Booking.com' },
    ]);
    render(<BookingLinks name="Some Place" category="restaurant" />);
    expect(screen.getAllByRole('link')).toHaveLength(2);
  });

  it('passes the name and category to getAffiliateLinks', () => {
    mockGetAffiliateLinks.mockReturnValue([]);
    render(<BookingLinks name="Tate Modern" category="gallery" />);
    expect(mockGetAffiliateLinks).toHaveBeenCalledWith('Tate Modern', 'gallery', expect.any(Object));
  });

  it('shows the provider name within each link', () => {
    mockGetAffiliateLinks.mockReturnValue([
      { label: 'Book tickets', href: 'https://viator.com', provider: 'Viator' },
    ]);
    render(<BookingLinks name="British Museum" category="museum" />);
    expect(screen.getByText(/via Viator/)).toBeInTheDocument();
  });
});
